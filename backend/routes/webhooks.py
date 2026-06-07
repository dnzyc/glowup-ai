from fastapi import APIRouter, Request
from config import STRIPE_WEBHOOK_SECRET
import stripe
from services.credit_service import CreditService

router = APIRouter()


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    stripe.api_key = STRIPE_SECRET_KEY
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(payload, sig_header, STRIPE_WEBHOOK_SECRET)
    except (ValueError, stripe.error.SignatureVerificationError):
        return {"error": "Invalid signature"}

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        amount = session.get("metadata", {}).get("credits", 10)
        if user_id:
            CreditService.add_credits(user_id, int(amount), session["id"])

    return {"status": "ok"}
