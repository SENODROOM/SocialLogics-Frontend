import { useMemo } from 'react';

export function ParticleField() {
  const particles = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 2.5 + 0.5, speed: Math.random() * 14 + 9,
    delay: Math.random() * 10, opacity: Math.random() * 0.2 + 0.04,
  })), []);

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x + '%', top: p.y + '%',
          width: p.size + 'px', height: p.size + 'px', borderRadius: '50%',
          background: `rgba(0,212,255,${p.opacity})`,
          animation: `float ${p.speed}s linear ${p.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

export function GlobalBackground() {
  return (
    <>
      {/* Grid */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(0,212,255,0.022) 1px,transparent 1px),linear-gradient(90deg,rgba(0,212,255,0.022) 1px,transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none', zIndex: 0 }} />
      {/* Radial glows */}
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse at 10% 10%,rgba(0,100,160,0.1) 0%,transparent 55%),radial-gradient(ellipse at 90% 85%,rgba(124,58,237,0.07) 0%,transparent 50%)', pointerEvents: 'none', zIndex: 0 }} />
      <ParticleField />
    </>
  );
}
