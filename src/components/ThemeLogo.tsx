import Image from "next/image";

export function ThemeLogo({
  width = 232,
  height = 48,
  priority = false,
  className = "",
}: {
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ width, height, gap: (26 / 232) * width }}
      aria-label="MoneyPilot"
    >
      <span className="shrink-0 overflow-hidden" style={{ width: height, height }}>
        <Image
          src="/moneypilot/moneypilot-logo.svg"
          alt=""
          width={232}
          height={48}
          priority={priority}
          className="h-full max-w-none"
          aria-hidden="true"
        />
      </span>
      <span
        className="money-pilot-wordmark whitespace-nowrap font-brand font-medium leading-none"
        style={{ fontSize: (26 / 48) * height }}
        aria-hidden="true"
      >
        MoneyPilot
      </span>
    </span>
  );
}
