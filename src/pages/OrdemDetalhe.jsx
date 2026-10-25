

import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Save,
  X,
  FileDown,
  Trash2,
  Plus,
  Minus,
  ClipboardList
} from 'lucide-react';

import { useData } from '../context/DataContext';
import { baixarOrdemPdf } from '../utils/ordemPdf';

const STATUS = [
  'Orçamento',
  'Agendada',
  'Em andamento',
  'Cancelada',
  'Concluída'
];

const moeda = value =>
  Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });

function calcularSubtotal(servicos) {
  return (servicos || []).reduce(
    (total, item) =>
      total +
      (Number(item.quantidade) || 0) *
      (Number(item.preco) || 0),
    0
  );
}

function dataFormatada(data) {
  if (!data) return '-';

  const partes = data.split('-');

  if (partes.length !== 3) return data;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function prepararFormulario(ordem) {
  const servicos = Array.isArray(ordem.servicos)
    ? ordem.servicos.map(item => ({
        ...item,
        quantidade: Number(item.quantidade) || 1,
        preco: Number(item.preco) || 0
      }))
    : ordem.servico
      ? [{
          nome: ordem.servico,
          quantidade: 1,
          preco: Number(ordem.valor) || 0
        }]
      : [];

  return {
    cliente: ordem.cliente || '',
    data: ordem.data || '',
    status: ordem.status || 'Orçamento',
    desconto: Number(ordem.desconto) || 0,
    servicos
  };
}

export default function OrdemDetalhe() {
  const { id } = useParams();
  const navigate = useNavigate();

  const {
    ordens = [],
    clientes = [],
    servicos = [],
    loading,
    put,
    del
  } = useData();

  const ordem = ordens.find(
    item => String(item.id) === String(id)
  );

  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [baixandoPdf, setBaixandoPdf] = useState(false);

  function iniciarEdicao() {
    setForm(prepararFormulario(ordem));
    setEditando(true);
    setErro('');
    setMensagem('');
  }

  function cancelarEdicao() {
    setForm(null);
    setEditando(false);
    setErro('');
  }

  function alterarCampo(campo, valor) {
    setForm(atual => ({
      ...atual,
      [campo]: valor
    }));
  }

  function adicionarServico(idServico) {
    const servico = servicos.find(
      item => String(item.id) === String(idServico)
    );

    if (!servico) return;

    if (
      form.servicos.some(
        item => String(item.id) === String(servico.id)
      )
    ) {
      setErro('Este serviço já foi adicionado à ordem.');
      return;
    }

    alterarCampo('servicos', [
      ...form.servicos,
      {
        id: servico.id,
        nome: servico.nome,
        quantidade: 1,
        preco: Number(servico.preco) || 0
      }
    ]);

    setErro('');
  }

  function alterarItem(index, campo, valor) {
    const novosServicos = form.servicos.map((item, i) =>
      i === index
        ? { ...item, [campo]: valor }
        : item
    );

    alterarCampo('servicos', novosServicos);
  }

  function removerServico(index) {
    alterarCampo(
      'servicos',
      form.servicos.filter((_, i) => i !== index)
    );
  }

  async function salvarEdicao(event) {
    event.preventDefault();

    if (salvando) return;

    try {
      setSalvando(true);
      setErro('');
      setMensagem('');

      if (!form.cliente.trim()) {
        throw new Error('Selecione o cliente.');
      }

      if (!form.data) {
        throw new Error('Informe a data da ordem.');
      }

      if (!STATUS.includes(form.status)) {
        throw new Error('Selecione um status válido.');
      }

      if (form.servicos.length === 0) {
        throw new Error('Adicione pelo menos um serviço.');
      }

      const desconto = Number(form.desconto);

      if (
        !Number.isFinite(desconto) ||
        desconto < 0 ||
        desconto > 100
      ) {
        throw new Error(
          'O desconto deve estar entre 0% e 100%.'
        );
      }

      for (const item of form.servicos) {
        const quantidade = Number(item.quantidade);
        const preco = Number(item.preco);

        if (
          !Number.isFinite(quantidade) ||
          quantidade <= 0 ||
          !Number.isFinite(preco) ||
          preco < 0
        ) {
          throw new Error(
            'Confira as quantidades e os preços dos serviços.'
          );
        }
      }

      const itensSalvos = form.servicos.map(item => ({
        ...item,
        quantidade: Number(item.quantidade),
        preco: Number(item.preco)
      }));

      const subtotal = calcularSubtotal(itensSalvos);
      const valorDesconto = subtotal * desconto / 100;
      const total = Math.max(0, subtotal - valorDesconto);

      const dadosAtualizados = {
        ...ordem,
        ...form,
        id: ordem.id,
        desconto,
        servicos: itensSalvos,
        servico: itensSalvos
          .map(item => item.nome)
          .join(', '),
        subtotal,
        valorDesconto,
        valor: total
      };

      await put('ordens', dadosAtualizados);

      setEditando(false);
      setForm(null);
      setMensagem('Ordem atualizada com sucesso.');
    } catch (error) {
      setErro(error.message || 'Não foi possível salvar a ordem.');
    } finally {
      setSalvando(false);
    }
  }

  async function excluirOrdem() {
    const confirmado = window.confirm(
      'Deseja realmente excluir esta ordem de serviço? Esta ação não pode ser desfeita.'
    );

    if (!confirmado) return;

    try {
      setErro('');
      await del('ordens', ordem.id);
      navigate('/ordens');
    } catch (error) {
      setErro(error.message || 'Não foi possível excluir a ordem.');
    }
  }

  async function baixarPdf() {
    try {
      setBaixandoPdf(true);
      setErro('');

      await baixarOrdemPdf(ordem, clientes);
    } catch (error) {
      setErro(error.message || 'Não foi possível gerar o PDF.');
    } finally {
      setBaixandoPdf(false);
    }
  }

  if (loading) {
    return (
      <section className="panel">
        Carregando ordem de serviço...
      </section>
    );
  }

  if (!ordem) {
    return (
      <section className="panel ordem-detalhe">
        <button
          type="button"
          className="ordem-btn ordem-btn-secundario"
          onClick={() => navigate('/ordens')}
        >
          <ArrowLeft size={18} />
          Voltar para ordens
        </button>

        <h1>Ordem não encontrada</h1>

        <p>
          Esta ordem pode ter sido excluída ou o endereço
          acessado não corresponde a uma ordem existente.
        </p>
      </section>
    );
  }

  const dados = editando ? form : prepararFormulario(ordem);

  const subtotal = calcularSubtotal(dados.servicos);
  const desconto = Number(dados.desconto) || 0;
  const valorDesconto = subtotal * desconto / 100;
  const total = Math.max(0, subtotal - valorDesconto);

  const servicosDisponiveis = servicos.filter(
    servico =>
      !dados.servicos.some(
        item => String(item.id) === String(servico.id)
      )
  );

  return (
    <div className="ordem-detalhe">      
      <header className="page-header">
        <div className="page-header-info">
            <h1>Ordem de serviço</h1>
            <p>Visualize e gerencie os detalhes do atendimento</p>
        </div>

        <div className="page-header-actions">
            <button
                type="button"
                className="ordem-btn ordem-btn-secundario"
                onClick={() => navigate('/ordens')}
                >
                <ArrowLeft size={18} />
                Voltar para ordens
            </button>
        </div>
      </header>

      <div className="ordem-detalhe-topo">
      </div>

      <div className="ordem-detalhe-cabecalho">
        <div>
            <span className="ordem-detalhe-identificador">
                Ordem #{String(ordem.id).slice(0, 8)}
            </span>
        </div>

        {!editando && (
          <div className="ordem-detalhe-acoes">
            <button
              type="button"
              className="ordem-btn ordem-btn-principal"
              onClick={iniciarEdicao}
            >
              <Pencil size={17} />
              Editar ordem
            </button>

            <button
              type="button"
              className="ordem-btn ordem-btn-secundario"
              onClick={baixarPdf}
              disabled={baixandoPdf}
            >
              <FileDown size={17} />
              {baixandoPdf ? 'Gerando PDF...' : 'Baixar PDF'}
            </button>

            <button
              type="button"
              className="ordem-btn ordem-btn-perigo"
              onClick={excluirOrdem}
            >
              <Trash2 size={17} />
              Excluir
            </button>
          </div>
        )}
      </div>

      {erro && (
        <p role="alert" className="error">
          {erro}
        </p>
      )}

      {mensagem && (
        <p role="status" className="ordem-sucesso">
          {mensagem}
        </p>
      )}

      <form onSubmit={salvarEdicao}>
        <section className="panel ordem-secao">
          <div className="ordem-secao-titulo">
            <ClipboardList size={20} />
            <h2>Dados do atendimento</h2>
          </div>

          <div className="ordem-campos">
            <label>
              Cliente

              {editando ? (
                <select
                  required
                  value={form.cliente}
                  onChange={event =>
                    alterarCampo('cliente', event.target.value)
                  }
                >
                  <option value="">Selecione o cliente</option>

                  {clientes.map(cliente => (
                    <option
                      key={cliente.id}
                      value={cliente.nome}
                    >
                      {cliente.nome}
                    </option>
                  ))}

                  {!clientes.some(
                    cliente => cliente.nome === form.cliente
                  ) && form.cliente && (
                    <option value={form.cliente}>
                      {form.cliente}
                    </option>
                  )}
                </select>
              ) : (
                <strong>{ordem.cliente || '-'}</strong>
              )}
            </label>

            <label>
              Data

              {editando ? (
                <input
                  type="date"
                  required
                  value={form.data}
                  onChange={event =>
                    alterarCampo('data', event.target.value)
                  }
                />
              ) : (
                <strong>{dataFormatada(ordem.data)}</strong>
              )}
            </label>

            <label>
              Status

              {editando ? (
                <select
                  required
                  value={form.status}
                  onChange={event =>
                    alterarCampo('status', event.target.value)
                  }
                >
                  {STATUS.map(status => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <span
                  className={
                    'ordem-status ordem-status-' +
                    (ordem.status || '')
                      .toLowerCase()
                      .normalize('NFD')
                      .replace(/[\u0300-\u036f]/g, '')
                      .replace(/[^a-z0-9]+/g, '-')
                      .replace(/^-|-$/g, '')
                  }
                >
                  {ordem.status || 'Sem status'}
                </span>
              )}
            </label>
          </div>
        </section>

        <section className="panel ordem-secao">
          <div className="ordem-secao-titulo">
            <ClipboardList size={20} />
            <h2>Serviços da ordem</h2>
          </div>

          {editando && (
            <div className="ordem-adicionar-servico">
              <label>
                Adicionar serviço cadastrado

                <select
                  value=""
                  onChange={event => {
                    if (event.target.value) {
                      adicionarServico(event.target.value);
                    }
                  }}
                >
                  <option value="">Selecione um serviço</option>

                  {servicosDisponiveis.map(servico => (
                    <option
                      key={servico.id}
                      value={servico.id}
                    >
                      {servico.nome} — {moeda(servico.preco)}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}

          {dados.servicos.length === 0 ? (
            <p>Nenhum serviço registrado nesta ordem.</p>
          ) : (
            <div className="ordem-servicos-lista">
              {dados.servicos.map((item, index) => (
                <div
                  className="ordem-servico-item"
                  key={item.id || index}
                >
                  <div className="ordem-servico-nome">
                    <strong>{item.nome}</strong>

                    {editando && (
                      <button
                        type="button"
                        className="ordem-remover-servico"
                        onClick={() => removerServico(index)}
                      >
                        <X size={16} />
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="ordem-servico-valores">
                    <label>
                      Quantidade

                      {editando ? (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          required
                          value={item.quantidade}
                          onChange={event =>
                            alterarItem(
                              index,
                              'quantidade',
                              event.target.value
                            )
                          }
                        />
                      ) : (
                        <strong>{item.quantidade}</strong>
                      )}
                    </label>

                    <label>
                      Preço unitário

                      {editando ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          value={item.preco}
                          onChange={event =>
                            alterarItem(
                              index,
                              'preco',
                              event.target.value
                            )
                          }
                        />
                      ) : (
                        <strong>{moeda(item.preco)}</strong>
                      )}
                    </label>

                    <div className="ordem-servico-subtotal">
                      <span>Subtotal</span>
                      <strong>
                        {moeda(
                          (Number(item.quantidade) || 0) *
                          (Number(item.preco) || 0)
                        )}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="panel ordem-secao ordem-total-secao">
          <h2>Resumo financeiro</h2>

          <div className="ordem-financeiro-linha">
            <span>Subtotal dos serviços</span>
            <strong>{moeda(subtotal)}</strong>
          </div>

          <div className="ordem-financeiro-linha">
            <label htmlFor="ordem-desconto">
              Desconto (%)
            </label>

            {editando ? (
              <input
                id="ordem-desconto"
                className="ordem-input-desconto"
                type="number"
                min="0"
                max="100"
                step="0.01"
                required
                value={form.desconto}
                onChange={event =>
                  alterarCampo('desconto', event.target.value)
                }
              />
            ) : (
              <strong>{desconto}%</strong>
            )}
          </div>

          <div className="ordem-financeiro-linha">
            <span>Valor do desconto</span>
            <strong>- {moeda(valorDesconto)}</strong>
          </div>

          <div className="ordem-financeiro-total">
            <span>Valor total</span>
            <strong>{moeda(total)}</strong>
          </div>
        </section>

        {editando && (
          <div className="ordem-edicao-acoes">
            <button
              type="submit"
              className="ordem-btn ordem-btn-principal"
              disabled={salvando}
            >
              <Save size={17} />
              {salvando ? 'Salvando...' : 'Salvar alterações'}
            </button>

            <button
              type="button"
              className="ordem-btn ordem-btn-secundario"
              onClick={cancelarEdicao}
              disabled={salvando}
            >
              <X size={17} />
              Cancelar
            </button>
          </div>
        )}
      </form>

      {!editando && (
        <div className="ordem-detalhe-rodape">
          <button
            type="button"
            className="ordem-btn ordem-btn-secundario"
            onClick={() => navigate('/ordens')}
          >
            <ArrowLeft size={18} />
            Voltar para a lista
          </button>
        </div>
      )}
    </div>
  );
}
