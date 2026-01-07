from sqlalchemy import Column, String, Text, DateTime, JSON, Integer, Boolean, ForeignKey
from datetime import datetime
from .db import Base


class UserDB(Base):
    """Database model for users (Phase 4)"""
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)


class WorkflowDB(Base):
    """Database model for workflows"""
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    version = Column(String, default="1.0.0")
    definition = Column(JSON, nullable=False)  # Stores nodes, edges, variables
    
    # Phase 4: Multi-user support
    owner_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)
    is_public = Column(Boolean, default=False)
    is_template = Column(Boolean, default=False)
    
    # Phase 4: Marketplace
    category = Column(String, nullable=True, index=True)
    tags = Column(JSON, default=list)  # List of tags
    likes_count = Column(Integer, default=0)
    views_count = Column(Integer, default=0)
    uses_count = Column(Integer, default=0)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class ExecutionDB(Base):
    """Database model for workflow executions"""
    __tablename__ = "executions"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=True, index=True)  # Phase 4
    status = Column(String, nullable=False)
    state = Column(JSON, nullable=False)  # Stores full execution state
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)


class WorkflowVersionDB(Base):
    """Database model for workflow versions (Phase 4)"""
    __tablename__ = "workflow_versions"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False, index=True)
    version_number = Column(Integer, nullable=False)
    definition = Column(JSON, nullable=False)
    change_notes = Column(Text, nullable=True)
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkflowShareDB(Base):
    """Database model for workflow sharing (Phase 4)"""
    __tablename__ = "workflow_shares"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False, index=True)
    shared_with_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    permission = Column(String, nullable=False)  # "view", "edit", "execute"
    shared_by = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class WorkflowTemplateDB(Base):
    """Database model for workflow templates (Phase 4)"""
    __tablename__ = "workflow_templates"
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False, index=True)
    tags = Column(JSON, default=list)
    definition = Column(JSON, nullable=False)
    
    # Template metadata
    author_id = Column(String, ForeignKey("users.id"), nullable=True)
    is_official = Column(Boolean, default=False)
    difficulty = Column(String, default="beginner")  # beginner, intermediate, advanced
    estimated_time = Column(String, nullable=True)  # "5 minutes", "1 hour", etc.


class SettingsDB(Base):
    """Database model for user settings (LLM providers, etc.)"""
    __tablename__ = "settings"
    
    user_id = Column(String, primary_key=True, index=True)  # "anonymous" for unauthenticated users
    settings_data = Column(JSON, nullable=False)  # Stores LLMSettings as JSON
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Usage stats
    uses_count = Column(Integer, default=0)
    likes_count = Column(Integer, default=0)
    rating = Column(Integer, default=0)  # 0-5 stars
    
    # Preview
    thumbnail_url = Column(String, nullable=True)
    preview_image_url = Column(String, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class WorkflowLikeDB(Base):
    """Database model for workflow likes (Phase 4)"""
    __tablename__ = "workflow_likes"
    
    id = Column(String, primary_key=True, index=True)
    workflow_id = Column(String, ForeignKey("workflows.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)

