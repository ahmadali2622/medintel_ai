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
        "You are a helpful health assistant for the MedIntel AI platform. "
        "You are not a doctor - always suggest consulting a real doctor for serious concerns. "
        "Answer in 2-3 short sentences, or a short numbered/bulleted list if listing items. "
        "Put each list item on its own line using a real line break. "
        "Use **word** for bold on important terms. Keep it concise - no long paragraphs."
    )

    convo = ""
    for turn in history[-6:]:  # keep last 6 turns to control token usage
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
        response = llm.invoke(prompt, max_tokens=200)
        return response.content.strip() if response.content else "Sorry, I couldn't generate a response."
    except Exception as e:
        return f"Error calling Groq API: {str(e)}"