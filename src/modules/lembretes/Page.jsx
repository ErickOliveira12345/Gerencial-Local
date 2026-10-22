
import React from 'react';
import { useData } from '../../context/DataContext';


function normalizarStatus(status = '') {
  return String(status)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function formatarData(data) {
  if (!data) return 'Sem data';

  const valor = String(data).slice(0, 10);
  const partes = valor.split('-');

  if (partes.length !== 3) return valor;

  const [ano, mes, dia] = partes;
  return `${dia}/${mes}/${ano}`;
}

export default function LembretesPage() {
  const {
    ordens = [],
    agenda = [],
    clientes = [],
    loading,
    error
  } = useData();

  
  function nomeCliente(registro) {
    // Nas ordens, o nome pode estar salvo diretamente.
    if (typeof registro.cliente === 'string' && registro.cliente.trim()) {
        return registro.cliente;
    }

    // Nos agendamentos, procura o nome pelo ID do cliente.
    const clienteId = registro.clienteId ?? registro.cliente;
    const cliente = clientes.find(
        (item) => String(item.id) === String(clienteId)
    );

    return cliente?.nome || 'Cliente não identificado';
  }


  const ordensPendentes = ordens
    .filter((ordem) => {
      const status = normalizarStatus(ordem.status);
      return status !== 'concluida' && status !== 'cancelada';
    })
    .sort((a, b) =>
      String(a.data || '').localeCompare(String(b.data || ''))
    );

  const agendamentos = [...agenda].sort((a, b) =>
    `${a.data || ''} ${a.hora || ''}`.localeCompare(
      `${b.data || ''} ${b.hora || ''}`
    )
  );

  if (loading) {
    return <div className="lembretes-page">Carregando lembretes...</div>;
  }

  if (error) {
    return <div className="lembretes-page">{error}</div>;
  }

  return (
    <div className="lembretes-page">
      
      <header className="page-header">
        <div>
            <h1>Lembretes</h1>
            <p>Acompanhe suas ordens de serviço e seus compromissos.</p>
        </div>
      </header>

      <section className="lembretes-section">
        <div className="lembretes-section-title">
          <h2>Ordens de serviço</h2>
          <span className="lembretes-count">
            {ordensPendentes.length}
          </span>
        </div>

        {ordensPendentes.length === 0 ? (
          <p className="lembretes-vazio">
            Não há ordens de serviço pendentes.
          </p>
        ) : (
          <div className="lembretes-lista">
            {ordensPendentes.map((ordem) => (
              <article
                className="lembrete-item"
                key={ordem.id}
              >
                <span className="lembrete-icone">🔧</span>

                <div className="lembrete-conteudo">
                  <strong>Ordem de serviço</strong>
                  <p>
                    {nomeCliente(ordem)}, {' '}
                    {formatarData(ordem.data)}, {' '}
                    {ordem.status || 'Sem status'}.
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="lembretes-section">
        <div className="lembretes-section-title">
          <h2>Agendamentos</h2>
          <span className="lembretes-count">
            {agendamentos.length}
          </span>
        </div>

        {agendamentos.length === 0 ? (
          <p className="lembretes-vazio">
            Não há agendamentos cadastrados.
          </p>
        ) : (
          <div className="lembretes-lista">
            {agendamentos.map((compromisso) => (
              <article
                className="lembrete-item"
                key={compromisso.id}
              >
                <span className="lembrete-icone">📅</span>

                <div className="lembrete-conteudo">
                  <strong>Agenda</strong>
                  <p>
                    {nomeCliente(compromisso)}, {' '}
                    {compromisso.descricao || 'Compromisso'}, {' '}
                    {formatarData(compromisso.data)}, {' '}
                    {compromisso.hora || 'Sem horário'}.
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
