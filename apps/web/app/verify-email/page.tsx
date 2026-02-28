"use client";

import { useEffect, useState, JSX } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { authClient } from "@repo/auth/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function VerifyEmailPage() : JSX.Element {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      
      if (!token) {
        setStatus("error");
        setMessage("Invalid verification link. Token is missing.");
        return;
      }

      try {
        const result = await authClient.verifyEmail({
          query: {
            token: token,
          },
        });
        
        if (result.error) {
          throw new Error(result.error.message || "Verification failed");
        }

        const session = await authClient.getSession();
        
        setStatus("success");
        
        if (session.data?.session) {
          setMessage("Email verified successfully! Redirecting to studio...");
          setTimeout(() => {
            window.location.href = "http://localhost:3001";
          }, 2000);
        } else {
          // just in case need to sign in manually
          setMessage("Email verified successfully! Redirecting to login...");
          setTimeout(() => {
            window.location.href = "http://localhost:3000/login";
          }, 2000);
        }
      } catch (error : unknown) {
        setStatus("error");
        setMessage((error as Error).message || "An error occurred while verifying your email. Please try again.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto h-16 w-16 text-primary animate-spin mb-4" />
            <h1 className="text-2xl font-bold mb-2">Verifying your email</h1>
            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-green-500">Email Verified!</h1>
            <p className="text-muted-foreground mb-4">{message}</p>
            <p className="text-sm text-muted-foreground">
              You will be redirected to the studio in a few seconds.
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2 text-red-500">Verification Failed</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl hover:bg-primary/90 transition-all"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
