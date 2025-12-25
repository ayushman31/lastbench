"use client";
import localFont from 'next/font/local';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { GetStartedButton } from './ui/button';

const aperture = localFont({src: '../public/fonts/aperture2.0-webfont.woff2'});

const Landing = () => {
    const router = useRouter();
    return (
        <div className='items-center justify-center'>
            <div className='text-center'>    
                <p className={`${aperture.className} text-6xl mb-6`} >Make your mark,</p>
                <p className={`${aperture.className} text-6xl mb-10`} >One Episode at a Time.</p>
            </div>
            <div className='text-center'>    
                <p className={`${aperture.className} text-2xl mt-15`} >Lastbench is a podcasting platform, where you <br/>
                    can record premium quality content. <br />
                    Anytime, Anywhere, Any device.  </p>
            </div>

            <div className={`flex items-center justify-center text-[18px] ${aperture.className} p-4 pr-10 z-10 gap-4 mt-10`}>
                <GetStartedButton className="cursor-pointer z-20" 
                onClick={() => router.push("/signup")}>Get Started</GetStartedButton>
            </div>

            {/* Left half - crops to show only left 50% */}
            <div className="absolute inset-0 flex">
                {/* Left half */}
                <div className="relative w-1/2">
                  <Image
                    src="/landing.png"
                    alt="Left half"
                    fill
                    className="object-cover"
                    style={{
                      clipPath: "inset(0 50% 0 0)",
                      transform: "scale(0.70)",
                      transformOrigin: "left bottom",
                      objectPosition: "left bottom",
                    }}
                  />
                </div>

                {/* Right half */}
                <div className="relative w-1/2">
                  <Image
                    src="/landing.png"
                    alt="Right half"
                    fill
                    className="object-cover"
                    style={{
                      clipPath: "inset(0 0 0 50%)",
                      transform: "scale(0.70)",
                      transformOrigin: "right bottom",
                      objectPosition: "right bottom",
                    }}
                  />
                </div>
            </div>
        </div>
    );
};

export default Landing;