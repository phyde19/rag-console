from fastapi import APIRouter, HTTPException
from pydantic import UUID4
import uuid
import json
from datetime import datetime
from sqlalchemy import select, insert, update, delete, and_

from db.dependencies import SessionDep
from db.models import Chat, Setting, SettingOption, SettingType
from schemas.setting import SettingSchema, CreateSettingSchema, UpdateSettingSchema

router = APIRouter(
    prefix="/api/chats/{chat_id}/settings"
)

@router.post("", response_model=SettingSchema)
async def create_setting(
    chat_id: UUID4,
    setting_data: CreateSettingSchema,
    session: SessionDep
):
    """Add a setting to a chat"""
    # Check if chat exists
    chat = session.execute(select(Chat).where(Chat.id == chat_id)).scalar_one_or_none()
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Check if setting with this ID already exists for this chat
    existing = session.execute(
        select(Setting).where(
            and_(Setting.chat_id == chat_id, Setting.setting_id == setting_data.setting_id)
        )
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(status_code=400, detail=f"Setting with ID '{setting_data.setting_id}' already exists for this chat")
    
    # Validate setting type
    try:
        setting_type = SettingType(setting_data.type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid setting type. Must be one of: {', '.join([t.value for t in SettingType])}")
    
    # Insert the setting
    setting_id = uuid.uuid4()
    session.execute(insert(Setting).values(
        id=setting_id,
        chat_id=chat_id,
        setting_id=setting_data.setting_id,
        name=setting_data.name,
        type=setting_type,
        value=setting_data.value,
        required=setting_data.required
    ))
    
    # If options are provided and setting type is multiselect or radio, insert them
    if setting_data.options and setting_type in [SettingType.MULTISELECT, SettingType.RADIO]:
        option_values = []
        for option in setting_data.options:
            option_values.append({
                "setting_id": setting_id,
                "option_id": option["id"],
                "name": option["name"]
            })
        
        if option_values:
            session.execute(insert(SettingOption), option_values)
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    # Get the setting including options
    setting = session.execute(
        select(Setting).where(Setting.id == setting_id)
    ).scalar_one()
    
    # Get options if needed
    options = []
    if setting.type in [SettingType.MULTISELECT, SettingType.RADIO]:
        options = session.execute(
            select(SettingOption).where(SettingOption.setting_id == setting_id)
        ).scalars().all()
        
        # Convert options to dictionaries
        options = [
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
    
    # Convert setting to dict and add options
    setting_dict = {c.name: getattr(setting, c.name) for c in setting.__table__.columns}
    setting_dict['options'] = options
    
    return setting_dict


@router.put("/{setting_id}", response_model=SettingSchema)
async def update_setting(
    chat_id: UUID4,
    setting_id: str,  # This is the setting_id field, not the UUID
    setting_data: UpdateSettingSchema,
    session: SessionDep
):
    """Update a setting's value"""
    # Find the setting
    setting = session.execute(
        select(Setting).where(
            and_(Setting.chat_id == chat_id, Setting.setting_id == setting_id)
        )
    ).scalar_one_or_none()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Update the setting
    session.execute(
        update(Setting)
        .where(and_(Setting.chat_id == chat_id, Setting.setting_id == setting_id))
        .values(value=setting_data.value, updated_at=datetime.now())
    )
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    # Get the updated setting
    updated_setting = session.execute(
        select(Setting).where(
            and_(Setting.chat_id == chat_id, Setting.setting_id == setting_id)
        )
    ).scalar_one()
    
    # Get options if needed
    options = []
    if updated_setting.type in [SettingType.MULTISELECT, SettingType.RADIO]:
        options = session.execute(
            select(SettingOption).where(SettingOption.setting_id == updated_setting.id)
        ).scalars().all()
        
        # Convert options to dictionaries
        options = [
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
    
    # Convert setting to dict and add options
    setting_dict = {c.name: getattr(updated_setting, c.name) for c in updated_setting.__table__.columns}
    setting_dict['options'] = options
    
    return setting_dict


@router.delete("/{setting_id}")
async def delete_setting(
    chat_id: UUID4,
    setting_id: str,  # This is the setting_id field, not the UUID
    session: SessionDep
):
    """Delete a setting"""
    # Find the setting
    setting = session.execute(
        select(Setting).where(
            and_(Setting.chat_id == chat_id, Setting.setting_id == setting_id)
        )
    ).scalar_one_or_none()
    
    if not setting:
        raise HTTPException(status_code=404, detail="Setting not found")
    
    # Prevent deletion of required settings (like temperature)
    if setting.required:
        raise HTTPException(status_code=400, detail="Cannot delete a required setting")
    
    # Delete the setting (will cascade to options)
    session.execute(
        delete(Setting).where(
            and_(Setting.chat_id == chat_id, Setting.setting_id == setting_id)
        )
    )
    
    # Update chat timestamp
    session.execute(update(Chat).where(Chat.id == chat_id).values(
        updated_at=datetime.now()
    ))
    session.commit()
    
    return {"detail": "Setting deleted successfully"}