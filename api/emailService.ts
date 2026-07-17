import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

export interface OrderItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  shippingAddress?: string;
  customerName?: string;
  customerPhone?: string;
  receiptNo?: string;
  createdAt: string;
}

/**
 * Creates a nodemailer transporter using environment variables.
 * Falls back gracefully if credentials are not fully configured.
 */
export function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    console.warn("[EmailService] SMTP credentials not fully configured in environment. Emails will run in simulation mode.");
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Sends a professional, beautifully formatted receipt to the customer's email.
 */
export async function sendReceiptEmail(email: string, orderId: string, order: Order): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const from = process.env.SMTP_FROM || '"Tech Sokoni Kenya" <support@techsokoni.com>';
  const cleanFrom = from.includes("support@techsokoni.com") ? from : '"Tech Sokoni Kenya" <support@techsokoni.com>';

  const itemsListHtml = (order.items || []).map((item) => `
    <tr style="border-bottom: 1px solid #eeeeee;">
      <td style="padding: 12px 0; text-align: left; font-size: 14px; font-weight: bold; color: #111111;">
        ${item.brand || ""} ${item.name}
        <br/>
        <span style="font-size: 11px; color: #777777; font-weight: normal;">SKU: ${item.id}</span>
      </td>
      <td style="padding: 12px 0; text-align: center; font-size: 14px; color: #555555;">${item.quantity}</td>
      <td style="padding: 12px 0; text-align: right; font-size: 14px; color: #555555;">KES ${Number(item.price).toLocaleString()}</td>
      <td style="padding: 12px 0; text-align: right; font-size: 14px; font-weight: bold; color: #111111;">KES ${Number(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `).join("");

  const emailHtmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 3px solid #C5A059;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Tech Sokoni Kenya</h1>
        <p style="color: #C5A059; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Premium Imports &amp; Enterprise Computers</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-top: 0; font-size: 18px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Official Fiscal Invoice &amp; Receipt</h2>
        
        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Thank you for your purchase from Tech Sokoni Kenya! Your transaction for order <strong>#${orderId.substring(0, 8).toUpperCase()}</strong> has been captured successfully. Below is a detailed record of your purchase.</p>
        
        <div style="background-color: #f9f9f9; padding: 15px; border-radius: 6px; margin: 20px 0; font-size: 13px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 4px 0; color: #777777;">Order Key:</td>
              <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; color: #111111;">${orderId}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;">Date:</td>
              <td style="padding: 4px 0; text-align: right; color: #111111;">${new Date(order.createdAt || Date.now()).toLocaleDateString("en-KE", { timeZone: "Africa/Nairobi" })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;">Customer Name:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #111111;">${order.customerName || "Valued Client"}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #777777;">Payment Method:</td>
              <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #111111; text-transform: uppercase;">${order.paymentMethod || "M-Pesa"}</td>
            </tr>
            ${order.receiptNo ? `
            <tr>
              <td style="padding: 4px 0; color: #777777;">Transaction Ref:</td>
              <td style="padding: 4px 0; text-align: right; font-family: monospace; font-weight: bold; color: #C5A059;">${order.receiptNo}</td>
            </tr>
            ` : ""}
            <tr>
              <td style="padding: 4px 0; color: #777777;">Delivery Address:</td>
              <td style="padding: 4px 0; text-align: right; color: #111111;">${order.shippingAddress || "Nairobi Store Pickup / CBD Delivery"}</td>
            </tr>
          </table>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr style="border-bottom: 2px solid #111111;">
              <th style="padding: 8px 0; text-align: left; font-size: 12px; text-transform: uppercase; color: #777777;">Product</th>
              <th style="padding: 8px 0; text-align: center; font-size: 12px; text-transform: uppercase; color: #777777;">Qty</th>
              <th style="padding: 8px 0; text-align: right; font-size: 12px; text-transform: uppercase; color: #777777;">Unit Price</th>
              <th style="padding: 8px 0; text-align: right; font-size: 12px; text-transform: uppercase; color: #777777;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsListHtml}
          </tbody>
        </table>

        <div style="margin-top: 25px; border-top: 2px solid #111111; padding-top: 15px; text-align: right;">
          <p style="margin: 0; font-size: 14px; color: #555555;">Gross Total:</p>
          <p style="margin: 5px 0 0 0; font-size: 22px; font-weight: bold; color: #111111;">KES ${Number(order.totalAmount).toLocaleString()}</p>
        </div>

        <div style="margin-top: 40px; padding: 20px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 12px; color: #92400e; line-height: 1.6;">
          <h4 style="margin: 0 0 8px 0; font-size: 13px; font-weight: bold; text-transform: uppercase;">Official Warranty Notice</h4>
          <p style="margin: 0;">This document guarantees a 12-month hardware warranty on all enterprise/refurbished motherboard components. Keyboard, screen, and battery are covered under a 30-day diagnostic window. Returns or exchanges must be initiated within 3 calendar days of delivery.</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 11px; color: #777777; text-align: center; line-height: 1.6;">
          <p><strong>Physical Address:</strong> Kenyatta Pioneer Building, Kenyatta Avenue, 5th Floor, Shop 514 (Next to I&M Building), Nairobi, Kenya.</p>
          <p>Contact Email: <a href="mailto:support@techsokoni.com" style="color: #C5A059; text-decoration: none;">support@techsokoni.com</a> | M-Pesa Till No: 9309020</p>
          <p style="margin-top: 10px; font-weight: bold; color: #333333;">This invoice copy is verified electronically. Thank you for your business!</p>
        </div>
      </div>
    </div>
  `;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const mailOptions = {
        from: cleanFrom,
        to: email,
        subject: `[Receipt] Tech Sokoni Kenya - Order #${orderId.substring(0, 8).toUpperCase()}`,
        html: emailHtmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Receipt sent successfully to ${email}`);
      return { success: true, message: `Receipt successfully sent via SMTP to ${email}.` };
    } catch (error: any) {
      console.error("[EmailService] Error sending email via SMTP:", error);
      throw error;
    }
  } else {
    console.log(`[EmailService] Simulated dispatch: Receipt would have been sent from "${cleanFrom}" to "${email}"`);
    return {
      success: true,
      simulated: true,
      message: `Simulated receipt dispatch. SMTP server credentials are not configured, but receipt was logged successfully. From: ${cleanFrom}`,
    };
  }
}

/**
 * Sends a stock/price alert or newsletter.
 */
export async function sendRestockAlertEmail(email: string, productName: string): Promise<{ success: boolean; message: string; simulated?: boolean }> {
  const from = process.env.SMTP_FROM || '"Tech Sokoni Kenya" <support@techsokoni.com>';
  const cleanFrom = from.includes("support@techsokoni.com") ? from : '"Tech Sokoni Kenya" <support@techsokoni.com>';

  const emailHtmlContent = `
    <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #dddddd; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
      <div style="background-color: #111111; padding: 25px; text-align: center; border-bottom: 3px solid #C5A059;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Tech Sokoni Kenya</h1>
        <p style="color: #C5A059; margin: 5px 0 0 0; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Premium Imports &amp; Enterprise Computers</p>
      </div>
      <div style="padding: 30px; background-color: #ffffff;">
        <h2 style="color: #111111; margin-top: 0; font-size: 18px; border-bottom: 1px solid #eeeeee; padding-bottom: 10px;">Item Fully Restocked!</h2>
        <p style="font-size: 14px; color: #333333; line-height: 1.6; font-weight: bold;">Great news! The product you were watching is back in stock.</p>
        
        <div style="background-color: #fcf8e3; border: 1px solid #faebcc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <h3 style="margin: 0 0 5px 0; color: #8a6d3b; font-size: 16px;">${productName}</h3>
          <p style="margin: 0; font-size: 13px; color: #8a6d3b;">Now available in active inventory!</p>
        </div>

        <p style="font-size: 14px; color: #555555; line-height: 1.6;">Our fresh air consignment has officially cleared custom diagnostics, and this model has been restored to fully active inventory. Stock is currently limited and available on a first-come, first-served basis.</p>

        <div style="text-align: center; margin: 30px 0;">
          <a href="https://techsokoni.com" style="background-color: #835c17; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 13px; display: inline-block;">Secure Yours Now</a>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 11px; color: #777777; text-align: center; line-height: 1.6;">
          <p><strong>Physical Address:</strong> Kenyatta Pioneer Building, Kenyatta Avenue, 5th Floor, Shop 514 (Next to I&M Building), Nairobi, Kenya.</p>
          <p>Contact Email: <a href="mailto:support@techsokoni.com" style="color: #C5A059; text-decoration: none;">support@techsokoni.com</a> | WhatsApp: +254 700 000000</p>
        </div>
      </div>
    </div>
  `;

  const transporter = getTransporter();

  if (transporter) {
    try {
      const mailOptions = {
        from: cleanFrom,
        to: email,
        subject: `[Restock Alert] Tech Sokoni Kenya - ${productName} is back!`,
        html: emailHtmlContent,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[EmailService] Restock alert sent successfully to ${email}`);
      return { success: true, message: `Restock alert successfully sent via SMTP to ${email}.` };
    } catch (error: any) {
      console.error("[EmailService] Error sending restock alert via SMTP:", error);
      throw error;
    }
  } else {
    console.log(`[EmailService] Simulated restock dispatch to "${email}" for "${productName}"`);
    return {
      success: true,
      simulated: true,
      message: `Simulated restock alert dispatch. SMTP server credentials are not configured. From: ${cleanFrom}`,
    };
  }
}
