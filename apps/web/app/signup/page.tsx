"use client";

import { authClient } from "@repo/auth/client";
import { useState, JSX } from "react";
import { Mail, Lock, User, CheckSquare, Square, Loader2 } from "lucide-react";
import { AuthLayout, InputField, SocialButton } from "../../components/AuthLayout";

export default function SignupPage() : JSX.Element {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await authClient.signUp.email({
        email, 
        password, 
        name,
        // callbackURL: "http://localhost:3001", do we need this?
      });
      
      if (result.error) {
        let errorMessage = result.error.message || "Failed to sign up";
        
        if (errorMessage.toLowerCase().includes("password")) {
          errorMessage = "Password must be 8-20 characters and include: uppercase, lowercase, number, and special character (!@#$%^&*)";
        }
        
        throw new Error(errorMessage);
      }

      setEmailSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to sign up");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout mode="signup">
      {!emailSent ? (
        <>
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Create an account</h1>
            <p className="text-muted-foreground text-sm">Enter your details to get started.</p>
          </div>

          <div className="mb-6"><SocialButton onClick={handleGoogle} disabled={loading} /></div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-medium">Or</span></div>
          </div>

          {error && <div className="mb-4 text-red-600 bg-red-50 p-3 rounded-lg text-sm">{error}</div>}

          <form onSubmit={handleSignup} className="space-y-4">
            <InputField type="text" placeholder="Full Name" value={name} onChange={(e: any) => setName(e.target.value)} icon={User} required />
            <InputField type="email" placeholder="Email" value={email} onChange={(e: any) => setEmail(e.target.value)} icon={Mail} required />
            <InputField type="password" placeholder="Password (A1b@example)" value={password} onChange={(e: any) => setPassword(e.target.value)} icon={Lock} required />
            <div className="text-xs text-muted-foreground -mt-2">
              Must include: uppercase, lowercase, number, special character
            </div>
            
            <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-medium py-3 rounded-xl mt-6 hover:bg-primary/90 hover:text-primary-foreground/90 transition-all flex items-center justify-center gap-2">
              {loading && <Loader2 size={18} className="animate-spin" />} Sign Up
            </button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mb-6 mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <Mail className="text-green-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Check your email</h1>
          <p className="text-muted-foreground text-sm mb-4">
            We've sent a verification link to <strong>{email}</strong>
          </p>
          <p className="text-muted-foreground text-sm mb-6">
            Click the link in the email to verify your account and get started.
          </p>
          <div className="text-xs text-muted-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button 
              onClick={() => setEmailSent(false)} 
              className="text-primary hover:underline font-medium"
            >
              try again
            </button>
          </div>
        </div>
      )}
    </AuthLayout>
  );
}