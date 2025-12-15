// apps/web/app/login/page.tsx
"use client";

import { authClient } from "@repo/auth/client";

export default function LoginPage() {
  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/dashboard",
    });
  };

  const handleEmailLogin = async (email: string, password: string) => {
    await authClient.signIn.email({
      email,
      password,
      callbackURL: "/dashboard",
    });
  };

  return (
    <div>
      <button onClick={handleGoogleLogin}>Login with Google</button>
      {/* Email/password form */}
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />
      <button onClick={() => handleEmailLogin("test@test.com", "test")}>Login with Email</button>
    </div>
  );
}
