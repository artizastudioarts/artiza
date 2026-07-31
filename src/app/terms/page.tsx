import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="max-w-2xl mx-auto px-6 py-14 flex-1 w-full">
        <p className="placard-label text-ink-soft mb-3">Legal</p>
        <h1 className="font-display text-3xl italic mb-8">
          Terms &amp; Conditions
        </h1>

        <div className="space-y-8 text-sm leading-relaxed text-ink">
          <p className="text-ink-soft">
            Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
          </p>

          <section>
            <h2 className="font-display text-lg mb-2">1. Who we are</h2>
            <p>
              These Terms &amp; Conditions govern all orders placed with
              Artiza Studio (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
              through this website. By placing an order, you agree to these
              terms.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">2. Orders and payment</h2>
            <p>
              All prices are shown in Euros (EUR) and include applicable
              taxes unless stated otherwise. Payment is processed securely
              by Stripe at the time of checkout. We do not store your card
              details. An order is confirmed once payment has been
              successfully completed, at which point you will receive a
              confirmation with your unique order number.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">3. Accounts</h2>
            <p>
              You may check out as a guest or create an account. If you
              create an account, you are responsible for keeping your login
              details secure and for all activity under your account.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">4. Shipping</h2>
            <p>
              We aim to pack and ship orders promptly. Estimated delivery
              times depend on your location and are provided for guidance
              only; they are not guaranteed delivery dates. Risk of loss and
              title for items pass to you once the order is delivered to the
              shipping address you provided.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">5. Returns and refunds</h2>
            <p>
              You may return most items within <strong>14 days</strong> of
              receiving your order for a full refund, provided the item is
              unused and in its original condition and packaging. To start a
              return, contact us with your order number. Refunds are issued
              to your original payment method once we&apos;ve received and
              inspected the returned item. Return shipping costs are the
              responsibility of the customer unless the item arrived faulty
              or incorrect.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">6. Cancellations</h2>
            <p>
              You may cancel an order before it has shipped by contacting
              us. Once an order has shipped, the return process above
              applies instead.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">
              7. Promotional communications
            </h2>
            <p>
              If you opt in at checkout, we may send you occasional
              newsletters, offers, or updates by email. You can unsubscribe
              at any time using the link in any such email.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">8. Your information</h2>
            <p>
              We collect the information needed to process and ship your
              order — such as your name, email, phone number, and shipping
              address — and share it only with the service providers
              necessary to fulfil your order (such as our payment processor
              and delivery carriers).
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">9. Changes to these terms</h2>
            <p>
              We may update these Terms &amp; Conditions from time to time.
              The version in effect at the time you place an order is the
              one that applies to that order.
            </p>
          </section>

          <section>
            <h2 className="font-display text-lg mb-2">10. Contact</h2>
            <p>
              Questions about an order or these terms? Reach out to us at{" "}
              <a href="mailto:hello@artiza.studio" className="underline">
                hello@artiza.studio
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
