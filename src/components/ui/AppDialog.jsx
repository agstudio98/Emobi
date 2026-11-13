import React, { useEffect } from 'react';
import { AlertCircle, CircleHelp } from 'lucide-react';
import { Button } from './Button';

export const AppDialog = ({
  isOpen,
  title = 'Aviso',
  message,
  confirmLabel = 'Entendido',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  tone = 'default',
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onCancel?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;
  const isConfirm = Boolean(onCancel);
  const Icon = isConfirm ? CircleHelp : AlertCircle;

  return (
    <div
      className="fixed inset-0 z-[100] bg-emobi-black/40 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        aria-describedby="app-dialog-message"
        className="glass-strong w-full max-w-md rounded-[2rem] p-6 shadow-glass-xl animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="flex gap-4 items-start">
          <div className={`w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center ${tone === 'danger' ? 'bg-red-500/15 text-red-700' : 'bg-emobi-yellow/70 text-emobi-black'}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="pt-1">
            <h2 id="app-dialog-title" className="text-lg font-black font-syne text-emobi-black">{title}</h2>
            <p id="app-dialog-message" className="mt-1.5 text-sm leading-relaxed text-emobi-black/65 font-space">{message}</p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          {isConfirm && <Button variant="outline" size="sm" onClick={onCancel}>{cancelLabel}</Button>}
          <Button variant={tone === 'danger' && isConfirm ? 'dark' : 'primary'} size="sm" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
};
