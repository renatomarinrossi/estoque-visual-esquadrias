export type Usuario = {
  id?: number;

  nome: string;

  login: string;

  senha: string;

  perfil:
    | "DESENVOLVEDOR"
    | "GERENCIAL"
    | "OPERADOR";

  ativo: boolean;
};
