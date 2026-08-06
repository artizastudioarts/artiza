import { supabaseAdmin } from "./supabase";
import { renderTemplate } from "./email";
import { renderHtmlToPdf } from "./invoicePdf";
import { getInvoiceSettings, getInvoiceTemplateHtml } from "./getInvoiceSettings";
import { formatPrice } from "./types";

type OrderRow = {
  order_number: string;
  product_title: string;
  quantity: number;
  amount_total_cents: number;
  shipping_cents: number | null;
  currency: string | null;
  customer_name: string | null;
  shipping_address: {
    line1?: string;
    postal_code?: string;
    city?: string;
    country?: string;
  } | null;
};

export async function generateInvoiceForOrder(
  orderNumber: string
): Promise<{ invoiceNumber: string; pdfBuffer: Buffer; pdfPath: string } | null> {
  const db = supabaseAdmin();

  const { data: orderRows } = await db
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber);

  const rows = orderRows as OrderRow[] | null;
  if (!rows || rows.length === 0) return null;
  const first = rows[0];

  const settings = await getInvoiceSettings();
  const templateHtml = await getInvoiceTemplateHtml();
  if (!templateHtml) return null;

  const { data: invoiceNumberData } = await db.rpc("generate_invoice_number");
  const invoiceNumber: string = invoiceNumberData ?? "";
  if (!invoiceNumber) return null;

  const currency = first.currency ?? "eur";
  const itemsRows = rows
    .map(
      (o) =>
        `<tr><td>${o.product_title}</td><td>${o.quantity}</td><td>${formatPrice(o.amount_total_cents, currency)}</td></tr>`
    )
    .join("");

  const shippingCents = rows.find((o) => o.shipping_cents != null)?.shipping_cents ?? 0;
  const productsTotal = rows.reduce((sum, o) => sum + o.amount_total_cents, 0);
  const totalCents = productsTotal + shippingCents;

  const businessAddress = [
    settings?.address_line1,
    [settings?.postal_code, settings?.city].filter(Boolean).join(" "),
    settings?.country,
  ]
    .filter(Boolean)
    .join(", ");

  // Uses the shipping address collected at checkout — this shop doesn't
  // collect a separate billing address, which is standard for a store
  // this size.
  const customerAddress = first.shipping_address
    ? [
        first.shipping_address.line1,
        [first.shipping_address.postal_code, first.shipping_address.city]
          .filter(Boolean)
          .join(" "),
        first.shipping_address.country,
      ]
        .filter(Boolean)
        .join(", ")
    : "";

  const kleinunternehmerNotice = settings?.kleinunternehmer
    ? "Gemäß § 19 UStG wird keine Umsatzsteuer berechnet."
    : "";

  const vars = {
    invoice_number: invoiceNumber,
    invoice_date: new Date().toLocaleDateString("de-DE"),
    order_number: orderNumber,
    business_name: settings?.business_name ?? "",
    business_address: businessAddress,
    tax_number: settings?.tax_number ?? "",
    customer_name: first.customer_name ?? "",
    customer_address: customerAddress,
    items_rows: itemsRows,
    shipping_amount: formatPrice(shippingCents, currency),
    total_amount: formatPrice(totalCents, currency),
    kleinunternehmer_notice: kleinunternehmerNotice,
    footer_note: settings?.footer_note ?? "",
  };

  const html = renderTemplate(templateHtml, vars);
  const pdfBuffer = await renderHtmlToPdf(html);

  const pdfPath = `${invoiceNumber}.pdf`;
  await db.storage.from("invoices").upload(pdfPath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });

  await db.from("invoices").insert({
    invoice_number: invoiceNumber,
    order_number: orderNumber,
    pdf_path: pdfPath,
  });

  return { invoiceNumber, pdfBuffer, pdfPath };
}
