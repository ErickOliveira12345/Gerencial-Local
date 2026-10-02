import React from 'react';
import CrudPage from '../../components/CrudPage';
import {useData} from '../../context/DataContext';
export default function Page(){const {clientes}=useData(); const fields=[{'key': 'clienteId', 'label': 'Cliente', 'type': 'select', 'required': false}, {'key': 'descricao', 'label': 'Compromisso', 'type': 'text', 'required': true}, {'key': 'data', 'label': 'Data', 'type': 'date', 'required': true}, {'key': 'hora', 'label': 'Horário', 'type': 'time', 'required': false}, {'key': 'status', 'label': 'Status', 'type': 'select', 'required': false}];
fields.forEach(f=>{if(f.key==='clienteId')f.options=clientes.map(c=>c.id); if(f.key==='status')f.options=['Agendado', 'Concluído', 'Cancelado'];});
return <CrudPage store="agenda" title="Agenda" subtitle="Compromissos e atendimentos" fields={fields} columns={fields.filter(f=>f.key!=='clienteId').slice(0,5)}/>;}
