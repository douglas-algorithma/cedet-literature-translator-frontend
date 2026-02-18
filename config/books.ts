import type { BookStatus } from "@/types/book";

export const STATUS_LABELS: Record<BookStatus, string> = {
  draft: "Rascunho",
  in_progress: "Em andamento",
  completed: "Concluído",
  paused: "Pausado",
};

export const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "in_progress", label: STATUS_LABELS.in_progress },
  { value: "completed", label: STATUS_LABELS.completed },
  { value: "paused", label: STATUS_LABELS.paused },
  { value: "draft", label: STATUS_LABELS.draft },
] as const;

export const ORDER_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "alpha", label: "Alfabético" },
  { value: "progress", label: "Progresso" },
] as const;

export const LANGUAGE_OPTIONS = [
  "Inglês",
  "Espanhol",
  "Francês",
  "Alemão",
  "Italiano",
  "Português (BR)",
  "Português (PT)",
  "Japonês",
  "Chinês",
] as const;

export const GENRE_OPTIONS = [
  "Ficção",
  "Não-ficção",
  "Fantasia",
  "Romance",
  "Histórico",
  "Suspense",
  "Técnico",
  "Poesia",
  "Infantojuvenil",
  "Filosofia",
  "Autoajuda",
  "Biografia",
  "Religioso",
  "Acadêmico",
  "Sci-fi",
  "Terror",
  "Drama",
  "Ensaio",
  "Policial",
] as const;

const LLM_MODEL_COSTS = {
  "openai/gpt-4.1": {
    profile: "Normal",
    inputPerMillion: 2,
    outputPerMillion: 8,
  },
  "openai/gpt-4.1-mini": {
    profile: "Rápido",
    inputPerMillion: 0.4,
    outputPerMillion: 1.6,
  },
  "anthropic/claude-sonnet-4.6": {
    profile: "Verboso/Contextual",
    inputPerMillion: 3,
    outputPerMillion: 15,
  },
} as const;

const BASE_LLM_MODEL = "openai/gpt-4.1";

const baseModelCosts = LLM_MODEL_COSTS[BASE_LLM_MODEL];

const calculateCostMultiplier = (model: keyof typeof LLM_MODEL_COSTS) => {
  const costs = LLM_MODEL_COSTS[model];
  const inputRatio = costs.inputPerMillion / baseModelCosts.inputPerMillion;
  const outputRatio = costs.outputPerMillion / baseModelCosts.outputPerMillion;
  return (inputRatio + outputRatio) / 2;
};

export const LLM_MODEL_OPTIONS = (Object.entries(LLM_MODEL_COSTS) as Array<
  [keyof typeof LLM_MODEL_COSTS, (typeof LLM_MODEL_COSTS)[keyof typeof LLM_MODEL_COSTS]]
>).map(([value, model]) => {
  const multiplier = calculateCostMultiplier(value).toFixed(2);
  return {
    value,
    label: `${multiplier}x • ${model.profile}`,
  };
});
