"use client";
import localFont from 'next/font/local';
import { motion } from "motion/react";
import { Mic, Cloud, Download, Laptop } from "lucide-react";
import { JSX } from "react";

const aperture = localFont({src: '../../../public/fonts/aperture2.0-webfont.woff2'});

const features = [
    {
        icon: <Mic className="w-8 h-8 text-primary" />,
        title: "Multi-Track Recording",
        desc: "Record host and guests separately with local high-quality audio and video capture. Each participant's track is saved independently."
    },
    {
        icon: <Cloud className="w-8 h-8 text-primary" />,
        title: "Automatic Cloud Upload",
        desc: "Recordings are automatically uploaded to cloud storage after the session. Organized by host and recording ID."
    },
    {
        icon: <Download className="w-8 h-8 text-primary" />,
        title: "WebRTC Video Streaming",
        desc: "Real-time bidirectional video and audio streaming between participants with automatic reconnection."
    },
    {
        icon: <Laptop className="w-8 h-8 text-primary" />,
        title: "Guest Join Links",
        desc: "Generate secure invite links for guests. Guests don't need to sign up. "
    }
];

export default function FeaturesPage(): JSX.Element {
    return (
        <div className="flex flex-col items-center justify-center text-center max-w-5xl mx-auto p-4 md:p-12 lg:p-24">
            <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${aperture.className} text-5xl md:text-6xl mb-6`}
            >
                Built for Remote Recording.
            </motion.h1>
            <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`${aperture.className} text-xl text-muted-foreground mb-12 max-w-2xl`}
            >
                Record podcast interviews with multiple guests in studio-quality. 
                Each participant's track is captured locally and uploaded securely.
            </motion.p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                {features.map((f, i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        // transition={{ delay: 0.01}}
                        whileHover={{ scale: 1.02, y: -5 }}
                        className="bg-white/5 border border-white/10 p-8 rounded-2xl hover:bg-white/10 hover:border-primary/30 transition-all duration-300 text-left cursor-pointer"
                    >
                        <div className="mb-4 bg-primary/10 w-fit p-3 rounded-xl">
                            {f.icon}
                        </div>
                        <h3 className={`${aperture.className} text-2xl mb-2`}>{f.title}</h3>
                        <p className="text-muted-foreground font-sans leading-relaxed">{f.desc}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
