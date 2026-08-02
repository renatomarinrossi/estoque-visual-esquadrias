import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import MainLayout from "./layouts/MainLayout";
import Compras from "./pages/Compras/Compras";
import Dashboard from "./pages/Dashboard/Dashboard";
import ContasPagar from "./pages/Financeiro/ContasPagar";
import ContasReceber from "./pages/Financeiro/ContasReceber";
import DashboardFinanceiro from "./pages/Financeiro/DashboardFinanceiro";
import Vendas from "./pages/Financeiro/Vendas";
import Fornecedores from "./pages/Fornecedores/Fornecedores";
import Entrada from "./pages/Entrada/Entrada";
import Lixeira from "./pages/Lixeira/Lixeira";
import Login from "./pages/Login/Login";
import Movimentacoes from "./pages/Movimentacoes/Movimentacoes";
import Produtos from "./pages/Produtos/Produtos";
import Saida from "./pages/Saida/Saida";
import Sistema from "./pages/Sistema/Sistema";
import Usuarios from "./pages/Usuarios/Usuarios";

function RotasDoSistema() {
  const { usuario, carregando } = useAuth();

  if (carregando) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!usuario) return <Login />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="produtos" element={<Produtos />} />
          <Route path="entrada" element={<Entrada />} />
          <Route path="saida" element={<Saida />} />
          <Route path="movimentacoes" element={<ProtectedRoute perfil="DESENVOLVEDOR"><Movimentacoes /></ProtectedRoute>} />
          <Route path="compras" element={<Compras />} />
          <Route path="vendas" element={<Vendas />} />
          <Route path="contas-receber" element={<ContasReceber />} />
          <Route path="contas-pagar" element={<ContasPagar />} />
          <Route path="dashboard-financeiro" element={<ProtectedRoute perfis={["DESENVOLVEDOR", "GERENCIAL"]}><DashboardFinanceiro /></ProtectedRoute>} />
          <Route path="fornecedores" element={<Fornecedores />} />
          <Route path="lixeira" element={<Lixeira />} />
          <Route path="sistema" element={<ProtectedRoute perfil="DESENVOLVEDOR"><Sistema /></ProtectedRoute>} />
          <Route path="usuarios" element={<ProtectedRoute perfil="DESENVOLVEDOR"><Usuarios /></ProtectedRoute>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default function App() {
  return <AuthProvider><RotasDoSistema /></AuthProvider>;
}

