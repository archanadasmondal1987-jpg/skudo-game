/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from 'react';

interface Star {
  x: number;
  y: number;
  length: number;
  speed: number;
  opacity: number;
  angle: number;
  color: string;
}

interface Cloud {
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
}

export default function BackgroundStars() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Initialize shooting stars
    const stars: Star[] = [];
    const maxStars = 4;

    const createStar = (randomX: boolean = false): Star => {
      const x = randomX ? Math.random() * width : -100;
      const y = Math.random() * (height * 0.45); // keep in upper part
      const length = 70 + Math.random() * 80;
      const speed = 1.3 + Math.random() * 2.0; // nice and swift shooting star speed
      const opacity = 0.35 + Math.random() * 0.35; // highly visible blue trails
      const angle = Math.PI / 6 + (Math.random() * Math.PI) / 36; // soft diagonal angle
      const blueTones = ['#4DA6FF', '#3BA7FF', '#00A3FF', '#87CEEB', '#00E5FF'];
      const color = blueTones[Math.floor(Math.random() * blueTones.length)];

      return { x, y, length, speed, opacity, angle, color };
    };

    for (let i = 0; i < maxStars; i++) {
      stars.push(createStar(true));
    }

    // Initialize decorative clouds
    const clouds: Cloud[] = [];
    const maxClouds = 5;

    const createCloud = (randomX: boolean = false): Cloud => {
      return {
        x: randomX ? Math.random() * width : -150,
        y: 40 + Math.random() * (height * 0.6),
        size: 80 + Math.random() * 100,
        speed: 0.1 + Math.random() * 0.15, // extremely slow drift
        opacity: 0.12 + Math.random() * 0.08,
      };
    };

    for (let i = 0; i < maxClouds; i++) {
      clouds.push(createCloud(true));
    }

    // Handle Resize
    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Drawing loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Create daytime soft sky gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#E0F2FE'); // light sky blue top
      gradient.addColorStop(0.5, '#F0F9FF'); // ultra-light sky blue middle
      gradient.addColorStop(1, '#FFFFFF'); // clean white bottom
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw clouds (subtle, airy layered vector blobs)
      clouds.forEach((cloud) => {
        ctx.fillStyle = `rgba(255, 255, 255, ${cloud.opacity})`;
        ctx.beginPath();
        const { x, y, size } = cloud;
        
        ctx.arc(x, y, size * 0.4, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y - size * 0.15, size * 0.35, 0, Math.PI * 2);
        ctx.arc(x + size * 0.6, y, size * 0.3, 0, Math.PI * 2);
        ctx.arc(x + size * 0.3, y + size * 0.15, size * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Move cloud
        cloud.x += cloud.speed;
        if (cloud.x - size > width) {
          // Reset to left side
          Object.assign(cloud, createCloud(false));
        }
      });

      // Draw Shooting Stars (semi-transparent elegant trails)
      stars.forEach((star, index) => {
        ctx.strokeStyle = star.color;
        
        // Setup glow/shadow
        ctx.shadowBlur = 8;
        ctx.shadowColor = star.color;

        const endX = star.x + Math.cos(star.angle) * star.length;
        const endY = star.y + Math.sin(star.angle) * star.length;

        // Custom gradient for the trail (fading to invisible at the tail)
        const lineGrad = ctx.createLinearGradient(star.x, star.y, endX, endY);
        lineGrad.addColorStop(0, star.color);
        lineGrad.addColorStop(1, 'rgba(77, 166, 255, 0)');

        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 2.0;
        ctx.beginPath();
        ctx.moveTo(star.x, star.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Move shooting star
        star.x += Math.cos(star.angle) * star.speed;
        star.y += Math.sin(star.angle) * star.speed;

        // Reset blur properties to avoid affecting other entities
        ctx.shadowBlur = 0;

        // If star drifts off the screen, re-create it
        if (star.x > width + 100 || star.y > height + 100) {
          stars[index] = createStar(false);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      id="bg-stars-canvas"
      className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10 bg-sky-50"
    />
  );
}
