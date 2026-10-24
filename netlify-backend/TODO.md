# Secure Test Mode Delivery TODO

## Backend code

- [ ] Deploy Netlify Functions from the backend project.
- [ ] Add Test Mode environment variables in Netlify without exposing them.
- [ ] Confirm the Test Mode Payment Link internal ID.
- [ ] Seed both PDF assets into the private Netlify Blobs store.
- [ ] Configure the Razorpay Test Mode webhook to the deployed webhook URL.
- [ ] Configure the Resend verified sender.

## Verification outcomes

- [ ] Test success payment creates one paid order and two expiring grants.
- [ ] Test failure does not create a grant.
- [ ] Test pending does not create a grant.
- [ ] Invalid webhook signature is rejected.
- [ ] Duplicate webhook event is idempotent.
- [ ] Duplicate payment identity is idempotent.
- [ ] Correct PDFs download with a valid grant.
- [ ] Expired and over-limit downloads are denied.
- [ ] Confirmation email succeeds or enters retry state.
- [ ] Email retry worker processes a failed email once delivery is available.
- [ ] No PDF or secret appears in the public GitHub repository.
- [ ] Live Mode remains disabled.
