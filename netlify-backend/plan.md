# Secure Test Mode Payment and eBook Delivery Plan

## Approved scope

Keep the current GitHub Pages landing page and Razorpay Payment Link approach. Add a separate Netlify Functions backend for Test Mode only. Do not switch Live Mode, accept real payments, activate a paid plan, or expose secrets.

## Architecture

- `netlify/functions/razorpay-webhook.mjs`: receives Razorpay Payment Link events, validates the raw-body HMAC signature, checks event type, Payment Link ID, INR amount 19900 paise and captured/paid status, and applies idempotency.
- `netlify/functions/download.mjs`: validates an expiring download grant, applies a maximum of three downloads per file, and streams the private PDF from Netlify Blobs.
- `netlify/functions/seed-assets.mjs`: protected setup endpoint for uploading the two PDFs to a private Netlify Blobs store. It requires an admin bearer token and is never linked from the frontend.
- `netlify/functions/retry-email.mjs`: scheduled retry worker for paid orders with failed email delivery.
- `netlify/functions/_lib/*.mjs`: shared validation, storage, email and response helpers.
- Netlify Blobs stores: private `ebook-assets` for PDFs, `ebook-orders` for orders, events, grants and email state.
- Resend: confirmation email only after verified payment; API key is a Netlify environment variable.

## Required Netlify environment variables

These values must be entered in Netlify UI or CLI environment-variable settings, never committed:

- `RAZORPAY_WEBHOOK_SECRET`
- `RAZORPAY_PAYMENT_LINK_ID` (Test Mode link ID, not the short URL)
- `RESEND_API_KEY`
- `EMAIL_FROM` (must use a verified sender/domain in Resend)
- `SUPPORT_EMAIL`
- `ADMIN_SETUP_TOKEN`
- `DOWNLOAD_TTL_HOURS` (default 48)
- `MAX_DOWNLOADS` (default 3)

## Product files

The bundle contains both existing PDFs:

- `excel-online-earning.pdf`
- `excel-only-ebook.pdf`

They are uploaded to private storage through the protected seed endpoint. They must not be added to GitHub.

## Acceptance evidence required before Live Mode

- Valid success event creates exactly one paid order and two grants.
- Failed, cancelled, pending and invalid-signature events create no grants.
- Duplicate event ID and duplicate payment ID do not create a second fulfillment.
- Download links expire and enforce the configured maximum.
- Resend success records an email ID; failure is persisted and scheduled retry is observable.
- Test Mode only; no real payment and no Live Mode setting change.
