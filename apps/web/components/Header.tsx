"use client";
import Image from "next/image";
import { Playfair_Display  } from 'next/font/google';
import localFont from 'next/font/local';
import  { ShinyText, Tabs, Button }  from "@repo/ui";
import { useRouter } from "next/navigation";

const aperture = localFont({src: '../public/fonts/aperture2.0-webfont.woff2'});

const playfair = Playfair_Display({subsets: ['latin']}); 
const Header = () => {
    const router = useRouter();
    return (
        <div className="flex justify-between mt-4 px-4">
            <div className="flex gap-4 items-center justify-center">
                <Image src={"logo.svg"} alt="logo" width={48} height={48} />
                <div className={`${aperture.className} text-[32px] mt-3`}>
                    <ShinyText text="LastBench" speed={3} className="font-black"/>
                </div>
            </div>


            <div className="flex items-center justify-center cursor-pointer z-10">
                <Tabs className={`${aperture.className} text-[18px] gap-4 px-4 py-1`} />
            </div>

            <div className={`flex items-center justify-center ${aperture.className} p-4 pr-10 z-10`}>
                <Button className="cursor-pointer text-[16px] font-bold bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-6 py-2" variant="default" size="lg"
                onClick={() => router.push("/signup")}>Sign Up</Button>
            </div>
        </div>
    );
};

export default Header;