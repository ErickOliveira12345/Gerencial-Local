
import React from 'react';
import {
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingUp,
  ClipboardList
} from 'lucide-react';

import { money } from '../data/demo';
import { useData } from '../context/DataContext';

export default function Dashboard() {
  // Obtém os lançamentos financeiros, as ordens e os estados do sistema.
  const {
    lancamentos,
    ordens,
    loading,
    error
  } = useData();

  // Calcula o total de entradas financeiras.
  const entradas = lancamentos
    .filter(e => e.tipo === 'Entrada')
    .reduce(
      (a, e) => a + Number(e.valor || 0),
      0
    );

  // Calcula o total de saídas financeiras.
  const saidas = lancamentos
    .filter(e => e.tipo === 'Saída')
    .reduce(
      (a, e) => a + Number(e.valor || 0),
      0
    );

  return (
    <>
      {/* Cabeçalho do Dashboard. */}
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral dos registros locais</p>
        </div>
      </header>

      {/* Exibe uma mensagem caso ocorra um erro no armazenamento. */}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}

      {/* Exibe o carregamento ou os dados do Dashboard. */}
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <>
          {/* Cards com os principais indicadores financeiros. */}
          <div className="cards">
            {[
              ['Entradas', money(entradas), ArrowUpCircle],
              ['Saídas', money(saidas), ArrowDownCircle],
              ['Resultado', money(entradas - saidas), TrendingUp],
              ['Ordens cadastradas', ordens.length, ClipboardList]
            ].map(([name, value, Icon]) => (
              <article className="metric" key={name}>
                <div className="metric-top">
                  <span>{name}</span>
                  <Icon size={22} />
                </div>

                <strong>{value}</strong>
              </article>
            ))}
          </div>

          {/* Tabela com as oito ordens de serviço mais recentes. */}
          <section className="panel">
            <h2>Ordens recentes</h2>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Serviço</th>
                    <th>Status</th>
                    <th>Valor</th>
                  </tr>
                </thead>

                <tbody>
                  {ordens
                    .slice(-8)
                    .reverse()
                    .map(o => (
                      <tr key={o.id}>
                        <td>{o.cliente}</td>
                        <td>{o.servico}</td>
                        <td>{o.status}</td>
                        <td>{money(Number(o.valor) || 0)}</td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {/* Mensagem exibida quando não existem ordens cadastradas. */}
              {!ordens.length && (
                <p className="empty">
                  Cadastre sua primeira ordem de serviço.
                </p>
              )}
            </div>
          </section>

          {/* Explicação do cálculo financeiro apresentado. */}
          <p className="notice">
            Resultado = entradas − saídas. O faturamento por
            competência será adicionado posteriormente.
          </p>
        </>
      )}
    </>
  );
}
