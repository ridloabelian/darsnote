import type { NextApiRequest, NextApiResponse } from "next";
import { sendPasswordResetEmail } from "@/lib/email";
import { buildPasswordResetUrl, createPasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";

type ForgotPasswordResponse = {
  message: string;
  resetUrl?: string;
};

function getRequestBaseUrl(req: NextApiRequest) {
  const proto = req.headers["x-forwarded-proto"] || "http";
  const host = req.headers.host;
  return host ? `${proto}://${host}` : undefined;
}

function isDebugLinkEnabled() {
  return process.env.RESET_PASSWORD_DEBUG_LINK === "true";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ForgotPasswordResponse | { message: string }>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { email } = req.body as { email?: string };
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedEmail || !normalizedEmail.includes("@")) {
    return res.status(400).json({ message: "Email tidak valid" });
  }

  const successMessage =
    "Jika email terdaftar, link reset password akan dikirim beberapa saat lagi.";

  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return res.status(200).json({ message: successMessage });
  }

  const { token, expires } = await createPasswordResetToken(normalizedEmail);
  const resetUrl = buildPasswordResetUrl(token, getRequestBaseUrl(req));

  try {
    const delivery = await sendPasswordResetEmail({
      to: normalizedEmail,
      resetUrl,
      expiresAt: expires,
    });

    if (!delivery.sent && !isDebugLinkEnabled()) {
      console.warn("Password reset email provider is not configured.");
    }
  } catch (error) {
    console.error("Failed to send password reset email:", error);
  }

  return res.status(200).json({
    message: successMessage,
    ...(isDebugLinkEnabled() ? { resetUrl } : {}),
  });
}
