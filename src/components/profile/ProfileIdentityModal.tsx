"use client";

import Image from "next/image";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { getInitials, UserAvatar } from "@/components/profile/UserAvatar";

export type ProfileIdentitySaveInput = {
  displayName: string;
  avatarMode: "photo" | "initials";
  avatarFile: File | null;
  removePhoto: boolean;
};

type ProfileIdentityModalProps = {
  open: boolean;
  displayName: string;
  email: string;
  avatarMode: "photo" | "initials";
  avatarPath: string | null;
  avatarUrl: string | null;
  onClose: () => void;
  onSave: (input: ProfileIdentitySaveInput) => Promise<void>;
};

const assetRoot = "/moneypilot/settings/profile";
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxPhotoSize = 5 * 1024 * 1024;

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] ?? "", lastName: parts.slice(1).join(" ") };
}

export function ProfileIdentityModal({
  open,
  displayName,
  email,
  avatarMode,
  avatarPath,
  avatarUrl,
  onClose,
  onSave,
}: ProfileIdentityModalProps) {
  const { theme } = useTheme();
  const isNight = theme === "dark";
  const iconTheme = isNight ? "night" : "day";
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialName = splitDisplayName(displayName);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [selectedMode, setSelectedMode] = useState<"photo" | "initials">(avatarMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isSaving, onClose, open]);

  if (!open) return null;

  const nextDisplayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const initials = getInitials(nextDisplayName, email);
  const usableExistingPhoto = Boolean(avatarPath) && !removePhoto;
  const activePhotoUrl = previewUrl ?? (usableExistingPhoto ? avatarUrl : null);

  function chooseFile(file: File | undefined) {
    if (!file) return;
    if (!acceptedImageTypes.includes(file.type)) {
      setError("Choose a JPEG, PNG, or WebP image.");
      return;
    }
    if (file.size > maxPhotoSize) {
      setError("Profile photos must be 5 MB or smaller.");
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setRemovePhoto(false);
    setSelectedMode("photo");
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!firstName.trim()) {
      setError("First name is required.");
      return;
    }
    if (selectedMode === "photo" && !selectedFile && !usableExistingPhoto) {
      setError("Choose a profile photo before using photo mode.");
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        displayName: nextDisplayName,
        avatarMode: selectedMode,
        avatarFile: selectedFile,
        removePhoto,
      });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Profile changes could not be saved.");
      setIsSaving(false);
    }
  }

  const inputClass = `h-[48px] w-full rounded-[12px] border bg-transparent px-[14px] text-[12px] outline-none transition focus:border-[#3B82F6] focus:ring-[3px] focus:ring-[#3B82F6]/20 ${isNight ? "border-[#373737] text-[#FAFAFA]" : "border-[#D4D4D4] text-[#0A0A0A]"}`;
  const labelClass = `mb-[6px] block text-[11px] font-semibold ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`;

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-[16px] backdrop-blur-[3px] sm:p-[24px] ${isNight ? "bg-black/68" : "bg-[#E5E5E5]/68"}`}
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) onClose(); }}
    >
      <section role="dialog" aria-modal="true" aria-labelledby="profile-identity-title" className={`flex max-h-[calc(100svh-32px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[24px] border ${isNight ? "border-[#373737] bg-[#171717] shadow-[0_18px_42px_rgba(0,0,0,0.5)]" : "border-[#D4D4D4] bg-white shadow-[0_18px_42px_rgba(0,0,0,0.2)]"}`}>
        <header className={`flex min-h-[76px] items-center justify-between gap-[16px] border-b px-[28px] py-[18px] ${isNight ? "border-[#262626]" : "border-[#E5E5E5]"}`}>
          <div className="flex min-w-0 items-center gap-[12px]">
            <Image src={`${assetRoot}/user-circle-${iconTheme}.svg`} alt="" width={46} height={46} className="shrink-0" />
            <div className="min-w-0">
              <h2 id="profile-identity-title" className={`text-[22px] font-semibold ${isNight ? "text-[#FAFAFA]" : "text-[#0A0A0A]"}`}>Profile</h2>
              <p className={`mt-[4px] text-[11.5px] ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`}>Manage your name and how your profile appears across MoneyPilot.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} aria-label="Close" className={`flex size-[38px] shrink-0 items-center justify-center rounded-[12px] border disabled:opacity-50 ${isNight ? "border-[#373737] bg-[#262626]" : "border-[#D4D4D4] bg-[#F5F5F5]"}`}>
            <Image src={`${assetRoot}/close-${iconTheme}.svg`} alt="" width={20} height={20} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 overflow-y-auto px-[28px] py-[22px]">
            <section className={`flex gap-[18px] rounded-[16px] border p-[14px] ${isNight ? "border-[#28313B] bg-[rgba(17,24,39,0.72)]" : "border-[#E5E7EB] bg-[#F8FAFC]"}`}>
              <div className="relative flex h-[84px] w-[84px] shrink-0 items-center">
                <UserAvatar name={nextDisplayName} email={email} avatarMode={selectedMode} avatarUrl={activePhotoUrl} size={72} />
                <span className="absolute bottom-[4px] right-[4px] flex size-[24px] items-center justify-center rounded-full bg-[#3B82F6] ring-2 ring-[var(--background-elevated)]">
                  <Image src={`${assetRoot}/camera-${iconTheme}.svg`} alt="" width={12} height={12} />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <h3 className={`text-[11px] font-semibold ${isNight ? "text-[#FAFAFA]" : "text-[#0A0A0A]"}`}>Profile appearance</h3>
                <p className={`mt-[8px] text-[10px] ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>Choose whether MoneyPilot shows your photo or your initials.</p>
                <div className="mt-[8px] flex flex-wrap gap-[10px]">
                  <button type="button" onClick={() => { setSelectedMode("photo"); setError(null); if (!selectedFile && !usableExistingPhoto) fileInputRef.current?.click(); }} aria-pressed={selectedMode === "photo"} className={`flex h-[42px] w-[126px] items-center gap-[8px] rounded-[12px] border px-[10px] text-[10.5px] font-semibold ${selectedMode === "photo" ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#2563EB]" : isNight ? "border-[#373737] text-[#D4D4D4]" : "border-[#D4D4D4] bg-white text-[#525252]"}`}>
                    <Image src={`${assetRoot}/photo-${iconTheme}.svg`} alt="" width={24} height={24} />Photo
                  </button>
                  <button type="button" onClick={() => { setSelectedMode("initials"); setError(null); }} aria-pressed={selectedMode === "initials"} className={`flex h-[42px] w-[126px] items-center gap-[8px] rounded-[12px] border px-[10px] text-[10.5px] font-semibold ${selectedMode === "initials" ? "border-[#3B82F6] bg-[#3B82F6]/10 text-[#2563EB]" : isNight ? "border-[#373737] text-[#D4D4D4]" : "border-[#D4D4D4] bg-white text-[#525252]"}`}>
                    <span className="grid size-[24px] place-items-center rounded-[12px] bg-[#3B82F6] text-[8.5px] text-white">{initials}</span>Initials
                  </button>
                </div>
                <div className="mt-[8px] flex flex-wrap gap-[12px]">
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label="Choose profile photo" className="sr-only" onChange={(event) => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ""; }} />
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-[32px] min-w-[126px] items-center justify-center gap-[6px] rounded-[10px] bg-[#3B82F6] px-[12px] text-[11px] font-semibold text-white">Change photo<Image src={`${assetRoot}/camera-${iconTheme}.svg`} alt="" width={14} height={14} /></button>
                  <button type="button" disabled={!selectedFile && !avatarPath} onClick={() => { setSelectedFile(null); setPreviewUrl(null); setRemovePhoto(Boolean(avatarPath)); setSelectedMode("initials"); setError(null); }} className={`flex h-[32px] min-w-[126px] items-center justify-center gap-[6px] rounded-[10px] border px-[12px] text-[11px] font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${isNight ? "border-[#373737] text-[#FAFAFA]" : "border-[#D4D4D4] bg-white text-[#0A0A0A]"}`}>Remove photo<Image src={`${assetRoot}/remove-${iconTheme}.svg`} alt="" width={14} height={14} /></button>
                </div>
                <p className={`mt-[7px] text-[9.5px] ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>
                  JPEG, PNG or WebP · Maximum 5 MB
                </p>
              </div>
            </section>

            <div className="mt-[18px]">
              <h3 className={`text-[11px] font-semibold ${isNight ? "text-[#FAFAFA]" : "text-[#0A0A0A]"}`}>Name</h3>
              <p className={`mt-[3px] text-[10px] ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>Your initials are generated from your first and last name.</p>
            </div>
            <div className="mt-[10px] grid grid-cols-1 gap-[14px] sm:grid-cols-2">
              <div><label htmlFor="profile-first-name" className={labelClass}>First name</label><input id="profile-first-name" value={firstName} onChange={(event) => { setFirstName(event.target.value); setError(null); }} autoComplete="given-name" className={inputClass} /></div>
              <div><label htmlFor="profile-last-name" className={labelClass}>Last name</label><input id="profile-last-name" value={lastName} onChange={(event) => { setLastName(event.target.value); setError(null); }} autoComplete="family-name" className={inputClass} /></div>
            </div>
            <div className="mt-[18px] text-[10px]">
              <p className={`font-semibold ${isNight ? "text-[#D4D4D4]" : "text-[#525252]"}`}>Account email</p>
              <p className={`mt-[3px] break-all ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>{email}</p>
            </div>
            {error && <p role="alert" className="mt-[12px] text-[10px] font-medium text-[#F43F5E]">{error}</p>}
          </div>

          <footer className="flex flex-col gap-[14px] border-t border-[#3B82F6] px-[28px] py-[18px] sm:flex-row sm:items-center sm:justify-between">
            <p className={`text-[10px] ${isNight ? "text-[#A3A3A3]" : "text-[#737373]"}`}>You can change this at any time.</p>
            <div className="flex justify-end gap-[10px]">
              <button type="button" onClick={onClose} disabled={isSaving} className={`h-[42px] w-[104px] rounded-[14px] border text-[11px] font-semibold disabled:opacity-50 ${isNight ? "border-[#373737] text-[#FAFAFA]" : "border-[#D4D4D4] bg-white text-[#0A0A0A]"}`}>Cancel</button>
              <button type="submit" disabled={isSaving || !firstName.trim()} className="flex h-[42px] w-[165px] items-center justify-center gap-[12px] rounded-[14px] bg-[#3B82F6] text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"><span>{isSaving ? "Saving…" : "Save changes"}</span><Image src={`${assetRoot}/save-${iconTheme}.svg`} alt="" width={24} height={24} /></button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  );
}
