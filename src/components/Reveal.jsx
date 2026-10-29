import { useEffect, useRef, useState } from 'react';

export default function Reveal({
  children,
  className = '',
  animation = 'fade-up',
  delay = 0,
  threshold = 0.1,
  once = true,
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setVisible(false);
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, once]);

  const animations = {
    'fade-up': visible
      ? 'animate-fade-up'
      : 'opacity-0 translate-y-4',
    'fade-in': visible
      ? 'opacity-100 transition-opacity duration-700 ease-out'
      : 'opacity-0',
    'slide-left': visible
      ? 'translate-x-0 opacity-100 transition-all duration-700 ease-out'
      : 'translate-x-8 opacity-0',
    'slide-right': visible
      ? 'translate-x-0 opacity-100 transition-all duration-700 ease-out'
      : '-translate-x-8 opacity-0',
  };

  return (
    <div
      ref={ref}
      className={`${animations[animation]} ${className}`}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
