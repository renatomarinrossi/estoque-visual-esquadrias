import { supabase } from "./supabase";

import type { Venda } from "../types/Venda";

export async function buscarVendas(): Promise<Venda[]> {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .order("data_venda", { ascending: false });

  if (error) {
    console.error(error);
    throw error;
  }

  return (data ?? []) as Venda[];
}

export async function buscarVendaPorId(id: number): Promise<Venda> {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data as Venda;
}

export async function inserirVenda(venda: Venda): Promise<Venda> {
  const { data, error } = await supabase
    .from("vendas")
    .insert({
      data_venda: venda.data_venda,
      cliente: venda.cliente,
      valor_total: venda.valor_total,
      responsavel: venda.responsavel,
      status: "A_RECEBER",
      observacoes: venda.observacoes,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data as Venda;
}

export async function atualizarVenda(venda: Venda): Promise<Venda> {
  if (!venda.id) {
    throw new Error("Venda sem ID.");
  }

  const { data, error } = await supabase
    .from("vendas")
    .update({
      data_venda: venda.data_venda,
      cliente: venda.cliente,
      valor_total: venda.valor_total,
      responsavel: venda.responsavel,
      observacoes: venda.observacoes,
    })
    .eq("id", venda.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data as Venda;
}

export async function atualizarStatusVenda(vendaId: number): Promise<void> {
  const { data: parcelas, error: erroParcelas } = await supabase
    .from("vendas_parcelas")
    .select("status")
    .eq("venda_id", vendaId);

  if (erroParcelas) {
    console.error(erroParcelas);
    throw erroParcelas;
  }

  const todasRecebidas =
    (parcelas?.length ?? 0) > 0 &&
    parcelas?.every((parcela) => parcela.status === "RECEBIDO");

  const status = todasRecebidas ? "RECEBIDO" : "A_RECEBER";

  const { error } = await supabase
    .from("vendas")
    .update({ status })
    .eq("id", vendaId);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirVenda(id: number): Promise<void> {
  const { error } = await supabase.from("vendas").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
