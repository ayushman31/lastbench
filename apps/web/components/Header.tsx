import Image from "next/image";
import { Playfair_Display } from 'next/font/google';
import  { ShinyText }  from "@repo/ui";

const playfair = Playfair_Display({subsets: ['latin']}); 
const Header = () => {
    return (
        <div className="flex">
            <div className="flex gap-4 items-center justify-center">
                <Image src={"logo.svg"} alt="logo" width={48} height={48} />
                <div className={`${playfair.className} text-[32px]`}>
                    <ShinyText text="LastBench" speed={3} className="font-black"/>
                </div>
            </div>
        </div>
    );
};

export default Header;