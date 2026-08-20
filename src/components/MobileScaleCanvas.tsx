"use client";

import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const BASE_WIDTH = 440;

type MobileScaleCanvasProps = {
  children: ReactNode;
};

export default function MobileScaleCanvas({
  children,
}: MobileScaleCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [scaledHeight, setScaledHeight] = useState<number>();

  const updateScale = useCallback(() => {
    const viewportWidth = document.documentElement.clientWidth;

    // Nunca ampliamos acima dos 440px do Figma.
    // Apenas reduzimos quando o celular for menor.
    const nextScale = Math.min(1, viewportWidth / BASE_WIDTH);

    setScale(nextScale);

    if (canvasRef.current) {
      const originalHeight = canvasRef.current.offsetHeight;
      setScaledHeight(originalHeight * nextScale);
    }
  }, []);

  useEffect(() => {
  const frame = requestAnimationFrame(() => {
    updateScale();
  });

  window.addEventListener("resize", updateScale);

  const observer = new ResizeObserver(() => {
    updateScale();
  });

  if (canvasRef.current) {
    observer.observe(canvasRef.current);
  }

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("resize", updateScale);
    observer.disconnect();
  };
}, [updateScale]);

  return (
    <div
      className="relative w-full overflow-x-hidden"
      style={{
        height: scaledHeight,
      }}
    >
      <div
        ref={canvasRef}
        className="absolute left-1/2 top-0 w-[440px]"
        style={{
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        {children}
      </div>
    </div>
  );
}