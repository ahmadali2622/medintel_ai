from pydantic import BaseModel
from typing import Optional, Dict, List, Union

class HealthInput(BaseModel):
    age: int
    gender: str
    glucose: Optional[float] = None
    HbA1c: Optional[float] = None
    bmi: Optional[float] = None
    sysBP: Optional[float] = None
    diaBP: Optional[float] = None
    chol: Optional[float] = None
    hemo: Optional[float] = None
    creatinine: Optional[float] = None
    alt: Optional[float] = None
    ast: Optional[float] = None

class HealthResult(BaseModel):
    risk_results: Dict[str, int]
    recommendations: List[str]

class PDFExtractResult(BaseModel):
    extracted: Dict[str, Optional[Union[float, str]]]