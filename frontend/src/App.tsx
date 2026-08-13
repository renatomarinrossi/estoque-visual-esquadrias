import { lazy, Suspense, useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./hooks/useAuth";
import MainLayout from "./layouts/MainLayout";
import Login from "./pages/Login/Login";

// As telas são baixadas somente quando o usuário as abre.
// Isso evita carregar relatórios e bibliotecas de PDF logo no primeiro acesso.
const Compras = lazy(() => import("./pages/Compras/Compras"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const ContasPagar = lazy(() => import("./pages/Financeiro/ContasPagar"));
const ContasReceber = lazy(() => import("./pages/Financeiro/ContasReceber"));
const DashboardFinanceiro = lazy(
  () => import("./pages/Financeiro/DashboardFinanceiro")
);
const Vendas = lazy(() => import("./pages/Financeiro/Vendas"));
const Fornecedores = lazy(() => import("./pages/Fornecedores/Fornecedores"));
const Entrada = lazy(() => import("./pages/Entrada/Entrada"));
const Lixeira = lazy(() => import("./pages/Lixeira/Lixeira"));
const EstoqueMobile = lazy(() => import("./pages/Mobile/EstoqueMobile"));
const Movimentacoes = lazy(
  () => import("./pages/Movimentacoes/Movimentacoes")
);
const Produtos = lazy(() => import("./pages/Produtos/Produtos"));
const Saida = lazy(() => import("./pages/Saida/Saida"));
const Sistema = lazy(() => import("./pages/Sistema/Sistema"));
const Usuarios = lazy(() => import("./pages/Usuarios/Usuarios"));

function TelaCarregando() {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-slate-600">
      Carregando...
    </div>
  );
}

function useModoMobile() {
  const consulta = "(max-width: 767px)";
  const [modoMobile, setModoMobile] = useState(() =>
    window.matchMedia(consulta).matches
  );

  useEffect(() => {
    const media = window.matchMedia(consulta);
    const atualizar = () => setModoMobile(media.matches);

    atualizar();
    media.addEventListener("change", atualizar);

    return () => media.removeEventListener("change", atualizar);
  }, []);

  return modoMobile;
}

function RotasDoSistema() {
  const { usuario, carregando } = useAuth();
  const modoMobile = useModoMobile();

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-700">
        Carregando...
      </div>
    );
  }

  if (!usuario) return <Login />;

  // O desenvolvedor conserva o sistema completo, mesmo quando acessa por celular.
  if (modoMobile && usuario.perfil !== "DESENVOLVEDOR") {
    return (
      <Suspense fallback={<TelaCarregando />}>
        <EstoqueMobile />
      </Suspense>
    );
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<TelaCarregando />}>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="produtos" element={<Produtos />} />
            <Route path="entrada" element={<Entrada />} />
            <Route path="saida" element={<Saida />} />
            <Route
              path="movimentacoes"
              element={
                <ProtectedRoute perfil="DESENVOLVEDOR">
                  <Movimentacoes />
                </ProtectedRoute>
              }
            />
            <Route path="compras" element={<Compras />} />
            <Route path="vendas" element={<Vendas />} />
            <Route path="contas-receber" element={<ContasReceber />} />
            <Route path="contas-pagar" element={<ContasPagar />} />
            <Route
              path="dashboard-financeiro"
              element={
                <ProtectedRoute perfis={["DESENVOLVEDOR", "GERENCIAL"]}>
                  <DashboardFinanceiro />
                </ProtectedRoute>
              }
            />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="lixeira" element={<Lixeira />} />
            <Route
              path="sistema"
              element={
                <ProtectedRoute perfil="DESENVOLVEDOR">
                  <Sistema />
                </ProtectedRoute>
              }
            />
            <Route
              path="usuarios"
              element={
                <ProtectedRoute perfil="DESENVOLVEDOR">
                  <Usuarios />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RotasDoSistema />
    </AuthProvider>
  );
}

