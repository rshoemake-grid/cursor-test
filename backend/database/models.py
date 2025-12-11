from sqlalchemy import Column, String, Text, DateTime, JSON
from datetime import datetime
from .db import Base


class WorkflowDB(Base):
    """Database model for workflows"""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String, default="1.0.0")
    definition = Column(JSON, nullable=False)  # Stores nodes, edges, variables
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExecutionDB(Base):
    """Database model for workflow executions"""
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False)
    state = Column(JSON, nullable=False)  # Stores full execution state
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

