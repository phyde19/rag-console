from fastapi import FastAPI
from contextlib import asynccontextmanager

from db.models import init_db_and_tables
from routers import chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("app start up")
    init_db_and_tables()
    yield
    print("app shutdown")


app = FastAPI(lifespan=lifespan)

app.include_router(chat.router)

