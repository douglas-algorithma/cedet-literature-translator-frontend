"use client";

import { Modal } from "@/components/common/Modal";

type ShortcutItem = {
  keys: string;
  description: string;
};

const SHORTCUTS: ShortcutItem[] = [
  { keys: "Ctrl + N", description: "Novo livro" },
  { keys: "Ctrl + S", description: "Salvar formulário atual" },
  { keys: "Ctrl + G", description: "Abrir glossário do livro" },
  { keys: "?", description: "Mostrar atalhos" },
  { keys: "Ctrl + Enter", description: "Aprovar tradução (HITL)" },
  { keys: "Ctrl + R", description: "Solicitar refinamento (HITL)" },
  { keys: "Ctrl + T", description: "Traduzir parágrafo selecionado" },
  { keys: "Alt + ↑/↓", description: "Navegar entre parágrafos" },
];

export function KeyboardShortcutsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} title="Atalhos de teclado" size="md">
      <div className="space-y-3">
        {SHORTCUTS.map((shortcut) => (
          <div
            key={shortcut.keys}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm text-text"
          >
            <span className="font-semibold">{shortcut.keys}</span>
            <span className="text-text-muted">{shortcut.description}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
