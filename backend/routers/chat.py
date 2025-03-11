from fastapi import APIRouter, HTTPException
from pydantic import UUID4
import uuid
from datetime import datetime
from sqlalchemy import select, insert, update, delete, desc

from db.dependencies import SessionDep
from db.models import Chat, Message, Setting, MessageRole, SettingOption
from schemas.chat import ChatSchema, ChatListItemSchema, CreateChatSchema, UpdateChatSchema

router = APIRouter(
    prefix="/api/chats"
)

@router.get("/", response_model=list[ChatListItemSchema])
async def read_chats(session: SessionDep):
    """Get all chats"""
    chats = session.execute(select(Chat).order_by(desc(Chat.updated_at))).scalars().all()
    return chats


@router.get("/{chat_id}", response_model=ChatSchema)
async def read_chat(chat_id: UUID4, session: SessionDep):
    """Get a single chat with all its messages and settings"""
    # Get the chat
    chat = session.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Get messages for this chat ordered by sequence
    messages = session.execute(
        select(Message).where(Message.chat_id == chat_id).order_by(Message.sequence)
    ).scalars().all()
    
    # Get settings for this chat
    settings = session.execute(
        select(Setting).where(Setting.chat_id == chat_id)
    ).scalars().all()
    
    # For each setting that needs options, get them
    settings_with_options = []
    for setting in settings:
        setting_dict = {c.name: getattr(setting, c.name) for c in setting.__table__.columns}
        
        # Get options for settings that need them (multiselect, radio)
        if setting.type in ["multiselect", "radio"]:
            options = session.execute(
                select(SettingOption).where(SettingOption.setting_id == setting.id)
            ).scalars().all()
            
            # Convert SettingOption objects to dictionaries
            option_dicts = [
                {
                    "id": option.id,
                    "setting_id": option.setting_id,
                    "option_id": option.option_id,
                    "name": option.name,
                    "created_at": option.created_at,
                    "updated_at": option.updated_at
                }
                for option in options
            ]
            
            setting_dict['options'] = option_dicts
        else:
            setting_dict['options'] = []
            
        settings_with_options.append(setting_dict)
    
    # Convert messages to dictionaries
    messages_dicts = [
        {
            "id": message.id,
            "role": message.role,
            "content": message.content,
            "sequence": message.sequence,
            "created_at": message.created_at,
            "updated_at": message.updated_at
        }
        for message in messages
    ]
    
    # Combine everything
    chat_dict = {c.name: getattr(chat, c.name) for c in chat.__table__.columns}
    chat_dict['messages'] = messages_dicts
    chat_dict['settings'] = settings_with_options
    
    return chat_dict


@router.post("/", response_model=ChatSchema)
async def create_chat(chat_data: CreateChatSchema, session: SessionDep):
    """Create a new chat with required settings"""
    # Create a new chat
    chat_id = uuid.uuid4()
    session.execute(insert(Chat).values(
        id=chat_id,
        name=chat_data.name
    ))
    
    # Add a system message
    session.execute(insert(Message).values(
        chat_id=chat_id,
        role=MessageRole.SYSTEM,
        content=chat_data.system_message,
        sequence=0
    ))
    
    # Add required temperature setting
    session.execute(insert(Setting).values(
        chat_id=chat_id,
        setting_id="temperature",
        name="Temperature",
        type="temperature",
        value="0.7",
        required=True
    ))
    
    session.commit()
    
    # Return the newly created chat
    return await read_chat(chat_id, session)


@router.put("/{chat_id}", response_model=ChatSchema)
async def update_chat(chat_id: UUID4, chat_data: UpdateChatSchema, session: SessionDep):
    """Update a chat"""
    # Check if chat exists
    chat = session.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Update only if name is provided
    if chat_data.name:
        session.execute(update(Chat).where(Chat.id == chat_id).values(
            name=chat_data.name,
            updated_at=datetime.now()
        ))
        session.commit()
    
    # Return the updated chat
    return await read_chat(chat_id, session)


@router.delete("/{chat_id}")
async def delete_chat(chat_id: UUID4, session: SessionDep):
    """Delete a chat and all its messages and settings"""
    # Check if chat exists
    chat = session.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Delete the chat (cascade will handle messages and settings)
    session.execute(delete(Chat).where(Chat.id == chat_id))
    session.commit()
    
    return {"detail": "Chat deleted successfully"}