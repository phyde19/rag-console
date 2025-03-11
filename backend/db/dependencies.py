from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from fastapi import Depends
from typing import Annotated

from config.settings import settings

engine = create_engine(
    settings.db_url, 
    echo=True,
    connect_args=settings.db_connect_args
)

def get_session():
    with Session(engine) as session:
        yield session

SessionDep = Annotated[Session, Depends(get_session)]