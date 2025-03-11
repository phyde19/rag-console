from pydantic import BaseModel, UUID4
from datetime import datetime


class ChatListItemSchema(BaseModel):
    id: UUID4
    name: str
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class ChatSchema(BaseModel):
    id: UUID4
    name: str
    created_at: datetime
    updated_at: datetime
    messages: list[dict] | None = None
    settings: list[dict] | None = None

    model_config = {
        "from_attributes": True
    }


class CreateChatSchema(BaseModel):
    name: str
    system_message: str = "You are a helpful assistant."


class UpdateChatSchema(BaseModel):
    name: str | None = None