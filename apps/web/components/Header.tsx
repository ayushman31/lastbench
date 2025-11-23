import Image from "next/image";
import { Playfair_Display } from 'next/font/google';

const playfair = Playfair_Display({subsets: ['latin']}); 
const Header = () => {
    return (
        <div className="flex">
            <div className="flex gap-4 items-center justify-center">
                <Image src={"logo.svg"} alt="logo" width={48} height={48} />
                <p className={`${playfair.className} text-[32px] font-black`}>LastBench</p>
            </div>
        </div>
    );
};

export default Header;