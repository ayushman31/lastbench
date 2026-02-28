import dotenv from "dotenv";
dotenv.config();
import {betterAuth} from "better-auth";
import { prisma } from "@repo/db";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { sendEmail } from "./email.js";


export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),

    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:4000",

    emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
        passwordPolicy: {
            minLength: 8,
            maxLength: 20,
            requireUppercase: true,
            requireLowercase: true,
            requireNumber: true,
            requireSpecialChar: true,
        },
        async sendVerificationOnSignUp(user: typeof auth.$Infer.Session.user, url: string, token: string) {
            const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
            
            await sendEmail({
                to: user.email,
                subject: "Verify your email address",
                text: `Click the link to verify your email: ${verificationUrl}`,
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <h2 style="color: #333;">Welcome to LastBench!</h2>
                        <p style="color: #666; font-size: 16px;">
                            Thanks for signing up! Please verify your email address to get started.
                        </p>
                        <a href="${verificationUrl}" 
                           style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                            Verify Email Address
                        </a>
                        <p style="color: #999; font-size: 14px; margin-top: 20px;">
                            If the button doesn't work, copy and paste this link into your browser:<br>
                            <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
                        </p>
                        <p style="color: #999; font-size: 12px; margin-top: 30px;">
                            If you didn't create an account, you can safely ignore this email.
                        </p>
                    </div>
                `,
            });
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

    emailVerification: {
        enabled: true,
        autoSignInAfterVerification: true,  // Auto sign in after email verification
        sendVerificationEmail: async ( { user, url, token }, request) => {
            const verificationUrl = `http://localhost:3000/verify-email?token=${token}`;
            try {
                const emailResult = await sendEmail({
                    to: user.email,
                    subject: "Verify your email address",
                    text: `Click the link to verify your email: ${verificationUrl}`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h2 style="color: #333;">Welcome to LastBench!</h2>
                            <p style="color: #666; font-size: 16px;">
                                Thanks for signing up! Please verify your email address to get started.
                            </p>
                            <a href="${verificationUrl}" 
                               style="display: inline-block; background-color: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0;">
                                Verify Email Address
                            </a>
                            <p style="color: #999; font-size: 14px; margin-top: 20px;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="${verificationUrl}" style="color: #0070f3;">${verificationUrl}</a>
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 30px;">
                                If you didn't create an account, you can safely ignore this email.
                            </p>
                        </div>
                    `,
                });
                
            } catch (error) {
                throw new Error("Error in sendVerificationEmail hook");
            }
        },
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