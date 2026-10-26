
import React from 'react';
import CrudPage from '../../components/CrudPage';
import { useData } from '../../context/DataContext';

export default function Page() {
  // Obtém a lista de clientes armazenada no contexto.
  const { clientes } = useData();

  // Define os campos utilizados no cadastro de materiais.
  const fields = [
    {
      key: 'nome',
      label: 'Material',
      type: 'text',
      required: true
    },
    {
      key: 'categoria',
      label: 'Categoria',
      type: 'text',
      required: false
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      type: 'number',
      required: false
    },
    {
      key: 'minimo',
      label: 'Estoque mínimo',
      type: 'number',
      required: false
    },
    {
      key: 'custo',
      label: 'Custo unitário',
      type: 'number',
      required: false
    }
  ];

  // Configura opções adicionais para campos que necessitam de listas.
  // Estas condições só terão efeito se os campos correspondentes
  // existirem na lista fields.
  fields.forEach(f => {
    // Define as opções de clientes para o campo clienteId.
    if (f.key === 'clienteId') {
      f.options = clientes.map(c => c.id);
    }

    // Define as opções disponíveis para o campo status.
    if (f.key === 'status') {
      f.options = [
        'Agendado',
        'Concluído',
        'Cancelado'
      ];
    }
  });

  // Renderiza a página de materiais usando o componente CRUD reutilizável.
  return (
    <CrudPage
      store="materiais"
      title="Materiais"
      subtitle="Controle de itens cadastrados"
      fields={fields}
      // Define as colunas exibidas na tabela de materiais.
      columns={fields
        .filter(f => f.key !== 'clienteId')
        .slice(0, 5)}
    />
  );
}
