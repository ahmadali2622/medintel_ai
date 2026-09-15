from pydantic import BaseModel
from typing import List, Dict, Optional

class ChatRequest(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    document_context: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str