"""
Stripe payment routes.
"""
from fastapi import APIRouter, HTTPException
from config import STRIPE_SECRET_KEY, FRONTEND_URL
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
