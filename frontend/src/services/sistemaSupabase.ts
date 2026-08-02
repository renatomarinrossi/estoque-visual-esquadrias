import { supabase } from "./supabase";

async function buscarTabela(nomeTabela: string) {
  const { data, error } = await supabase.from(nomeTabela).select("*");

  if (error) {
    console.error(error);
    throw new Error(`Não foi possível incluir a tabela ${nomeTabela} no backup.`);
  }

  return data ?? [];
}

export async function gerarBackup() {
  const [
    fornecedores,
    produtos,
    lixeira,
    usuarios,
    vendas,
    vendasParcelas,
    vendasRecebimentos,
    contasPagar,
  ] = await Promise.all([
    buscarTabela("fornecedores"),
    buscarTabela("produtos"),
    buscarTabela("lixeira"),
    buscarTabela("usuarios"),
    buscarTabela("vendas"),
    buscarTabela("vendas_parcelas"),
    buscarTabela("vendas_recebimentos"),
    buscarTabela("contas_pagar"),
  ]);

  return {
    versaoSistema: "3.0.0",
    backupVersion: 2,
    dataBackup: new Date().toISOString(),
    fornecedores,
    produtos,
    lixeira,
    usuarios,
    vendas,
    vendasParcelas,
    vendasRecebimentos,
    contasPagar,
  };
}

export async function verificarBanco() {
  const { error } = await supabase
    .from("produtos")
    .select("codigo")
    .limit(1);

  return !error;
}
