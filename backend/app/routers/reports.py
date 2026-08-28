from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.report import Report
from app.schemas.report import HealthInput, HealthResult, PDFExtractResult, ReportSaveRequest, ReportOut
from app.services.ml_service import analyze_health
from app.services.ocr_service import extract_patient_info
from app.core.deps import get_current_user

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


@router.post("/lab-submit", response_model=ReportOut)
def lab_submit(data: ReportSaveRequest, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "lab":
        raise HTTPException(status_code=403, detail="Only labs can submit reports for patients")

    patient = db.query(User).filter(User.email == data.patient_email, User.role == "patient").first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found with that email")

    input_dict = data.dict(exclude={"patient_email"})
    result = analyze_health(input_dict)

    report = Report(
        patient_id=patient.id,
        uploaded_by_id=user.id,
        extracted_values=input_dict,
        risk_results=result["risk_results"],
        recommendations=result["recommendations"],
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report


@router.get("/my-reports", response_model=list[ReportOut])
def my_reports(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.patient_id == user.id).order_by(Report.created_at.desc()).all()

