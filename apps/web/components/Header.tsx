import Image from "next/image";
import { Playfair_Display  } from 'next/font/google';
import localFont from 'next/font/local';
import  { ShinyText, Tabs }  from "@repo/ui";

const aperture = localFont({src: '../public/fonts/aperture2.0-webfont.woff2'});

const playfair = Playfair_Display({subsets: ['latin']}); 
const Header = () => {
    return (
        <div className="flex justify-between">
            <div className="flex gap-4 items-center justify-center">
                <Image src={"logo.svg"} alt="logo" width={48} height={48} />
                <div className={`${aperture.className} text-[32px] mt-3`}>
                    <ShinyText text="LastBench" speed={3} className="font-black"/>
                </div>
            </div>


            <div className="flex items-center justify-center cursor-pointer z-10">
                <Tabs className={`${aperture.className} text-[18px] gap-4`} />
            </div>

            <div className={`flex items-center justify-center text-[18px] ${aperture.className} p-4 pr-10 z-10  cursor-pointer gap-4`}>
                Signup
            </div>
        </div>
    );
};

export default Header;