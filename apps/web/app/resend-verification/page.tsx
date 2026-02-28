"use client";

import { authClient } from "@repo/auth/client";
import { useState } from "react";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ResendVerificationPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:4000"}/api/auth/send-verification-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
          credentials: "include",
        }
      );

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || "Failed to resend verification email");
      }
    } catch (err: any) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8">
        <button
          onClick={() => router.push("/signup")}
          className="mb-6 text-muted-foreground hover:text-foreground flex items-center gap-2 text-sm"
        >
          <ArrowLeft size={16} /> Back to signup
        </button>

        {!success ? (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h1 className="text-3xl font-bold tracking-tight mb-2">Resend Verification</h1>
              <p className="text-muted-foreground text-sm">
                Enter your email to receive a new verification link
              </p>
            </div>

            {error && (
              <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleResend} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 size={18} className="animate-spin" />}
                Resend Verification Email
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <div className="mb-6 mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Mail className="text-green-600" size={32} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-2 text-green-600">
              Email Sent!
            </h1>
            <p className="text-muted-foreground text-sm mb-4">
              We've sent a new verification link to <strong>{email}</strong>
            </p>
            <p className="text-muted-foreground text-sm">
              Click the link in the email to verify your account.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
