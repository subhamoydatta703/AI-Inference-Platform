"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

export function ProductStage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const stage = stageRef.current;
    const frame = frameRef.current;
    if (!stage || !frame) return;

    function fitPreview() {
      if (!stage || !frame) return;
      // Leave space for the projected corners of the rotated 1030px layout.
      const scale = Math.min(1, Math.max(0.1, (stage.clientWidth - 32) / 1200));
      stage.style.setProperty("--preview-scale", String(scale));
      stage.style.height = `${Math.ceil((frame.offsetHeight + frame.offsetWidth * 0.15) * scale + 90)}px`;
    }

    const observer = new ResizeObserver(fitPreview);
    observer.observe(stage);
    observer.observe(frame);
    fitPreview();
    return () => observer.disconnect();
  }, []);

  return (
    <div className="hero-product-stage" ref={stageRef}>
      <div className="product-preview-frame" ref={frameRef}>
        {children}
      </div>
      <div className="hero-product-fade" />
    </div>
  );
}
