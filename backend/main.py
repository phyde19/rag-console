from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from db.models import init_db_and_tables
from routers import chat, message, setting
from config.settings import settings

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Initializing in-memory database...")
    init_db_and_tables()
    yield
    print("Shutting down...")


app = FastAPI(
    title="Chat Simulation API",
    description="Backend API for the Chat Simulation application",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware to allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(chat.router)
app.include_router(message.router)
app.include_router(setting.router)

from pydantic import BaseModel, UUID4
import uuid

class UUIDTest(BaseModel):
    id: UUID4
    name: str
    
    model_config = {
        "from_attributes": True
    }

@app.get("/")
async def root():
    return {
        "message": "Welcome to the Chat Simulation API",
        "docs": "/docs",
        "version": "1.0.0"
    }
    
@app.get("/test-uuid", response_model=list[UUIDTest])
async def test_uuid():
    """Test endpoint to verify UUID serialization"""
    return [
        {"id": uuid.uuid4(), "name": "Test 1"},
        {"id": uuid.uuid4(), "name": "Test 2"}
    ]

