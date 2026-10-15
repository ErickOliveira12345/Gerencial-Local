
import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { imprimirPlanilha } from '../../utils/planilhaPdf';

export default function Page() {
  const { planilhas, put, del } = useData();

  const [selected, setSelected] = useState('');

  const [obs, setObs] = useState('');

  const sheet =
    planilhas.find(s => s.id === selected) || planilhas[0];

  // Contar as colunas da planilha + a coluna Ações
  const totalColunas = (sheet?.colunas?.length || 0);

  const change = async s => put('planilhas', s);

  // Imprimir a planilha selecionada
  const handleImprimir = async () => {
    if (!sheet) {
      alert('Selecione uma planilha para imprimir.');
      return;
    }

    try {
      await imprimirPlanilha({
        ...sheet,
        obs
      });
    } catch (erro) {
      console.error('Erro ao imprimir planilha:', erro);
      alert('Não foi possível gerar o PDF da planilha.');
    }
  };

  // Criar uma nova planilha
  const criarPlanilha = () => {
    const nome = prompt('Nome da planilha');

    if (nome?.trim()) {
      change({
        nome: nome.trim(),
        colunas: [
          {
            id: crypto.randomUUID(),
            nome: 'Descrição'
          }
        ],
        linhas: []
      });
    }
  };

  // Adicionar coluna
  const adicionarColuna = () => {
    const nome = prompt('Nome da coluna');

    if (nome?.trim()) {
      change({
        ...sheet,
        colunas: [
          ...sheet.colunas,
          {
            id: crypto.randomUUID(),
            nome: nome.trim()
          }
        ]
      });
    }
  };

  // Adicionar linha
  const adicionarLinha = () => {
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

  // Renomear coluna
  const renomearColuna = (coluna) => {
    const nome = prompt('Renomear', coluna.nome);

    if (nome?.trim()) {
      change({
        ...sheet,
        colunas: sheet.colunas.map(c =>
          c.id === coluna.id
            ? { ...c, nome: nome.trim() }
            : c
        )
      });
    }
  };

  // Excluir coluna e seus valores
  const excluirColuna = (coluna) => {
    if (!confirm('Excluir coluna e seus valores?')) {
      return;
    }

    change({
      ...sheet,
      colunas: sheet.colunas.filter(
        c => c.id !== coluna.id
      ),
      linhas: sheet.linhas.map(
        ({ [coluna.id]: removido, ...resto }) => resto
      )
    });
  };

  // Excluir linha
  const excluirLinha = (linha) => {
    change({
      ...sheet,
      linhas: sheet.linhas.filter(
        r => r.id !== linha.id
      )
    });
  };

  // Excluir planilha
  const excluirPlanilha = async () => {
    if (!confirm('Excluir planilha?')) {
      return;
    }

    await del('planilhas', sheet.id);
    setSelected('');
  };

  // Salvar valor editado
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

  // Ajustar a altura da celula ao digitar
  
    const ajustarAltura = (e) => {
    const campo = e.currentTarget;
    campo.style.height = "auto";
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
                                el.style.height = `${el.scrollHeight}px`;
                                }
                            }}
                            onBlur={e =>
                                salvarCelula(r, c, e.target.value)
                            }
                            onInput={e => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
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
                
                <tr>
                    <td colSpan={totalColunas}>
                        <textarea
                        className="Obs"
                        placeholder="Obs:"
                        value={obs}
                        onChange={e => setObs(e.target.value)}
                        />
                    </td>
                </tr>

              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
