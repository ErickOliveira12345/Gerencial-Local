
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { imprimirPlanilha } from '../../utils/planilhaPdf';
import ConfirmDialog from '../../components/ConfirmDialog';
import AppDialog from '../../components/AppDialog';

export default function Page() {
  const { planilhas, put, del } = useData();

  const [selected, setSelected] = useState('');
  const [obs, setObs] = useState('');

  // Controla as janelas de confirmação de exclusão.
  const [confirmacao, setConfirmacao] = useState(null);

  // Controla as janelas personalizadas do módulo.
  const [dialogo, setDialogo] = useState(null);

  // Identifica a planilha selecionada.
  const sheet =
    planilhas.find(s => s.id === selected) || planilhas[0];

  // Contar as colunas da planilha + a coluna Ações.
  const totalColunas = sheet?.colunas?.length || 0;

  // Salvar ou atualizar uma planilha.
  const change = async s => put('planilhas', s);

  // Abrir uma mensagem personalizada.
  const mostrarMensagem = (titulo, mensagem) => {
    setDialogo({
      tipo: 'mensagem',
      titulo,
      mensagem
    });
  };

  // Imprimir a planilha selecionada.
  const handleImprimir = async () => {
    if (!sheet) {
      mostrarMensagem(
        'Atenção',
        'Selecione uma planilha para imprimir.'
      );
      return;
    }

    try {
      await imprimirPlanilha({
        ...sheet,
        obs
      });
    } catch (erro) {
      console.error('Erro ao imprimir planilha:', erro);

      mostrarMensagem(
        'Erro ao imprimir',
        'Não foi possível gerar o PDF da planilha. Tente novamente.'
      );
    }
  };

  // Criar uma nova planilha.
  const criarPlanilha = () => {
    setDialogo({
      tipo: 'criarPlanilha',
      titulo: 'Nova planilha',
      mensagem: 'Informe o nome da planilha.',
      valorInicial: '',
      placeholder: 'Nome da planilha'
    });
  };

  // Adicionar coluna.
  const adicionarColuna = () => {
    if (!sheet) return;

    setDialogo({
      tipo: 'adicionarColuna',
      titulo: 'Nova coluna',
      mensagem: 'Informe o nome da nova coluna.',
      valorInicial: '',
      placeholder: 'Nome da coluna'
    });
  };

  // Adicionar linha.
  const adicionarLinha = () => {
    if (!sheet) return;

    change({
      ...sheet,
      linhas: [
        ...sheet.linhas,
        {
          id: crypto.randomUUID()
        }
      ]
    });
  };

  // Renomear coluna.
  const renomearColuna = (coluna) => {
    setDialogo({
      tipo: 'renomearColuna',
      titulo: 'Renomear coluna',
      mensagem: 'Informe o novo nome da coluna.',
      valorInicial: coluna.nome,
      placeholder: 'Nome da coluna',
      colunaId: coluna.id
    });
  };

  // Processar as informações das janelas personalizadas.
  const confirmarDialogo = async (valor) => {
    if (!dialogo) return;

    // Fecha a janela de mensagem.
    if (dialogo.tipo === 'mensagem') {
      setDialogo(null);
      return;
    }

    // Não permite nomes vazios.
    const nome = valor?.trim();

    if (!nome) return;

    try {
      // Criar uma nova planilha.
      if (dialogo.tipo === 'criarPlanilha') {
        await change({
          nome,
          colunas: [
            {
              id: crypto.randomUUID(),
              nome: 'Descrição'
            }
          ],
          linhas: []
        });

        setSelected('');
        setObs('');
      }

      // Adicionar uma coluna.
      if (dialogo.tipo === 'adicionarColuna' && sheet) {
        await change({
          ...sheet,
          colunas: [
            ...sheet.colunas,
            {
              id: crypto.randomUUID(),
              nome
            }
          ]
        });
      }

      // Renomear uma coluna.
      if (dialogo.tipo === 'renomearColuna' && sheet) {
        await change({
          ...sheet,
          colunas: sheet.colunas.map(c =>
            c.id === dialogo.colunaId
              ? { ...c, nome }
              : c
          )
        });
      }

      setDialogo(null);
    } catch (erro) {
      console.error('Erro ao salvar:', erro);

      setDialogo(null);

      mostrarMensagem(
        'Erro ao salvar',
        'Não foi possível salvar as alterações. Tente novamente.'
      );
    }
  };

  // Excluir coluna e seus valores.
  const excluirColuna = (coluna) => {
    setConfirmacao({
      tipo: 'coluna',
      id: coluna.id,
      titulo: 'Excluir coluna',
      mensagem:
        `Deseja excluir a coluna "${coluna.nome}" e todos os seus valores? ` +
        'Esta ação não poderá ser desfeita.'
    });
  };

  // Excluir linha.
  const excluirLinha = (linha) => {
    setConfirmacao({
      tipo: 'linha',
      id: linha.id,
      titulo: 'Excluir linha',
      mensagem:
        'Deseja realmente excluir esta linha? Esta ação não poderá ser desfeita.'
    });
  };

  // Excluir planilha.
  const excluirPlanilha = () => {
    if (!sheet) return;

    setConfirmacao({
      tipo: 'planilha',
      id: sheet.id,
      titulo: 'Excluir planilha',
      mensagem:
        `Deseja excluir a planilha "${sheet.nome}"? ` +
        'Esta ação não poderá ser desfeita.'
    });
  };

  // Confirmar exclusão de planilha, coluna ou linha.
  const confirmarExclusao = async () => {
    if (!confirmacao || !sheet) return;

    try {
      if (confirmacao.tipo === 'planilha') {
        await del('planilhas', confirmacao.id);

        setSelected('');
        setObs('');
      } else if (confirmacao.tipo === 'coluna') {
        await change({
          ...sheet,
          colunas: sheet.colunas.filter(
            c => c.id !== confirmacao.id
          ),
          linhas: sheet.linhas.map(
            ({ [confirmacao.id]: removido, ...resto }) => resto
          )
        });
      } else if (confirmacao.tipo === 'linha') {
        await change({
          ...sheet,
          linhas: sheet.linhas.filter(
            r => r.id !== confirmacao.id
          )
        });
      }

      setConfirmacao(null);
    } catch (erro) {
      console.error('Erro ao excluir:', erro);

      setConfirmacao(null);

      mostrarMensagem(
        'Erro ao excluir',
        'Não foi possível concluir a exclusão. Tente novamente.'
      );
    }
  };

  // Salvar valor editado.
  const salvarCelula = (linha, coluna, valor) => {
    if (valor === (linha[coluna.id] ?? '')) {
      return;
    }

    change({
      ...sheet,
      linhas: sheet.linhas.map(r =>
        r.id === linha.id
          ? {
              ...r,
              [coluna.id]: valor
            }
          : r
      )
    });
  };

  // Ajustar a altura da célula ao digitar.
  const ajustarAltura = (e) => {
    const campo = e.currentTarget;
    campo.style.height = 'auto';
    campo.style.height = `${campo.scrollHeight}px`;
  };

  return (
    <>
      <header className="page-header">
        <h1>Planilhas</h1>

        <button
          className="primary"
          onClick={criarPlanilha}
        >
          + Planilha
        </button>
      </header>

      <section className="panel">
        <select
          value={sheet?.id || ''}
          onChange={e => setSelected(e.target.value)}
        >
          {planilhas.map(s => (
            <option value={s.id} key={s.id}>
              {s.nome}
            </option>
          ))}
        </select>

        {sheet && (
          <>
            <div className="actions">
              <button
                type="button"
                className="primary"
                onClick={handleImprimir}
              >
                Imprimir planilha
              </button>

              <button
                type="button"
                onClick={adicionarColuna}
              >
                + Coluna
              </button>

              <button
                type="button"
                onClick={adicionarLinha}
              >
                + Linha
              </button>

              <button
                type="button"
                className="danger"
                onClick={excluirPlanilha}
              >
                Excluir planilha
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {sheet.colunas.map(c => (
                      <th key={c.id}>
                        {c.nome}{' '}

                        <button
                          type="button"
                          title="Renomear coluna"
                          onClick={() => renomearColuna(c)}
                        >
                          ✎
                        </button>

                        <button
                          type="button"
                          title="Excluir coluna"
                          onClick={() => excluirColuna(c)}
                        >
                          ×
                        </button>
                      </th>
                    ))}

                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {sheet.linhas.map(r => (
                    <tr key={r.id}>
                      {sheet.colunas.map(c => (
                        <td key={c.id}>
                          <textarea
                            defaultValue={r[c.id] || ''}
                            rows={1}
                            ref={el => {
                              if (el) {
                                el.style.height = 'auto';
                                el.style.height =
                                  `${el.scrollHeight}px`;
                              }
                            }}
                            onBlur={e =>
                              salvarCelula(r, c, e.target.value)
                            }
                            onInput={e => {
                              e.target.style.height = 'auto';
                              e.target.style.height =
                                `${e.target.scrollHeight}px`;
                            }}
                          />
                        </td>
                      ))}

                      <td>
                        <button
                          type="button"
                          onClick={() => excluirLinha(r)}
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                <tfoot>
                  <tr>
                    <td colSpan={Math.max(totalColunas + 1, 1)}>
                      <textarea
                        className="Obs"
                        placeholder="Obs:"
                        value={obs}
                        onChange={e => setObs(e.target.value)}
                      />
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Janela personalizada para nomes, avisos e erros. */}
      <AppDialog
        open={Boolean(dialogo)}
        title={dialogo?.titulo}
        message={dialogo?.mensagem}
        mode={
          dialogo?.tipo === 'mensagem'
            ? 'message'
            : 'input'
        }
        initialValue={dialogo?.valorInicial || ''}
        placeholder={dialogo?.placeholder || ''}
        confirmText={
          dialogo?.tipo === 'mensagem'
            ? 'Entendi'
            : 'Salvar'
        }
        cancelText="Cancelar"
        onConfirm={confirmarDialogo}
        onCancel={() => setDialogo(null)}
      />

      {/* Janela personalizada para confirmar exclusões. */}
      <ConfirmDialog
        open={Boolean(confirmacao)}
        title={confirmacao?.titulo || 'Confirmar exclusão'}
        message={confirmacao?.mensagem || ''}
        confirmText="Excluir"
        cancelText="Cancelar"
        danger
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmacao(null)}
      />
    </>
  );
}

