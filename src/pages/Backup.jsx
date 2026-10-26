
import React, { useState } from 'react';
import {
  exportBackup,
  importBackup
} from '../db/indexedDB';
import { useData } from '../context/DataContext';

export default function Backup() {
  // Armazena mensagens de sucesso ou erro.
  const [message, setMessage] = useState('');

  // Obtém a função que atualiza os dados do sistema.
  const { refresh } = useData();

  // Exportar os dados do sistema para um arquivo JSON.
  async function download() {
    try {
      // Gera o conteúdo JSON com formatação legível.
      const json = JSON.stringify(
        await exportBackup(),
        null,
        2
      );

      // Cria um arquivo temporário para download.
      const url = URL.createObjectURL(
        new Blob(
          [json],
          { type: 'application/json' }
        )
      );

      // Cria um link temporário para baixar o arquivo.
      const a = document.createElement('a');

      a.href = url;

      // Define o nome do arquivo com a data atual.
      a.download =
        'gerencial-backup-' +
        new Date().toISOString().slice(0, 10) +
        '.json';

      // Inicia o download do backup.
      a.click();

      // Libera a URL temporária após o download.
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      // Informa que o backup foi gerado.
      setMessage(
        'Backup gerado. Guarde o arquivo em local seguro.'
      );
    } catch (e) {
      // Exibe o erro caso a exportação falhe.
      setMessage(e.message);
    }
  }

  // Restaurar os dados a partir de um arquivo JSON.
  async function restore(e) {
    // Obtém o arquivo selecionado pelo usuário.
    const file = e.target.files?.[0];

    // Encerra se nenhum arquivo tiver sido selecionado.
    if (!file) return;

    // Solicita confirmação antes de substituir os dados atuais.
    if (
      !window.confirm(
        'Restaurar substitui TODOS os dados atuais. Deseja continuar?'
      )
    ) {
      e.target.value = '';
      return;
    }

    try {
      // Lê o conteúdo do arquivo e converte o JSON em objeto.
      const json = JSON.parse(await file.text());

      // Importa o backup para o armazenamento local.
      await importBackup(json);

      // Atualiza os dados apresentados no sistema.
      await refresh();

      // Informa que a restauração foi concluída.
      setMessage('Backup restaurado.');
    } catch (err) {
      // Exibe o erro caso a restauração falhe.
      setMessage('Erro: ' + err.message);
    }

    // Permite selecionar novamente o mesmo arquivo.
    e.target.value = '';
  }

  return (
    <>
      {/* Cabeçalho da página de backup. */}
      <header className="page-header">
        <div>
          <h1>Backup</h1>
          <p>
            Proteja os dados armazenados neste dispositivo
          </p>
        </div>
      </header>

      {/* Seção para exportar os dados do sistema. */}
      <section className="panel">
        <h2>Exportar dados</h2>

        <p>
          Salve uma cópia JSON fora do navegador.
        </p>

        <button
          className="primary"
          onClick={download}
        >
          Baixar backup
        </button>
      </section>

      {/* Seção para restaurar os dados de um backup. */}
      <section className="panel">
        <h2>Restaurar dados</h2>

        <p>
          Atenção: a restauração substitui todos os cadastros atuais.
        </p>

        <input
          aria-label="Selecionar arquivo de backup"
          type="file"
          accept=".json,application/json"
          onChange={restore}
        />
      </section>

      {/* Exibe o resultado da operação para o usuário. */}
      {message && (
        <p role="status">
          {message}
        </p>
      )}
    </>
  );
}
