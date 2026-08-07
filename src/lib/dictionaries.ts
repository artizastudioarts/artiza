import type { Locale } from "./i18n";

export type Dictionary = {
  nav: {
    home: string;
    shop: string;
    cartLabel: string; // combine with item count in the component, e.g. `${cartLabel} (${count})`
    account: string;
    login: string;
    openMenu: string;
    closeMenu: string;
  };
  home: {
    defaultSubheadline: string;
    defaultHeadline: string;
    defaultBody: string;
    shopButton: string;
    videoFallback: string;
    videoCaption: string;
    readyHeading: string;
    browseButton: string;
    defaultStoryEyebrow: string;
    defaultStoryHeading: string;
    defaultStoryBody: string;
    defaultCarouselEyebrow: string;
    carouselPrev: string;
    carouselNext: string;
    carouselRegionLabel: string;
    defaultReviewsEyebrow: string;
    defaultReviewsHeading: string;
  };
  shop: {
    eyebrow: string;
    heading: string;
    body: string;
    empty: string;
    sortNewest: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    sortNameAsc: string;
  };
  productCard: {
    badges: {
      best_seller: string;
      artists_pick: string;
      trending: string;
      customer_favorite: string;
      new_creations: string;
    };
  };
  product: {
    originalArtworkFallback: string;
    qty: string; // template with {n}
    addToCart: string;
    viewCart: string;
    continueShopping: string;
    relatedHeading: string;
    showPhoto: string; // template with {n} and {total}
  };
  cart: {
    title: string;
    empty: string;
    browseShop: string;
    each: string;
    remove: string;
    qty: string; // template with {n}
    total: string;
    checkout: string;
    redirecting: string;
    continueGuest: string;
    loginTrack: string;
    paymentNote: string;
  };
  auth: {
    loginTitle: string;
    signupTitle: string;
    loginSubtitle: string;
    signupSubtitle: string;
    emailPlaceholder: string;
    passwordPlaceholder: string;
    pleaseWait: string;
    loginButton: string;
    signupButton: string;
    noAccount: string;
    haveAccount: string;
    confirmEmailInfo: string;
  };
  account: {
    yourAccount: string;
    logout: string;
    yourOrders: string;
    loading: string;
    noOrders: string;
    statusPaid: string;
    statusShipped: string;
    statusCancelled: string;
    downloadInvoice: string;
    downloading: string;
  };
  success: {
    orderConfirmed: string;
    thankYou: string;
    confirmationSent: string;
    saveOrderNumber: string;
    backToShop: string;
  };
  footer: {
    rights: string; // template with {year}
    terms: string;
  };
  terms: {
    eyebrow: string;
    title: string;
    lastUpdated: string; // template with {date}
    s1: { heading: string; body: string };
    s2: { heading: string; body: string };
    s3: { heading: string; body: string };
    s4: { heading: string; body: string };
    s5: { heading: string; before: string; bold: string; after: string };
    s6: { heading: string; body: string };
    s7: { heading: string; body: string };
    s8: { heading: string; body: string };
    s9: { heading: string; body: string };
    s10: { heading: string; before: string; after: string };
  };
  languageSwitcher: {
    switchToEnglish: string;
    switchToGerman: string;
  };
  reviews: {
    homeReadAll: string;
    verifiedBadge: string;
    pageEyebrow: string;
    pageTitle: string;
    pageEmpty: string;
    writeReviewButton: string;
    writeTitle: string;
    writeSubtitle: string;
    orderNumberLabel: string;
    orderNumberPlaceholder: string;
    nameLabel: string;
    ratingLabel: string;
    ratingOptional: string;
    reviewLabel: string;
    photoLabel: string;
    submitButton: string;
    submitting: string;
    successTitle: string;
    successBody: string;
    backToShop: string;
    errorOrderNotFound: string;
    errorAlreadyReviewed: string;
    errorGeneric: string;
  };
  shipping: {
    freeBanner: string; // template with {amount}
    freeProductNote: string; // template with {amount}
    cartProgress: string; // template with {amount}
    cartUnlocked: string;
  };
  cookies: {
    bannerMessage: string;
    policyLinkText: string;
    acceptAll: string;
    necessaryOnly: string;
    customize: string;
    save: string;
    necessaryTitle: string;
    necessaryDesc: string;
    alwaysOn: string;
    analyticsTitle: string;
    analyticsDesc: string;
    marketingTitle: string;
    marketingDesc: string;
    footerLink: string;
    pageTitle: string;
    pageEyebrow: string;
  };
  impressum: {
    pageEyebrow: string;
    pageTitle: string;
    footerLink: string;
    sectionHeading: string; // "Angaben gemäß § 5 DDG"
    contactHeading: string;
    phoneLabel: string;
    emailLabel: string;
    vatIdLabel: string;
    disputeResolutionHeading: string;
    missingDetailsNote: string; // shown only if admin hasn't filled in business details yet
  };
  faq: {
    navLabel: string;
  };
  contact: {
    navLabel: string;
    nameLabel: string;
    emailLabel: string;
    messageLabel: string;
    submitButton: string;
    submitting: string;
    successMessage: string;
    errorMessage: string;
  };
  privacy: {
    footerLink: string;
    lastUpdated: string; // template with {date}
  };
};

