import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { PageHeader } from "@/components/layout/PageHeader";
import { PAGE_TITLES } from "@/config/app";

export default function ExportPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={PAGE_TITLES.export}
        description="Configure o formato final e gere o arquivo da tradução."
        action={<Button>Exportar</Button>}
      />

      <Card className="space-y-4">
        <div className="flex flex-wrap gap-3">
          {[
            "DOCX (Word)",
            "TXT (Texto simples)",
            "Markdown (.md)",
          ].map((format) => (
            <button
              key={format}
              className="rounded-2xl border border-border px-4 py-2 text-sm font-medium text-text hover:border-brand hover:text-brand"
            >
              {format}
            </button>
          ))}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {[
            "Incluir metadados",
            "Incluir epígrafes",
            "Modo bilíngue",
            "Incluir notas do tradutor",
          ].map((option) => (
            <label key={option} className="flex items-center gap-2 text-sm text-text">
              <input type="checkbox" className="h-4 w-4 accent-brand" />
              {option}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <p className="text-sm text-text-muted">Pré-visualização</p>
        <div className="mt-4 rounded-2xl border border-dashed border-border bg-surface-muted p-6 text-sm text-text-muted">
          Aqui você verá um preview do arquivo exportado.
        </div>
      </Card>
    </div>
  );
}
