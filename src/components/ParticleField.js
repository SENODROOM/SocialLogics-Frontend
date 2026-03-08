import { useMemo } from 'react';

export default function ParticleField() {
  const particles = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5,
    speed: Math.random() * 12 + 8,
    delay: Math.random() * 8,
    opacity: Math.random() * 0.25 + 0.05,
  })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute',
          left: p.x + '%',
          top: p.y + '%',
          width: p.size + 'px',
          height: p.size + 'px',
          borderRadius: '50%',
          background: `rgba(0,245,255,${p.opacity})`,
          animation: `float ${p.speed}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}
