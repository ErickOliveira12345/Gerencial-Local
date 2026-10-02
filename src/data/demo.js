export const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
export const clients=[{id:1,nome:'João Silva',telefone:'(11) 99999-1234',email:'joao@exemplo.com'},{id:2,nome:'Maria Santos',telefone:'(11) 98888-5678',email:'maria@exemplo.com'}];
export const services=[{id:1,nome:'Instalação',categoria:'Serviços gerais',preco:350},{id:2,nome:'Manutenção',categoria:'Serviços gerais',preco:180}];
export const orders=[{id:'OS-001',cliente:'João Silva',servico:'Instalação',valor:350,status:'Em andamento'},{id:'OS-002',cliente:'Maria Santos',servico:'Manutenção',valor:180,status:'Concluída'}];
export const entries=[{id:1,data:'2026-10-01',descricao:'Instalação',tipo:'Entrada',valor:350},{id:2,data:'2026-10-02',descricao:'Materiais',tipo:'Saída',valor:95}];
