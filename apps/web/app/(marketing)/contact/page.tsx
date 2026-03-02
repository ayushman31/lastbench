"use client";
import { useState } from "react";
import localFont from 'next/font/local';
import { motion } from "motion/react";
import { Button } from "@repo/ui";
import { Mail, Building, User, MessageSquare, Loader2 } from "lucide-react";
import { JSX } from "react";

const aperture = localFont({src: '../../../public/fonts/aperture2.0-webfont.woff2'});

export default function ContactPage(): JSX.Element {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        company: "",
        message: ""
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setLoading(false);
        setSubmitted(true);
        
        // Reset form after 3 seconds
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: "", email: "", company: "", message: "" });
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center justify-center max-w-4xl mx-auto p-4 md:p-12 lg:p-24">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center mb-12"
            >
                <h1 className={`${aperture.className} text-5xl md:text-6xl mb-6`}>
                    Get in Touch
                </h1>
                <p className={`${aperture.className} text-xl text-gray-400 max-w-2xl mx-auto`}>
                    Interested in LastBench for your team or organization? 
                    We'd love to hear from you.
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12"
            >
                {submitted ? (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-center py-12"
                    >
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h3 className={`${aperture.className} text-2xl mb-2`}>
                            Message Sent!
                        </h3>
                        <p className="text-gray-400">
                            We'll get back to you within 24 hours.
                        </p>
                    </motion.div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
                                <User className="w-4 h-4" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-white placeholder-gray-500"
                                placeholder="John Doe"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
                                <Mail className="w-4 h-4" />
                                Work Email
                            </label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-white placeholder-gray-500"
                                placeholder="john@company.com"
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
                                <Building className="w-4 h-4" />
                                Company Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData.company}
                                onChange={(e) => setFormData({...formData, company: e.target.value})}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-white placeholder-gray-500"
                                placeholder="Acme Inc."
                            />
                        </div>

                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium mb-2 text-gray-300">
                                <MessageSquare className="w-4 h-4" />
                                Message
                            </label>
                            <textarea
                                required
                                value={formData.message}
                                onChange={(e) => setFormData({...formData, message: e.target.value})}
                                rows={5}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-all text-white placeholder-gray-500 resize-none"
                                placeholder="Tell us about your needs..."
                            />
                        </div>

                        <Button
                            type="submit"
                            disabled={loading}
                            className={`${aperture.className} w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl text-lg transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending...
                                </span>
                            ) : (
                                "Send Message"
                            )}
                        </Button>
                    </form>
                )}
            </motion.div>

            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-12 text-center text-gray-400 text-sm"
            >
                <p>You can also reach us at{" "}
                    <a href="mailto:sales@lastbench.com" className="text-primary hover:underline">
                        sales@lastbench.fm
                    </a>
                </p>
            </motion.div>
        </div>
    );
}
