from sqlalchemy import String, Integer, Text, DateTime, insert
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from sqlalchemy.types import Uuid
from datetime import datetime
import uuid

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

"""

# Example of how to define SqlAlchemy 2.0 Mapped Table
# Note: We will not use any 'relationship' or heavy duty orm features, implementing __repr__ would be good though

class Chat(Base):
    __tablename__ = "chat"

    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.now)

    def __repr__(self):
        return f"Chat(id={self.id}, name={self.name}, created_at={self.created_at}, updated_at={self.updated_at})"
    

def init_db_and_tables():
    # drop all not needed for sqlite
    # Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    seed_db()

def seed_db():
    session = next(get_session())
    # adding chats corresponding to hardcoded values in frontend/app/components/lib/initialChats
    session.execute(insert(Chat), [
        {"id": uuid.uuid4(), "name": "BlueCard FAQ"},
        {"id": uuid.uuid4(), "name": "Technical Support"}
    ])



