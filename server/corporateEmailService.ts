import { sendEmail } from "./smtpClient";
import type { CorporateAccount } from "@shared/schema";

const PLAN_PRICES: Record<string, string> = {
  bronze: "$250/month",
  silver: "$400/month",
  gold: "$750/month",
};

const PLAN_NAMES: Record<string, string> = {
  bronze: "Bronze",
  silver: "Silver",
  gold: "Gold",
};

const LBS_ADDRESS = "616 FM 1960 Rd W, Ste 101, Houston, TX 77090";
const LBS_PHONE = "(281) 836-5357";
const LBS_EMAIL = process.env.MAIL_FROM_ADDRESS || "info@lbsconnect.net";
const SITE_URL = "https://www.lbs4.com";

function emailWrapper(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>LBS Enterprise Corporate Notary</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr><td style="background:#0d1b35;border-radius:10px 10px 0 0;padding:28px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div style="color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">LBS Enterprise</div>
              <div style="color:#c9a84c;font-size:11px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">Corporate Notary Services</div>
            </td>
            <td align="right">
              <div style="color:#94a3b8;font-size:11px;">Linton Business Solutions LLC</div>
              <div style="color:#94a3b8;font-size:11px;">JPMorgan Chase Building, Houston TX</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- Body -->
      <tr><td style="background:#ffffff;padding:36px;border-left:1px solid #e2e8f0;border-right:1px solid #e2e8f0;">
        ${content}
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#f8fafc;border-radius:0 0 10px 10px;padding:24px 36px;border:1px solid #e2e8f0;border-top:none;">
        <p style="margin:0;color:#64748b;font-size:12px;line-height:1.7;">
          <strong style="color:#0d1b35;">LBS Test &amp; Exam Center</strong><br />
          ${LBS_ADDRESS}<br />
          ${LBS_PHONE} &nbsp;|&nbsp; <a href="mailto:${LBS_EMAIL}" style="color:#1e3a6e;">${LBS_EMAIL}</a><br />
          Mon–Fri 8 AM–5 PM &nbsp;|&nbsp; Sat 8 AM–4 PM
        </p>
        <p style="margin:12px 0 0;color:#94a3b8;font-size:11px;">
          Official notarial fees are charged in accordance with Texas law. Monthly program fees cover administrative services, scheduling, account management, and reporting only.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ─── Enrollment Confirmation → Company ────────────────────────────────────────
export async function sendEnrollmentConfirmation(account: CorporateAccount): Promise<boolean> {
  const planName = PLAN_NAMES[account.planTier || ""] || "Selected Plan";
  const planPrice = PLAN_PRICES[account.planTier || ""] || "";

  const content = `
    <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">Enrollment Received</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">We've received your application for LBS Enterprise Corporate Notary Services. Our team will review your enrollment within 1–2 business days.</p>

    <div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #1e3a6e;">
      <div style="color:#64748b;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">Enrollment Summary</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Company:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${account.companyName}</td></tr>
        <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Account Code:</td><td style="color:#0d1b35;font-size:14px;padding:4px 0;font-weight:700;font-family:monospace;">${account.accountCode}</td></tr>
        <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Selected Plan:</td><td style="color:#374151;font-size:14px;padding:4px 0;">${planName} — ${planPrice}</td></tr>
        <tr><td style="color:#374151;font-size:14px;padding:4px 0;font-weight:600;">Status:</td><td style="padding:4px 0;"><span style="background:#fef3c7;color:#92400e;font-size:12px;font-weight:600;padding:2px 8px;border-radius:20px;">Pending Review</span></td></tr>
      </table>
    </div>

    <h3 style="color:#0d1b35;font-size:16px;margin:0 0 12px;">What Happens Next</h3>
    <table cellpadding="0" cellspacing="0" width="100%">
      ${["Our team reviews your application (1–2 business days)", "You receive an approval email with your activation link", "Complete payment to activate your corporate account", "Begin scheduling appointments for your team"].map((step, i) => `
        <tr>
          <td style="width:32px;vertical-align:top;padding:6px 0;">
            <span style="display:inline-block;width:24px;height:24px;border-radius:50%;background:#1e3a6e;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;">${i + 1}</span>
          </td>
          <td style="color:#374151;font-size:14px;padding:6px 0 6px 10px;">${step}</td>
        </tr>`).join("")}
    </table>

    <div style="margin-top:28px;padding:20px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
      <p style="margin:0;color:#166534;font-size:13px;"><strong>Questions?</strong> Contact us at <a href="tel:2818365357" style="color:#166534;">${LBS_PHONE}</a> or <a href="mailto:${LBS_EMAIL}" style="color:#166534;">${LBS_EMAIL}</a></p>
    </div>
  `;

  return sendEmail({
    to: account.primaryContactEmail,
    subject: `LBS Corporate Notary — Enrollment Received (${account.accountCode})`,
    html: emailWrapper(content),
  });
}

// ─── Enrollment Notification → LBS Admin ──────────────────────────────────────
export async function sendEnrollmentNotificationToAdmin(
  account: CorporateAccount
): Promise<boolean> {
  const adminEmail = process.env.MAIL_FROM_ADDRESS || LBS_EMAIL;
  const planName = PLAN_NAMES[account.planTier || ""] || "Unknown";
  const planPrice = PLAN_PRICES[account.planTier || ""] || "";

  const users = (account.authorizedUsers as any[]) || [];

  const content = `
    <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">New Corporate Enrollment</h2>
    <p style="margin:0 0 24px;color:#64748b;font-size:14px;">A new company has submitted a corporate notary services enrollment. Review and approve or reject below.</p>

    <div style="background:#fff7ed;border-radius:8px;padding:20px 24px;margin-bottom:20px;border-left:4px solid #c9a84c;">
      <div style="color:#92400e;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:12px;">⚡ Action Required — Pending Approval</div>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;width:40%;">Account Code:</td><td style="font-size:14px;padding:5px 0;font-family:monospace;font-weight:700;color:#0d1b35;">${account.accountCode}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Company:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.companyName}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Plan:</td><td style="font-size:14px;padding:5px 0;color:#374151;"><strong>${planName}</strong> — ${planPrice}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Address:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.businessAddress}, ${account.city}, ${account.state} ${account.zip}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Contact:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.primaryContactName}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Email:</td><td style="font-size:14px;padding:5px 0;"><a href="mailto:${account.primaryContactEmail}" style="color:#1e3a6e;">${account.primaryContactEmail}</a></td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Phone:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.primaryContactPhone || "—"}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Company Size:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.companySize || "—"}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Est. Monthly Vol:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.estimatedMonthlyVolume || "—"} acts</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Scan-to-Email:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.needsScanToEmail ? "Yes" : "No"}</td></tr>
        <tr><td style="font-size:14px;padding:5px 0;font-weight:600;color:#374151;">Billing Method:</td><td style="font-size:14px;padding:5px 0;color:#374151;">${account.billingMethod || "—"}</td></tr>
      </table>
    </div>

    ${users.length > 0 ? `
    <div style="background:#f8fafc;border-radius:8px;padding:16px 24px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#0d1b35;margin-bottom:10px;">Authorized Users (${users.length})</div>
      ${users.map((u: any) => `<div style="font-size:13px;color:#374151;padding:3px 0;">${u.name} — <a href="mailto:${u.email}" style="color:#1e3a6e;">${u.email}</a></div>`).join("")}
    </div>` : ""}

    ${account.specialRequirements ? `
    <div style="background:#f8fafc;border-radius:8px;padding:16px 24px;margin-bottom:20px;">
      <div style="font-size:13px;font-weight:700;color:#0d1b35;margin-bottom:6px;">Special Requirements</div>
      <div style="font-size:13px;color:#374151;">${account.specialRequirements}</div>
    </div>` : ""}

    <div style="margin-top:20px;text-align:center;">
      <a href="${SITE_URL}/admin/corporate" style="display:inline-block;background:#1e3a6e;color:#fff;padding:14px 32px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:600;">Review in Admin Dashboard</a>
    </div>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `[ACTION REQUIRED] New Corporate Enrollment — ${account.companyName} (${account.accountCode})`,
    html: emailWrapper(content),
  });
}

// ─── Approval Email → Company ─────────────────────────────────────────────────
export async function sendApprovalEmail(
  account: CorporateAccount,
  stripeCheckoutUrl: string
): Promise<boolean> {
  const planName = PLAN_NAMES[account.planTier || ""] || "Selected Plan";
  const planPrice = PLAN_PRICES[account.planTier || ""] || "";

  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;width:56px;height:56px;background:#d1fae5;border-radius:50%;line-height:56px;font-size:28px;text-align:center;margin-bottom:12px;">✓</div>
      <h2 style="margin:0 0 6px;color:#0d1b35;font-size:24px;font-weight:700;">Application Approved!</h2>
      <p style="margin:0;color:#64748b;font-size:15px;">Welcome to LBS Enterprise Corporate Notary Services</p>
    </div>

    <div style="background:#f0f4ff;border-radius:8px;padding:20px 24px;margin-bottom:24px;border-left:4px solid #c9a84c;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;width:40%;">Company:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${account.companyName}</td></tr>
        <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Account Code:</td><td style="font-size:14px;padding:4px 0;font-family:monospace;font-weight:700;color:#0d1b35;">${account.accountCode}</td></tr>
        <tr><td style="font-size:14px;padding:4px 0;font-weight:600;color:#374151;">Plan:</td><td style="font-size:14px;padding:4px 0;color:#374151;">${planName} — ${planPrice}</td></tr>
      </table>
    </div>

    <h3 style="color:#0d1b35;font-size:16px;margin:0 0 12px;">Complete Your Activation</h3>
    <p style="color:#374151;font-size:14px;line-height:1.7;">To activate your corporate account, please complete the secure payment setup below. Your subscription will begin immediately upon payment confirmation.</p>

    <div style="text-align:center;margin:28px 0;">
      <a href="${stripeCheckoutUrl}" style="display:inline-block;background:linear-gradient(135deg,#1e3a6e,#2a4f8e);color:#fff;padding:16px 40px;border-radius:8px;text-decoration:none;font-size:16px;font-weight:700;">Activate Account — ${planPrice}</a>
      <p style="margin:10px 0 0;color:#94a3b8;font-size:12px;">Powered by Stripe &bull; Encrypted &bull; Cancel anytime</p>
    </div>

    <div style="background:#f8fafc;border-radius:8px;padding:20px;margin-top:24px;">
      <h4 style="margin:0 0 10px;color:#0d1b35;font-size:14px;">After Activation, You'll Be Able To:</h4>
      <ul style="margin:0;padding-left:20px;color:#374151;font-size:14px;line-height:2;">
        <li>Schedule appointments for employees online</li>
        <li>Receive monthly utilization reports</li>
        <li>Manage your authorized users</li>
        <li>Track usage against your plan limit</li>
      </ul>
    </div>
  `;

  return sendEmail({
    to: account.primaryContactEmail,
    subject: `Corporate Account Approved — Complete Activation (${account.accountCode})`,
    html: emailWrapper(content),
  });
}

// ─── Rejection Email → Company ────────────────────────────────────────────────
export async function sendRejectionEmail(
  account: CorporateAccount
): Promise<boolean> {
  const content = `
    <h2 style="margin:0 0 6px;color:#0d1b35;font-size:22px;font-weight:700;">Application Update</h2>
    <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Thank you for your interest in LBS Enterprise Corporate Notary Services.</p>

    <p style="color:#374151;font-size:14px;line-height:1.7;">We've reviewed your application for <strong>${account.companyName}</strong> and are unable to proceed with the enrollment at this time.</p>

    ${account.rejectionReason ? `<div style="background:#fef2f2;border-radius:8px;padding:16px 20px;margin:20px 0;border-left:4px solid #ef4444;"><p style="margin:0;color:#991b1b;font-size:14px;">${account.rejectionReason}</p></div>` : ""}

    <p style="color:#374151;font-size:14px;line-height:1.7;">We encourage you to contact us directly to discuss your needs. We may be able to accommodate your requirements or suggest an alternative arrangement.</p>

    <div style="margin-top:24px;padding:18px 20px;background:#f0f4ff;border-radius:8px;">
      <p style="margin:0;color:#1e3a6e;font-size:14px;font-weight:600;">Contact Us</p>
      <p style="margin:6px 0 0;color:#374151;font-size:14px;"><a href="tel:2818365357" style="color:#1e3a6e;">${LBS_PHONE}</a> &nbsp;&bull;&nbsp; <a href="mailto:${LBS_EMAIL}" style="color:#1e3a6e;">${LBS_EMAIL}</a></p>
    </div>
  `;

  return sendEmail({
    to: account.primaryContactEmail,
    subject: "LBS Corporate Notary — Application Update",
    html: emailWrapper(content),
  });
}
