"""
Base repository class providing common CRUD operations.
All repositories should inherit from this base class.
"""
from typing import Generic, TypeVar, Optional, List
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update, delete
from sqlalchemy.orm import selectinload
from ..database.db import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Base repository with common CRUD operations"""
    
    def __init__(self, db: AsyncSession, model: type[ModelType]):
        """
        Initialize repository
        
        Args:
            db: Database session
            model: SQLAlchemy model class
        """
        self.db = db
        self.model = model
    
    async def get_by_id(self, id: str) -> Optional[ModelType]:
        """Get entity by ID"""
        result = await self.db.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[ModelType]:
        """Get all entities with optional pagination"""
        query = select(self.model).offset(offset)
        if limit:
            query = query.limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())
    
    async def create(self, entity: ModelType) -> ModelType:
        """Create a new entity"""
        self.db.add(entity)
        await self.db.commit()
        await self.db.refresh(entity)
        return entity
    
    async def update(self, id: str, **kwargs) -> Optional[ModelType]:
        """Update entity by ID"""
        await self.db.execute(
            update(self.model)
            .where(self.model.id == id)
            .values(**kwargs)
        )
        await self.db.commit()
        return await self.get_by_id(id)
    
    async def delete(self, id: str) -> bool:
        """Delete entity by ID"""
        result = await self.db.execute(
            delete(self.model).where(self.model.id == id)
        )
        await self.db.commit()
        return result.rowcount > 0
    
    async def count(self) -> int:
        """Count total entities"""
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.count()).select_from(self.model)
        )
        return result.scalar() or 0

