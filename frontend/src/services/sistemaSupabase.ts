import { supabase } from "./supabase";

export async function gerarBackup() {
  const { data: produtos, error: erroProdutos } =
    await supabase
      .from("produtos")
      .select("*");

  if (erroProdutos) throw erroProdutos;

  const {
    data: fornecedores,
    error: erroFornecedores,
  } = await supabase
    .from("fornecedores")
    .select("*");

  if (erroFornecedores)
    throw erroFornecedores;

  const { data: lixeira, error: erroLixeira } =
    await supabase
      .from("lixeira")
      .select("*");

  if (erroLixeira) throw erroLixeira;

  return {
    versao: "2.0.0",

    dataBackup:
      new Date().toISOString(),

    produtos,

    fornecedores,

    lixeira,
  };
}
export async function verificarBanco() {
  const { error } = await supabase
    .from("produtos")
    .select("codigo")
    .limit(1);

  return !error;
}
