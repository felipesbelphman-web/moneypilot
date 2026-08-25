"use client";

import { useEffect, useState, type ReactNode } from "react";

type DesktopScaleCanvasProps = {
  children: ReactNode;
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
};

export function DesktopScaleCanvas({
  children,
  baseWidth = 1536,
  baseHeight = 1024,
  className = "",
}: DesktopScaleCanvasProps) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const widthScale = window.innerWidth / baseWidth;

      const nextScale = Math.min(widthScale, 1);

      setScale(nextScale);
    };

    updateScale();

    window.addEventListener("resize", updateScale);

    return () => {
      window.removeEventListener("resize", updateScale);
    };
  }, [baseWidth]);

  return (
    <div className={`relative w-full ${className}`}>
      <div
        className="relative mx-auto"
        style={{
          width: baseWidth * scale,
          height: baseHeight * scale,
        }}
      >
        <div
          className="relative"
          style={{
            width: baseWidth,
            height: baseHeight,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}