const de: Dictionary = {
  nav: {
    home: "Start",
    shop: "Shop",
    cartLabel: "Warenkorb",
    account: "Konto",
    login: "Anmelden",
    openMenu: "Menü öffnen",
    closeMenu: "Menü schließen",
  },
  home: {
    defaultSubheadline: "ZUM-SELBST-BEMALEN-FIGUREN",
    defaultHeadline: "Mit Sorgfalt gefertigt, von dir bemalt",
    defaultBody:
      "Wir gestalten und arbeiten jedes Figurenmodell von Hand vor, bevor es als Bemal-Set zu dir nach Hause geschickt wird. Sieh dir an, wie jedes Stück entsteht, und stöbere dann im Shop, um dein nächstes Projekt auszuwählen.",
    shopButton: "Zur Kollektion",
    videoFallback: "Füge im Admin-Bereich ein Video hinzu, um es hier anzuzeigen",
    videoCaption: "Jedes Modell, handveredelt vor dem Versand",
    readyHeading: "Bereit, ein Modell auszuwählen?",
    browseButton: "Shop durchstöbern",
    defaultStoryEyebrow: "UNSER HANDWERK",
    defaultStoryHeading: "Von Hand gestaltet, bereit zum Bemalen",
    defaultStoryBody:
      "Jedes Modell beginnt als Skizze in unserem Studio, wird in Handarbeit geformt und sorgfältig grundiert, bevor es zu dir nach Hause reist. Wir glauben, dass ein Stück, das man selbst bemalt, länger in Erinnerung bleibt als eines, das schon fertig ist — deshalb liefern wir jedes Stück bereit für deine eigene Handschrift.",
    defaultCarouselEyebrow: "EIN BLICK INS STUDIO",
    carouselPrev: "Vorheriges Bild",
    carouselNext: "Nächstes Bild",
    carouselRegionLabel: "Bildergalerie, mit der Maus oder durch Wischen durchsuchbar",
    defaultReviewsEyebrow: "WAS UNSERE KUNDEN SAGEN",
    defaultReviewsHeading: "Echte Bewertungen von echten Käufern",
  },
  shop: {
    eyebrow: "Bemalbare Figuren",
    heading: "Modell wählen, loslegen.",
    body: "Stöbere unten durch die aktuelle Kollektion und wähle dein Lieblingsstück.",
    empty: "Es sind noch keine Stücke gelistet. Füge welche im Admin-Bereich hinzu.",
    sortNewest: "Neueste zuerst",
    sortPriceAsc: "Preis: aufsteigend",
    sortPriceDesc: "Preis: absteigend",
    sortNameAsc: "Name: A–Z",
  },
  productCard: {
    badges: {
      best_seller: "Bestseller",
      artists_pick: "Künstlerfavorit",
      trending: "Im Trend",
      customer_favorite: "Kundenliebling",
      new_creations: "Neue Kreation",
    },
  },
  product: {
    originalArtworkFallback: "Originalkunstwerk",
    qty: "Menge {n}",
    addToCart: "In den Warenkorb",
    viewCart: "Warenkorb ansehen",
    continueShopping: "Weiter einkaufen",
    relatedHeading: "Das könnte dir auch gefallen",
    showPhoto: "Foto {n} von {total} anzeigen",
  },
  cart: {
    title: "Dein Warenkorb",
    empty: "Dein Warenkorb ist leer.",
    browseShop: "Shop durchstöbern",
    each: "je Stück",
    remove: "Entfernen",
    qty: "Menge {n}",
    total: "Gesamt",
    checkout: "Zur Kasse",
    redirecting: "Weiterleitung zur Kasse…",
    continueGuest: "Als Gast fortfahren",
    loginTrack: "Anmelden / Registrieren, um diese Bestellung zu verfolgen",
    paymentNote: "Karte & PayPal akzeptiert über Stripe",
  },
  auth: {
    loginTitle: "Anmelden",
    signupTitle: "Konto erstellen",
    loginSubtitle: "Verfolge deine Bestellungen und ihren Status.",
    signupSubtitle: "So kannst du deine Bestellungen nach dem Kauf verfolgen.",
    emailPlaceholder: "E-Mail",
    passwordPlaceholder: "Passwort",
    pleaseWait: "Einen Moment…",
    loginButton: "Anmelden",
    signupButton: "Registrieren",
    noAccount: "Noch kein Konto? Jetzt erstellen",
    haveAccount: "Bereits ein Konto? Anmelden",
    confirmEmailInfo:
      "Konto erstellt. Bitte bestätige deine E-Mail-Adresse und melde dich anschließend an.",
  },
  account: {
    yourAccount: "Dein Konto",
    logout: "Abmelden",
    yourOrders: "Deine Bestellungen",
    loading: "Wird geladen…",
    noOrders:
      "Noch keine Bestellungen — Bestellungen, die du angemeldet aufgibst, erscheinen hier.",
    statusPaid: "Bestellung eingegangen",
    statusShipped: "Versendet",
    statusCancelled: "Storniert",
    downloadInvoice: "Rechnung herunterladen",
    downloading: "Wird geladen…",
  },
  success: {
    orderConfirmed: "Bestellung bestätigt",
    thankYou: "Vielen Dank für deine Bestellung",
    confirmationSent:
      "Eine Bestätigung wurde an deine E-Mail-Adresse gesendet. Dein Stück wird sorgfältig verpackt und bald versendet.",
    saveOrderNumber: "Speichere diese Bestellnummer, um sie später griffbereit zu haben.",
    backToShop: "Zurück zum Shop",
  },
  footer: {
    rights: "© {year} Artiza Studio. Alle Artikel werden mit Sorgfalt versendet.",
    terms: "AGB",
  },
  terms: {
    eyebrow: "Rechtliches",
    title: "Allgemeine Geschäftsbedingungen",
    lastUpdated: "Zuletzt aktualisiert: {date}",
    s1: {
      heading: "1. Wer wir sind",
      body: 'Diese Allgemeinen Geschäftsbedingungen gelten für alle Bestellungen, die über diese Website bei Artiza Studio ("wir", "uns", "unser") aufgegeben werden. Mit der Aufgabe einer Bestellung erklärst du dich mit diesen Bedingungen einverstanden.',
    },
    s2: {
      heading: "2. Bestellungen und Zahlung",
      body: "Alle Preise werden in Euro (EUR) angezeigt und enthalten die geltende Mehrwertsteuer, sofern nicht anders angegeben. Die Zahlung wird zum Zeitpunkt der Bestellung sicher über Stripe abgewickelt. Wir speichern keine Kartendaten. Eine Bestellung gilt als bestätigt, sobald die Zahlung erfolgreich abgeschlossen wurde; du erhältst dann eine Bestätigung mit deiner eindeutigen Bestellnummer.",
    },
    s3: {
      heading: "3. Konten",
      body: "Du kannst als Gast oder mit einem Konto bestellen. Wenn du ein Konto erstellst, bist du dafür verantwortlich, deine Anmeldedaten sicher aufzubewahren und für alle Aktivitäten unter deinem Konto.",
    },
    s4: {
      heading: "4. Versand",
      body: "Wir bemühen uns, Bestellungen zügig zu verpacken und zu versenden. Geschätzte Lieferzeiten hängen von deinem Standort ab und dienen nur zur Orientierung; sie sind keine garantierten Liefertermine. Das Risiko des Verlusts und das Eigentum an den Artikeln gehen auf dich über, sobald die Bestellung an die von dir angegebene Lieferadresse geliefert wurde.",
    },
    s5: {
      heading: "5. Rückgabe und Erstattung",
      before: "Du kannst die meisten Artikel innerhalb von ",
      bold: "14 Tagen",
      after:
        " nach Erhalt deiner Bestellung gegen vollständige Erstattung zurückgeben, sofern der Artikel unbenutzt und in seiner Originalverpackung ist. Um eine Rückgabe zu starten, kontaktiere uns mit deiner Bestellnummer. Erstattungen erfolgen auf die ursprüngliche Zahlungsmethode, sobald wir den zurückgesendeten Artikel erhalten und geprüft haben. Die Kosten für die Rücksendung trägt der Kunde, es sei denn, der Artikel kam fehlerhaft oder falsch an.",
    },
    s6: {
      heading: "6. Stornierungen",
      body: "Du kannst eine Bestellung stornieren, bevor sie versendet wurde, indem du uns kontaktierst. Sobald eine Bestellung versendet wurde, gilt stattdessen das oben beschriebene Rückgabeverfahren.",
    },
    s7: {
      heading: "7. Werbliche Kommunikation",
      body: "Wenn du dich beim Checkout dafür entscheidest, senden wir dir möglicherweise gelegentlich Newsletter, Angebote oder Updates per E-Mail. Du kannst dich jederzeit über den Link in einer solchen E-Mail abmelden.",
    },
    s8: {
      heading: "8. Deine Daten",
      body: "Wir erheben die Informationen, die zur Bearbeitung und zum Versand deiner Bestellung erforderlich sind — wie Name, E-Mail, Telefonnummer und Lieferadresse — und geben sie nur an die Dienstleister weiter, die zur Erfüllung deiner Bestellung notwendig sind (z. B. unser Zahlungsdienstleister und Versanddienstleister).",
    },
    s9: {
      heading: "9. Änderungen dieser Bedingungen",
      body: "Wir können diese Allgemeinen Geschäftsbedingungen von Zeit zu Zeit aktualisieren. Es gilt jeweils die Fassung, die zum Zeitpunkt deiner Bestellung in Kraft war.",
    },
    s10: {
      heading: "10. Kontakt",
      before: "Fragen zu einer Bestellung oder diesen Bedingungen? Schreib uns an ",
      after: ".",
    },
  },
  languageSwitcher: {
    switchToEnglish: "Switch to English",
    switchToGerman: "Auf Deutsch anzeigen",
  },
  reviews: {
    homeReadAll: "Alle Bewertungen lesen",
    verifiedBadge: "Verifizierter Kauf",
    pageEyebrow: "Kundenstimmen",
    pageTitle: "Bewertungen",
    pageEmpty: "Noch keine Bewertungen — sei die erste Person, die eine schreibt.",
    writeReviewButton: "Bewertung schreiben",
    writeTitle: "Teile deine Bewertung",
    writeSubtitle:
      "Nur Kunden mit einer gültigen Bestellnummer können eine Bewertung abgeben.",
    orderNumberLabel: "Bestellnummer",
    orderNumberPlaceholder: "z. B. AS-2607-000001",
    nameLabel: "Dein Name",
    ratingLabel: "Bewertung",
    ratingOptional: "(optional)",
    reviewLabel: "Deine Bewertung",
    photoLabel: "Foto deines fertigen Stücks (optional)",
    submitButton: "Bewertung absenden",
    submitting: "Wird gesendet…",
    successTitle: "Vielen Dank!",
    successBody:
      "Deine Bewertung wurde eingereicht und erscheint, sobald wir sie geprüft haben.",
    backToShop: "Zurück zum Shop",
    errorOrderNotFound:
      "Wir konnten diese Bestellnummer nicht finden. Bitte überprüfe sie und versuche es erneut.",
    errorAlreadyReviewed: "Für diese Bestellung wurde bereits eine Bewertung abgegeben.",
    errorGeneric: "Etwas ist schiefgelaufen. Bitte versuche es erneut.",
  },
  shipping: {
    freeBanner: "Kostenloser Standardversand ab {amount} Bestellwert",
    freeProductNote: "Kostenloser Standardversand ab {amount}",
    cartProgress: "Noch {amount} bis zum kostenlosen Standardversand",
    cartUnlocked: "Du hast kostenlosen Standardversand freigeschaltet.",
  },
  cookies: {
    bannerMessage:
      "Wir verwenden Cookies, die für den Betrieb der Website notwendig sind (z. B. Spracheinstellung, Anmeldung). Mit deiner Zustimmung nutzen wir außerdem optionale Cookies für Statistik und Marketing.",
    policyLinkText: "Mehr erfahren",
    acceptAll: "Alle akzeptieren",
    necessaryOnly: "Nur notwendige",
    customize: "Einstellungen",
    save: "Auswahl speichern",
    necessaryTitle: "Notwendig",
    necessaryDesc:
      "Erforderlich für grundlegende Funktionen wie Spracheinstellung, Anmeldung und Warenkorb. Kann nicht deaktiviert werden.",
    alwaysOn: "Immer aktiv",
    analyticsTitle: "Statistik",
    analyticsDesc:
      "Hilft uns zu verstehen, wie die Website genutzt wird, damit wir sie verbessern können. Wir nutzen dafür Vercel Web Analytics, das anonymisierte Nutzungsdaten erfasst, ohne Cookies zu setzen oder dich persönlich zu identifizieren.",
    marketingTitle: "Marketing",
    marketingDesc:
      "Würde für personalisierte Werbung oder Newsletter-Tracking verwendet. Aktuell nutzen wir hierfür keine Dienste — diese Einstellung ist für zukünftige Nutzung vorbereitet.",
    footerLink: "Cookie-Einstellungen",
    pageTitle: "Cookie-Richtlinie",
    pageEyebrow: "Rechtliches",
  },
  impressum: {
    pageEyebrow: "Rechtliches",
    pageTitle: "Impressum",
    footerLink: "Impressum",
    sectionHeading: "Angaben gemäß § 5 DDG",
    contactHeading: "Kontakt",
    phoneLabel: "Telefon",
    emailLabel: "E-Mail",
    vatIdLabel: "Umsatzsteuer-ID",
    disputeResolutionHeading: "Verbraucherstreitbeilegung",
    missingDetailsNote:
      "Diese Angaben werden noch vervollständigt. Bitte trage deine Geschäftsdaten unter Admin → Rechnungen und Admin → Content ein.",
  },
  faq: {
    navLabel: "FAQ",
  },
  contact: {
    navLabel: "Kontakt",
    nameLabel: "Name",
    emailLabel: "E-Mail",
    messageLabel: "Nachricht",
    submitButton: "Nachricht senden",
    submitting: "Wird gesendet…",
    successMessage: "Danke für deine Nachricht! Wir melden uns so schnell wie möglich.",
    errorMessage: "Etwas ist schiefgelaufen. Bitte versuche es erneut oder schreib uns direkt per E-Mail.",
  },
  privacy: {
    footerLink: "Datenschutz",
    lastUpdated: "Zuletzt aktualisiert: {date}",
  },
};

