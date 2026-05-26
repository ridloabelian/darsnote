interface PasswordResetEmailInput {
  to: string;
  resetUrl: string;
  expiresAt: Date;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatExpiry(expiresAt: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  }).format(expiresAt);
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
  expiresAt,
}: PasswordResetEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    return { sent: false, reason: "missing_config" as const };
  }

  const escapedUrl = escapeHtml(resetUrl);
  const expiry = formatExpiry(expiresAt);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset password DarsNote",
      text: [
        "Kami menerima permintaan reset password untuk akun DarsNote Anda.",
        "",
        `Buka link berikut untuk membuat password baru: ${resetUrl}`,
        "",
        `Link ini berlaku sampai ${expiry} WIB.`,
        "Abaikan email ini jika Anda tidak meminta reset password.",
      ].join("\n"),
      html: `
        <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111827">
          <h1 style="font-size:20px;color:#1A5276">Reset password DarsNote</h1>
          <p>Kami menerima permintaan reset password untuk akun DarsNote Anda.</p>
          <p>
            <a href="${escapedUrl}" style="display:inline-block;background:#1A5276;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600">
              Buat password baru
            </a>
          </p>
          <p style="font-size:14px;color:#4b5563">Link ini berlaku sampai ${escapeHtml(expiry)} WIB.</p>
          <p style="font-size:14px;color:#6b7280">Abaikan email ini jika Anda tidak meminta reset password.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend email failed: ${response.status} ${detail}`);
  }

  return { sent: true as const };
}
