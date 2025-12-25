import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:4000",

    fetchOptions: {
        credentials: "include",
    }
});

export type AuthClient = typeof authClient;