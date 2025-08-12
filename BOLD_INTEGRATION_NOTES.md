# Bold Payment Integration — Implementation Notes

This document tracks what is implemented with mock endpoints today and what must change once real Bold API access is available.

## Current (Mock) Flow

- Frontend
  - Checkout creates an order in Supabase with `payment_method = 'bold'` and `status = 'awaiting_payment'`.
  - If method is Bold, it navigates to `Payment` page (`/payment`) with the `order` in navigation state.
  - Payment page calls `bold-init` Edge Function, which currently returns a mocked `paymentId` (or `redirectUrl`).
  - Payment page polls `bold-status` Edge Function every 3s until one of: `succeeded|failed|expired|cancelled`.
  - On `succeeded`:
    - Update order: `status = 'paid', is_verified = true` (via `db.updateOrderStatus`).
    - Decrement product quantities (`db.decrementProductQuantities`).
    - Send confirmation email via Edge Function `resend-email`.
    - Show success screen and auto-redirect.
  - On failure/expiry/cancel: show clear error with Retry (calls init again) or return to checkout.

- Edge Functions (expected)
  - `bold-init` (mock): returns `{ paymentId: string }` or `{ redirectUrl: string }`.
  - `bold-status` (mock): returns `{ status: 'pending'|'succeeded'|'failed'|'expired'|'cancelled' }`.

## What To Do When Real Bold Access Is Available

1. Secrets (Edge Functions → Secrets)

- `BOLD_API_KEY = <provided>`
- `BOLD_ENV = production|sandbox`
- Optional: `BOLD_WEBHOOK_SECRET = <provided>`

2. Edge Function: bold-init

- Replace mock response with a real POST to Bold to create a checkout/payment session.
- Return `{ redirectUrl }` (hosted checkout URL) OR a client token to render a widget.
- Include our `order_id` as metadata so webhook can correlate.

3. Edge Function: bold-status (optional if webhook is used)

- Given `paymentId`, fetch payment status from Bold’s API.
- Return `{ status }` mapped to our enums: `succeeded|failed|expired|cancelled|pending`.
- If you implement webhook, this function can simply read the order row from Supabase and return the saved status instead of hitting Bold.

4. Edge Function: bold-webhook (recommended)

- Verify signature using `BOLD_WEBHOOK_SECRET`.
- Map Bold event → order:
  - success → `status = 'paid', is_verified = true`
  - failure/expired/cancel → `status = 'failed'|'expired'|'cancelled'`
- Persist `payment_id`, timestamps.

5. Frontend Payment page

- If using hosted checkout redirect, use `redirectUrl` from `bold-init` and do not poll.
- On return URL from Bold (success/cancel), either:
  - Query our `bold-status` (if pulling), OR
  - Read order status directly from Supabase (if webhook writes it).
- For success, finalize (decrement inventory, send email) if not already done server-side.

6. Database

- Add optional columns to `orders` if desired:
  - `payment_id text`, `payment_meta jsonb`, `paid_at timestamp`.

## API/Routes Summary

- `POST /functions/v1/bold-init` → returns `{ redirectUrl }` or `{ paymentId }`
- `POST /functions/v1/bold-status` → returns `{ status }` (mock)
- `POST /functions/v1/bold-webhook` → updates order status (real-only)
- `POST /functions/v1/resend-email` → already in use to send order email

## Testing Checklist

- Bold selected → Payment page shows processing, polls → success → success UI + email + inventory decrement.
- Failure/Expired/Cancelled → error screen with Retry & Back to Checkout.
- COD continues to open the existing confirmation modal immediately.

## Notes

- Keep CORS permissive for localhost during dev.
- Once in prod, restrict origins and add signature verification for webhooks.
