from pydantic import BaseModel
from typing import Optional, Dict, List

class HealthInput(BaseModel):
    age: int
    gender: str  # "Male" or "Female"
    glucose: float
    HbA1c: float
    bmi: float
    sysBP: float
    diaBP: float
    chol: float
    hemo: float
    creatinine: float
    alt: float
    ast: float

class HealthResult(BaseModel):
    risk_results: Dict[str, int]
    recommendations: List[str]

class PDFExtractResult(BaseModel):
    extracted: Dict[str, Optional[float]]