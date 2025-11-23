import localFont from 'next/font/local';
import Image from 'next/image';

const aperture = localFont({src: '../public/fonts/aperture2.0-webfont.woff2'});

const Landing = () => {

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
                      scale: "0.65",
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
                      scale: "0.65",
                      objectPosition: "right bottom",
                    }}
                  />
                </div>
</div>


        </div>
    );
};

export default Landing;