from fastapi import APIRouter
# prefer these functions over ORM session.add, etc 
from sqlalchemy import select, insert, update, delete

from db.dependencies import SessionDep
from db.models import Chat

router = APIRouter(
    prefix="/api/chats"
)

@router.get("/")
async def read_chats(session: SessionDep):
    chats = session.execute(select(Chat)).scalars().all()
    return chats