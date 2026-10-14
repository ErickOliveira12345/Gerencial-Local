
import React, { useState } from 'react';
import { useData } from '../context/DataContext';

export default function CrudPage({
  store,
  title,
  subtitle,
  fields,
  columns,
  onDownloadPdf
}) {
  const ctx = useData();
  const rows = ctx[store] || [];

  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  function start(row) {
    setEditing(row?.id || null);

    setForm(
      Object.fromEntries(
        fields.map(f => [
          f.key,
          row?.[f.key] ??
          (f.key === 'desconto' ? 0 :
          f.type === 'services' ? [] : '')
        ])
      )
    );

    setError('');
  }

  function change(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function updateService(field, service, checked) {
    const current = Array.isArray(form[field.key])
      ? form[field.key]
      : [];

    const next = checked
      ? [
          ...current,
          {
            id: service.id,
            nome: service.nome,
            quantidade: 1,
            preco: Number(service.preco) || 0
          }
        ]
      : current.filter(item => item.id !== service.id);

    change(field.key, next);
  }

  function updateServiceItem(field, index, key, value) {
    const next = [...form[field.key]];
    next[index] = { ...next[index], [key]: value };
    change(field.key, next);
  }

  function totalServices(items) {
    return (items || []).reduce(
      (sum, item) =>
        sum +
        (Number(item.quantidade) || 0) *
          (Number(item.preco) || 0),
      0
    );
  }

  async function submit(e) {
    e.preventDefault();

    try {
      const data = { ...form, id: editing || undefined };
      const servicesField = fields.find(f => f.type === 'services');

      if (servicesField) {
        const items = data[servicesField.key] || [];

        if (servicesField.required && items.length === 0) {
          throw new Error('Selecione pelo menos um serviço.');
        }

        if (items.some(item =>
          Number(item.quantidade) <= 0 ||
          Number(item.preco) < 0 ||
          !Number.isFinite(Number(item.quantidade)) ||
          !Number.isFinite(Number(item.preco))
        )) {
          throw new Error('Confira as quantidades e os preços.');
        }

        const subtotal = totalServices(items);
        const desconto = Number(data.desconto) || 0;

        if (desconto < 0 || desconto > 100) {
          throw new Error('O desconto deve estar entre 0% e 100%.');
        }

        const valorDesconto = subtotal * (desconto / 100);

        data.desconto = desconto;
        data.subtotal = subtotal;
        data.valorDesconto = valorDesconto;
        data.valor = Math.max(0, subtotal - valorDesconto);
        data.servico = items.map(item => item.nome).join(', ');
      }

      await ctx.put(store, data);
      setForm(null);
      setEditing(null);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }

  async function del(id) {
    if (!window.confirm('Excluir este registro?')) return;

    try {
      await ctx.del(store, id);
    } catch (err) {
      setError(err.message);
    }
  }

  const currency = value =>
    Number(value || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

  return (
    <>
      <header className="page-header">
        <div>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
        <button className="primary" onClick={() => start()}>
          + Novo registro
        </button>
      </header>

      {error && <p role="alert" className="error">{error}</p>}

      {form && (
        <section className="panel">
          <h2>{editing ? 'Editar' : 'Cadastrar'}</h2>

          <form className="entry-form" onSubmit={submit}>
            {fields.map(f => (
              <div
                key={f.key}
                style={{
                    width:
                    f.key === 'servicos' ? '480px' :
                    f.key === 'cliente' ? '245px' :
                    f.key === 'data' ? '190px' :
                    f.key === 'status' ? '190px' :
                    'auto',
                    maxWidth: '100%',
                    flexShrink: 0
                }}
                >
                
                {f.type === 'services' ? (
                <fieldset style={{ minWidth: '350px', width: '100%' }}>
                    <legend>{f.label}</legend>

                    <label>
                    Selecionar serviço
                    <select
                        value=""
                        onChange={e => {
                        const service = f.options.find(
                            s => String(s.id) === e.target.value
                        );

                        if (service) {
                            const current = Array.isArray(form[f.key])
                            ? form[f.key]
                            : [];

                            if (!current.some(
                            item => String(item.id) === String(service.id)
                            )) {
                            change(f.key, [
                                ...current,
                                {
                                id: service.id,
                                nome: service.nome,
                                quantidade: 1,
                                preco: Number(service.preco) || 0
                                }
                            ]);
                            }
                        }
                        }}
                    >
                        <option value="">Selecione para adicionar</option>
                        {(f.options || [])
                        .filter(s => !(form[f.key] || []).some(
                            item => String(item.id) === String(s.id)
                        ))
                        .map(s => (
                            <option key={s.id} value={s.id}>
                            {s.nome} — {currency(s.preco)}
                            </option>
                        ))}
                    </select>
                    </label>

                    <div style={{
                    display: 'grid',
                    gap: 12,
                    marginTop: 16,
                    minWidth: '330px',
                    }}>
                    {(form[f.key] || []).map((item, index) => (
                        <div
                        key={item.id || index}
                        style={{
                            padding: 6,
                            border: '1px solid #d5dce8',
                            borderRadius: 8,
                            minWidth: '330px'
                        }}
                        >
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            alignItems: 'center'
                        }}>
                            <strong>{item.nome}</strong>
                            <button
                            type="button"
                            onClick={() => change(
                                f.key,
                                form[f.key].filter((_, i) => i !== index)
                            )}
                            >
                            Remover
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '80px 120px 120px',
                            gap: 12,
                            marginTop: 12
                        }}>
                            <label>
                            Quantidade
                            <input
                                type="number"
                                min="1"
                                step="1"
                                required
                                value={item.quantidade}
                                onChange={e =>
                                updateServiceItem(
                                    f, index, 'quantidade', e.target.value
                                )
                                }
                            />
                            </label>

                            <label>
                            Preço unitário (R$)
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                required
                                value={item.preco}
                                onChange={e =>
                                updateServiceItem(
                                    f, index, 'preco', e.target.value
                                )
                                }
                            />
                            </label>

                            <div>
                            <strong>Subtotal</strong>
                            <p>
                                {currency(
                                (Number(item.quantidade) || 0) *
                                (Number(item.preco) || 0)
                                )}
                            </p>
                            </div>
                        </div>
                        </div>
                    ))}
                    </div>

                    {(form[f.key] || []).length === 0 && (
                    <p>Nenhum serviço adicionado.</p>
                    )}

                    {(() => {
                      const subtotal = totalServices(form[f.key]);
                      const desconto = Number(form.desconto) || 0;
                      const valorDesconto = subtotal * desconto / 100;
                      const total = subtotal - valorDesconto;

                      return (
                        <div style={{ marginTop: 16, textAlign: 'right' }}>
                          <p>Subtotal: {currency(subtotal)}</p>
                          <p>
                            Desconto ({desconto}%): - {currency(valorDesconto)}
                          </p>
                          <p style={{ fontWeight: 700, fontSize: 18 }}>
                            Valor total: {currency(total)}
                          </p>
                        </div>
                      );
                    })()}
                </fieldset>
                ) : (

                  <label>
                    {f.label}

                    {f.type === 'select' ? (
                      <select style={{
                        width: f.key === 'status' ? '150px' : '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                        }}
                        value={form[f.key]}
                        required={f.required}
                        onChange={e => change(f.key, e.target.value)}
                      >
                        <option value="">Selecione</option>
                        {(f.options || []).map(o => (
                          <option key={o} value={o}>{o}</option>
                        ))}
                      </select>
                    ) : (
                      <input style={{
                        width: f.key === 'data' ? '150px' : '100%',
                        maxWidth: '100%',
                        boxSizing: 'border-box'
                        }}
                        required={f.required}
                        type={f.type || 'text'}
                        min={f.type === 'number' ? '0' : undefined}
                        step={f.type === 'number' ? '0.01' : undefined}
                        value={form[f.key]}
                        onChange={e => change(f.key, e.target.value)}
                      />
                    )}
                  </label>
                )}
              </div>
            ))}

            <div className="actions">
              <button className="primary" type="submit">
                Salvar
              </button>
              <button type="button" onClick={() => setForm(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        <div className="table-wrap">
          <table className={store === 'ordens' ? 'orders-table' : ''}>
            <div className='table-header'>
              <thead>
                <tr>
                  {columns.map(c => (
                    <th  key={c.key}>{c.label}</th>
                  ))}
                  {/* <th>Ações</th> */}
                </tr>
              </thead>
            </div>

            
          <tbody>
            {rows.map(row => {
                const isOrder = store === 'ordens';
                const expanded = expandedId === row.id;

                const items = Array.isArray(row.servicos) && row.servicos.length
                ? row.servicos
                : row.servico
                    ? [{
                        nome: row.servico,
                        quantidade: 1,
                        preco: Number(row.valor) || 0
                    }]
                    : [];

                return (
                <React.Fragment key={row.id}>
                    
                  <tr className={isOrder ? 'order-row' : ''}>
                    <div className='order-data'>
                      {columns.map(c => (
                        <td
                          key={c.key}
                          data-label={c.label}
                          className="order-data-cell"
                        >
                          {c.format
                            ? c.format(row[c.key], row)
                            : row[c.key]}
                        </td>
                      ))}
                    </div>

                    <td className="order-actions-cell" data-label="Ações">
                      <div className="actions">
                        {isOrder && (
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedId(expanded ? null : row.id)
                            }
                          >
                            {expanded ? 'Fechar ordem' : 'Ver ordem'}
                          </button>
                        )}

                        <button onClick={() => start(row)}>
                          Editar
                        </button>

                        {onDownloadPdf && (
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await onDownloadPdf(row, ctx);
                                setError('');
                              } catch (err) {
                                setError(err.message);
                              }
                            }}
                          >
                            Baixar em PDF
                          </button>
                        )}

                        <button
                          className="danger"
                          onClick={() => del(row.id)}
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>


                    {isOrder && expanded && (
                    <tr>
                      <td colSpan={columns.length + 1}>
                        <div style={{
                            padding: 16,
                            background: '#f8fafc',
                            borderRadius: 8
                        }}>
                            <h3>Detalhes da ordem de serviço</h3>

                            <p><strong>Cliente:</strong> {row.cliente}</p>
                            <p><strong>Data:</strong> {row.data}</p>
                            <p><strong>Status:</strong> {row.status}</p>

                            <div className="table-wrap">
                            <table>
                                <thead>
                                <tr>
                                    <th>Serviço</th>
                                    <th>Quantidade</th>
                                    <th>Preço unitário</th>
                                    <th>Subtotal</th>
                                </tr>
                                </thead>

                                <tbody>
                                {items.map((item, index) => {
                                    const qty = Number(item.quantidade) || 0;
                                    const price = Number(item.preco) || 0;

                                    return (
                                    <tr key={item.id || index}>
                                        <td>{item.nome}</td>
                                        <td>{qty}</td>
                                        <td>{currency(price)}</td>
                                        <td>{currency(qty * price)}</td>
                                    </tr>
                                    );
                                })}
                                </tbody>
                            </table>
                            </div>

                            
                          <p style={{
                            textAlign: 'right',
                            marginTop: 16
                          }}>
                            Subtotal: {currency(
                              row.subtotal ??
                              items.reduce(
                                (sum, item) =>
                                  sum +
                                  (Number(item.quantidade) || 0) *
                                  (Number(item.preco) || 0),
                                0
                              )
                            )}
                          </p>

                          <p style={{ textAlign: 'right' }}>
                            Desconto ({Number(row.desconto) || 0}%): - {currency(
                              row.valorDesconto ??
                              (
                                (Number(row.subtotal) ||
                                  items.reduce(
                                    (sum, item) =>
                                      sum +
                                      (Number(item.quantidade) || 0) *
                                      (Number(item.preco) || 0),
                                    0
                                  )
                                ) * (Number(row.desconto) || 0) / 100
                              )
                            )}
                          </p>

                          <p style={{
                            textAlign: 'right',
                            fontWeight: 700,
                            fontSize: 18,
                            marginTop: 8
                          }}>
                            Valor total: {currency(row.valor)}
                          </p>

                        </div>
                      </td>
                    </tr>
                    )}
                </React.Fragment>
                );
            })}
          </tbody>

          </table>

          {rows.length === 0 && (
            <p className="empty">Nenhum registro cadastrado.</p>
          )}
        </div>
      </section>
    </>
  );
}

