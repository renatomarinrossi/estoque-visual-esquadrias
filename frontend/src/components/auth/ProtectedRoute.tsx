import { Navigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

type Perfil = "DESENVOLVEDOR" | "GERENCIAL" | "OPERADOR";

interface Props {
  children: React.ReactNode;
  perfil?: Perfil;
  perfis?: Perfil[];
}

export default function ProtectedRoute({ children, perfil, perfis }: Props) {
  const { usuario, carregando } = useAuth();
  const perfisPermitidos = perfis ?? (perfil ? [perfil] : []);

  if (carregando) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!usuario) return <Navigate to="/" replace />;

  if (perfisPermitidos.length > 0 && !perfisPermitidos.includes(usuario.perfil)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

