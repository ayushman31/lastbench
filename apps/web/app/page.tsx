import Header from "@/components/Header";
import Landing from "@/components/Landing";
import LightRays from "@/components/LightRays";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-[#121212] relative text-white">
  {/* Complex Multiplier Pattern (Enhanced) */}
  {/* <div
    className="absolute inset-0 z-0 pointer-events-none"
    style={{
      backgroundImage: `
        repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 40px),
        repeating-linear-gradient(45deg, rgba(0,255,128,0.09) 0, rgba(0,255,128,0.09) 1px, transparent 1px, transparent 20px),
       repeating-linear-gradient(-45deg, rgba(255,0,128,0.10) 0, rgba(255,0,128,0.10) 1px, transparent 1px, transparent 30px),
        repeating-linear-gradient(90deg, rgba(255,255,255,0.03) 0, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 80px),
        radial-gradient(circle at 60% 40%, rgba(0,255,128,0.05) 0, transparent 60%)
      `,
      backgroundSize: "80px 80px, 40px 40px, 60px 60px, 80px 80px, 100% 100%",
      backgroundPosition: "0 0, 0 0, 0 0, 40px 40px, center"
    }}
  /> */}

<div style={{ width: '100%', height: '100%', position: 'absolute' }}>
  <LightRays
    raysOrigin="top-center"
    raysColor="#006239"
    raysSpeed={0.6}
    lightSpread={0.1}
    rayLength={3}
    followMouse={false}
    mouseInfluence={0.1}
    noiseAmount={0}
    distortion={0}
    className="custom-rays"
  />
</div>
   <div className="relative p-4 flex flex-col min-h-screen">
    {/* <Button className="bg-primary text-primary-foreground">dsdsad</Button>
    <Image src="/logo.svg" alt="logo " width={100} height={100} /> */}
    <Header />
    <div className="flex  justify-center p-36">
      <Landing />
    </div>
  </div>

</div>
  );
}