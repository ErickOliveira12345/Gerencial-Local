
import React from 'react';
import CrudPage from '../../components/CrudPage';
import { useData } from '../../context/DataContext';

export default function Page() {
  const { clientes } = useData();

  const fields = [
    {
      key: 'clienteId',
      label: 'Cliente',
      type: 'select',
      required: false,
      options: (clientes || []).map(c => ({
        value: c.id,
        label: c.nome
      }))
    },
    {
      key: 'descricao',
      label: 'Compromisso',
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
      key: 'hora',
      label: 'Horário',
      type: 'time',
      required: false
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      required: false,
      options: ['Agendado', 'Concluído', 'Cancelado']
    }
  ];

  const columns = [
    {
      key: 'clienteId',
      label: 'Cliente',
      format: value => {
        const cliente = (clientes || []).find(
          c => String(c.id) === String(value)
        );

        return cliente?.nome || 'Cliente não encontrado';
      }
    },
    {
      key: 'descricao',
      label: 'Compromisso'
    },
    {
      key: 'data',
      label: 'Data'
    },
    {
      key: 'hora',
      label: 'Horário'
    },
    {
      key: 'status',
      label: 'Status'
    }
  ];

  return (
    <CrudPage
      store="agenda"
      title="Agenda"
      subtitle="Compromissos e atendimentos"
      fields={fields}
      columns={columns}
    />
  );
}
