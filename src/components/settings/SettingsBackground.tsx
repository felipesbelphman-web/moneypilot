"use client";
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RotateCcw } from 'lucide-react';
import type { SettingsCopy } from '@/i18n/settings-copy';
import { backgroundImageTypes, validateBackgroundFile } from './settings-presentation';

export function SettingsBackground({ copy }: { copy: SettingsCopy }) {
  // No background storage exists. Keep the preview scoped to this mounted session.
  const [preview, setPreview] = useState<{ url: string; name: string } | null>(null);
  const [error, setError] = useState<'imageTypeError' | 'imageSizeError' | 'imageLoadError' | null>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview.url); }, [preview]);
  function selectFile(file?: File) {
    if (!file) return;
    const invalid = validateBackgroundFile(file);
    if (invalid) { setError(invalid); return; }
    try { setPreview({ url: URL.createObjectURL(file), name: file.name }); setError(null); }
    catch { setError('imageLoadError'); }
  }
  return <section className="settings-card" aria-labelledby="settings-background-title"><div className="settings-section-title"><h2 id="settings-background-title">{copy.backgroundPersonalization}</h2><span className="settings-badge">{copy.localOnly}</span></div><div className="settings-background-content">
    <div className="settings-background-preview">{preview ? <Image unoptimized src={preview.url} alt={preview.name} fill sizes="(max-width: 767px) 100vw, 200px" onError={() => { setPreview(null); setError('imageLoadError'); }} /> : <div role="img" aria-label={copy.defaultBackground} className="settings-background-default" />}</div>
    <div><h3>{copy.currentBackground}</h3><p className="settings-file-name">{preview?.name ?? copy.defaultBackground}</p><p>{copy.backgroundDescription}</p><div className="settings-background-actions"><input ref={input} className="sr-only" tabIndex={-1} type="file" accept={backgroundImageTypes.join(',')} aria-label={copy.changeImage} onChange={event => { selectFile(event.target.files?.[0]); event.currentTarget.value = ''; }} /><button type="button" className="settings-secondary" onClick={() => input.current?.click()}><ImagePlus size={16} aria-hidden="true" />{copy.changeImage}</button><button type="button" className="settings-secondary" disabled={!preview} onClick={() => { setPreview(null); setError(null); }}><RotateCcw size={16} aria-hidden="true" />{copy.restoreDefault}</button></div><p>{copy.imageRecommendation}</p></div>
  </div><p className="settings-note">{copy.backgroundScroll}</p>{error && <p role="alert">{copy[error]}</p>}</section>;
}
