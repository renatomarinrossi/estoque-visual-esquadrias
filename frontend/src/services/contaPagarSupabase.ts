import { supabase } from "./supabase";

import type { ContaPagar } from "../types/ContaPagar";

export async function buscarContasPagar(): Promise<ContaPagar[]> {
  const { data, error } = await supabase
    .from("contas_pagar")
    .select("*")
    .order("data_vencimento", { ascending: true });

  if (error) {
    console.error(error);
    throw error;
  }

  return (data ?? []) as ContaPagar[];
}

export async function inserirContaPagar(conta: ContaPagar): Promise<void> {
  const { error } = await supabase.from("contas_pagar").insert({
    data_lancamento: conta.data_lancamento,
    favorecido: conta.favorecido,
    descricao: conta.descricao,
    valor: conta.valor,
    forma_pagamento: conta.forma_pagamento,
    data_vencimento: conta.data_vencimento,
    status: conta.status,
    observacoes: conta.observacoes,
  });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarContaPagar(conta: ContaPagar): Promise<void> {
  if (!conta.id) {
    throw new Error("Conta a pagar sem ID.");
  }

  const { error } = await supabase
    .from("contas_pagar")
    .update({
      data_lancamento: conta.data_lancamento,
      favorecido: conta.favorecido,
      descricao: conta.descricao,
      valor: conta.valor,
      forma_pagamento: conta.forma_pagamento,
      data_vencimento: conta.data_vencimento,
      status: conta.status,
      observacoes: conta.observacoes,
    })
    .eq("id", conta.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function confirmarPagamentoContaPagar(
  id: number
): Promise<void> {
  const { error } = await supabase
    .from("contas_pagar")
    .update({ status: "PAGO" })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirContaPagar(id: number): Promise<void> {
  const { error } = await supabase
    .from("contas_pagar")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
