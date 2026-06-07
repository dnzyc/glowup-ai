"""
Stripe payment routes.
"""
from fastapi import APIRouter, HTTPException, Request
from config import STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, FRONTEND_URL
from services.credit_service import CreditService
import stripe

router = APIRouter()


@router.post("/stripe/checkout")
async def create_checkout_session(data: dict):
    price_id = data.get("price_id")
    user_id = data.get("user_id")

    if not price_id or not user_id:
        raise HTTPException(status_code=400, detail="Missing price_id or user_id")

    stripe.api_key = STRIPE_SECRET_KEY

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{"price": price_id, "quantity": 1}],
            mode="payment",
            client_reference_id=user_id,
            success_url=f"{FRONTEND_URL}/dashboard?success=true",
            cancel_url=f"{FRONTEND_URL}/pricing?canceled=true",
        )
        return {"url": session.url}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    stripe.api_key = STRIPE_SECRET_KEY

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session.get("client_reference_id")
        line_items = stripe.checkout.Session.list_line_items(session["id"])
        if line_items.data:
            price = line_items.data[0].price
            credits = int(price.metadata.get("credits", 0))
            if user_id and credits:
                CreditService.add_credits(user_id, credits, session["id"])

    return {"status": "ok"}
