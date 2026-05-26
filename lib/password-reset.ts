import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const RESET_IDENTIFIER_PREFIX = "password-reset:";
export const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getResetIdentifier(email: string) {
  return `${RESET_IDENTIFIER_PREFIX}${normalizeEmail(email)}`;
}

export function buildPasswordResetUrl(token: string, baseUrl?: string) {
  const base = (process.env.NEXTAUTH_URL || baseUrl || "http://localhost:8787").replace(/\/$/, "");
  return `${base}/auth/reset-password?token=${encodeURIComponent(token)}`;
}

export function generateResetToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function hashResetToken(token: string) {
  const encoded = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return bytesToHex(new Uint8Array(digest));
}

export async function createPasswordResetToken(email: string) {
  const token = generateResetToken();
  const tokenHash = await hashResetToken(token);
  const identifier = getResetIdentifier(email);
  const expires = new Date(Date.now() + PASSWORD_RESET_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: {
      identifier,
      token: tokenHash,
      expires,
    },
  });

  return { token, expires };
}

export async function resetPasswordWithToken(token: string, password: string) {
  const tokenHash = await hashResetToken(token);
  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token: tokenHash },
  });

  if (!verificationToken) {
    return { ok: false, reason: "invalid" as const };
  }

  if (verificationToken.expires.getTime() < Date.now()) {
    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
    return { ok: false, reason: "expired" as const };
  }

  if (!verificationToken.identifier.startsWith(RESET_IDENTIFIER_PREFIX)) {
    await prisma.verificationToken.deleteMany({ where: { token: tokenHash } });
    return { ok: false, reason: "invalid" as const };
  }

  const email = verificationToken.identifier.slice(RESET_IDENTIFIER_PREFIX.length);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verificationToken.identifier },
    });
    return { ok: false, reason: "invalid" as const };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { email },
    data: { passwordHash },
  });
  await prisma.verificationToken.deleteMany({
    where: { identifier: verificationToken.identifier },
  });

  return { ok: true as const };
}
