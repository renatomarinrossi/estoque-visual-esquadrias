import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Produtos from "./pages/Produtos/Produtos";
import Entrada from "./pages/Entrada/Entrada";
import Saida from "./pages/Saida/Saida";
import Compras from "./pages/Compras/Compras";
import Fornecedores from "./pages/Fornecedores/Fornecedores";
import Lixeira from "./pages/Lixeira/Lixeira";
import Configuracoes from "./pages/Configuracoes/Configuracoes";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/produtos" element={<Produtos />} />
          <Route path="/entrada" element={<Entrada />} />
          <Route path="/saida" element={<Saida />} />
          <Route path="/compras" element={<Compras />} />
          <Route path="/fornecedores" element={<Fornecedores />} />
          <Route path="/lixeira" element={<Lixeira />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
