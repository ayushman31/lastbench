"use client";

import { authClient } from "@repo/auth/client";
import { useState, JSX } from "react";
import { Mail, Lock, CheckSquare, Square, Loader2 } from "lucide-react";
import { AuthLayout, InputField, SocialButton } from "../../components/AuthLayout";

export default function LoginPage() : JSX.Element {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "http://localhost:3001", // Redirect to Studio        
      });
    } catch (err: any) {
      setError(err.message || "Failed to sign in with Google");
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError("");

      const result = await authClient.signIn.email({
        email,
        password,
        rememberMe,
        callbackURL: "http://localhost:3001", // Redirect to Studio
      });

      if (result.error) {
        const errorMessage = result.error.message || "Failed to sign in";
        
        // Check if it's an email verification error
        if (errorMessage.toLowerCase().includes("email") && 
            (errorMessage.toLowerCase().includes("verify") || 
             errorMessage.toLowerCase().includes("verified"))) {
          setError(
            "Your email is not verified. Please check your inbox or resend verification email"
          );
        } else {
          setError(errorMessage);
        }
      } else {
        // Redirect to Studio on success
        window.location.href = "http://localhost:3001";
      }
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="signin">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome back</h1>
        <p className="text-muted-foreground text-sm">Enter your details to access your workspace.</p>
      </div>

      <div className="mb-6"><SocialButton onClick={handleGoogle} disabled={loading} /></div>

      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
        <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-medium">Or</span></div>
      </div>

      {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleEmailLogin} className="space-y-4">
        <InputField type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} icon={Mail} required />
        <InputField type="password" placeholder="Password" value={password} onChange={(e: any) => setPassword(e.target.value)} icon={Lock} required />
        
        <div className="flex items-center justify-between text-sm">
          <button type="button" onClick={() => setRememberMe(!rememberMe)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            {rememberMe ? <CheckSquare size={18} className="text-primary-foreground" /> : <Square size={18} className="text-muted-foreground" />}
            <span>Keep me logged in</span>
          </button>
          <button type="button" className="text-muted-foreground hover:text-foreground transition-colors">Forgot password?</button>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl mt-6 hover:bg-primary/90 hover:text-primary-foreground/90 transition-all flex items-center justify-center gap-2">
          {loading && <Loader2 size={18} className="animate-spin" />} Login
        </button>
      </form>
    </AuthLayout>
  );
}