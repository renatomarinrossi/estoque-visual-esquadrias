import { supabase } from "./supabase";

import type { ContaReceber } from "../types/ContaReceber";
import type { Venda } from "../types/Venda";
import type { VendaParcela } from "../types/VendaParcela";

export async function buscarContasReceber(): Promise<ContaReceber[]> {
  const { data: parcelas, error: erroParcelas } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .in("status", ["A_RECEBER", "PARCIALMENTE_RECEBIDO"])
    .order("data_vencimento", { ascending: true });

  if (erroParcelas) {
    console.error(erroParcelas);
    throw erroParcelas;
  }

  const parcelasPendentes = (parcelas ?? []) as VendaParcela[];
  const vendaIds = [...new Set(parcelasPendentes.map((parcela) => parcela.venda_id))];

  if (vendaIds.length === 0) return [];

  const { data: vendas, error: erroVendas } = await supabase
    .from("vendas")
    .select("id, cliente")
    .in("id", vendaIds);

  if (erroVendas) {
    console.error(erroVendas);
    throw erroVendas;
  }

  const clientesPorVenda = new Map(
    ((vendas ?? []) as Pick<Venda, "id" | "cliente">[]).flatMap((venda) =>
      venda.id ? [[venda.id, venda.cliente] as const] : []
    )
  );

  const recebimentos = await Promise.all(
    parcelasPendentes.map(async (parcela) => {
      const { data, error } = await supabase
        .from("vendas_recebimentos")
        .select("valor")
        .eq("parcela_id", parcela.id!);

      if (error) {
        console.error(error);
        throw error;
      }

      return [parcela.id!, data ?? []] as const;
    })
  );

  const recebimentosPorParcela = new Map(recebimentos);

  return parcelasPendentes.map((parcela) => {
    const totalRecebido = (recebimentosPorParcela.get(parcela.id!) ?? []).reduce(
      (total, recebimento) => total + Number(recebimento.valor),
      0
    );

    return {
      parcela_id: parcela.id!,
      venda_id: parcela.venda_id,
      cliente: clientesPorVenda.get(parcela.venda_id) ?? "Cliente não encontrado",
      numero_parcela: parcela.numero_parcela,
      total_parcelas: parcela.total_parcelas,
      data_vencimento: parcela.data_vencimento,
      forma_pagamento: parcela.forma_pagamento,
      descricao_entrega: parcela.descricao_entrega,
      valor: Number(parcela.valor),
      valor_recebido: totalRecebido,
      saldo: Number(parcela.valor) - totalRecebido,
      status: parcela.status,
    };
  });
}
