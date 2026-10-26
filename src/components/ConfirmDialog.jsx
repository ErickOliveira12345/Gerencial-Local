
import React from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  open,
  title = 'Confirmar ação',
  message = 'Deseja realmente continuar?',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  danger = false,
  onConfirm,
  onCancel
}) {
  if (!open) return null;

  return (
    <div
      className="confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onCancel?.();
        }
      }}
    >
      <div
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-message"
      >
        <div className={`confirm-icon ${danger ? 'danger' : ''}`}>
          <AlertTriangle size={27} />
        </div>

        <h2 id="confirm-title">{title}</h2>

        <p id="confirm-message">{message}</p>

        <div className="confirm-actions">
          <button
            type="button"
            className="confirm-btn-cancel"
            onClick={onCancel}
          >
            {cancelText}
          </button>

          <button
            type="button"
            className={`confirm-btn-ok ${danger ? 'danger' : ''}`}
            onClick={onConfirm}
            autoFocus
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
