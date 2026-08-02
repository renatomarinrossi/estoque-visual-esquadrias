export type PerfilUsuario = "DESENVOLVEDOR" | "GERENCIAL" | "OPERADOR";

export type Usuario = {
  id?: number;
  auth_user_id?: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  senha?: string;
};

export type UsuarioLogado = Omit<Usuario, "senha"> & {
  id: number;
  auth_user_id: string;
};

