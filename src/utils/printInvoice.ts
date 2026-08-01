import { Order } from "../types";
import brandLogoImg from "../assets/images/tech_soko_logo_1783960703453.jpg";
import signatureImg from "../assets/images/signature_adam_kassim_1785619369923.jpg";

export function generateInvoiceHtml(order: Order): string {
  const brandLogo = brandLogoImg;
  const formattedDate = order.createdAt ? new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }) : "Date pending";

  const subtotal = (order.items || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalAmount = order.totalAmount || subtotal;

  const itemsRows = (order.items || []).map((item) => `
    <tr>
      <td>
        <div style="font-size: 9px; font-weight: 700; color: #b45309; text-transform: uppercase; font-family: monospace;">${item.brand || "TECH SOKONI"}</div>
        <div style="font-weight: 600; color: #111827; margin-top: 2px; font-size: 11px;">${item.name}</div>
      </td>
      <td style="text-align: center; font-weight: 700; font-family: monospace;">${item.quantity}</td>
      <td style="text-align: right; font-family: monospace;">KES ${(item.price || 0).toLocaleString()}</td>
      <td style="text-align: right; font-weight: 800; color: #111827; font-family: monospace;">KES ${((item.price || 0) * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Official Invoice - #${order.id ? order.id.slice(0, 10).toUpperCase() : "TS-ORD"}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 8mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    }
    html, body {
      background: #ffffff !important;
      color: #111827 !important;
      font-size: 10px;
      line-height: 1.35;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .invoice-card {
      max-width: 100%;
      margin: 0 auto;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 16px;
      background: #ffffff;
      page-break-inside: avoid;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 2px solid #f3f4f6;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .brand-logo {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      border: 1px solid #d1d5db;
      object-fit: cover;
    }
    .brand-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #111827;
      line-height: 1;
    }
    .brand-subtitle {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.15em;
      color: #b45309;
      text-transform: uppercase;
      margin-top: 3px;
    }
    .company-details {
      margin-top: 8px;
      font-size: 9.5px;
      color: #4b5563;
      line-height: 1.4;
    }
    .company-details strong {
      color: #111827;
    }
    .contact-highlight {
      color: #111827;
      font-weight: 700;
    }
    .invoice-meta-box {
      text-align: right;
      font-size: 9.5px;
      color: #374151;
    }
    .badge-tax {
      display: inline-block;
      background: #111827;
      color: #ffffff;
      font-weight: 800;
      font-size: 9px;
      padding: 3px 8px;
      border-radius: 4px;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    .invoice-number {
      font-size: 13px;
      font-weight: 900;
      color: #111827;
      margin-top: 4px;
      font-family: monospace;
    }
    .status-tags {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      margin-top: 6px;
    }
    .tag {
      font-size: 8.5px;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #d1d5db;
      text-transform: uppercase;
    }
    .tag-paid {
      background: #ecfdf5;
      color: #047857;
      border-color: #a7f3d0;
    }
    .tag-unpaid {
      background: #fef2f2;
      color: #dc2626;
      border-color: #fca5a5;
    }
    .tag-shipped {
      background: #eff6ff;
      color: #1d4ed8;
      border-color: #bfdbfe;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #f3f4f6;
    }
    .details-box {
      background: #f9fafb;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #e5e7eb;
    }
    .section-label {
      font-size: 8.5px;
      font-weight: 800;
      letter-spacing: 0.1em;
      color: #6b7280;
      text-transform: uppercase;
      margin-bottom: 3px;
      font-family: monospace;
    }
    .client-name {
      font-size: 11px;
      font-weight: 700;
      color: #111827;
    }
    .table-container {
      margin: 12px 0;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      overflow: hidden;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 10px;
    }
    th {
      background: #f3f4f6;
      color: #374151;
      font-weight: 700;
      text-transform: uppercase;
      font-size: 8.5px;
      letter-spacing: 0.05em;
      padding: 6px 10px;
      border-bottom: 1px solid #e5e7eb;
    }
    td {
      padding: 8px 10px;
      border-bottom: 1px solid #f3f4f6;
      color: #1f2937;
      vertical-align: top;
    }
    tr:last-child td {
      border-bottom: none;
    }
    .totals-wrapper {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      margin-top: 10px;
      align-items: flex-end;
    }
    .clearance-box {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      padding: 10px;
      border-radius: 6px;
      max-width: 320px;
      font-size: 9px;
      color: #92400e;
    }
    .clearance-title {
      font-weight: 800;
      margin-bottom: 3px;
      text-transform: uppercase;
      font-size: 9.5px;
      color: #78350f;
    }
    .totals-box {
      width: 260px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      padding: 2px 0;
      color: #4b5563;
    }
    .totals-row.grand-total {
      border-top: 2px solid #111827;
      margin-top: 4px;
      padding-top: 4px;
      font-size: 13px;
      font-weight: 900;
      color: #111827;
    }
    .policies-section {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 2px solid #e5e7eb;
    }
    .policy-card {
      background: #fafafa;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px;
    }
    .policy-title {
      font-weight: 800;
      font-size: 9.5px;
      color: #b45309;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .policy-text {
      font-size: 8px;
      color: #374151;
      line-height: 1.4;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .footer {
      margin-top: 16px;
      padding-top: 10px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5px;
      color: #6b7280;
    }
    .signature-area {
      text-align: center;
      width: 150px;
    }
    .signature-line {
      border-bottom: 1px solid #9ca3af;
      height: 22px;
      margin-bottom: 3px;
      font-family: Georgia, serif;
      font-style: italic;
      font-size: 10px;
      color: #374151;
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div class="invoice-card">
    <!-- Header -->
    <div class="header">
      <div>
        <div class="brand-section">
          <img src="${brandLogo}" alt="Tech Sokoni" class="brand-logo" />
          <div>
            <div class="brand-title">TECH SOKONI</div>
            <div class="brand-subtitle">KENYA • OFFICIAL STORE RECEIPT</div>
          </div>
        </div>
        <div class="company-details">
          <p><strong>Physical Address:</strong> Kenyatta Pioneer Building, 5th Floor, Shop 514</p>
          <p>Kenyatta Avenue (Next to I&M Building), Nairobi CBD, Kenya</p>
          <p class="contact-highlight" style="margin-top: 2px;">Phone: 0792620789 / +254 792 620 789 | Email: shop@techsokoni.com</p>
        </div>
      </div>

      <div class="invoice-meta-box">
        <span class="badge-tax">TAX INVOICE</span>
        <div class="invoice-number">#${order.id ? order.id.slice(0, 10).toUpperCase() : "TS-ORD"}</div>
        <div style="margin-top: 4px; font-size: 9px; color: #4b5563;">
          <p><strong>Date Issued:</strong> ${formattedDate}</p>
          <p><strong>Payment Method:</strong> ${order.paymentProvider || "M-Pesa Express"}</p>
          ${order.receiptNo ? `<p style="color: #047857; font-weight: 700;"><strong>Clearance Ref:</strong> ${order.receiptNo}</p>` : ""}
        </div>
        <div class="status-tags">
          <span class="tag ${order.paymentStatus === "Paid" ? "tag-paid" : "tag-unpaid"}">
            Payment: ${order.paymentStatus === "Paid" ? "🟢 Paid" : "🔴 NOT PAID"}
          </span>
          <span class="tag tag-shipped">Dispatch: ${order.shippingStatus || "Processing"}</span>
        </div>
        <div style="margin-top: 8px; display: flex; justify-content: flex-end; align-items: center; gap: 6px;">
          <div style="text-align: right;">
            <div style="font-size: 7.5px; font-weight: 800; color: #111827; font-family: monospace; text-transform: uppercase;">VERIFIED ORDER QR</div>
            <div style="font-size: 7px; color: #6b7280; font-family: monospace;">Scan to Trace Invoice</div>
          </div>
          <img 
            src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(order.id || 'TS-ORD')}" 
            alt="Order ID QR Code" 
            style="width: 44px; height: 44px; border-radius: 4px; border: 1px solid #d1d5db; padding: 2px; background: #ffffff; object-fit: contain;" 
          />
        </div>
      </div>
    </div>

    <!-- Details Grid -->
    <div class="details-grid">
      <div class="details-box">
        <div class="section-label">Billed To</div>
        <div class="client-name">${order.customerName || "Valued Client"}</div>
        <div style="color: #4b5563; margin-top: 2px;">${order.customerEmail || "N/A"}</div>
        <div style="color: #4b5563; font-weight: 600;">Contact: ${order.customerPhone || order.mpesaPhone || "0792620789"}</div>
      </div>

      <div class="details-box">
        <div class="section-label">Dispatch Destination</div>
        <div style="font-weight: 600; color: #111827;">${order.shippingAddress || "Nairobi CBD Store Pickup / Express Courier Dispatch"}</div>
        <div style="color: #6b7280; font-size: 9px; margin-top: 2px;">Fulfillment Courier: Express Store Dispatch</div>
      </div>
    </div>

    <!-- Items Table -->
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 50%;">Component / Model Description</th>
            <th style="width: 12%; text-align: center;">Qty</th>
            <th style="width: 18%; text-align: right;">Unit Price</th>
            <th style="width: 20%; text-align: right;">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
    </div>

    <!-- Totals & Clearance -->
    <div class="totals-wrapper">
      <div class="clearance-box">
        <div class="clearance-title">✓ Verified Payment & Gateway Security</div>
        <p>Payment Status: <strong style="${order.paymentStatus === "Paid" ? "color:#047857;" : "color:#dc2626;"}">${(order.paymentStatus === "Paid" ? "🟢 PAID" : "🔴 NOT PAID").toUpperCase()}</strong></p>
        <p>Gateway Carrier: <strong>${order.paymentProvider || "M-Pesa Express"}</strong></p>
        ${order.receiptNo ? `<p>Clearance Ref: <strong>${order.receiptNo}</strong></p>` : ""}
        <p style="margin-top: 3px; font-size: 8px; opacity: 0.85;">Certified electronic transaction record logged with Tech Sokoni Kenya.</p>
      </div>

      <div class="totals-box">
        <div class="totals-row">
          <span>Items Subtotal:</span>
          <span style="font-family: monospace; font-weight: 600;">KES ${subtotal.toLocaleString()}</span>
        </div>
        <div class="totals-row">
          <span>Gateway Clearance Fee:</span>
          <span style="font-family: monospace; font-weight: 600; color: #047857;">KES 0 (FREE)</span>
        </div>
        <div class="totals-row">
          <span>Courier Dispatch Fee:</span>
          <span style="font-family: monospace; font-weight: 600;">KES 0 (FREE)</span>
        </div>
        <div class="totals-row grand-total">
          <span>Total Billed Amount:</span>
          <span style="font-family: monospace; color: #b45309;">KES ${totalAmount.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <!-- Policy & Returns Section -->
    <div class="policies-section">
      <div class="policy-card">
        <div class="policy-title">
          🛡️ OFFICIAL SERVICE POLICIES: WARRANTY, RETURN & REFUNDS
        </div>
        <div class="policy-text">
          <p>• <strong>WARRANTY DURATIONS:</strong> 1 Year (12 Months) warranty for brand-new items; 6 Months warranty for certified refurbished devices.</p>
          <p>• <strong>KEYBOARD TESTING WINDOW:</strong> Laptop screens/keyboards are not covered under warranty, but keyboards receive a 7-day testing window to verify full function.</p>
          <p>• <strong>PHONE LIMITATIONS:</strong> Screen assemblies, display panels, and liquid/moisture ingress are strictly NOT covered under any warranty.</p>
          <p>• <strong>RETURN & TESTING:</strong> Clients are granted a strict 3-day testing window from date of receipt/delivery. No returns are accepted after 3 days.</p>
          <p>• <strong>VOID CLAUSE:</strong> Physically damaged, cracked, burnt, altered, or liquid-damaged elements are strictly NOT covered under any circumstances.</p>
          <p>• <strong>DIGITAL CLEARANCE:</strong> Certified transaction verified under digital audit index registries.</p>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div>
        <p style="font-weight: 700; color: #374151;">Tech Sokoni Kenya Limited</p>
        <p>Kenyatta Pioneer Building, 5th Floor Shop 514, Kenyatta Ave, Nairobi CBD</p>
        <p>Phone: 0792620789 / +254 792 620 789 • Email: shop@techsokoni.com</p>
      </div>

      <div class="signature-area" style="display: flex; flex-direction: column; align-items: flex-end; text-align: center; width: 160px;">
        <img src="${signatureImg}" alt="Adam Kassim Signature" style="height: 48px; max-width: 150px; object-fit: contain; margin-bottom: 2px;" />
        <div class="signature-line" style="border-top: 1.5px solid #111827; width: 140px; padding-top: 2px; font-weight: 800; font-size: 10px; color: #111827; font-family: monospace;">Adam Kassim</div>
        <p style="font-size: 8px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; width: 140px;">Authorized Signatory & Store Stamp</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}

export function printInvoiceIframe(order: Order) {
  if (!order) return;

  let iframe = document.getElementById("techsokoni-print-iframe") as HTMLIFrameElement;
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "techsokoni-print-iframe";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);
  }

  const htmlContent = generateInvoiceHtml(order);

  const iframeWin = iframe.contentWindow;
  const iframeDoc = iframe.contentDocument || iframeWin?.document;

  if (!iframeDoc || !iframeWin) return;

  iframeDoc.open();
  iframeDoc.write(htmlContent);
  iframeDoc.close();

  // Give a small delay to ensure rendering and images are loaded inside iframe
  setTimeout(() => {
    try {
      iframeWin.focus();
      iframeWin.print();
    } catch (err) {
      console.error("Iframe print error, falling back to window.print():", err);
      window.print();
    }
  }, 350);
}
