# Add to existing schemas.py file - Error Response Models for Apigee compatibility

class ErrorDetail(BaseModel):
    """Error detail for standardized error responses"""
    code: str
    message: str
    path: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    details: Optional[Dict[str, Any]] = None


class ErrorResponse(BaseModel):
    """Standardized error response for Apigee compatibility"""
    error: ErrorDetail
