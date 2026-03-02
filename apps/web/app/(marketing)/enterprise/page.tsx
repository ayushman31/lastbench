"use client";
import localFont from 'next/font/local';
import { motion } from "motion/react";
import { Button } from "@repo/ui";
import { Shield, Users, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { JSX } from "react";

const aperture = localFont({src: '../../../public/fonts/aperture2.0-webfont.woff2'});

export default function EnterprisePage(): JSX.Element {
    const router = useRouter();
    
    return (
        <div className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto py-10 p-4 md:p-12 lg:p-24">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${aperture.className} text-5xl md:text-6xl mb-6 leading-tight`}
            >
                Scale Your Production.
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${aperture.className} text-xl text-gray-400 mb-12 max-w-2xl`}
            >
                For large networks and organizations requiring advanced security, 
                SSO, and dedicated support.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-16">
                {[
                    { icon: Shield, title: "Enterprise Security", desc: "SSO enforcement and advanced access controls." },
                    { icon: Users, title: "Team Management", desc: "Manage permissions and roles across your organization." },
                    { icon: Zap, title: "Dedicated Support", desc: "24/7 priority support and dedicated success manager." }
                ].map((item, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + (i * 0.1) }}
                        className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-all duration-300"
                    >
                        <item.icon className="w-10 h-10 text-primary mb-4 mx-auto" />
                        <h3 className={`${aperture.className} text-xl mb-2`}>{item.title}</h3>
                        <p className="text-gray-400 text-sm font-sans">{item.desc}</p>
                    </motion.div>
                ))}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Button 
                    size="lg"  
                    className={`${aperture.className} bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2 text-xl rounded-lg transition-all duration-300 hover:scale-105 cursor-pointer`}
                    onClick={() => router.push("/contact")}
                >
                    Contact Sales
                </Button>
            </motion.div>
        </div>
    );
}
