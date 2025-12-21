import dotenv from "dotenv";
dotenv.config();
import {betterAuth} from "better-auth";
import { prisma } from "@repo/db";
import { prismaAdapter } from "better-auth/adapters/prisma";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: false,  //enable later for production
    },

    socialProviders: {
        google: {
            enabled: true,
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
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
    
    trustedOrigins: [
        "http://localhost:3000",  //apps/web
        "http://localhost:3001",  //apps/studio
        "http://localhost:3002",  //apps/editor
    ],
        
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;