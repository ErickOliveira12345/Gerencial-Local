
import React from 'react';
import { useData } from '../../context/DataContext';

export default function Page() {
  // Obtém os lançamentos financeiros e as ordens de serviço.
  const { lancamentos, ordens } = useData();

  // Filtra somente os lançamentos que já foram pagos.
  const paid = lancamentos.filter(
    x => x.status === 'Pago'
  );

  // Calcula o total financeiro por tipo de lançamento.
  const sum = type =>
    paid
      .filter(x => x.tipo === type)
      .reduce(
        (n, x) => n + Number(x.valor || 0),
        0
      );

  return (
    <>
      {/* Cabeçalho da página de relatórios. */}
      <header className="page-header">
        <h1>Relatórios</h1>

        <button
          className="primary"
          onClick={() => window.print()}
        >
          Imprimir / Salvar PDF
        </button>
      </header>

      {/* Painel com o resumo financeiro e as ordens cadastradas. */}
      <section className="panel">
        <h2>Resumo financeiro</h2>

        {/* Total de entradas recebidas. */}
        <p>
          Entradas recebidas: R$ {sum('Entrada').toFixed(2)}
        </p>

        {/* Total de saídas pagas. */}
        <p>
          Saídas pagas: R$ {sum('Saída').toFixed(2)}
        </p>

        {/* Resultado financeiro: entradas menos saídas. */}
        <p>
          Resultado: R$ {
            (sum('Entrada') - sum('Saída')).toFixed(2)
          }
        </p>

        {/* Quantidade total de ordens cadastradas. */}
        <p>
          Ordens cadastradas: {ordens.length}
        </p>
      </section>
    </>
  );
}
