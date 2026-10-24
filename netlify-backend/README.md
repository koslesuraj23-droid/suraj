# Secure Razorpay Test Mode eBook Delivery Backend

यह backend मौजूदा GitHub Pages landing page से अलग चलता है। GitHub Pages पर केवल static frontend रहेगा; Razorpay webhook, private PDFs और email delivery Netlify Functions में रहेंगी।

## अभी क्या तैयार है

इस project में Razorpay Payment Link webhook के लिए raw-body HMAC verification, ₹199/19900 paise और INR checks, configured Test Payment Link ID check, paid/captured status check, duplicate event protection, private Netlify Blobs assets, expiring download grants, three-download limit और Resend confirmation email शामिल हैं। Email failure को `email_retry` state में रखा जाता है और scheduled retry function हर 15 मिनट में pending email को फिर भेजने की कोशिश करता है।

## जरूरी Netlify variables

इन values को Netlify UI के Environment variables section में manually set करें। Real values कभी GitHub, README या chat में commit न करें:

```text
RAZORPAY_WEBHOOK_SECRET
RAZORPAY_PAYMENT_LINK_ID
RESEND_API_KEY
EMAIL_FROM
SUPPORT_EMAIL
ADMIN_SETUP_TOKEN
DOWNLOAD_TTL_HOURS=48
MAX_DOWNLOADS=3
```

`RAZORPAY_PAYMENT_LINK_ID` short URL नहीं है। यह Razorpay Dashboard में दिखने वाला Test Mode Payment Link ID होना चाहिए, जैसे `plink_test_...`। `EMAIL_FROM` Resend में verified sender/domain से होना चाहिए।

## Netlify setup

Netlify में **Add new project → Import an existing project → GitHub** चुनें और केवल `koslesuraj23-droid/suraj` repository access दें। Base directory `netlify-backend` रखें। Build command खाली रखें और publish directory `public` रखें। Netlify Functions directory `netlify/functions` पहले से `netlify.toml` में configured है। कोई paid plan select न करें।

## Private PDFs seed करना

Deployment सफल होने और environment variables set होने के बाद दोनों PDFs को public GitHub में डालने के बजाय protected setup endpoint पर upload करें। Local terminal में real admin token environment variable से दें; token को command history या chat में paste न करें:

```bash
export BACKEND_URL="https://YOUR-NETLIFY-SITE.netlify.app"
export ADMIN_SETUP_TOKEN='set-this-only-in-your-local-shell'
curl -fsS -X POST "$BACKEND_URL/api/admin/seed" \
  -H "Authorization: Bearer $ADMIN_SETUP_TOKEN" \
  -F "excel-online-earning.pdf=@/safe/local/path/excel-online-earning.pdf;type=application/pdf" \
  -F "excel-only-ebook.pdf=@/safe/local/path/excel-only-ebook.pdf;type=application/pdf"
```

Response में दोनों uploaded keys दिखने चाहिए। Upload के बाद `ADMIN_SETUP_TOKEN` बदल देना recommended है।

## Razorpay Test Mode webhook

Razorpay Dashboard में Test Mode खोलें। Webhook URL यह होगा:

```text
https://YOUR-NETLIFY-SITE.netlify.app/api/razorpay-webhook
```

`payment_link.paid`, `payment_link.partially_paid`, `payment_link.cancelled` और `payment_link.expired` events में से कम-से-कम paid और terminal failure events configure करें। Webhook secret Netlify variable में रखें। Secret chat में नहीं भेजना है।

## Test evidence required

Live Mode चालू किए बिना Test Mode में success, failure, pending, invalid signature, duplicate webhook, correct two-file download, expiry, download limit और Resend delivery/retry check करें। केवल actual logs और returned responses को pass माना जाएगा।
