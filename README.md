# Gerencial Local modular (React + Vite)

## Executar
`npm install` e `npm run dev`. Para testar PWA: `npm run build` e `npm run preview`; para instalar no celular publique a pasta `dist/` em HTTPS.

## Migração dos dados
Na versão HTML antiga, gere o backup JSON em Backup. Na versão modular, abra Backup e restaure esse arquivo. Faça uma cópia de segurança antes: a restauração substitui os dados existentes. O PIN antigo não é migrado.

## Atenção
Esta versão modular é uma base de migração, não equivalência funcional integral com o HTML ampliado. Ainda faltam PIN, lixeira integrada aos cadastros, movimentações de estoque, automações de recebimento e conversão de orçamentos em OS. Teste com dados fictícios antes do uso real. Dados ficam isolados por origem (URL).
