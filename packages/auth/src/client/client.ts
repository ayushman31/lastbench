import dotenv from "dotenv";
dotenv.config();
import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:4000",
});

export type AuthClient = typeof authClient;