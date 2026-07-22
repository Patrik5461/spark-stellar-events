import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const inputSchema = z.object({
  name: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(50).optional().nullable(),
  message: z.string().trim().min(1).max(5000),
});

export const sendContactForm = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const html = `
      <div style="font-family: Georgia, serif; color: #383B3A;">
        <h2 style="margin:0 0 16px;">Nová správa z kontaktného formulára</h2>
        <p><strong>Meno:</strong> ${escapeHtml(data.name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
        ${data.phone ? `<p><strong>Telefón:</strong> ${escapeHtml(data.phone)}</p>` : ""}
        <p><strong>Správa:</strong></p>
        <p style="white-space:pre-wrap; padding:12px; background:#F5F1EC; border-radius:8px;">${escapeHtml(data.message)}</p>
      </div>
    `;

    const { error } = await resend.emails.send({
      from: "NU-U <web@nu-u.sk>",
      to: ["info@nu-u.sk"],
      replyTo: data.email,
      subject: `Nová správa od ${data.name}`,
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error(typeof error === "string" ? error : (error as { message?: string }).message ?? "Odoslanie zlyhalo");
    }

    return { ok: true };
  });

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
