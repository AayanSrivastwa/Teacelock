import { useEffect, useRef } from "react";
import { useTheme } from "../context/ThemeContext";

interface HologramNode {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  type: "hash" | "dot" | "pulse";
  label?: string;
  size: number;
}

const HEX_CHARS = ["0", "1", "7", "F", "A", "E", "9", "B", "C", "D"];

export default function BackgroundMesh() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initNodes();
    };

    window.addEventListener("resize", handleResize);

    const mouse = { x: -2000, y: -2000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    let nodes: HologramNode[] = [];

    const initNodes = () => {
      nodes = [];
      const count = Math.floor(Math.min(48, Math.max(24, (width * height) / 32000)));

      for (let i = 0; i < count; i++) {
        const isHash = i % 5 === 0;
        nodes.push({
          x: Math.random() * width,
          y: Math.random() * height,
          z: Math.random() * 200 + 50,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
          vz: (Math.random() - 0.5) * 0.1,
          type: isHash ? "hash" : i % 7 === 0 ? "pulse" : "dot",
          label: isHash ? `0x${HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]}${HEX_CHARS[Math.floor(Math.random() * HEX_CHARS.length)]}` : undefined,
          size: isHash ? 9 : 2 + Math.random() * 2,
        });
      }
    };

    initNodes();

    let scanY = 0;
    let time = 0;

    const render = () => {
      time += 0.012;
      ctx.clearRect(0, 0, width, height);

      const isLight = document.documentElement.getAttribute("data-theme") === "light";

      // Color scheme: Emerald Primary with Cyan security accents
      const primaryRgb = isLight ? "5, 150, 105" : "0, 230, 118";
      const cyanRgb = isLight ? "8, 145, 178" : "6, 182, 212";

      // 1. Render subtle cryptographic scanline sweep across the page
      scanY += 1.2;
      if (scanY > height) scanY = -20;

      const scanGrad = ctx.createLinearGradient(0, scanY - 30, 0, scanY + 30);
      scanGrad.addColorStop(0, "rgba(0, 230, 118, 0)");
      scanGrad.addColorStop(0.5, isLight ? "rgba(5, 150, 105, 0.04)" : "rgba(0, 230, 118, 0.06)");
      scanGrad.addColorStop(1, "rgba(0, 230, 118, 0)");
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 30, width, 60);

      // 2. Update and draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        node.x += node.vx;
        node.y += node.vy;

        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 140 && dist > 0) {
            const force = (140 - dist) / 140;
            node.x += (dx / dist) * force * 0.7;
            node.y += (dy / dist) * force * 0.7;
          }
        }
      }

      // 3. Connect nodes with dual-color provenance lattice
      const maxDist = 170;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxDist) {
            const alpha = (1 - dist / maxDist) * (isLight ? 0.2 : 0.32);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);

            const isSpecial = (i + j) % 4 === 0;
            ctx.strokeStyle = isSpecial 
              ? `rgba(${cyanRgb}, ${alpha * 1.1})` 
              : `rgba(${primaryRgb}, ${alpha})`;
            ctx.lineWidth = isSpecial ? 1 : 0.75;
            ctx.stroke();
          }
        }
      }

      // 4. Draw nodes (dots, glowing rings, and hex bytes)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];

        if (node.type === "hash" && node.label) {
          ctx.font = "10px 'JetBrains Mono', monospace";
          ctx.fillStyle = isLight ? "rgba(5, 150, 105, 0.65)" : "rgba(0, 230, 118, 0.7)";
          ctx.fillText(node.label, node.x, node.y);
        } else if (node.type === "pulse") {
          const pulseRadius = node.size + Math.sin(time * 3 + i) * 2;
          ctx.beginPath();
          ctx.arc(node.x, node.y, Math.max(1, pulseRadius), 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${cyanRgb})`;
          ctx.fill();

          // Outer halo
          ctx.beginPath();
          ctx.arc(node.x, node.y, Math.max(2, pulseRadius + 4), 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cyanRgb}, 0.25)`;
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgb(${primaryRgb})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <div className="live-bg-container" aria-hidden="true">
      {/* Precision isometric grid */}
      <div className="bg-precision-grid"></div>

      {/* Cybernetic ambient radial spotlight */}
      <div className="bg-dual-spotlight left-spot"></div>
      <div className="bg-dual-spotlight right-spot"></div>

      {/* Interactive canvas */}
      <canvas ref={canvasRef} className="live-bg-canvas" />
    </div>
  );
}
