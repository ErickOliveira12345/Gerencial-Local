

import React, { useEffect, useRef, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  MapPin,
  Camera,
  X,
  Save,
  Navigation,
  CalendarDays,
  UserRound,
  Image as ImageIcon,
  LoaderCircle
} from 'lucide-react';

import { useData } from '../context/DataContext';

import ConfirmDialog from '../components/ConfirmDialog';

import {
  save,
  remove,
  photosByServiceId,
  deletePhotosByServiceId
} from '../db/indexedDB';

const LISTA_VAZIA = [];

function hoje() {
  const data = new Date();
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

function formatarData(data) {
  if (!data) return 'Não informada';

  const [ano, mes, dia] = data.split('-');

  if (!ano || !mes || !dia) return data;

  return `${dia}/${mes}/${ano}`;
}

function nomeCliente(cliente) {
  return (
    cliente?.nome ||
    cliente?.razaoSocial ||
    cliente?.name ||
    'Cliente sem nome'
  );
}

function enderecoCliente(cliente) {
  if (!cliente) return '';

  if (cliente.enderecoCompleto) {
    return cliente.enderecoCompleto;
  }

  return [
    cliente.endereco,
    cliente.numero,
    cliente.complemento,
    cliente.bairro,
    cliente.cidade,
    cliente.estado
  ]
    .filter(Boolean)
    .join(', ');
}

const formularioInicial = {
  clienteId: '',
  dataCadastro: hoje(),
  endereco: '',
  descricao: '',
  latitude: '',
  longitude: ''
};

export default function ServicosExecutados() {
  const dados = useData();

  const clientes = dados.clientes || LISTA_VAZIA;
  const servicosExecutados = dados.servicosExecutados || LISTA_VAZIA;

  const {
    put,
    del,
    refresh,
    loading
  } = dados;

  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formulario, setFormulario] = useState(formularioInicial);

  const [formFotos, setFormFotos] = useState([]);
  const [fotosPorServico, setFotosPorServico] = useState({});

  const [capturandoLocalizacao, setCapturandoLocalizacao] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [confirmacao, setConfirmacao] = useState(null);

  const inputFotosRef = useRef(null);
  const urlsRef = useRef(new Set());

  // Remove a mensagem de sucesso automaticamente após 3 segundos.
  useEffect(() => {
    if (!mensagem) return;

    const temporizador = setTimeout(() => {
      setMensagem('');
    }, 3000);

    return () => clearTimeout(temporizador);
  }, [mensagem]);

  // Cria uma URL temporária para exibir uma imagem.
  function criarUrl(blob) {
    const url = URL.createObjectURL(blob);
    urlsRef.current.add(url);
    return url;
  }

  // Libera uma URL temporária.
  function liberarUrl(url) {
    if (!url) return;

    URL.revokeObjectURL(url);
    urlsRef.current.delete(url);
  }

  // Libera todas as URLs quando a página é desmontada.
  useEffect(() => {
    return () => {
      urlsRef.current.forEach(url => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    };
  }, []);

  // Carrega as fotos separadamente dos registros principais.
  useEffect(() => {
    let ativo = true;

    async function carregarFotos() {
      try {
        const resultado = await Promise.all(
          servicosExecutados.map(async servico => {
            const fotos = await photosByServiceId(servico.id);

            return [servico.id, fotos];
          })
        );

        if (!ativo) return;

        const novoMapa = {};

        resultado.forEach(([servicoId, fotos]) => {
          novoMapa[servicoId] = fotos.map(foto => ({
            ...foto,
            url: criarUrl(foto.blob),
            persistida: true
          }));
        });

        setFotosPorServico(novoMapa);
      } catch (e) {
        if (ativo) {
          setErro('Não foi possível carregar as fotos: ' + e.message);
        }
      }
    }

    carregarFotos();

    return () => {
      ativo = false;
    };
  }, [servicosExecutados]);

  function atualizarCampo(campo, valor) {
    setFormulario(atual => ({
      ...atual,
      [campo]: valor
    }));
  }

  function abrirNovo() {
    setEditandoId(null);

    setFormulario({
      ...formularioInicial,
      dataCadastro: hoje()
    });

    setFormFotos([]);
    setErro('');
    setMensagem('');
    setMostrarFormulario(true);
  }

  async function abrirEdicao(servico) {
    try {
      setErro('');
      setMensagem('');

      let fotos = fotosPorServico[servico.id];

      if (!fotos) {
        const registros = await photosByServiceId(servico.id);

        fotos = registros.map(foto => ({
          ...foto,
          url: criarUrl(foto.blob),
          persistida: true
        }));
      }

      setEditandoId(servico.id);

      setFormulario({
        clienteId: servico.clienteId || '',
        dataCadastro: servico.dataCadastro || hoje(),
        endereco: servico.endereco || '',
        descricao: servico.descricao || '',
        latitude: servico.latitude ?? '',
        longitude: servico.longitude ?? ''
      });

      setFormFotos(fotos || []);
      setMostrarFormulario(true);
    } catch (e) {
      setErro('Não foi possível abrir o registro: ' + e.message);
    }
  }

  function fecharFormulario() {
    formFotos.forEach(foto => {
      if (!foto.persistida) {
        liberarUrl(foto.url);
      }
    });

    setMostrarFormulario(false);
    setEditandoId(null);

    setFormulario({
      ...formularioInicial,
      dataCadastro: hoje()
    });

    setFormFotos([]);
    setErro('');
  }

  function selecionarCliente(clienteId) {
    const cliente = clientes.find(
      item => String(item.id) === String(clienteId)
    );

    setFormulario(atual => ({
      ...atual,
      clienteId,
      endereco: enderecoCliente(cliente) || atual.endereco
    }));
  }

  function adicionarFotos(event) {
    const arquivos = Array.from(event.target.files || []);

    const imagensValidas = arquivos.filter(arquivo =>
      arquivo.type.startsWith('image/')
    );

    if (imagensValidas.length !== arquivos.length) {
      setErro('Selecione somente arquivos de imagem.');
    } else {
      setErro('');
    }

    const novasFotos = imagensValidas.map(arquivo => ({
      id: crypto.randomUUID(),
      blob: arquivo,
      nome: arquivo.name,
      tipo: arquivo.type,
      tamanho: arquivo.size,
      url: criarUrl(arquivo),
      persistida: false
    }));

    setFormFotos(atual => [...atual, ...novasFotos]);

    if (inputFotosRef.current) {
      inputFotosRef.current.value = '';
    }
  }

  function removerFoto(fotoId) {
    const foto = formFotos.find(item => item.id === fotoId);

    if (foto && !foto.persistida) {
      liberarUrl(foto.url);
    }

    setFormFotos(atual =>
      atual.filter(item => item.id !== fotoId)
    );
  }

  function capturarLocalizacao() {
    setErro('');

    if (!navigator.geolocation) {
      setErro('Este dispositivo não oferece suporte à geolocalização.');
      return;
    }

    setCapturandoLocalizacao(true);

    navigator.geolocation.getCurrentPosition(
      position => {
        setFormulario(atual => ({
          ...atual,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }));

        setCapturandoLocalizacao(false);
        setMensagem('Localização capturada com sucesso.');
      },
      error => {
        let texto = 'Não foi possível obter a localização.';

        if (error.code === error.PERMISSION_DENIED) {
          texto = 'Permita o acesso à localização nas configurações do navegador.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          texto = 'A localização não está disponível no momento.';
        } else if (error.code === error.TIMEOUT) {
          texto = 'Tempo esgotado ao tentar capturar a localização.';
        }

        setErro(texto);
        setCapturandoLocalizacao(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  }

  async function salvarServico(event) {
    event.preventDefault();

    setErro('');
    setMensagem('');

    if (!formulario.clienteId) {
      setErro('Selecione um cliente.');
      return;
    }

    if (!formulario.descricao.trim()) {
      setErro('Informe a descrição do serviço executado.');
      return;
    }

    setSalvando(true);

    try {
      const cliente = clientes.find(
        item => String(item.id) === String(formulario.clienteId)
      );

      const id = editandoId || crypto.randomUUID();

      const registroAnterior = servicosExecutados.find(
        item => String(item.id) === String(id)
      );

      const registro = {
        id,
        clienteId: formulario.clienteId,
        clienteNome: nomeCliente(cliente),
        dataCadastro: formulario.dataCadastro,
        endereco: formulario.endereco.trim(),
        descricao: formulario.descricao.trim(),

        latitude: formulario.latitude === ''
          ? null
          : Number(formulario.latitude),

        longitude: formulario.longitude === ''
          ? null
          : Number(formulario.longitude),

        atualizadoEm: new Date().toISOString(),

        criadoEm: registroAnterior?.criadoEm || new Date().toISOString()
      };

      // Salva o registro principal.
      await put('servicosExecutados', registro);

      // Consulta as fotos já salvas para este serviço.
      const fotosAntigas = await photosByServiceId(id);

      const fotosMantidas = formFotos
        .filter(foto => foto.persistida)
        .map(foto => foto.id);

      // Remove as fotos retiradas durante a edição.
      for (const foto of fotosAntigas) {
        if (!fotosMantidas.includes(foto.id)) {
          await remove('fotosServicosExecutados', foto.id);
        }
      }

      // Salva somente as fotos novas.
      for (const foto of formFotos) {
        if (!foto.persistida) {
          await save('fotosServicosExecutados', {
            id: foto.id,
            servicoExecutadoId: id,
            blob: foto.blob,
            nome: foto.nome,
            tipo: foto.tipo,
            tamanho: foto.tamanho,
            criadoEm: new Date().toISOString()
          });
        }
      }

      // Atualiza os registros exibidos.
      if (refresh) {
        await refresh();
      }

      setMensagem('Serviço executado salvo com sucesso.');
      fecharFormulario();
    } catch (e) {
      setErro('Não foi possível salvar o serviço: ' + e.message);
    } finally {
      setSalvando(false);
    }
  }

  function excluirServico(servico) {
    setConfirmacao(servico);
  }

  async function confirmarExclusao() {
    if (!confirmacao) return;

    const servico = confirmacao;

    try {
      await deletePhotosByServiceId(servico.id);
      await del('servicosExecutados', servico.id);

      setConfirmacao(null);
      setMensagem('Serviço executado excluído.');
      setErro('');
    } catch (e) {
      setConfirmacao(null);
      setErro('Não foi possível excluir o serviço: ' + e.message);
    }
  }

  function abrirMapa(servico) {
    if (
      servico.latitude == null ||
      servico.longitude == null
    ) {
      return;
    }

    const url = `https://www.google.com/maps?q=${servico.latitude},${servico.longitude}`;

    window.open(url, '_blank', 'noopener,noreferrer');
  }

  const listaOrdenada = [...servicosExecutados].sort((a, b) =>
    (b.dataCadastro || '').localeCompare(a.dataCadastro || '')
  );

  return (
    <>
      <header className="page-header">
        <div>
          <h1>Serviços Executados</h1>
          <p>
            Registre os serviços realizados, fotos e localização.
          </p>
        </div>

        <button
          type="button"
          className="primary"
          onClick={abrirNovo}
        >
          + Novo registro
        </button>
      </header>

      {mensagem && (
        <p className="executed-message" role="status">
          {mensagem}
        </p>
      )}

      {erro && (
        <p className="error" role="alert">
          {erro}
        </p>
      )}

      {mostrarFormulario && (
        <section className="panel">
          <h2>
            {editandoId ? 'Editar' : 'Cadastrar'} serviço executado
          </h2>

          <form className="entry-form" onSubmit={salvarServico}>
            <div className="executed-form-grid">
              <label>
                Cliente

                <select
                  value={formulario.clienteId}
                  onChange={event =>
                    selecionarCliente(event.target.value)
                  }
                  required
                >
                  <option value="">Selecione um cliente</option>

                  {clientes
                    .slice()
                    .sort((a, b) =>
                      nomeCliente(a).localeCompare(
                        nomeCliente(b),
                        'pt-BR',
                        { sensitivity: 'base' }
                      )
                    )
                    .map(cliente => (
                      <option key={cliente.id} value={cliente.id}>
                        {nomeCliente(cliente)}
                      </option>
                    ))}
                </select>
              </label>

              <label>
                Data do cadastro

                <input
                  type="date"
                  value={formulario.dataCadastro}
                  onChange={event =>
                    atualizarCampo('dataCadastro', event.target.value)
                  }
                  required
                />
              </label>

              <label className="executed-full-width">
                Endereço onde o serviço foi executado

                <input
                  type="text"
                  value={formulario.endereco}
                  onChange={event =>
                    atualizarCampo('endereco', event.target.value)
                  }
                  placeholder="Rua, número, bairro, cidade..."
                />
              </label>

              <label className="executed-full-width">
                Descrição do serviço

                <textarea
                  value={formulario.descricao}
                  onChange={event =>
                    atualizarCampo('descricao', event.target.value)
                  }
                  placeholder="Descreva o serviço realizado..."
                  rows={4}
                  required
                />
              </label>
            </div>

            <div className="executed-section">
              <div className="executed-section-heading">
                <div>
                  <h3>
                    <Camera size={18} />
                    Fotos do serviço
                  </h3>

                  <p>
                    Adicione uma ou mais imagens do trabalho realizado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => inputFotosRef.current?.click()}
                >
                  <Plus size={17} />
                  Adicionar fotos
                </button>
              </div>

              <input
                ref={inputFotosRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={adicionarFotos}
              />

              {formFotos.length > 0 ? (
                <div className="executed-photo-grid">
                  {formFotos.map(foto => (
                    <div className="executed-photo-item" key={foto.id}>
                      <img src={foto.url} alt={foto.nome} />

                      <button
                        type="button"
                        onClick={() => removerFoto(foto.id)}
                        aria-label={`Remover ${foto.nome}`}
                      >
                        <X size={16} />
                      </button>

                      <span title={foto.nome}>{foto.nome}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="executed-no-photos">
                  <ImageIcon size={25} />
                  <span>Nenhuma foto adicionada.</span>
                </div>
              )}
            </div>

            <div className="executed-section">
              <div className="executed-section-heading">
                <div>
                  <h3>
                    <MapPin size={18} />
                    Localização
                  </h3>

                  <p>
                    Capture as coordenadas do local onde o serviço foi realizado.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={capturarLocalizacao}
                  disabled={capturandoLocalizacao}
                >
                  {capturandoLocalizacao ? (
                    <LoaderCircle
                      size={17}
                      className="executed-spin"
                    />
                  ) : (
                    <Navigation size={17} />
                  )}

                  {capturandoLocalizacao
                    ? 'Capturando...'
                    : 'Capturar localização'}
                </button>
              </div>

              <div className="executed-coordinates">
                <label>
                  Latitude

                  <input
                    type="number"
                    step="any"
                    value={formulario.latitude}
                    onChange={event =>
                      atualizarCampo('latitude', event.target.value)
                    }
                    placeholder="Latitude"
                  />
                </label>

                <label>
                  Longitude

                  <input
                    type="number"
                    step="any"
                    value={formulario.longitude}
                    onChange={event =>
                      atualizarCampo('longitude', event.target.value)
                    }
                    placeholder="Longitude"
                  />
                </label>
              </div>
            </div>

            <div className="actions">
              <button
                type="submit"
                className="primary"
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>

              <button
                type="button"
                onClick={fecharFormulario}
                disabled={salvando}
              >
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel">
        {loading ? (
          <div className="executed-empty">
            <LoaderCircle size={25} className="executed-spin" />
            <p>Carregando registros...</p>
          </div>
        ) : listaOrdenada.length === 0 ? (
          <div className="executed-empty">
            <div className="executed-empty-icon">
              <ImageIcon size={30} />
            </div>

            <h2>Nenhum serviço executado</h2>

            <p>
              Clique em "+ Novo registro" para cadastrar o primeiro.
            </p>
          </div>
        ) : (
          <div className="executed-card-grid">
            {listaOrdenada.map(servico => {
              const fotos = fotosPorServico[servico.id] || [];

              return (
                <article
                  className="executed-card"
                  key={servico.id}
                >
                  <div className="executed-card-header">
                    <div className="executed-client">
                      <div className="executed-client-icon">
                        <UserRound size={20} />
                      </div>

                      <div>
                        <h2>
                          {servico.clienteNome || 'Cliente sem nome'}
                        </h2>

                        <span>
                          <CalendarDays size={14} />
                          {formatarData(servico.dataCadastro)}
                        </span>
                      </div>
                    </div>

                    <div className="executed-card-actions">
                      <button
                        type="button"
                        onClick={() => abrirEdicao(servico)}
                        aria-label="Editar serviço"
                        title="Editar"
                      >
                        <Pencil size={17} />
                      </button>

                      <button
                        type="button"
                        onClick={() => excluirServico(servico)}
                        aria-label="Excluir serviço"
                        title="Excluir"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>

                  {servico.endereco && (
                    <div className="executed-card-address">
                      <MapPin size={16} />
                      <span>{servico.endereco}</span>
                    </div>
                  )}

                  <div className="executed-card-description">
                    <h3>Serviço realizado:</h3>
                    <p>{servico.descricao}</p>
                  </div>

                  {fotos.length > 0 && (
                    <div className="executed-card-photos">
                      {fotos.map(foto => (
                        <img
                          key={foto.id}
                          src={foto.url}
                          alt={foto.nome || 'Foto do serviço'}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}

                  <div className="executed-card-footer">
                    <span>
                      <Camera size={15} />
                      {fotos.length}{' '}
                      {fotos.length === 1 ? 'foto' : 'fotos'}
                    </span>

                    {servico.latitude != null &&
                      servico.longitude != null && (
                        <button
                          type="button"
                          onClick={() => abrirMapa(servico)}
                        >
                          <MapPin size={15} />
                          Ver localização
                        </button>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <ConfirmDialog
        open={Boolean(confirmacao)}
        title="Confirmar exclusão"
        message={
          confirmacao?.clienteNome
            ? `Deseja realmente excluir o serviço executado de "${confirmacao.clienteNome}"? As fotos também serão excluídas.`
            : 'Deseja realmente excluir este serviço executado? As fotos também serão excluídas.'
        }
        confirmText="Excluir"
        cancelText="Cancelar"
        danger
        onConfirm={confirmarExclusao}
        onCancel={() => setConfirmacao(null)}
      />
    </>
  );
}
