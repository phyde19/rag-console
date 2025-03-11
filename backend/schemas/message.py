from pydantic import BaseModel, UUID4
from datetime import datetime


class MessageSchema(BaseModel):
    id: UUID4
    role: str
    content: str
    sequence: int
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }


class CreateMessageSchema(BaseModel):
    role: str
    content: str = ""
    sequence: int | None = None


class UpdateMessageSchema(BaseModel):
    content: str