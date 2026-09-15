from fastapi import APIRouter, UploadFile, File
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.rag_service import get_chat_response
from app.services.ocr_service import extract_full_text

router = APIRouter(prefix="/chatbot", tags=["chatbot"])


@router.post("/upload-document")
async def upload_document(file: UploadFile = File(...)):
    contents = await file.read()
    text = extract_full_text(contents)
    if not text:
        return {"document_text": "", "message": "Could not extract text from this file. It may be a scanned image."}
    return {"document_text": text, "message": f"Document processed ({len(text)} characters extracted)."}


@router.post("/message", response_model=ChatResponse)
def chat(request: ChatRequest):
    reply = get_chat_response(request.message, history=request.history, document_context=request.document_context)
    return {"reply": reply}