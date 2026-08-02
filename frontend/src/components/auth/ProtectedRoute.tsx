import { Navigate } from "react-router-dom";

import useUsuario from "../../hooks/useUsuario";

type Perfil = "DESENVOLVEDOR" | "GERENCIAL" | "OPERADOR";

interface Props {
  children: React.ReactNode;
  perfil?: Perfil;
  perfis?: Perfil[];
}

export default function ProtectedRoute({
  children,
  perfil,
  perfis,
}: Props) {
  const usuario = useUsuario();
  const perfisPermitidos = perfis ?? (perfil ? [perfil] : []);

  if (!usuario) {
    return <Navigate to="/" replace />;
  }

  if (
    perfisPermitidos.length > 0 &&
    !perfisPermitidos.includes(usuario.perfil)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

