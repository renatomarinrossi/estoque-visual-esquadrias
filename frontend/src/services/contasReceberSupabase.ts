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

  if (erroParcelas) throw erroParcelas;

  const parcelasPendentes = (parcelas ?? []) as VendaParcela[];
  if (parcelasPendentes.length === 0) return [];

  const vendaIds = [...new Set(parcelasPendentes.map((parcela) => parcela.venda_id))];
  const parcelaIds = parcelasPendentes.flatMap((parcela) => (parcela.id ? [parcela.id] : []));

  const [{ data: vendas, error: erroVendas }, { data: recebimentos, error: erroRecebimentos }] =
    await Promise.all([
      supabase.from("vendas").select("id, cliente").in("id", vendaIds),
      supabase.from("vendas_recebimentos").select("parcela_id, valor").in("parcela_id", parcelaIds),
    ]);

  if (erroVendas) throw erroVendas;
  if (erroRecebimentos) throw erroRecebimentos;

  const clientesPorVenda = new Map(
    ((vendas ?? []) as Pick<Venda, "id" | "cliente">[]).flatMap((venda) =>
      venda.id ? [[venda.id, venda.cliente] as const] : []
    )
  );

  const totaisPorParcela = (recebimentos ?? []).reduce((totais, recebimento) => {
    const parcelaId = Number(recebimento.parcela_id);
    totais.set(parcelaId, (totais.get(parcelaId) ?? 0) + Number(recebimento.valor));
    return totais;
  }, new Map<number, number>());

  return parcelasPendentes.map((parcela) => {
    const totalRecebido = totaisPorParcela.get(parcela.id!) ?? 0;

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

