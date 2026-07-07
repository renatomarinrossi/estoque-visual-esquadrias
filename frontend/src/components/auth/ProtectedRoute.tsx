import { Navigate } from "react-router-dom";

import useUsuario from "../../hooks/useUsuario";

interface Props {
  children: React.ReactNode;

  perfil:
    | "DESENVOLVEDOR"
    | "GERENCIAL"
    | "OPERADOR";
}

export default function ProtectedRoute({
  children,
  perfil,
}: Props) {
  const usuario =
    useUsuario();

  if (!usuario) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  if (
    usuario.perfil !==
    perfil
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return <>{children}</>;
}
