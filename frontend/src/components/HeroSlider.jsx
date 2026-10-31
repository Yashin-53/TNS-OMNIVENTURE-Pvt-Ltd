import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HERO_SLIDES } from '../data/constants';

// Full-width banner: changes slide every 3 seconds, pauses while the mouse is over it
export default function HeroSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), 3000);
    return () => clearInterval(timer);
  }, [paused]);

  return (
    <section
      className="relative h-[360px] w-full overflow-hidden bg-ink sm:h-[460px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-label="Featured"
    >
      {HERO_SLIDES.map((slide, i) => (
        <div
          key={slide.title}
          className={`absolute inset-0 transition-opacity duration-700 ${i === index ? 'opacity-100' : 'opacity-0'}`}
          aria-hidden={i !== index}
        >
          <img
            src={slide.image}
            alt=""
            className="h-full w-full object-cover"
            onError={(e) => (e.currentTarget.style.display = 'none')}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/55 to-ink/10" />

          {i === index && (
            <div className="absolute inset-0 mx-auto flex max-w-6xl items-center px-4">
              <div className="hero-in max-w-xl text-white">
                <h1 className="text-3xl font-bold leading-tight sm:text-5xl">{slide.title}</h1>
                <p className="mt-3 text-base text-white/85 sm:text-lg">{slide.text}</p>
                <Link to={slide.cta.to} className="btn btn-accent mt-6">{slide.cta.label}</Link>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
        {HERO_SLIDES.map((slide, i) => (
          <button
            key={slide.title}
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${i === index ? 'w-8 bg-marigold' : 'w-2 bg-white/60'}`}
          />
        ))}
      </div>
    </section>
  );
}
