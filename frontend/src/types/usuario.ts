export type PerfilUsuario = "DESENVOLVEDOR" | "GERENCIAL" | "OPERADOR";

export type Usuario = {
  id?: number;
  auth_user_id?: string;
  nome: string;
  login: string;
  perfil: PerfilUsuario;
  ativo: boolean;
  senha?: string;
  email_autenticacao?: string;
};

export type UsuarioLogado = Omit<Usuario, "senha" | "email_autenticacao"> & {
  id: number;
  auth_user_id: string;
};

