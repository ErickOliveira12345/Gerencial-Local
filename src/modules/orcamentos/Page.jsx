

import React from 'react';
import CrudPage from '../../components/CrudPage';
import { useData } from '../../context/DataContext';

export default function Page() {
  const { clientes = [] } = useData();

  const fields = [
    {
      key: 'clienteId',
      label: 'Cliente',
      type: 'select',
      required: false,
      options: clientes.map((cliente) => ({
        value: cliente.id,
        label: cliente.nome
      }))
    },
    {
      key: 'descricao',
      label: 'Descrição',
      type: 'text',
      required: true
    },
    {
      key: 'data',
      label: 'Data',
      type: 'date',
      required: true
    },
    {
      key: 'validade',
      label: 'Validade',
      type: 'date',
      required: false
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: ['Rascunho', 'Enviado', 'Aprovado', 'Rejeitado']
    },
    {
      key: 'valor',
      label: 'Valor',
      type: 'number',
      required: false
    }
  ];

  const columns = [
    {
      key: 'clienteId',
      label: 'Cliente',
      format: (clienteId, row) => {
        const cliente = clientes.find(
          (item) => String(item.id) === String(clienteId)
        );

        return cliente?.nome || row.cliente || 'Cliente não identificado';
      }
    },
    ...fields.filter((field) => field.key !== 'clienteId')
  ];

  return (
    <CrudPage
      store="orcamentos"
      title="Orçamentos"
      subtitle="Propostas e valores para seus clientes"
      fields={fields}
      columns={columns}
    />
  );
}
