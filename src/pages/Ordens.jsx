
import React from 'react';
import CrudPage from '../components/CrudPage';
import { money } from '../data/demo';
import { useData } from '../context/DataContext';
import { baixarOrdemPdf } from '../utils/ordemPdf';

export default function Ordens() {
  const { clientes, servicos } = useData();

  return (
    <CrudPage
      store="ordens"
      title="Ordens de serviço"
      subtitle="Acompanhe seus atendimentos"
      
      fields={[
        {
            key: 'cliente',
            label: 'Cliente',
            type: 'select',
            required: true,
            options: clientes.map(c => c.nome)
        },
        {
            key: 'data',
            label: 'Data',
            type: 'date',
            required: true
        },
        {
            key: 'status',
            label: 'Status',
            type: 'select',
            required: true,
            options: [
            'Orçamento',
            'Agendada',
            'Em andamento',
            'Concluída',
            'Cancelada'
            ]
        },
        {
            key: 'servicos',
            label: 'Serviços',
            type: 'services',
            required: true,
            options: servicos
        }
      ]}

      
      columns={[
        {
            key: 'cliente',
            label: 'Cliente'
        },
        {
            key: 'data',
            label: 'Data',
            format: value => {
            if (!value) return '-';
            const [ano, mes, dia] = value.split('-');
            return `${dia}/${mes}/${ano}`;
            }
        },
        {
            key: 'status',
            label: 'Status'
        },
        {
            key: 'valor',
            label: 'Valor total',
            format: value => money(Number(value) || 0)
        }
     ]}

      onDownloadPdf={row => baixarOrdemPdf(row, clientes)}
    />
  );
}

