// apps/api/src/index.ts (or wherever your main Express/Fastify app is)
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "@repo/auth/server";
import cors from "cors";

const app = express();

app.use(express.json());

app.use(cors({
  origin: [
    "http://localhost:3000",  //apps/web
    "http://localhost:3001",  //apps/studio
    "http://localhost:3002",  //apps/editor
  ],
  credentials: true,
}));

//custom redirect handler after successful auth
app.get("/api/auth/success", async (req, res) => {
  res.redirect("http://localhost:3001");
});

//session validation endpint
app.get("/api/auth/session", async (req, res) => {
  try {
    const session = await auth.api.getSession({ headers: req.headers as HeadersInit });

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    res.json({ user: session.user , session });
  } catch (error) {
    console.error("Error getting session:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// better-auth automatically handles all OAuth routes
app.use("/api/auth", toNodeHandler(auth));


// other API routes
app.get("/api/projects", async (req, res) => {
  // access session in your routes
  const session = await auth.api.getSession({ headers: req.headers as HeadersInit });
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  // logic here
  res.json({ user: session.user });
});

// temporary logging to check if the environment variables are set
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Missing');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Missing');

app.listen(4000, () => {
  console.log("API server running on http://localhost:4000");
});
