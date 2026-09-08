from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import Response
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
import io
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.profile import LabProfile
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
    return {
        "id": report.id,
        "patient_id": report.patient_id,
        "uploaded_by_id": report.uploaded_by_id,
        "uploaded_by_name": None,
        "extracted_values": report.extracted_values,
        "risk_results": report.risk_results,
        "recommendations": report.recommendations,
        "created_at": report.created_at.isoformat() if report.created_at else None,
    }


from app.models.profile import LabProfile


@router.get("/my-reports", response_model=list[ReportOut])
def my_reports(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    reports = db.query(Report).filter(Report.patient_id == user.id).order_by(Report.created_at.desc()).all()

    result = []
    for r in reports:
        uploader = db.query(User).filter(User.id == r.uploaded_by_id).first()
        uploaded_by_name = None
        if uploader:
            if uploader.role == "lab":
                lab_profile = db.query(LabProfile).filter(LabProfile.user_id == uploader.id).first()
                uploaded_by_name = lab_profile.lab_name if lab_profile else uploader.email
            else:
                uploaded_by_name = "Self-submitted"

        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "uploaded_by_id": r.uploaded_by_id,
            "uploaded_by_name": uploaded_by_name,
            "extracted_values": r.extracted_values,
            "risk_results": r.risk_results,
            "recommendations": r.recommendations,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@router.get("/submitted-by-me", response_model=list[ReportOut])
def reports_submitted_by_me(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    if user.role != "lab":
        raise HTTPException(status_code=403, detail="Only labs can view their submitted reports")

    reports = db.query(Report).filter(Report.uploaded_by_id == user.id).order_by(Report.created_at.desc()).all()

    result = []
    for r in reports:
        patient = db.query(User).filter(User.id == r.patient_id).first()
        result.append({
            "id": r.id,
            "patient_id": r.patient_id,
            "uploaded_by_id": r.uploaded_by_id,
            "uploaded_by_name": patient.email if patient else "Unknown patient",
            "extracted_values": r.extracted_values,
            "risk_results": r.risk_results,
            "recommendations": r.recommendations,
            "created_at": r.created_at.isoformat() if r.created_at else None,
        })
    return result

@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.patient_id != user.id and report.uploaded_by_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to access this report")

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    p.setFont("Helvetica-Bold", 16)
    p.drawString(50, y, "MedIntel AI - Health Report")
    y -= 25

    p.setFont("Helvetica", 10)
    p.drawString(50, y, f"Report ID: {report.id}")
    y -= 15
    p.drawString(50, y, f"Date: {report.created_at.strftime('%Y-%m-%d %H:%M') if report.created_at else 'N/A'}")
    y -= 30

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Lab Values")
    y -= 18
    p.setFont("Helvetica", 9)

    labels = {
        "age": "Age", "gender": "Gender", "glucose": "Glucose (mg/dL)",
        "HbA1c": "HbA1c (%)", "bmi": "BMI", "sysBP": "Systolic BP",
        "diaBP": "Diastolic BP", "chol": "Cholesterol", "hemo": "Hemoglobin",
        "creatinine": "Creatinine", "alt": "ALT", "ast": "AST",
    }
    col_x = [50, 300]
    row_y = y
    i = 0
    for key, label in labels.items():
        val = report.extracted_values.get(key)
        if val is None:
            continue
        x = col_x[i % 2]
        if i % 2 == 0 and i != 0:
            row_y -= 15
        p.drawString(x, row_y, f"{label}: {val}")
        i += 1
    y = row_y - 25

    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Risk Results")
    y -= 18
    p.setFont("Helvetica", 10)
    for key, val in report.risk_results.items():
        status = "AT RISK" if val == 1 else "Healthy"
        p.drawString(60, y, f"- {key.replace('_', ' ').title()}: {status}")
        y -= 15

    y -= 15
    p.setFont("Helvetica-Bold", 12)
    p.drawString(50, y, "Recommendations")
    y -= 18
    p.setFont("Helvetica", 10)
    for rec in report.recommendations:
        p.drawString(60, y, f"- {rec}")
        y -= 15

    p.showPage()
    p.save()
    buffer.seek(0)

    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{report_id}.pdf"}
    )