"use client";

import { type FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { profileIdentityCopy } from "@/i18n/profile-identity-copy";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
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
  const { language } = useLanguage();
  const copy = profileIdentityCopy[language];
  const savingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialName = splitDisplayName(displayName);
  const [firstName, setFirstName] = useState(initialName.firstName);
  const [lastName, setLastName] = useState(initialName.lastName);
  const [selectedMode, setSelectedMode] = useState<"photo" | "initials">(avatarMode);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [removePhoto, setRemovePhoto] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<'typeError' | 'sizeError' | 'nameError' | 'photoError' | 'saveError' | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);


  if (!open) return null;

  const nextDisplayName = [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
  const initials = getInitials(nextDisplayName, email);
  const usableExistingPhoto = Boolean(avatarPath) && !removePhoto;
  const activePhotoUrl = previewUrl ?? (usableExistingPhoto ? avatarUrl : null);

  function chooseFile(file: File | undefined) {
    if (!file) return;
    if (!acceptedImageTypes.includes(file.type)) {
      setError('typeError');
      return;
    }
    if (file.size > maxPhotoSize) {
      setError('sizeError');
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
    if (savingRef.current) return;
    if (!firstName.trim()) {
      setError('nameError');
      return;
    }
    if (selectedMode === "photo" && !selectedFile && !usableExistingPhoto) {
      setError('photoError');
      return;
    }
    savingRef.current = true;
    setIsSaving(true);
    setError(null);
    try {
      await onSave({
        displayName: nextDisplayName,
        avatarMode: selectedMode,
        avatarFile: selectedFile,
        removePhoto,
      });
    } catch {
      setError('saveError');
    } finally {
      savingRef.current = false;
      setIsSaving(false);
    }
  }

  return <SettingsDialog label={copy.title} onClose={onClose} busy={isSaving} className="settings-profile-dialog">
    <header className="settings-section-title"><div><h2>{copy.title}</h2><p>{copy.description}</p></div><button type="button" className="settings-secondary" onClick={onClose} disabled={isSaving}>{copy.close}</button></header>
    <form onSubmit={handleSubmit}>
      <fieldset disabled={isSaving} className="settings-profile-fields">
        <section className="settings-profile-appearance">
          <UserAvatar name={nextDisplayName} email={email} avatarMode={selectedMode} avatarUrl={activePhotoUrl} size={72} />
          <div><h3>{copy.appearance}</h3><p>{copy.appearanceHelp}</p><div className="settings-profile-actions">
            <button type="button" className="settings-secondary" aria-pressed={selectedMode === 'photo'} onClick={() => { setSelectedMode('photo'); setError(null); if (!selectedFile && !usableExistingPhoto) fileInputRef.current?.click(); }}>{copy.photo}</button>
            <button type="button" className="settings-secondary" aria-pressed={selectedMode === 'initials'} onClick={() => { setSelectedMode('initials'); setError(null); }}>{initials} · {copy.initials}</button>
          </div><div className="settings-profile-actions">
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" aria-label={copy.choosePhoto} className="sr-only" tabIndex={-1} onChange={event => { chooseFile(event.target.files?.[0]); event.currentTarget.value = ''; }} />
            <button type="button" className="settings-primary" onClick={() => fileInputRef.current?.click()}>{copy.changePhoto}</button>
            <button type="button" className="settings-secondary" disabled={!selectedFile && !avatarPath} onClick={() => { setSelectedFile(null); setPreviewUrl(null); setRemovePhoto(Boolean(avatarPath)); setSelectedMode('initials'); setError(null); }}>{copy.removePhoto}</button>
          </div><p>{copy.formats}</p></div>
        </section>
        <h3>{copy.name}</h3><p>{copy.nameHelp}</p>
        <div className="settings-profile-name"><div><label htmlFor="profile-first-name">{copy.firstName}</label><input data-autofocus id="profile-first-name" value={firstName} onChange={event => { setFirstName(event.target.value); setError(null); }} autoComplete="given-name" /></div><div><label htmlFor="profile-last-name">{copy.lastName}</label><input id="profile-last-name" value={lastName} onChange={event => { setLastName(event.target.value); setError(null); }} autoComplete="family-name" /></div></div>
        <h3>{copy.email}</h3><p className="settings-file-name">{email}</p>
      </fieldset>
      {error && <p role="alert">{copy[error]}</p>}
      <footer className="settings-profile-footer"><p>{copy.footer}</p><div className="settings-profile-actions"><button type="button" className="settings-secondary" onClick={onClose} disabled={isSaving}>{copy.cancel}</button><button type="submit" className="settings-primary" disabled={isSaving || !firstName.trim()} aria-busy={isSaving}>{isSaving ? copy.saving : copy.save}</button></div></footer>
    </form>
  </SettingsDialog>;
}
