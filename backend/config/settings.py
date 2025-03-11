from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    app_name: str = "Chat Simulator"
    
    # db settings - use in-memory SQLite for simplicity
    db_url: str = "sqlite+pysqlite:///:memory:"
    db_connect_args: dict = {"check_same_thread": False}
    
    # CORS settings
    allow_origins: list[str] = ["http://localhost:3000"] 
    
    # API settings
    api_prefix: str = "/api"

# export settings obj for use in the app
settings = Settings()