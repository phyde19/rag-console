from pydantic_settings import BaseSettings
from sqlalchemy import create_engine

class Settings(BaseSettings):
    app_name: str = "Chat Simulator"

    # db settings
    db_url: str = "sqlite+pysqlite:///:memory:"
    db_connect_args: dict | None = {"check_same_thread": False}
    

# export settings obj for use in the app
settings = Settings()