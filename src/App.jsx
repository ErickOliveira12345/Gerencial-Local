
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { DataProvider } from "./context/DataContext";
import Layout from "./components/Layout";

import Dashboard from "./pages/Dashboard";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";
import Ordens from "./pages/Ordens";
import Financeiro from "./pages/Financeiro";
import Backup from "./pages/Backup";

import OrcamentosPage from "./modules/orcamentos/Page";
import AgendaPage from "./modules/agenda/Page";
import MateriaisPage from "./modules/materiais/Page";
import PlanilhasPage from "./modules/planilhas/Page";
import RelatoriosPage from "./modules/relatorios/Page";
import LembretesPage from "./modules/lembretes/Page";

export default function App() {
  return (
    <DataProvider>
      <Routes>
        <Route element={<Layout />}>

          {/* Página inicial */}
          <Route
            index
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Dashboard */}
          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          {/* Clientes */}
          <Route
            path="clientes"
            element={<Clientes />}
          />

          {/* Serviços */}
          <Route
            path="servicos"
            element={<Servicos />}
          />

          {/* Ordens de serviço */}
          <Route
            path="ordens"
            element={<Ordens />}
          />

          {/* Financeiro */}
          <Route
            path="financeiro"
            element={<Financeiro />}
          />

          {/* Orçamentos */}
          <Route
            path="orcamentos"
            element={<OrcamentosPage />}
          />

          {/* Agenda */}
          <Route
            path="agenda"
            element={<AgendaPage />}
          />

          {/* Materiais */}
          <Route
            path="materiais"
            element={<MateriaisPage />}
          />

          {/* Planilhas */}
          <Route
            path="planilhas"
            element={<PlanilhasPage />}
          />

          {/* Relatórios */}
          <Route
            path="relatorios"
            element={<RelatoriosPage />}
          />

          {/* Lembretes */}
          <Route
            path="lembretes"
            element={<LembretesPage />}
          />

          {/* Backup */}
          <Route
            path="backup"
            element={<Backup />}
          />

          {/* Redirecionamento para o Dashboard */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

        </Route>
      </Routes>
    </DataProvider>
  );
}

