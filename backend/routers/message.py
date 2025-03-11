from fastapi import APIRouter, HTTPException
from pydantic import UUID4
import uuid
from datetime import datetime
from sqlalchemy import select, insert, update, delete, and_, func

from db.dependencies import SessionDep
from db.models import Chat, Message, MessageRole
from schemas.message import MessageSchema, CreateMessageSchema, UpdateMessageSchema

router = APIRouter(
    prefix="/api/chats/{chat_id}/messages"
)

@router.post("", response_model=MessageSchema)
async def create_message(
    chat_id: UUID4,
    message_data: CreateMessageSchema,
    session: SessionDep
):
    """Add a message to a chat"""
    # Check if chat exists
    chat = session.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Validate message role
    try:
        role = MessageRole(message_data.role)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid role. Must be one of: {', '.join([r.value for r in MessageRole])}")
    
    # Determine sequence if not provided
    sequence = message_data.sequence
    if sequence is None:
        # Get the highest sequence number and add 1
        max_sequence = session.execute(
            select(func.max(Message.sequence)).where(Message.chat_id == chat_id)
        ).scalar_one_or_none()
        sequence = 0 if max_sequence is None else max_sequence + 1
    
    # Insert the message
    message_id = uuid.uuid4()
    session.execute(insert(Message).values(
        id=message_id,
        chat_id=chat_id,
        role=role,
        content=message_data.content,
        sequence=sequence
    ))
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    # Get and return the created message
    message = session.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one()
    
    return message


@router.put("/{message_id}", response_model=MessageSchema)
async def update_message(
    chat_id: UUID4,
    message_id: UUID4,
    message_data: UpdateMessageSchema,
    session: SessionDep
):
    """Update a message's content"""
    # Check if chat and message exist
    message = session.execute(
        select(Message).where(and_(Message.id == message_id, Message.chat_id == chat_id))
    ).scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Update the message
    session.execute(update(Message).where(Message.id == message_id).values(
        content=message_data.content,
        updated_at=datetime.now()
    ))
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    # Get and return the updated message
    updated_message = session.execute(
        select(Message).where(Message.id == message_id)
    ).scalar_one()
    
    return updated_message


@router.delete("/{message_id}")
async def delete_message(
    chat_id: UUID4,
    message_id: UUID4,
    session: SessionDep
):
    """Delete a message"""
    # Check if chat and message exist
    message = session.execute(
        select(Message).where(and_(Message.id == message_id, Message.chat_id == chat_id))
    ).scalar_one_or_none()
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # Delete the message
    session.execute(delete(Message).where(Message.id == message_id))
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    return {"detail": "Message deleted successfully"}