
import React, { useEffect, useState } from 'react';
import './AppDialog.css';

export default function AppDialog({
  open,
  title = 'Aviso',
  message = '',
  mode = 'message',
  initialValue = '',
  placeholder = '',
  confirmText = 'OK',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel
}) {
  const [value, setValue] = useState(initialValue);

  // Atualiza o campo sempre que a janela for aberta.
  useEffect(() => {
    if (open) {
      setValue(initialValue);
    }
  }, [open, initialValue]);

  if (!open) return null;

  // Envia o texto digitado ou confirma a mensagem.
  const confirmar = (e) => {
    e?.preventDefault();
    onConfirm?.(mode === 'input' ? value.trim() : undefined);
  };

  return (
    <div
      className="app-dialog-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel?.();
        }
      }}
    >
      <div
        className="app-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
      >
        <h2 id="app-dialog-title">{title}</h2>

        {message && (
          <p className="app-dialog-message">{message}</p>
        )}

        {mode === 'input' ? (
          <form onSubmit={confirmar}>
            <input
              className="app-dialog-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              autoFocus
              required
            />

            <div className="app-dialog-actions">
              <button
                type="button"
                className="app-dialog-cancel"
                onClick={onCancel}
              >
                {cancelText}
              </button>

              <button
                type="submit"
                className="app-dialog-confirm"
                disabled={!value.trim()}
              >
                {confirmText}
              </button>
            </div>
          </form>
        ) : (
          <div className="app-dialog-actions">
            <button
              type="button"
              className="app-dialog-confirm"
              onClick={confirmar}
            >
              {confirmText}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
