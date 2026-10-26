
import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useData } from '../context/DataContext';

import {
  LayoutDashboard,
  Users,
  Wrench,
  ClipboardList,
  Wallet,
  Menu,
  X,
  BriefcaseBusiness,
  DatabaseBackup,
  CalendarDays,
  FileText,
  Package,
  Table2,
  ChartNoAxesCombined,
  Bell
} from 'lucide-react';

const links = [
  ['/dashboard', 'Dashboard', LayoutDashboard],
  ['/clientes', 'Clientes', Users],
  ['/servicos', 'Serviços', Wrench],
  ['/ordens', 'Ordens de serviço', ClipboardList],
  ['/financeiro', 'Financeiro', Wallet],
  ['/orcamentos', 'Orçamentos', FileText],
  ['/agenda', 'Agenda', CalendarDays],
  ['/materiais', 'Materiais', Package],
  ['/planilhas', 'Planilhas', Table2],
  ['/relatorios', 'Relatórios', ChartNoAxesCombined],
  ['/lembretes', 'Lembretes', Bell],
  ['/backup', 'Backup', DatabaseBackup]
];

function normalizarStatus(status) {
  return String(status || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function dataLocalHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');

  return `${ano}-${mes}-${dia}`;
}

export default function Layout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const { ordens = [], agenda = [] } = useData();
  const hoje = dataLocalHoje();

  const ordensPendentes = ordens.filter(ordem => {
    const status = normalizarStatus(ordem.status);
    const data = String(ordem.data || '').slice(0, 10);

    return (
      data !== '' &&
      data <= hoje &&
      status !== 'concluida' &&
      status !== 'cancelada'
    );
  }).length;

  const compromissosPendentes = agenda.filter(compromisso => {
    const status = normalizarStatus(compromisso.status);
    const data = String(compromisso.data || '').slice(0, 10);

    return (
      data !== '' &&
      data <= hoje &&
      status === 'agendado'
    );
  }).length;

  const totalNotificacoes =
    ordensPendentes + compromissosPendentes;

  useEffect(() => {
    setOpen(false);
  }, [location]);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;

    if (
      totalNotificacoes > 0 &&
      typeof navigator.setAppBadge === 'function'
    ) {
      navigator.setAppBadge(totalNotificacoes).catch(() => {});
    } else if (
      totalNotificacoes === 0 &&
      typeof navigator.clearAppBadge === 'function'
    ) {
      navigator.clearAppBadge().catch(() => {});
    }
  }, [totalNotificacoes]);

  return (
    <div className="shell">
      <button
        className="mobile-menu"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <Menu size={23} />
      </button>

      <button
        type="button"
        className="notification-button"
        aria-label="Abrir lembretes"
        onClick={() => {
          window.location.hash = '#/lembretes';
        }}
      >
        <Bell size={22} />
        {totalNotificacoes > 0 && (
          <span className="notification-badge">
            {totalNotificacoes}
          </span>
        )}
      </button>

      {open && (
        <button
          className="overlay"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="brand">
          <BriefcaseBusiness />
          <span>Erick Eletricista</span>

          <button
            className="close"
            onClick={() => setOpen(!open)}
            aria-label="Fechar"
          >
            <X />
          </button>
        </div>

        <nav>
          {links.map(([path, label, Icon]) => {
            const quantidade =
              path === '/ordens'
                ? ordensPendentes
                : path === '/agenda'
                  ? compromissosPendentes
                  : path === '/lembretes'
                    ? totalNotificacoes
                    : 0;
            return (
              <NavLink
                key={path}
                to={path}
                end={path === '/dashboard'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <Icon size={19} />
                <span>{label}</span>

                {quantidade > 0 && (
                  <span className="notification-badge">
                    {quantidade > 99 ? '99+' : quantidade}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div className="side-footer">
          Dados locais • IndexedDB
        </div>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
