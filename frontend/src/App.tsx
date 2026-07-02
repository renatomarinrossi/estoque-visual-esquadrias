import { useEffect, useState } from "react";

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import MainLayout from "./layouts/MainLayout";

import Dashboard from "./pages/Dashboard/Dashboard";
import Produtos from "./pages/Produtos/Produtos";
import Entrada from "./pages/Entrada/Entrada";
import Saida from "./pages/Saida/Saida";
import Compras from "./pages/Compras/Compras";
import Lixeira from "./pages/Lixeira/Lixeira";
import Login from "./pages/Login/Login";
import Fornecedores from "./pages/Fornecedores/Fornecedores";

function App() {
  const [carregando, setCarregando] =
    useState(true);

  const [logado, setLogado] =
    useState(false);

  useEffect(() => {
    const sessaoLocal =
      sessionStorage.getItem(
        "visual_logado"
      );

    setLogado(
      sessaoLocal === "true"
    );

    setCarregando(false);
  }, []);

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando...
      </div>
    );
  }

  if (!logado) {
    return <Login />;
  }

  return (
    <BrowserRouter>
      <Routes>

        <Route
          path="/"
          element={<MainLayout />}
        >

          <Route
            index
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />

          <Route
            path="dashboard"
            element={<Dashboard />}
          />

          <Route
            path="produtos"
            element={<Produtos />}
          />

          <Route
            path="entrada"
            element={<Entrada />}
          />

          <Route
            path="saida"
            element={<Saida />}
          />

          <Route
            path="compras"
            element={<Compras />}
          />

          <Route
            path="fornecedores"
            element={<Fornecedores />}
          />

          <Route
            path="lixeira"
            element={<Lixeira />}
          />

        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