const en: Dictionary = {
  nav: {
    home: "Home",
    shop: "Shop",
    cartLabel: "Cart",
    account: "Account",
    login: "Log in",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  home: {
    defaultSubheadline: "PAINT-YOUR-OWN FIGURE KITS",
    defaultHeadline: "Handmade with care, painted by you",
    defaultBody:
      "We design and hand-finish every figure model before it ships to your door as a paint-it-yourself kit. Watch how each piece comes together, then browse the shop to pick your next project.",
    shopButton: "Shop the collection",
    videoFallback: "Add a video in the admin dashboard to show it here",
    videoCaption: "Every model, hand-finished before it ships",
    readyHeading: "Ready to pick a model?",
    browseButton: "Browse the shop",
    defaultStoryEyebrow: "OUR CRAFT",
    defaultStoryHeading: "Shaped by hand, ready for your colors",
    defaultStoryBody:
      "Every model starts as a sketch in our studio, is hand-formed and carefully primed before it travels to your door. We believe a piece you paint yourself stays with you longer than one that arrives finished — so we ship each piece ready for your own hand.",
    defaultCarouselEyebrow: "A LOOK INSIDE THE STUDIO",
    carouselPrev: "Previous photo",
    carouselNext: "Next photo",
    carouselRegionLabel: "Photo gallery, scrollable with mouse or swipe",
    defaultReviewsEyebrow: "WHAT OUR CUSTOMERS SAY",
    defaultReviewsHeading: "Real reviews from real buyers",
  },
  shop: {
    eyebrow: "Paintable figures",
    heading: "Pick a model, get painting.",
    body: "Browse the current collection below and choose your favorite.",
    empty: "No pieces are listed yet. Add some in the admin dashboard.",
    sortNewest: "Newest first",
    sortPriceAsc: "Price: Low to High",
    sortPriceDesc: "Price: High to Low",
    sortNameAsc: "Name: A–Z",
  },
  productCard: {
    badges: {
      best_seller: "Best Seller",
      artists_pick: "Artist's Pick",
      trending: "Trending",
      customer_favorite: "Customer Favorite",
      new_creations: "New Creation",
    },
  },
  product: {
    originalArtworkFallback: "Original artwork",
    qty: "Qty {n}",
    addToCart: "Add to cart",
    viewCart: "View cart",
    continueShopping: "Continue shopping",
    relatedHeading: "You might also like",
    showPhoto: "Show photo {n} of {total}",
  },
  cart: {
    title: "Your cart",
    empty: "Your cart is empty.",
    browseShop: "Browse the shop",
    each: "each",
    remove: "Remove",
    qty: "Qty {n}",
    total: "Total",
    checkout: "Checkout",
    redirecting: "Redirecting to checkout…",
    continueGuest: "Continue as guest",
    loginTrack: "Log in / Sign up to track this order",
    paymentNote: "Card & PayPal accepted via Stripe",
  },
  auth: {
    loginTitle: "Log in",
    signupTitle: "Create an account",
    loginSubtitle: "Track your orders and see their status.",
    signupSubtitle: "So you can track your orders after checkout.",
    emailPlaceholder: "Email",
    passwordPlaceholder: "Password",
    pleaseWait: "Please wait…",
    loginButton: "Log in",
    signupButton: "Sign up",
    noAccount: "No account yet? Create one",
    haveAccount: "Already have an account? Log in",
    confirmEmailInfo: "Account created. Check your email to confirm, then log in.",
  },
  account: {
    yourAccount: "Your account",
    logout: "Log out",
    yourOrders: "Your orders",
    loading: "Loading…",
    noOrders: "No orders yet — orders you place while logged in will show up here.",
    statusPaid: "Order received",
    statusShipped: "Shipped",
    statusCancelled: "Cancelled",
    downloadInvoice: "Download invoice",
    downloading: "Loading…",
  },
  success: {
    orderConfirmed: "Order confirmed",
    thankYou: "Thank you for your order",
    confirmationSent:
      "A confirmation has been sent to your email. Your piece will be carefully packed and shipped soon.",
    saveOrderNumber: "Save this order number to reference it later.",
    backToShop: "Back to shop",
  },
  footer: {
    rights: "© {year} Artiza Studio. All items shipped with care.",
    terms: "Terms & Conditions",
  },
  terms: {
    eyebrow: "Legal",
    title: "Terms & Conditions",
    lastUpdated: "Last updated: {date}",
    s1: {
      heading: "1. Who we are",
      body: 'These Terms & Conditions govern all orders placed with Artiza Studio ("we", "us", "our") through this website. By placing an order, you agree to these terms.',
    },
    s2: {
      heading: "2. Orders and payment",
      body: "All prices are shown in Euros (EUR) and include applicable taxes unless stated otherwise. Payment is processed securely by Stripe at the time of checkout. We do not store your card details. An order is confirmed once payment has been successfully completed, at which point you will receive a confirmation with your unique order number.",
    },
    s3: {
      heading: "3. Accounts",
      body: "You may check out as a guest or create an account. If you create an account, you are responsible for keeping your login details secure and for all activity under your account.",
    },
    s4: {
      heading: "4. Shipping",
      body: "We aim to pack and ship orders promptly. Estimated delivery times depend on your location and are provided for guidance only; they are not guaranteed delivery dates. Risk of loss and title for items pass to you once the order is delivered to the shipping address you provided.",
    },
    s5: {
      heading: "5. Returns and refunds",
      before: "You may return most items within ",
      bold: "14 days",
      after:
        " of receiving your order for a full refund, provided the item is unused and in its original condition and packaging. To start a return, contact us with your order number. Refunds are issued to your original payment method once we've received and inspected the returned item. Return shipping costs are the responsibility of the customer unless the item arrived faulty or incorrect.",
    },
    s6: {
      heading: "6. Cancellations",
      body: "You may cancel an order before it has shipped by contacting us. Once an order has shipped, the return process above applies instead.",
    },
    s7: {
      heading: "7. Promotional communications",
      body: "If you opt in at checkout, we may send you occasional newsletters, offers, or updates by email. You can unsubscribe at any time using the link in any such email.",
    },
    s8: {
      heading: "8. Your information",
      body: "We collect the information needed to process and ship your order — such as your name, email, phone number, and shipping address — and share it only with the service providers necessary to fulfil your order (such as our payment processor and delivery carriers).",
    },
    s9: {
      heading: "9. Changes to these terms",
      body: "We may update these Terms & Conditions from time to time. The version in effect at the time you place an order is the one that applies to that order.",
    },
    s10: {
      heading: "10. Contact",
      before: "Questions about an order or these terms? Reach out to us at ",
      after: ".",
    },
  },
  languageSwitcher: {
    switchToEnglish: "Switch to English",
    switchToGerman: "Auf Deutsch anzeigen",
  },
  reviews: {
    homeReadAll: "Read all reviews",
    verifiedBadge: "Verified purchase",
    pageEyebrow: "Customer voices",
    pageTitle: "Reviews",
    pageEmpty: "No reviews yet — be the first to write one.",
    writeReviewButton: "Write a review",
    writeTitle: "Share your review",
    writeSubtitle: "Only customers with a valid order number can leave a review.",
    orderNumberLabel: "Order number",
    orderNumberPlaceholder: "e.g. AS-2607-000001",
    nameLabel: "Your name",
    ratingLabel: "Rating",
    ratingOptional: "(optional)",
    reviewLabel: "Your review",
    photoLabel: "Photo of your finished piece (optional)",
    submitButton: "Submit review",
    submitting: "Submitting…",
    successTitle: "Thank you!",
    successBody: "Your review has been submitted and will appear once we've reviewed it.",
    backToShop: "Back to shop",
    errorOrderNotFound: "We couldn't find that order number. Please check and try again.",
    errorAlreadyReviewed: "This order has already been reviewed.",
    errorGeneric: "Something went wrong. Please try again.",
  },
  shipping: {
    freeBanner: "Free Standard shipping on orders over {amount}",
    freeProductNote: "Free Standard shipping over {amount}",
    cartProgress: "Add {amount} more for free Standard shipping",
    cartUnlocked: "You've unlocked free Standard shipping.",
  },
  cookies: {
    bannerMessage:
      "We use cookies that are necessary for the site to work (like your language setting and login). With your consent, we'd also use optional cookies for statistics and marketing.",
    policyLinkText: "Learn more",
    acceptAll: "Accept all",
    necessaryOnly: "Necessary only",
    customize: "Customize",
    save: "Save choices",
    necessaryTitle: "Necessary",
    necessaryDesc:
      "Required for basic functions like your language setting, login, and cart. Can't be turned off.",
    alwaysOn: "Always on",
    analyticsTitle: "Statistics",
    analyticsDesc:
      "Helps us understand how the site is used so we can improve it. We use Vercel Web Analytics for this, which collects anonymized usage data without setting cookies or identifying you personally.",
    marketingTitle: "Marketing",
    marketingDesc:
      "Would be used for personalized ads or newsletter tracking. We don't currently use any service for this — this setting is ready for future use.",
    footerLink: "Cookie Settings",
    pageTitle: "Cookie Policy",
    pageEyebrow: "Legal",
  },
  impressum: {
    pageEyebrow: "Legal",
    pageTitle: "Legal Notice",
    footerLink: "Legal Notice",
    sectionHeading: "Information according to § 5 DDG",
    contactHeading: "Contact",
    phoneLabel: "Phone",
    emailLabel: "Email",
    vatIdLabel: "VAT ID",
    disputeResolutionHeading: "Consumer dispute resolution",
    missingDetailsNote:
      "These details are still being completed. Business information can be added under Admin → Invoices and Admin → Content.",
  },
  faq: {
    navLabel: "FAQ",
  },
  contact: {
    navLabel: "Contact",
    nameLabel: "Name",
    emailLabel: "Email",
    messageLabel: "Message",
    submitButton: "Send message",
    submitting: "Sending…",
    successMessage: "Thanks for your message! We'll get back to you as soon as we can.",
    errorMessage: "Something went wrong. Please try again or email us directly.",
  },
  privacy: {
    footerLink: "Privacy Policy",
    lastUpdated: "Last updated: {date}",
  },
};

const dictionaries: Record<Locale, Dictionary> = { de, en };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
