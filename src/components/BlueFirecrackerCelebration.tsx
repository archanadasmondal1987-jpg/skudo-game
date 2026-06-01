/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Rocket {
  x: number;
  y: number;
  tx: number;
  ty: number;
  speed: number;
  angle: number;
  color: string;
  isAlive: boolean;
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  gravity: number;
  size: number;
}

export default function BlueFirecrackerCelebration() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const rockets: Rocket[] = [];
    const sparks: Spark[] = [];

    // Beautiful blue tones for firecrackers
    const BLUE_PALETTE = [
      '#4DA6FF', // Sky blue
      '#3BA7FF', // Brilliant blue
      '#007FFF', // Azure Blue
      '#1E90FF', // Dodger blue
      '#87CEEB', // Midnight blue accent but bright
      '#E0F4FF', // Ice blue flash
      '#00D2FF', // Cyan flare
    ];

    const getRandomBlue = () => {
      return BLUE_PALETTE[Math.floor(Math.random() * BLUE_PALETTE.length)];
    };

    const spawnRocket = () => {
      const startX = Math.random() * (width * 0.6) + width * 0.2;
      const startY = height + 10;
      const targetX = Math.random() * (width * 0.8) + width * 0.1;
      const targetY = Math.random() * (height * 0.45) + height * 0.15; // explode in top half

      const dx = targetX - startX;
      const dy = targetY - startY;
      const angle = Math.atan2(dy, dx);
      const dist = Math.hypot(dx, dy);
      const speed = dist / (35 + Math.random() * 15); // reached target frames

      rockets.push({
        x: startX,
        y: startY,
        tx: targetX,
        ty: targetY,
        speed,
        angle,
        color: getRandomBlue(),
        isAlive: true,
      });
    };

    const explode = (x: number, y: number, color: string) => {
      const sparkCount = 60 + Math.floor(Math.random() * 40);
      for (let i = 0; i < sparkCount; i++) {
        // Uniform circular spread with velocity
        const angle = Math.random() * Math.PI * 2;
        const velocity = (1.5 + Math.random() * 5.0) * (Math.random() * 0.5 + 0.6);
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        sparks.push({
          x,
          y,
          vx,
          vy,
          color,
          alpha: 1.0,
          decay: 0.012 + Math.random() * 0.015,
          gravity: 0.04 + Math.random() * 0.03,
          size: 1.8 + Math.random() * 1.5,
        });
      }
    };

    // Initial burst & continuous generator timers
    let timer = 0;
    const initialSpawn = 3;
    for (let i = 0; i < initialSpawn; i++) {
      spawnRocket();
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    const update = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'; // partial trail clearing
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = 'lighter';

      // Update and draw rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        
        // draw tail fire
        ctx.beginPath();
        ctx.arc(r.x, r.y, 2.5, 0, Math.PI * 2);
        ctx.fillStyle = r.color;
        ctx.fill();

        ctx.strokeStyle = r.color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(r.x, r.y);
        ctx.lineTo(r.x - Math.cos(r.angle) * 12, r.y - Math.sin(r.angle) * 12);
        ctx.stroke();

        // Move rocket
        r.x += Math.cos(r.angle) * r.speed;
        r.y += Math.sin(r.angle) * r.speed;

        // Check if rocket reached or passed target boundary heights
        if (r.y <= r.ty) {
          explode(r.tx, r.ty, r.color);
          rockets.splice(i, 1);
        }
      }

      // Update and draw sparkles
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vy += s.gravity; // drop under gravity
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.shadowBlur = 4;
        ctx.shadowColor = s.color;
        
        ctx.beginPath();
        // Give sparkles a slight shimmering star flash effect
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.restore();
      }

      // Continuous spawning
      timer++;
      if (timer % 24 === 0) {
        spawnRocket();
      }

      animId = requestAnimationFrame(update);
    };

    update();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="blue-firecrackers-canvas"
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
