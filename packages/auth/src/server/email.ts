import dotenv from "dotenv";
dotenv.config();
import { BrevoClient } from "@getbrevo/brevo";

const client = new BrevoClient({
  apiKey: process.env.BREVO_API_KEY!, // make sure .env is loaded
});

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}): Promise<{ success: boolean; result?: any; error?: any }> {
  try {
    const result = await client.transactionalEmails.sendTransacEmail({
      sender: { email: "singhayushman100@gmail.com", name: "LastBench" },
      to: [{ email: to }],
      subject,
      textContent: text,
      htmlContent: html,
    });
    return { success: true, result };
  } catch (error: unknown) {
      return { success: false, error: (error as Error).message };
  }
}