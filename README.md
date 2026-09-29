# asset-shop-template

Sell digital goods this afternoon. Guest checkout, magic-link accounts, order
dashboard, mock fulfillment — with clean seams to plug in Stripe, real email,
and your own generation backend when you're ready.

Extracted from a production game-asset shop. The storefront is the template;
your fulfillment backend stays yours.

## What's inside

- Product catalog (`lib/db.ts` `PRODUCTS` — edit the array, ship)
- Guest checkout + mock payment (`app/api/checkout/route.ts`)
- Magic-link auth: 15-minute single-use links, 30-day sessions, no passwords
- Orders auto-claim by email match on login (guest buys now, owns it later)
- Receipt-token order links that keep working without login
- Owner dashboard (`/dashboard`) + live order page (`/o/[publicId]`)
- Admin order list gated by `ADMIN_EMAILS`
- Mock fulfillment clock: jobs go queued → working → complete (~30s), no worker
- SQLite via Node's built-in `node:sqlite` — zero native deps, file in `data/`

## Quickstart

```bash
cp .env.example .env   # set ADMIN_EMAILS to your address
npm install
npm run dev            # http://localhost:3000
```

Buy something as a guest, save the receipt link, request a login link on
`/login` (mock email prints a dev link — click it), watch the guest order
appear in `/dashboard`.

## Going live: the three seams

1. **Stripe** — `app/api/checkout/route.ts` is marked. Verify the payment
   (webhook or session), then run the same paid-transition: order status →
   `paid`, insert the `jobs` row. Keep the mock path behind an env flag for
   local dev.
2. **Email** — `lib/auth.ts` `requestLink()` is marked. Send the magic link
   via Resend/Postmark when `EMAIL_API_KEY` is set; dev-link fallback stays
   for local.
3. **Fulfillment** — `app/api/_job.ts` `readJob()` is the whole mock backend.
   Replace it with your real job table + worker (poll a provider, write
   artifacts to object storage), and serve the artifact in
   `app/api/orders/[publicId]/download/route.ts` (signed URL, zip, …).

## Deploy

Any Node 22+ host works (`node:sqlite` is stdlib). Build with `npm run build`,
run `npm start` with `APP_URL` set to your domain. The `data/` directory holds
the SQLite file — back it up or point `DATABASE_PATH` at durable storage.

## License

MIT — sell things with it.
