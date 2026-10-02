import React from 'react';
import CrudPage from '../../components/CrudPage';
import {useData} from '../../context/DataContext';
export default function Page(){const {clientes}=useData(); const fields=[{'key': 'clienteId', 'label': 'Cliente', 'type': 'select', 'required': false}, {'key': 'descricao', 'label': 'Descrição', 'type': 'text', 'required': true}, {'key': 'data', 'label': 'Data', 'type': 'date', 'required': true}, {'key': 'validade', 'label': 'Validade', 'type': 'date', 'required': false}, {'key': 'status', 'label': 'Status', 'type': 'select', 'required': false}, {'key': 'valor', 'label': 'Valor', 'type': 'number', 'required': false}];
fields.forEach(f=>{if(f.key==='clienteId')f.options=clientes.map(c=>c.id); if(f.key==='status')f.options=['Rascunho', 'Enviado', 'Aprovado', 'Rejeitado'];});
return <CrudPage store="orcamentos" title="Orçamentos" subtitle="Propostas e valores para seus clientes" fields={fields} columns={fields.filter(f=>f.key!=='clienteId').slice(0,5)}/>;}
