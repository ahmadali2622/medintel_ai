from langchain_groq import ChatGroq
from app.core.config import settings

llm = (
    ChatGroq(model=settings.GROQ_MODEL, api_key=settings.GROQ_API_KEY)
    if settings.GROQ_API_KEY
    else None
)


def build_context(latest_report: dict | None) -> str:
    if not latest_report:
        return ""
    risk = latest_report.get("risk_results", {})
    at_risk = [k for k, v in risk.items() if v == 1]
    context = f"Patient's latest report values: {latest_report.get('extracted_values')}\n"
    if at_risk:
        context += f"Conditions flagged as at-risk: {', '.join(at_risk)}\n"
    else:
        context += "No conditions currently flagged as at-risk.\n"
    return context


def get_chat_response(user_message: str, history: list | None = None, latest_report: dict | None = None) -> str:
    if llm is None:
        return "GROQ_API_KEY is not set. Please add it to your .env file."

    context = build_context(latest_report)
    history = history or []

    system_instructions = (
        "You are a focused medical health assistant for the MedIntel AI platform. "
        "Only answer questions related to health, medicine, symptoms, conditions, diet, and wellness. "
        "If asked something unrelated to health, politely redirect to health topics. "
        "You are not a doctor - always suggest consulting a real doctor for serious concerns.\n"
        "If the user's question has a typo or unclear term, infer the most likely medical term they meant "
        "and answer that - do not refuse just because of a typo.\n"
        "Answer in 2-4 short sentences, or a short numbered/bulleted list if listing items. "
        "Put each list item on its own line using a real line break. "
        "Use **word** for bold on important terms. Be specific and accurate, not vague."
    )

    convo = ""
    for turn in history[-6:]:
        role = "Patient" if turn.get("role") == "user" else "Assistant"
        convo += f"{role}: {turn.get('content', '')}\n"

    if context:
        prompt = (
            f"{system_instructions}\n\n"
            f"<patient_context>\n{context}\n</patient_context>\n\n"
            f"Conversation so far:\n{convo}\n"
            f"Patient: {user_message}\nAssistant:"
        )
    else:
        prompt = (
            f"{system_instructions}\n\n"
            f"Conversation so far:\n{convo}\n"
            f"Patient: {user_message}\nAssistant:"
        )

    try:
        response = llm.invoke(
            prompt,
            max_tokens=600,
            extra_body={"reasoning_effort": "low"}
        )
        return response.content.strip() if response.content else "Sorry, I couldn't generate a response."
    except Exception as e:
        return f"Error calling Groq API: {str(e)}"