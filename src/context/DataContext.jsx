
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
  'lixeira',
  'servicosExecutados'
];

export function DataProvider({ children }) {
  // Armazena os dados de todos os módulos do sistema.
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
      const values = await Promise.all(
        names.map(name => db.all(name))
      );

      const updatedData = Object.fromEntries(
        names.map((name, index) => [
          name,
          values[index]
        ])
      );

      setData(updatedData);
      setError('');
    } catch (e) {
      setError(
        'Não foi possível acessar o armazenamento local: ' +
        e.message
      );
    } finally {
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
      id: item.id || crypto.randomUUID()
    });

    await refresh();
  }

  // Exclui um registro e atualiza os dados do contexto.
  async function del(name, id) {
    await db.remove(name, id);
    await refresh();
  }

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
