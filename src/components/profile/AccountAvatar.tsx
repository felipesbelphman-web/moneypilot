"use client";

import { useAccountProfile } from "@/components/profile/AccountProfileProvider";
import { UserAvatar } from "@/components/profile/UserAvatar";

type AccountAvatarProps = {
  size?: number;
};

export function AccountAvatar({ size = 48 }: AccountAvatarProps) {
  const { account, isReady } = useAccountProfile();

  if (
    !isReady ||
    !account ||
    (!account.profile.display_name && !account.email)
  ) {
    return (
      <div
        aria-hidden
        className="shrink-0 rounded-full border-[1.5px] border-[#3B82F6]/30 bg-[#19212C]"
        style={{
          width: size,
          height: size,
        }}
      />
    );
  }

  return (
    <UserAvatar
      name={account.profile.display_name}
      email={account.email}
      avatarMode={account.profile.avatar_mode}
      avatarUrl={account.avatarUrl}
      size={size}
    />
  );
}
