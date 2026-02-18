export function AppFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface/60">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-text-muted sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <p>
            Plataforma de propriedade do{" "}
            <a href="https://www.cedet.com.br/" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
              CEDET - Centro de Desenvolvimento Profissional e Tecnologico LTDA - EPP
            </a>{" "}
            (CNPJ 51.914.620/0001-77).
          </p>
          <p>Desenvolvido por Algorithma AI - CNPJ 56.420.666/0001-53 - Sao Paulo/SP.</p>
        </div>
      </div>
    </footer>
  );
}
