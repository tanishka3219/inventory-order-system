from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

# In PostgreSQL, we want to make sure pg connections are pooled properly.
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # checks connection health before executing commands
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
