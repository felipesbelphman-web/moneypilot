"use client";

import { useEffect, useRef, useSyncExternalStore, useState, type ReactNode } from "react";

type DesktopScaleCanvasProps = {
  children: ReactNode;
  baseWidth?: number;
  baseHeight?: number;
  className?: string;
  scaleOnMobile?: boolean;
};

type DesktopInternalPagePanelProps = {
  children: ReactNode;
  className?: string;
};

const desktopMediaQuery = "(min-width: 768px)";

function subscribeToViewport(callback: () => void) {
  const mediaQuery = window.matchMedia(desktopMediaQuery);
  mediaQuery.addEventListener("change", callback);
  return () => mediaQuery.removeEventListener("change", callback);
}

function getDesktopSnapshot() {
  return window.matchMedia(desktopMediaQuery).matches;
}

function getServerDesktopSnapshot() {
  return true;
}

export function DesktopInternalPagePanel({ children, className = "" }: DesktopInternalPagePanelProps) {
  return (
    <section className={`relative h-full w-full overflow-hidden bg-transparent px-[32px] py-[16px] ${className}`}>
      {children}
    </section>
  );
}

export function DesktopScaleCanvas({
  children,
  baseWidth = 1536,
  baseHeight = 1024,
  className = "",
  scaleOnMobile = false,
}: DesktopScaleCanvasProps) {
  const isDesktop = useSyncExternalStore(subscribeToViewport, getDesktopSnapshot, getServerDesktopSnapshot);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateScale = () => {
      const availableWidth = canvasRef.current?.clientWidth ?? window.innerWidth;
      const widthScale = availableWidth / baseWidth;

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
    <div ref={canvasRef} className={`relative min-h-screen w-full overflow-x-hidden bg-[var(--background-secondary)] min-[768px]:px-[24px] min-[768px]:py-[108px] ${className}`}>
      {!isDesktop && !scaleOnMobile ? (
        <div className="relative min-h-screen w-full px-[16px] py-[16px]">
          <div className="w-full">{children}</div>
        </div>
      ) : (
        <div>
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
      )}
    </div>
  );
}
