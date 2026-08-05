from fastapi import APIRouter
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import get_chat_response

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/message", response_model=ChatResponse)
def chat(request: ChatRequest):
    # Note: patient report linking comes in the next refinement —
    # for now this tests the chatbot standalone, no context yet
    reply = get_chat_response(request.message, history=request.history)
    return {"reply": reply}