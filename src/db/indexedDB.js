
const NAME = 'gerencial-local';
const VERSION = 5;

export const STORES = [
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
  'servicosExecutados',
  'fotosServicosExecutados'
];

// Abre o banco e cria apenas as tabelas que ainda não existem.
export function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(NAME, VERSION);

    req.onupgradeneeded = () => {
      const database = req.result;

      for (const name of STORES) {
        if (!database.objectStoreNames.contains(name)) {
          const store = database.createObjectStore(name, {
            keyPath: 'id'
          });

          if (name === 'fotosServicosExecutados') {
            store.createIndex(
              'servicoExecutadoId',
              'servicoExecutadoId',
              { unique: false }
            );
          }
        }
      }

      // Garante o índice caso a tabela já exista.
      if (database.objectStoreNames.contains('fotosServicosExecutados')) {
        const store = req.transaction.objectStore(
          'fotosServicosExecutados'
        );

        if (!store.indexNames.contains('servicoExecutadoId')) {
          store.createIndex(
            'servicoExecutadoId',
            'servicoExecutadoId',
            { unique: false }
          );
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// Busca todos os registros de uma tabela.
export async function all(store) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readonly');
    const req = tx.objectStore(store).getAll();

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => database.close();
    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };
  });
}

// Salva ou atualiza um registro.
export async function save(store, item) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');

    tx.objectStore(store).put(item);

    tx.oncomplete = () => {
      database.close();
      resolve();
    };

    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      database.close();
      reject(tx.error || new Error('Operação cancelada.'));
    };
  });
}

// Remove um registro pelo ID.
export async function remove(store, id) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(store, 'readwrite');

    tx.objectStore(store).delete(id);

    tx.oncomplete = () => {
      database.close();
      resolve();
    };

    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      database.close();
      reject(tx.error || new Error('Operação cancelada.'));
    };
  });
}

// Busca somente as fotos vinculadas a um serviço executado.
export async function photosByServiceId(serviceId) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(
      'fotosServicosExecutados',
      'readonly'
    );

    const index = tx
      .objectStore('fotosServicosExecutados')
      .index('servicoExecutadoId');

    const req = index.getAll(serviceId);

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);

    tx.oncomplete = () => database.close();
    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };
  });
}

// Remove todas as fotos vinculadas a um serviço executado.
export async function deletePhotosByServiceId(serviceId) {
  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(
      'fotosServicosExecutados',
      'readwrite'
    );

    const store = tx.objectStore('fotosServicosExecutados');
    const index = store.index('servicoExecutadoId');
    const req = index.getAllKeys(serviceId);

    req.onsuccess = () => {
      for (const id of req.result) {
        store.delete(id);
      }
    };

    req.onerror = () => {
      database.close();
      reject(req.error);
    };

    tx.oncomplete = () => {
      database.close();
      resolve();
    };

    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      database.close();
      reject(tx.error || new Error('Remoção cancelada.'));
    };
  });
}

// Converte uma imagem Blob para Data URL para permitir o backup JSON.
function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    if (!(blob instanceof Blob)) {
      resolve(null);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(blob);
  });
}

// Converte a Data URL do backup novamente para Blob.
function dataURLToBlob(dataURL) {
  const [metadata, content] = dataURL.split(',');

  if (!metadata || !content) {
    throw new Error('Imagem inválida no arquivo de backup.');
  }

  const mime = metadata.match(/data:(.*?);base64/)?.[1]
    || 'application/octet-stream';

  const binary = atob(content);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: mime });
}

// Exporta todas as tabelas, incluindo as fotos.
export async function exportBackup() {
  const data = {
    version: VERSION,
    exportadoEm: new Date().toISOString(),
    stores: {}
  };

  for (const store of STORES) {
    const records = await all(store);

    if (store === 'fotosServicosExecutados') {
      data.stores[store] = await Promise.all(
        records.map(async photo => ({
          ...photo,
          blobData: await blobToDataURL(photo.blob),
          blob: undefined
        }))
      );
    } else {
      data.stores[store] = records;
    }
  }

  return data;
}

// Importa backups antigos e novos.
export async function importBackup(data) {
  let incoming;

  // Compatibilidade com o formato antigo da versão HTML.
  if (data?.app === 'gerencial-local' && data?.dados) {
    incoming = {
      ...data.dados,
      lancamentos: (data.dados.financeiro || []).map(item => ({
        ...item,
        origemLegacy: true
      }))
    };
  } else if (
    data?.stores &&
    typeof data.stores === 'object'
  ) {
    incoming = data.stores;
  } else {
    throw new Error('Formato de backup desconhecido.');
  }

  // Mantém a validação das tabelas essenciais do sistema.
  if (
    !['clientes', 'servicos', 'ordens', 'lancamentos']
      .every(store => Array.isArray(incoming[store]))
  ) {
    throw new Error('Backup incompleto ou inválido.');
  }

  // Tabelas ausentes em backups antigos começam vazias.
  const valid = Object.fromEntries(
    STORES.map(store => [
      store,
      Array.isArray(incoming[store])
        ? incoming[store]
        : []
    ])
  );

  // Reconstrói os Blobs das fotos.
  valid.fotosServicosExecutados = valid.fotosServicosExecutados.map(
    photo => {
      const restored = { ...photo };

      if (
        typeof restored.blobData === 'string' &&
        restored.blobData.startsWith('data:')
      ) {
        restored.blob = dataURLToBlob(restored.blobData);
      }

      delete restored.blobData;

      return restored;
    }
  );

  // Confere os IDs antes de substituir os dados atuais.
  for (const store of STORES) {
    for (const row of valid[store]) {
      if (!row || typeof row.id !== 'string') {
        throw new Error(
          `Registro inválido encontrado na tabela ${store}.`
        );
      }
    }
  }

  const database = await openDB();

  return new Promise((resolve, reject) => {
    const tx = database.transaction(STORES, 'readwrite');

    for (const store of STORES) {
      const objectStore = tx.objectStore(store);

      objectStore.clear();

      for (const row of valid[store]) {
        objectStore.put(row);
      }
    }

    tx.oncomplete = () => {
      database.close();
      resolve();
    };

    tx.onerror = () => {
      database.close();
      reject(tx.error);
    };

    tx.onabort = () => {
      database.close();
      reject(tx.error || new Error('Importação cancelada.'));
    };
  });
}
