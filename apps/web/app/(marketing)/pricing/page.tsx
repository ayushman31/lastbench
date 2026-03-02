"use client";
import { useState } from "react";
import localFont from 'next/font/local';
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { Button } from "@repo/ui";
import { JSX } from "react";

const aperture = localFont({src: '../../../public/fonts/aperture2.0-webfont.woff2'});

export default function PricingPage(): JSX.Element {
    const [isAnnual, setIsAnnual] = useState(true);

    const price = isAnnual ? 23 : 25;
    const savings = (25 - 23) * 12;

    return (
        <div className="flex flex-col items-center justify-center text-center max-w-4xl mx-auto p-4 md:p-12 lg:p-16">
            {/* <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${aperture.className} text-5xl md:text-6xl mb-6`}
            >
                Simple Pricing.
            </motion.h1> */}

            {/* Toggle Switch */}
            <div className="flex items-center gap-4 mb-12 bg-white/5 p-1 rounded-full border border-white/10">
                <button 
                    onClick={() => setIsAnnual(false)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${!isAnnual ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Monthly
                </button>
                <button 
                    onClick={() => setIsAnnual(true)}
                    className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${isAnnual ? 'bg-primary text-white' : 'text-gray-400 hover:text-white'}`}
                >
                    Yearly <span className="text-[10px] ml-1 opacity-80">(Save ${savings})</span>
                </button>
            </div>

            {/* Pricing Card */}
            <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                whileHover={{ scale: 1.02, y: -5 }}
                className="relative w-full max-w-md bg-[#1a1a1a] border border-primary/30 p-10 rounded-3xl overflow-hidden hover:border-primary/50 transition-all duration-300"
            >
                {/* Glow effect */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary blur-[100px] opacity-20"></div>

                <h3 className={`${aperture.className} text-2xl text-muted-foreground mb-2`}>Pro Creator</h3>
                <div className="flex items-baseline justify-center gap-1 mb-6">
                    <span className={`${aperture.className} text-6xl`}>${price}</span>
                    <span className="text-gray-400">/mo</span>
                </div>
                
                <p className="text-gray-400 text-sm mb-8">Billed {isAnnual ? 'Annually' : 'Monthly'}</p>

                <Button className={`${aperture.className} w-full mb-8 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl text-lg cursor-pointer`}>
                    Start Free Trial
                </Button>

                <div className="space-y-4 text-left">
                    {[
                        "High Quality Audio & Video Capture",
                        "Get separated tracks for host and guests", 
                        "Get audio and video tracks for each participant separately", 
                        "Automatic Cloud Upload", 
                    ].map((feat, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <div className="bg-green-500/20 p-1 rounded-full">
                                <Check className="w-4 h-4 text-green-500" />
                            </div>
                            <span className="text-gray-300 font-sans">{feat}</span>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
