import pickle
import os
import pandas as pd

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODELS_PATH = os.path.join(BASE_DIR, "ml_models")

def _load(filename):
    with open(os.path.join(MODELS_PATH, filename), "rb") as f:
        return pickle.load(f)

diabetes_model = _load("diabetes.pkl")
heart_model = _load("heart.pkl")
kidney_model = _load("kidney.pkl")
liver_model = _load("liver.pkl")
hypertension_model = _load("hypertension.pkl")
scaler = _load("scaler.pkl")


def analyze_health(data: dict) -> dict:
    age = data["age"]
    gender_male = 1 if data["gender"] == "Male" else 0
    glucose = data["glucose"]
    HbA1c = data["HbA1c"]
    bmi = data["bmi"]
    sysBP = data["sysBP"]
    diaBP = data["diaBP"]
    chol = data["chol"]
    hemo = data["hemo"]
    creatinine = data["creatinine"]
    alt = data["alt"]
    ast = data["ast"]

    # --- Diabetes ---
    diabetes_input = pd.DataFrame([{
        'age': age, 'hypertension': 1 if sysBP > 130 else 0,
        'heart_disease': 0, 'bmi': bmi,
        'HbA1c_level': HbA1c, 'blood_glucose_level': glucose,
        'gender_Male': gender_male, 'gender_Other': 0,
        'smoking_history_current': 0, 'smoking_history_ever': 0,
        'smoking_history_former': 0, 'smoking_history_never': 1,
        'smoking_history_not current': 0,
    }])
    diabetes_scaled = scaler.transform(diabetes_input)
    diabetes_pred = diabetes_model.predict(diabetes_scaled)[0]

    # --- Heart ---
    heart_input = pd.DataFrame([{
        'age': age, 'sex': gender_male, 'cp': 0,
        'trestbps': sysBP, 'chol': chol,
        'fbs': 1 if glucose > 120 else 0,
        'restecg': 0, 'thalach': 75, 'exang': 0,
        'oldpeak': 0.0, 'slope': 1, 'ca': 0, 'thal': 2
    }])
    heart_pred = heart_model.predict(heart_input)[0]

    # --- Kidney ---
    kidney_input = pd.DataFrame([{
        'age': age, 'bp': sysBP, 'sg': 1.020,
        'al': 0, 'su': 0, 'bgr': glucose,
        'bu': 20, 'sc': creatinine,
        'sod': 138, 'pot': 4.2, 'hemo': hemo,
        'pcv': 40.0, 'wc': 7200.0, 'rc': 4.5,
        'rbc_normal': 1, 'pc_normal': 1,
        'pcc_present': 0, 'ba_present': 0,
        'htn_yes': 1 if sysBP > 130 else 0,
        'dm_yes': 1 if glucose > 140 else 0,
        'cad_no': 1, 'cad_yes': 0,
        'appet_poor': 0, 'pe_yes': 0, 'ane_yes': 0
    }])
    kidney_input = kidney_input.reindex(columns=kidney_model.feature_names_in_, fill_value=0)
    kidney_pred = kidney_model.predict(kidney_input)[0]

    # --- Liver ---
    liver_input = pd.DataFrame([{
        'Age': age, 'Sex': gender_male,
        'ALB': 4.0, 'ALP': 70, 'ALT': alt,
        'AST': ast, 'BIL': 0.8, 'CHE': 8.0,
        'CHOL': chol, 'CREA': creatinine,
        'GGT': 30, 'PROT': 7.0
    }])
    liver_input = liver_input.reindex(columns=liver_model.feature_names_in_, fill_value=0)
    liver_pred = liver_model.predict(liver_input)[0]

    # --- Hypertension ---
    hypertension_input = pd.DataFrame([{
        'age': age, 'BMI': bmi,
        'sysBP': sysBP, 'diaBP': diaBP,
        'glucose': glucose, 'totChol': chol
    }])
    hypertension_pred = hypertension_model.predict(hypertension_input)[0]

    # --- Clinical override rules ---
    def clinical_diabetes(r):
        if glucose >= 126 or HbA1c >= 6.5: return 1
        if glucose < 100 and HbA1c < 5.7: return 0
        return r

    def clinical_heart(r):
        if chol > 240 or sysBP > 140: return 1
        if chol < 200 and sysBP < 120: return 0
        return r

    def clinical_kidney(r):
        if creatinine > 1.2: return 1
        if creatinine < 0.9: return 0
        return r

    def clinical_liver(r):
        if alt > 56 or ast > 40: return 1
        if alt < 25 and ast < 25: return 0
        return r

    def clinical_hypertension(r):
        if sysBP > 130 or diaBP > 80: return 1
        if sysBP < 120 and diaBP < 80: return 0
        return r

    results = {
        "diabetes": int(clinical_diabetes(diabetes_pred)),
        "heart_disease": int(clinical_heart(heart_pred)),
        "kidney_disease": int(clinical_kidney(kidney_pred)),
        "liver_disease": int(clinical_liver(liver_pred)),
        "hypertension": int(clinical_hypertension(hypertension_pred)),
    }

    recommendations = []
    if glucose > 200: recommendations.append("Very High Glucose — Immediate medical consultation recommended")
    elif glucose > 140: recommendations.append("Reduce Sugar Intake & HbA1c test Recommended")
    elif glucose > 100: recommendations.append("Borderline Glucose — Monitor diet and sugar intake")
    else: recommendations.append("Glucose levels are Normal")

    if sysBP > 140: recommendations.append("Reduce Salt Intake & Check BP Regularly")
    elif sysBP > 120: recommendations.append("Slightly Elevated BP — Reduce stress & salt")
    else: recommendations.append("Blood Pressure is Normal")

    if chol > 240: recommendations.append("Avoid Oily Food & Lipid Profile Test Recommended")
    elif chol > 200: recommendations.append("Borderline Cholesterol — Reduce fried food")
    else: recommendations.append("Cholesterol is Normal")

    if HbA1c > 6.5: recommendations.append("High HbA1c — Consult a diabetologist")
    elif HbA1c > 5.7: recommendations.append("Pre-diabetic HbA1c range — Monitor carefully")
    else: recommendations.append("HbA1c is Normal")

    if creatinine > 1.2: recommendations.append("High Creatinine — Kidney function test recommended")
    else: recommendations.append("Creatinine is Normal")

    if alt > 56 or ast > 40: recommendations.append("Elevated Liver Enzymes — Liver function test recommended")
    else: recommendations.append("Liver Enzymes are Normal")

    return {"risk_results": results, "recommendations": recommendations}