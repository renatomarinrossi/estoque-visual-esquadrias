import { useAuth } from "../contexts/AuthContext";

export type { UsuarioLogado } from "../types/usuario";

export default function useUsuario() {
  return useAuth().usuario;
}

