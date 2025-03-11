from sqlalchemy import String, Integer, Text, DateTime, insert, ForeignKey, Enum, select, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import Uuid
from datetime import datetime
import uuid
import enum
import json

from db.dependencies import engine, get_session

class Base(DeclarativeBase):
    pass


"""
The following is an abtract JSON model of the data structures. 
We will need to implement this as SQL entity relationships

db = {
    chats: Chat[] = [
        {
            messages: Message[] = [
                {
                    id: uuid
                    role: 'system' | 'user' | 'assistant'
                    content: str
                    created_at: datetime
                    updated_at: datetime
                },
                ...
            ]
            settings: Setting[] = [
                {
                    id: uuid
                    name: str
                    type: 'text-input' | 'toggle' | 'radio' | 'multiselect' | 'json'
                    value: string <- "user input" for text-input, "true" or "false" for toggle, selection choice for radio, list of selections for multiselect, json string for json 
                    setting_options: SettingOption[] = [
                        {
                            id: 
                            name: str
                        },
                        ...
                    ]
                },
                ...
            ]
        },
        ...
    ]
}

Entities 

chat
message
setting
setting_option

chat : message - 1 : many
message : setting - 1 : many
setting : setting_option - 1 : many

"""

class MessageRole(str, enum.Enum):
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class SettingType(str, enum.Enum):
    TEXT = "text"
    CHECKBOX = "checkbox"
    RADIO = "radio"
    MULTISELECT = "multiselect"
    JSON = "json"
    TEMPERATURE = "temperature"


class Chat(Base):
    __tablename__ = "chat"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f"Chat(id={self.id}, name={self.name}, created_at={self.created_at}, updated_at={self.updated_at})"


class Message(Base):
    __tablename__ = "message"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(Enum(MessageRole), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)
    # Store the sequence order of messages within a chat
    sequence: Mapped[int] = mapped_column(Integer, nullable=False)

    def __repr__(self):
        content_preview = self.content[:20] + "..." if len(self.content) > 20 else self.content
        return f"Message(id={self.id}, chat_id={self.chat_id}, role={self.role}, content='{content_preview}', sequence={self.sequence})"


class Setting(Base):
    __tablename__ = "setting"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    chat_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("chat.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    setting_id: Mapped[str] = mapped_column(String(128), nullable=False)
    type: Mapped[str] = mapped_column(Enum(SettingType), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False, default="")
    # Flag to indicate if setting is required (like temperature) and can't be deleted
    required: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        value_preview = self.value[:20] + "..." if len(self.value) > 20 else self.value
        return f"Setting(id={self.id}, chat_id={self.chat_id}, name='{self.name}', type={self.type}, value='{value_preview}', required={self.required})"


class SettingOption(Base):
    __tablename__ = "setting_option"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    setting_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("setting.id", ondelete="CASCADE"))
    option_id: Mapped[str] = mapped_column(String(128), nullable=False)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now, onupdate=datetime.now)

    def __repr__(self):
        return f"SettingOption(id={self.id}, setting_id={self.setting_id}, option_id='{self.option_id}', name='{self.name}')"


def init_db_and_tables():
    # drop all not needed for sqlite
    # Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed_db()


def seed_db():
    session = next(get_session())
    
    # Create two sample chats
    bluecard_id = uuid.uuid4()
    tech_support_id = uuid.uuid4()
    
    session.execute(insert(Chat), [
        {"id": bluecard_id, "name": "BlueCard FAQ"},
        {"id": tech_support_id, "name": "Technical Support"}
    ])
    
    # Add initial messages
    session.execute(insert(Message), [
        {
            "chat_id": bluecard_id,
            "role": MessageRole.SYSTEM,
            "content": "You are a helpful assistant for BlueCard.",
            "sequence": 0
        },
        {
            "chat_id": bluecard_id,
            "role": MessageRole.USER,
            "content": "What is BlueCard?",
            "sequence": 1
        },
        {
            "chat_id": tech_support_id,
            "role": MessageRole.SYSTEM,
            "content": "You are a technical support agent.",
            "sequence": 0
        },
        {
            "chat_id": tech_support_id,
            "role": MessageRole.USER,
            "content": "How do I deploy to GCP?",
            "sequence": 1
        }
    ])
    
    # Add required temperature settings for both chats
    bluecard_temp = session.execute(insert(Setting).values(
        chat_id=bluecard_id,
        setting_id="temperature",
        name="Temperature",
        type=SettingType.TEMPERATURE,
        value="0.7",
        required=True
    ).returning(Setting.id)).scalar_one()
    
    tech_temp = session.execute(insert(Setting).values(
        chat_id=tech_support_id,
        setting_id="temperature",
        name="Temperature",
        type=SettingType.TEMPERATURE,
        value="0.5",
        required=True
    ).returning(Setting.id)).scalar_one()
    
    # Add plugin settings
    bluecard_plugins = session.execute(insert(Setting).values(
        chat_id=bluecard_id,
        setting_id="plugins",
        name="Plugins",
        type=SettingType.MULTISELECT,
        value='["bluecard_chat"]'
    ).returning(Setting.id)).scalar_one()
    
    tech_plugins = session.execute(insert(Setting).values(
        chat_id=tech_support_id,
        setting_id="plugins",
        name="Plugins",
        type=SettingType.MULTISELECT,
        value='["gcp_chat", "dscoe_docs_chat"]'
    ).returning(Setting.id)).scalar_one()
    
    # Add plugin options
    plugins = [
        {"id": "bluecard_chat", "name": "BlueCard Chat"},
        {"id": "dscoe_docs_chat", "name": "DSCOE Docs Chat"},
        {"id": "gcp_chat", "name": "GCP Chat"},
        {"id": "web_search", "name": "WebSearch"}
    ]
    
    for plugin in plugins:
        session.execute(insert(SettingOption), [
            {
                "setting_id": bluecard_plugins,
                "option_id": plugin["id"],
                "name": plugin["name"]
            },
            {
                "setting_id": tech_plugins,
                "option_id": plugin["id"],
                "name": plugin["name"]
            }
        ])
    
    session.commit()



