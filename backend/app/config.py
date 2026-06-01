import os
from pydantic import BaseModel

class Settings(BaseModel):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/inventory_db"
    )
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "supersecretkeychangeinproduction123"
    )
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
    
    # CORS settings
    CORS_ORIGINS: str = os.getenv("CORS_ORIGINS", "*")

settings = Settings()
