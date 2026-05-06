import innovaHero from '@/assets/innova-hero.jpg';

export const HeroScene = () => (
  <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
    {/* Ambient gradient stage */}
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,hsl(var(--primary)/0.35),transparent_70%)]" />
    <div className="absolute inset-x-0 bottom-10 h-6 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.5),transparent_70%)] blur-2xl animate-pulse-glow" />

    {/* Car with floating + subtle tilt animation */}
    <div className="relative w-[92%] car-float">
      <div className="car-tilt drop-shadow-[0_25px_40px_hsl(var(--primary)/0.45)]">
        <img
          src={innovaHero}
          alt="Toyota Innova Crysta — premium fleet vehicle"
          className="w-full h-auto object-contain select-none pointer-events-none"
          draggable={false}
        />
      </div>
    </div>
  </div>
);
