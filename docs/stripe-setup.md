# GlowUp AI — Stripe Setup

## 1. Create Products in Stripe Dashboard

Go to: https://dashboard.stripe.com/products

Create 3 one-time products:

| Product | Price | Credits | Price ID |
|---------|-------|---------|----------|
| Starter | $5.00 | 10 | `price_xxx_starter` |
| Pro | $20.00 | 50 | `price_xxx_pro` |
| Studio | $50.00 | 150 | `price_xxx_studio` |

Metadata for each: `credits: <number>`

## 2. Set up Webhook

```bash
# Local dev:
stripe listen --forward-to http://localhost:8000/api/stripe/webhook

# Production:
# Stripe Dashboard > Webhooks > Add endpoint
# URL: https://your-api.railway.app/api/stripe/webhook
# Events: checkout.session.completed
```

## 3. Add Price IDs to .env.local / Vercel env vars

```
NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID=price_xxx_starter
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxx_pro
NEXT_PUBLIC_STRIPE_STUDIO_PRICE_ID=price_xxx_studio
```
