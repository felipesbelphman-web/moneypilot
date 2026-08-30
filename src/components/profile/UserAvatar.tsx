"use client";

import Image from "next/image";

type UserAvatarProps = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  size?: number;
};

function getInitials(name?: string | null, email?: string | null) {
  const cleanName = name?.trim();

  if (cleanName) {
    const parts = cleanName.split(/\s+/).filter(Boolean);

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }

  const emailInitial = email?.trim().charAt(0);

  return emailInitial ? emailInitial.toUpperCase() : "MP";
}

export function UserAvatar({
  name,
  email,
  avatarUrl,
  size = 48,
}: UserAvatarProps) {
  const initials = getInitials(name, email);

  return (
    <div
      className="relative grid shrink-0 place-items-center overflow-hidden rounded-full border-[1.5px] border-[#3B82F6] bg-[#3B82F6]"
      style={{
        width: size,
        height: size,
      }}
      aria-label={name || email || "User profile"}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={name || "Profile photo"}
          fill
          sizes={`${size}px`}
          className="object-cover"
        />
      ) : (
        <span className="select-none text-[15px] font-semibold leading-none text-white">
          {initials}
        </span>
      )}
    </div>
  );
}