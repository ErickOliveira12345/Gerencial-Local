
import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

import * as db from '../db/indexedDB';

// Contexto global para compartilhar os dados entre os módulos.
const Context = createContext(null);

// Lista das tabelas utilizadas pelo sistema.
const names = [
  'clientes',
  'servicos',
  'ordens',
  'lancamentos',
  'orcamentos',
  'agenda',
  'materiais',
  'movimentosEstoque',
  'planilhas',
  'lixeira'
];

export function DataProvider({ children }) {
  // Armazena os dados de todos os módulos do sistema.
  // Todas as tabelas começam com arrays vazios.
  const [data, setData] = useState(() =>
    Object.fromEntries(
      names.map(name => [name, []])
    )
  );

  // Indica se os dados ainda estão sendo carregados.
  const [loading, setLoading] = useState(true);

  // Armazena mensagens de erro relacionadas ao armazenamento.
  const [error, setError] = useState('');

  // Carrega todos os registros do IndexedDB.
  async function refresh() {
    try {
      // Busca os registros de todas as tabelas em paralelo.
      const values = await Promise.all(
        names.map(name => db.all(name))
      );

      // Organiza os resultados em um objeto por nome de tabela.
      const updatedData = Object.fromEntries(
        names.map((name, index) => [
          name,
          values[index]
        ])
      );

      setData(updatedData);
      setError('');
    } catch (e) {
      // Informa se não for possível acessar o armazenamento local.
      setError(
        'Não foi possível acessar o armazenamento local: ' +
        e.message
      );
    } finally {
      // Finaliza o estado de carregamento, mesmo se ocorrer um erro.
      setLoading(false);
    }
  }

  // Carrega os dados quando o componente é montado.
  useEffect(() => {
    refresh();
  }, []);

  // Salva um registro e atualiza os dados do contexto.
  async function put(name, item) {
    await db.save(name, {
      ...item,
      // Gera um identificador caso o registro ainda não tenha um.
      id: item.id || crypto.randomUUID()
    });

    // Atualiza os dados após salvar.
    await refresh();
  }

  // Exclui um registro e atualiza os dados do contexto.
  async function del(name, id) {
    await db.remove(name, id);

    // Atualiza os dados após excluir.
    await refresh();
  }

  // Disponibiliza os dados e as funções para os componentes filhos.
  return (
    <Context.Provider
      value={{
        ...data,
        loading,
        error,
        put,
        del,
        refresh
      }}
    >
      {children}
    </Context.Provider>
  );
}

// Hook para acessar os dados e as funções do contexto.
export const useData = () => useContext(Context);
