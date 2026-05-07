import { useEffect, useState } from "react";
import innovaGx from "@/assets/innova-crysta-gx-light.jpg";
import innovaVx from "@/assets/innova-crysta-vx-light.jpg";
import innovaZx from "@/assets/innova-crysta-zx-light.jpg";
import innovaTouringSport from "@/assets/innova-crysta-touring-sport-light.jpg";

const slides = [
  { trim: "GX", image: innovaGx },
  { trim: "VX", image: innovaVx },
  { trim: "ZX", image: innovaZx },
  { trim: "Touring Sport", image: innovaTouringSport },
];

export const HeroScene = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 4200);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[660px] w-full overflow-hidden">
      <div
        className="flex h-full w-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ transform: `translateX(-${activeIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.trim} className="relative min-w-full">
            <img
              src={slide.image}
              alt={`Toyota Innova Crysta ${slide.trim}`}
              className="h-full w-full object-cover object-[72%_center] sm:object-[74%_center] lg:object-[78%_center]"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/35" />
      <div className="absolute inset-y-0 left-0 w-[70%] bg-gradient-to-r from-slate-950/70 via-slate-950/40 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/45 via-transparent to-transparent" />

      <div className="absolute right-5 top-5 z-20 rounded-full border border-white/25 bg-black/55 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-white backdrop-blur sm:right-8 sm:top-8 sm:px-5 sm:py-2 sm:text-sm">
        Innova Crysta · {slides[activeIndex].trim}
      </div>

      <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.trim}
            type="button"
            onClick={() => setActiveIndex(index)}
            aria-label={`Go to ${slide.trim}`}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              activeIndex === index ? "w-10 bg-white" : "w-2.5 bg-white/45"
            }`}
          />
        ))}
      </div>
    </div>
  );
};
