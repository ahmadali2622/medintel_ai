from fastapi import APIRouter, UploadFile, File
from app.schemas.report import HealthInput, HealthResult, PDFExtractResult
from app.services.ml_service import analyze_health
from app.services.ocr_service import extract_patient_info

router = APIRouter(prefix="/reports", tags=["reports"])


@router.post("/extract-pdf", response_model=PDFExtractResult)
async def extract_pdf(file: UploadFile = File(...)):
    contents = await file.read()
    extracted = extract_patient_info(contents)
    return {"extracted": extracted}


@router.post("/analyze", response_model=HealthResult)
def analyze(data: HealthInput):
    result = analyze_health(data.dict())
    return result