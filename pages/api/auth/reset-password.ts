import type { NextApiRequest, NextApiResponse } from "next";
import { resetPasswordWithToken } from "@/lib/password-reset";

type ResetPasswordResponse = {
  message: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResetPasswordResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { token, password } = req.body as { token?: string; password?: string };

  if (!token || typeof token !== "string") {
    return res.status(400).json({ message: "Token reset password tidak valid" });
  }

  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ message: "Password minimal 8 karakter" });
  }

  const result = await resetPasswordWithToken(token, password);
  if (!result.ok) {
    return res.status(400).json({
      message: "Link reset password tidak valid atau sudah kedaluwarsa",
    });
  }

  return res.status(200).json({ message: "Password berhasil diperbarui" });
}
