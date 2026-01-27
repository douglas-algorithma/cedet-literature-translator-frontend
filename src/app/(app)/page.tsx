export default function DashboardPage() {
  return (
    <section className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Visao geral</p>
          <h1>Dashboard</h1>
        </div>
        <button className="primary">Continuar traducao</button>
      </header>
      <div className="card-grid">
        <article className="card">
          <h2>Livros em andamento</h2>
          <p className="card-value">0</p>
          <p className="muted">Acompanhe o progresso por capitulo.</p>
        </article>
        <article className="card">
          <h2>Paragrafos pendentes</h2>
          <p className="card-value">0</p>
          <p className="muted">Prontos para traducao e revisao.</p>
        </article>
        <article className="card">
          <h2>Revisoes abertas</h2>
          <p className="card-value">0</p>
          <p className="muted">Itens aguardando decisao humana.</p>
        </article>
      </div>
      <section className="two-columns">
        <div className="card">
          <h2>Atalhos rapidos</h2>
          <ul className="list">
            <li>Adicionar livro e capitulos</li>
            <li>Inserir paragrafos em massa</li>
            <li>Gerenciar glossario</li>
          </ul>
        </div>
        <div className="card">
          <h2>Status do sistema</h2>
          <p className="muted">API conectada e Redis ativo.</p>
        </div>
      </section>
    </section>
  );
}
