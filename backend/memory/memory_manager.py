from typing import List, Dict, Any, Optional
from datetime import datetime
from collections import deque
import chromadb
from chromadb.config import Settings
import hashlib


class ConversationMemory:
    """
    Short-term conversation memory
    Stores recent messages with a sliding window
    """
    
    def __init__(self, max_messages: int = 10):
        self.max_messages = max_messages
        self.messages: deque = deque(maxlen=max_messages)
    
    def add_message(self, role: str, content: str, metadata: Dict[str, Any] = None):
        """Add a message to conversation history"""
        message = {
            "role": role,
            "content": content,
            "timestamp": datetime.utcnow().isoformat(),
            "metadata": metadata or {}
        }
        self.messages.append(message)
    
    def get_messages(self, limit: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get recent messages"""
        messages = list(self.messages)
        if limit:
            return messages[-limit:]
        return messages
    
    def get_context_string(self, limit: Optional[int] = None) -> str:
        """Get conversation history as a formatted string"""
        messages = self.get_messages(limit)
        return "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in messages
        ])
    
    def clear(self):
        """Clear conversation history"""
        self.messages.clear()


class VectorMemory:
    """
    Long-term vector memory using ChromaDB
    Stores and retrieves information using semantic search
    """
    
    def __init__(self, collection_name: str = "workflow_memory"):
        # Initialize ChromaDB client
        self.client = chromadb.Client(Settings(
            anonymized_telemetry=False,
            allow_reset=True
        ))
        
        try:
            self.collection = self.client.get_collection(collection_name)
        except:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"description": "Long-term memory for agentic workflows"}
            )
    
    def add_memory(
        self,
        content: str,
        metadata: Dict[str, Any] = None,
        memory_id: Optional[str] = None
    ):
        """Add a memory to long-term storage"""
        if not memory_id:
            # Generate unique ID from content
            memory_id = hashlib.md5(content.encode()).hexdigest()
        
        self.collection.add(
            documents=[content],
            metadatas=[{
                **metadata or {},
                "timestamp": datetime.utcnow().isoformat()
            }],
            ids=[memory_id]
        )
    
    def search(
        self,
        query: str,
        n_results: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search memories by semantic similarity"""
        results = self.collection.query(
            query_texts=[query],
            n_results=n_results,
            where=filter_metadata
        )
        
        memories = []
        if results['documents']:
            for i, doc in enumerate(results['documents'][0]):
                memories.append({
                    "content": doc,
                    "metadata": results['metadatas'][0][i] if results['metadatas'] else {},
                    "distance": results['distances'][0][i] if results['distances'] else None
                })
        
        return memories
    
    def get_by_id(self, memory_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve a specific memory by ID"""
        try:
            result = self.collection.get(ids=[memory_id])
            if result['documents']:
                return {
                    "content": result['documents'][0],
                    "metadata": result['metadatas'][0] if result['metadatas'] else {}
                }
        except:
            return None
    
    def delete_memory(self, memory_id: str):
        """Delete a memory"""
        self.collection.delete(ids=[memory_id])
    
    def clear_all(self):
        """Clear all memories"""
        self.client.delete_collection(self.collection.name)
        self.collection = self.client.create_collection(
            name=self.collection.name,
            metadata={"description": "Long-term memory for agentic workflows"}
        )


class MemoryManager:
    """
    Manages both short-term and long-term memory for agents
    Provides unified interface for memory operations
    """
    
    def __init__(
        self,
        agent_id: str,
        max_conversation_messages: int = 10,
        use_vector_memory: bool = True
    ):
        self.agent_id = agent_id
        
        # Short-term conversation memory
        self.conversation = ConversationMemory(max_conversation_messages)
        
        # Long-term vector memory
        self.vector = None
        if use_vector_memory:
            self.vector = VectorMemory(f"agent_{agent_id}_memory")
    
    def add_interaction(
        self,
        user_message: str,
        assistant_message: str,
        metadata: Dict[str, Any] = None,
        save_to_longterm: bool = False
    ):
        """
        Add an interaction to memory
        
        Args:
            user_message: User's message
            assistant_message: Assistant's response
            metadata: Additional metadata
            save_to_longterm: Whether to also save to vector memory
        """
        # Add to conversation memory
        self.conversation.add_message("user", user_message, metadata)
        self.conversation.add_message("assistant", assistant_message, metadata)
        
        # Optionally save to long-term memory
        if save_to_longterm and self.vector:
            combined = f"User: {user_message}\nAssistant: {assistant_message}"
            self.vector.add_memory(
                combined,
                metadata={
                    **metadata or {},
                    "agent_id": self.agent_id,
                    "type": "interaction"
                }
            )
    
    def add_fact(self, fact: str, metadata: Dict[str, Any] = None):
        """Add a fact to long-term memory"""
        if self.vector:
            self.vector.add_memory(
                fact,
                metadata={
                    **metadata or {},
                    "agent_id": self.agent_id,
                    "type": "fact"
                }
            )
    
    def recall(self, query: str, n_results: int = 3) -> List[str]:
        """
        Recall relevant information from long-term memory
        Returns list of relevant memory contents
        """
        if not self.vector:
            return []
        
        memories = self.vector.search(query, n_results)
        return [mem["content"] for mem in memories]
    
    def get_context_for_prompt(
        self,
        current_query: str,
        include_conversation: bool = True,
        include_longterm: bool = True,
        max_conversation_messages: int = 5,
        max_longterm_results: int = 3
    ) -> str:
        """
        Build context string for LLM prompt
        Combines conversation history and relevant long-term memories
        """
        context_parts = []
        
        # Add conversation history
        if include_conversation:
            conv_context = self.conversation.get_context_string(max_conversation_messages)
            if conv_context:
                context_parts.append("Recent Conversation:")
                context_parts.append(conv_context)
        
        # Add relevant long-term memories
        if include_longterm and self.vector:
            relevant_memories = self.recall(current_query, max_longterm_results)
            if relevant_memories:
                context_parts.append("\nRelevant Context from Memory:")
                for i, memory in enumerate(relevant_memories, 1):
                    context_parts.append(f"{i}. {memory}")
        
        return "\n\n".join(context_parts)
    
    def clear_conversation(self):
        """Clear short-term conversation memory"""
        self.conversation.clear()
    
    def clear_all(self):
        """Clear all memories"""
        self.conversation.clear()
        if self.vector:
            self.vector.clear_all()

