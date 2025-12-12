// apps/api/src/index.ts (or wherever your main Express/Fastify app is)
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@repo/auth";

const app = express();

// Better Auth automatically handles all OAuth routes
app.all("/api/auth", toNodeHandler(auth));

// Your other API routes
app.get("/api/projects", async (req, res) => {
  // Access session in your routes
  const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // Your logic here
  res.json({ user: session.user });
});

app.listen(4000, () => {
  console.log("API server running on http://localhost:4000");
});
