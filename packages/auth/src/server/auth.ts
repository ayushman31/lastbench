import dotenv from "dotenv";
dotenv.config();
import {betterAuth} from "better-auth";
import { prisma } from "@repo/db";
import { prismaAdapter } from "better-auth/adapters/prisma";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,  //enable later for production
        passwordPolicy: {
            minLength: 8,
            maxLength: 20,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecialChar: true,
        },
    },

    socialProviders: {
        google: {
            enabled: true,
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            redirectURI: `${process.env.BETTER_AUTH_URL}/api/auth/callback/google`,
        },

    },

    session: {
        expiresIn: 60 * 60 * 24 * 30, // 30 days
        updateAge: 60 * 60 * 24, // 1 day
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60 , // 5 minutes
        },
    },

    // to make cookies work across subdomains
    advanced: {
        cookiePrefix: "lastbench",
        useSecureCookies: process.env.NODE_ENV === "production",
        crossSubDomainCookies: {
            enabled: true,
            domain: process.env.NODE_ENV === "production" ? ".lastbench.com" : "localhost",
        }
    },
    
    trustedOrigins: [
        "http://localhost:3000",  //apps/web
        "http://localhost:3001",  //apps/studio
        "http://localhost:3002",  //apps/editor
        "http://localhost:4000",  //api
    ],
        
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;