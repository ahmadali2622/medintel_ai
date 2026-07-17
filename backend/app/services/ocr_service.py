import re
import io
import pdfplumber


def extract_value(text, patterns, default=None):
    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return float(match.group(1))
            except:
                pass
    return default


def extract_patient_info(pdf_bytes: bytes) -> dict:
    with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
        full_text = "\n".join(page.extract_text() or "" for page in pdf.pages)

    data = {}

    data['age'] = extract_value(full_text, [
        r'age[:\s]+(\d+)', r'patient age[:\s]+(\d+)', r'(\d+)\s*years?\s*old'
    ])

    if re.search(r'\b(male|man|mr\.)\b', full_text, re.IGNORECASE):
        data['gender'] = 'Male'
    elif re.search(r'\b(female|woman|ms\.|mrs\.)\b', full_text, re.IGNORECASE):
        data['gender'] = 'Female'

    data['glucose'] = extract_value(full_text, [
        r'blood glucose[:\s]+([\d.]+)', r'glucose[:\s]+([\d.]+)',
        r'blood sugar[:\s]+([\d.]+)', r'fasting glucose[:\s]+([\d.]+)',
    ])
    data['HbA1c'] = extract_value(full_text, [
        r'hba1c[:\s]+([\d.]+)', r'hb\s*a1c[:\s]+([\d.]+)',
        r'glycated hemoglobin[:\s]+([\d.]+)', r'a1c[:\s]+([\d.]+)',
    ])
    data['bmi'] = extract_value(full_text, [
        r'bmi[:\s]+([\d.]+)', r'body mass index[:\s]+([\d.]+)',
    ])

    bp_match = re.search(r'(\d{2,3})\s*/\s*(\d{2,3})', full_text)
    if bp_match:
        data['sysBP'] = float(bp_match.group(1))
        data['diaBP'] = float(bp_match.group(2))
    else:
        data['sysBP'] = extract_value(full_text, [r'systolic[:\s]+([\d.]+)', r'sys\s*bp[:\s]+([\d.]+)'])
        data['diaBP'] = extract_value(full_text, [r'diastolic[:\s]+([\d.]+)', r'dia\s*bp[:\s]+([\d.]+)'])

    data['chol'] = extract_value(full_text, [
        r'total cholesterol[:\s]+([\d.]+)', r'cholesterol[:\s]+([\d.]+)', r'chol[:\s]+([\d.]+)',
    ])
    data['hemo'] = extract_value(full_text, [
        r'hemoglobin[:\s]+([\d.]+)', r'haemoglobin[:\s]+([\d.]+)', r'\bhgb[:\s]+([\d.]+)', r'\bhb[:\s]+([\d.]+)',
    ])
    data['creatinine'] = extract_value(full_text, [
        r'creatinine[:\s]+([\d.]+)', r'serum creatinine[:\s]+([\d.]+)',
    ])
    data['alt'] = extract_value(full_text, [
        r'\balt[:\s]+([\d.]+)', r'alanine aminotransferase[:\s]+([\d.]+)', r'sgpt[:\s]+([\d.]+)',
    ])
    data['ast'] = extract_value(full_text, [
        r'\bast[:\s]+([\d.]+)', r'aspartate aminotransferase[:\s]+([\d.]+)', r'sgot[:\s]+([\d.]+)',
    ])

    return data