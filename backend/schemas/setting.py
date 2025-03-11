from pydantic import BaseModel, UUID4
from datetime import datetime


class SettingOptionSchema(BaseModel):
    id: UUID4
    option_id: str
    name: str

    model_config = {
        "from_attributes": True
    }


class SettingSchema(BaseModel):
    id: UUID4
    name: str
    type: str
    value: str
    required: bool
    options: list[SettingOptionSchema] | None = None

    model_config = {
        "from_attributes": True
    }


class CreateSettingSchema(BaseModel):
    name: str
    type: str
    value: str
    required: bool = False
    options: list[dict[str, str]] | None = None


class UpdateSettingSchema(BaseModel):
    value: str