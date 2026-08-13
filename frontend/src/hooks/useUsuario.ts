import { useAuth } from "./useAuth";

export type { UsuarioLogado } from "../types/usuario";

export default function useUsuario() {
  return useAuth().usuario;
}

