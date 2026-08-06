import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";

export async function renderHtmlToPdf(html: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true,
  });
  try {
    const page = await browser.newPage();
    // "networkidle0" isn't supported here — the invoice HTML is fully
    // self-contained (no external images/fonts to wait on), so "load" is
    // both valid and sufficient.
    await page.setContent(html, { waitUntil: "load" });
    const pdf = await page.pdf({ format: "A4", printBackground: true });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
