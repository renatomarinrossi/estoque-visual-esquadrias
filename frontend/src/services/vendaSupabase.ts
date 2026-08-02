import { supabase } from "./supabase";
import type { Venda } from "../types/Venda";

export async function buscarVendas() {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .order("data_venda", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function buscarVendaPorId(
  id: number
) {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function inserirVenda(
  venda: Venda
) {
  const { data, error } = await supabase
    .from("vendas")
    .insert({
      data_venda: venda.data_venda,
      cliente: venda.cliente,
      valor_total: venda.valor_total,
      forma_pagamento: venda.forma_pagamento,
      responsavel: venda.responsavel,
      status: venda.status,
      observacoes: venda.observacoes,
    })
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function atualizarVenda(
  venda: Venda
) {
  if (!venda.id) {
    throw new Error("Venda sem ID.");
  }

  const { data, error } = await supabase
    .from("vendas")
    .update({
      data_venda: venda.data_venda,
      cliente: venda.cliente,
      valor_total: venda.valor_total,
      forma_pagamento: venda.forma_pagamento,
      responsavel: venda.responsavel,
      status: venda.status,
      observacoes: venda.observacoes,
    })
    .eq("id", venda.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    throw error;
  }

  return data;
}

export async function atualizarStatusVenda(
  vendaId: number
) {

  const {
    data: parcelas,
    error,
  } = await supabase
    .from("vendas_parcelas")
    .select("status")
    .eq("venda_id", vendaId);

  if (error) {
    console.error(error);
    throw error;
  }

  const existeParcelaPendente =
    parcelas.some(
      (p) =>
        p.status === "A_RECEBER" ||
        p.status ===
          "PARCIALMENTE_RECEBIDO"
    );

  const novoStatus =
    existeParcelaPendente
      ? "A_RECEBER"
      : "RECEBIDO";

  const { error: erroVenda } =
    await supabase
      .from("vendas")
      .update({
        status: novoStatus,
      })
      .eq("id", vendaId);

  if (erroVenda) {
    console.error(erroVenda);
    throw erroVenda;
  }
}

export async function excluirVenda(
  id: number
) {
  const { error } = await supabase
    .from("vendas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
