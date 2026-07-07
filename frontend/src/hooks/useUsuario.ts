export interface UsuarioLogado {
  id: number;

  nome: string;

  login: string;

  perfil:
    | "DESENVOLVEDOR"
    | "GERENCIAL"
    | "OPERADOR";

  ativo: boolean;
}

export default function useUsuario() {
  const usuario =
    sessionStorage.getItem(
      "visual_usuario"
    );

  if (!usuario) {
    return null;
  }

  return JSON.parse(
    usuario
  ) as UsuarioLogado;
}
