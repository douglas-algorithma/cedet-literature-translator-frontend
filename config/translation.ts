import type { BadgeVariant } from "@/components/common/Badge";
import type { TranslationStatus } from "@/types/translation";

export const TRANSLATION_STATUS_LABELS: Record<TranslationStatus, string> = {
  pending: "Pendente",
  translating: "Em tradução",
  review: "Em revisão",
  approved: "Aprovado",
  error: "Erro",
};

export const TRANSLATION_STATUS_BADGES: Record<TranslationStatus, BadgeVariant> = {
  pending: "neutral",
  translating: "info",
  review: "warning",
  approved: "success",
  error: "danger",
};

export const TRANSLATION_STATUS_CARD_STYLES: Record<TranslationStatus, string> = {
  pending: "border-border bg-surface-muted",
  translating: "border-brand/30 bg-brand-soft/50",
  review: "border-accent/40 bg-accent-soft/60",
  approved: "border-success/30 bg-success/10",
  error: "border-danger/30 bg-danger/10",
};
