from fastapi import FastAPI
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("app start up")
    yield
    print("app shutdown")

app = FastAPI()