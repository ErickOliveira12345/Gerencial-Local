import React from 'react';
import CrudPage from '../../components/CrudPage';
import {useData} from '../../context/DataContext';
export default function Page(){const {clientes}=useData(); const fields=[{'key': 'nome', 'label': 'Material', 'type': 'text', 'required': true}, {'key': 'categoria', 'label': 'Categoria', 'type': 'text', 'required': false}, {'key': 'quantidade', 'label': 'Quantidade', 'type': 'number', 'required': false}, {'key': 'minimo', 'label': 'Estoque mínimo', 'type': 'number', 'required': false}, {'key': 'custo', 'label': 'Custo unitário', 'type': 'number', 'required': false}];
fields.forEach(f=>{if(f.key==='clienteId')f.options=clientes.map(c=>c.id); if(f.key==='status')f.options=['Agendado', 'Concluído', 'Cancelado'];});
return <CrudPage store="materiais" title="Materiais" subtitle="Controle de itens cadastrados" fields={fields} columns={fields.filter(f=>f.key!=='clienteId').slice(0,5)}/>;}
