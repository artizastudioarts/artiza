# Your art shop — setup guide

Everything below is one-time setup. After this, adding new artwork or
managing orders is done entirely at `/admin` — no code needed.

**Total cost: ~€10-15/year (just the domain).** Hosting, database and
checkout have no monthly fee at this scale.

---

## 1. Create three free accounts

1. **GitHub** — github.com/signup (holds your code)
2. **Supabase** — supabase.com (your database + image storage, free tier)
3. **Vercel** — vercel.com (hosting, free tier, sign up with GitHub)
4. **Stripe** — stripe.com (payments — cards + PayPal in one)

## 2. Put this code on GitHub

1. Create a new empty repository on GitHub (no README/license).
2. In a terminal, inside this folder:
   ```
   git init
   git add .
   git commit -m "Initial art shop"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

## 3. Set up Supabase (database + image storage)

1. Create a new Supabase project (pick a region close to Germany, e.g. Frankfurt).
2. Go to **SQL Editor** -> paste the contents of `supabase-schema.sql` -> Run.
   This creates your `products` and `orders` tables.
3. Go to **Storage** -> **New bucket** -> name it `artwork` -> make it **Public**.
   This is where your artwork photos live.
4. Go to **Project Settings -> API**. You'll need three values for step 5:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key (click "reveal") -> `SUPABASE_SERVICE_ROLE_KEY`
     (keep this one secret — never put it in client-side code)

## 4. Set up Stripe (payments)

1. Sign up, finish the basic business details.
2. Go to **Settings -> Payment methods** and turn on **PayPal** (card is on
   by default). Stripe now shows both at checkout automatically.
3. Go to **Developers -> API keys** -> copy the **Secret key** ->
   `STRIPE_SECRET_KEY` (start with the **test** key while you're setting
   up; switch to the **live** key once you're ready to sell for real).
4. You'll add the webhook (step 6) after your site is live, since it
   needs your live URL.

## 5. Deploy to Vercel

1. On vercel.com, **Add New Project** -> import your GitHub repo.
2. Before deploying, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET` — leave blank for now, you'll fill this in step 6
   - `ADMIN_PASSWORD` — make up a strong password, this locks your `/admin` page
   - `SITE_URL` — your future Vercel URL, e.g. `https://your-shop.vercel.app`
3. Click **Deploy**. In a minute or two your site is live at a `*.vercel.app` address.

## 6. Connect the Stripe webhook (this is what automates order recording)

1. In Stripe: **Developers -> Webhooks -> Add endpoint**.
2. Endpoint URL: `https://your-shop.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Save, then copy the **Signing secret** (starts `whsec_...`).
5. Back in Vercel: **Project Settings -> Environment Variables** -> add/edit
   `STRIPE_WEBHOOK_SECRET` with that value -> redeploy (Vercel does this
   automatically on save, or trigger a redeploy from the Deployments tab).

Once this is connected: every paid order automatically gets saved to your
**Orders** tab in `/admin` and the artwork is automatically marked "Sold"
on your site — zero manual work.

## 7. Add your first pieces

1. Go to `https://your-shop.vercel.app/admin`, log in with your `ADMIN_PASSWORD`.
2. Click the **Artwork** tab -> **+ Add new piece** -> fill in details, upload
   a photo -> Save. It appears on your homepage within a minute.

## 8. Buy a domain (optional but recommended, ~€10-15/year)

1. Buy a domain from any registrar (e.g. Namecheap, Porkbun, INWX — a
   German registrar, useful if you want a `.de` domain).
2. In Vercel: **Project Settings -> Domains** -> add your domain -> follow
   the DNS instructions Vercel shows you (usually one or two DNS records
   at your registrar).
3. Update `SITE_URL` in your environment variables to your new domain.

## 9. Go live for real

1. In Stripe, finish account verification (business details, bank account
   for payouts).
2. Swap `STRIPE_SECRET_KEY` in Vercel from the **test** key to the **live** key.
3. Add a **second** webhook endpoint in Stripe under **live mode** (same
   URL, same event) and update `STRIPE_WEBHOOK_SECRET` to the live signing secret.

---

## Day-to-day use

- **Add/remove artwork, mark pieces sold:** `/admin` -> Artwork tab
- **View orders, get shipping addresses, mark shipped:** `/admin` -> Orders tab
- Selling out a piece happens automatically the moment it's paid for —
  you'll never oversell a one-of-a-kind piece.

## Costs recap

| Item | Cost |
|---|---|
| Vercel hosting | Free (up to far more traffic than you'll need) |
| Supabase database + storage | Free (up to 500MB DB / 1GB storage) |
| Stripe | No monthly fee — ~1.5% + €0.25 per transaction |
| Domain | ~€10-15/year |
