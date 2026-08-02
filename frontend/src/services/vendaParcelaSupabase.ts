import { supabase } from "./supabase";

import type { VendaParcela } from "../types/VendaParcela";

type StatusParcela = "A_RECEBER" | "PARCIALMENTE_RECEBIDO" | "RECEBIDO";

export async function buscarParcelasVenda(vendaId: number): Promise<VendaParcela[]> {
  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .order("numero_parcela", { ascending: true });

  if (error) throw error;

  return (data ?? []) as VendaParcela[];
}

export async function inserirParcela(parcela: VendaParcela): Promise<void> {
  const { error } = await supabase.from("vendas_parcelas").insert({
    venda_id: parcela.venda_id,
    numero_parcela: parcela.numero_parcela,
    total_parcelas: parcela.total_parcelas,
    valor: parcela.valor,
    data_vencimento: parcela.data_vencimento || null,
    forma_pagamento: parcela.forma_pagamento,
    status: "A_RECEBER",
    condicionado_entrega: parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
    descricao_entrega:
      parcela.forma_pagamento === "CONDICIONADO_ENTREGA" ? parcela.descricao_entrega : "",
  });

  if (error) throw error;
}

export async function atualizarParcela(parcela: VendaParcela): Promise<void> {
  if (!parcela.id) throw new Error("Parcela sem ID.");

  const { error } = await supabase
    .from("vendas_parcelas")
    .update({
      numero_parcela: parcela.numero_parcela,
      total_parcelas: parcela.total_parcelas,
      valor: parcela.valor,
      data_vencimento: parcela.data_vencimento || null,
      forma_pagamento: parcela.forma_pagamento,
      condicionado_entrega: parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
      descricao_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA" ? parcela.descricao_entrega : "",
    })
    .eq("id", parcela.id);

  if (error) throw error;
}

export async function excluirParcela(id: number): Promise<void> {
  const { error } = await supabase.from("vendas_parcelas").delete().eq("id", id);
  if (error) throw error;
}

async function buscarTotaisRecebidos(parcelaIds: number[]) {
  if (parcelaIds.length === 0) return new Map<number, number>();

  const { data, error } = await supabase
    .from("vendas_recebimentos")
    .select("parcela_id, valor")
    .in("parcela_id", parcelaIds);

  if (error) throw error;

  return (data ?? []).reduce((totais, recebimento) => {
    const parcelaId = Number(recebimento.parcela_id);
    const totalAtual = totais.get(parcelaId) ?? 0;
    totais.set(parcelaId, totalAtual + Number(recebimento.valor));
    return totais;
  }, new Map<number, number>());
}

export async function salvarParcelasVenda(vendaId: number, parcelas: VendaParcela[]): Promise<void> {
  const atuais = await buscarParcelasVenda(vendaId);
  const idsAtuais = atuais.flatMap((parcela) => (parcela.id ? [parcela.id] : []));
  const idsMantidos = parcelas.flatMap((parcela) => (parcela.id ? [parcela.id] : []));
  const totaisRecebidos = await buscarTotaisRecebidos(idsAtuais);

  const idsRemovidosComRecebimento = idsAtuais.filter(
    (id) => !idsMantidos.includes(id) && (totaisRecebidos.get(id) ?? 0) > 0
  );

  if (idsRemovidosComRecebimento.length > 0) {
    throw new Error("Não é possível remover uma parcela que já possui recebimentos registrados.");
  }

  for (const parcela of parcelas) {
    if (!parcela.id) continue;

    const totalRecebido = totaisRecebidos.get(parcela.id) ?? 0;
    if (Number(parcela.valor) < totalRecebido) {
      throw new Error(
        `O valor da parcela ${parcela.numero_parcela} não pode ser menor que o total já recebido (${totalRecebido.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}).`
      );
    }
  }

  for (const id of idsAtuais) {
    if (!idsMantidos.includes(id)) await excluirParcela(id);
  }

  for (const parcela of parcelas) {
    const parcelaNormalizada: VendaParcela = {
      ...parcela,
      venda_id: vendaId,
      condicionado_entrega: parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
      descricao_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA" ? parcela.descricao_entrega : "",
    };

    if (parcelaNormalizada.id) {
      await atualizarParcela(parcelaNormalizada);
      await atualizarStatusParcela(parcelaNormalizada.id);
    } else {
      await inserirParcela(parcelaNormalizada);
    }
  }
}

export async function atualizarStatusParcela(parcelaId: number): Promise<{
  vendaId: number;
  status: StatusParcela;
  totalRecebido: number;
  saldo: number;
}> {
  const { data: parcela, error: erroParcela } = await supabase
    .from("vendas_parcelas")
    .select("id, venda_id, valor")
    .eq("id", parcelaId)
    .single();

  if (erroParcela) throw erroParcela;

  const { data: recebimentos, error: erroRecebimentos } = await supabase
    .from("vendas_recebimentos")
    .select("valor")
    .eq("parcela_id", parcelaId);

  if (erroRecebimentos) throw erroRecebimentos;

  const totalRecebido = (recebimentos ?? []).reduce(
    (total, recebimento) => total + Number(recebimento.valor),
    0
  );
  const saldo = Number(parcela.valor) - totalRecebido;

  const status: StatusParcela =
    totalRecebido <= 0
      ? "A_RECEBER"
      : totalRecebido < Number(parcela.valor)
        ? "PARCIALMENTE_RECEBIDO"
        : "RECEBIDO";

  const { error: erroAtualizacao } = await supabase
    .from("vendas_parcelas")
    .update({ status })
    .eq("id", parcelaId);

  if (erroAtualizacao) throw erroAtualizacao;

  return { vendaId: parcela.venda_id, status, totalRecebido, saldo };
}

export async function buscarProximaParcela(vendaId: number): Promise<VendaParcela | null> {
  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .in("status", ["A_RECEBER", "PARCIALMENTE_RECEBIDO"])
    .order("data_vencimento", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;

  return data as VendaParcela | null;
}

export async function buscarTotaisRecebidosVendas(vendaIds: number[]): Promise<Record<number, number>> {
  const totais = Object.fromEntries(vendaIds.map((vendaId) => [vendaId, 0])) as Record<number, number>;
  if (vendaIds.length === 0) return totais;

  const { data: parcelas, error: erroParcelas } = await supabase
    .from("vendas_parcelas")
    .select("id, venda_id")
    .in("venda_id", vendaIds);

  if (erroParcelas) throw erroParcelas;

  const vendaPorParcela = new Map<number, number>();
  for (const parcela of parcelas ?? []) {
    vendaPorParcela.set(Number(parcela.id), Number(parcela.venda_id));
  }

  const parcelaIds = [...vendaPorParcela.keys()];
  if (parcelaIds.length === 0) return totais;

  const { data: recebimentos, error: erroRecebimentos } = await supabase
    .from("vendas_recebimentos")
    .select("parcela_id, valor")
    .in("parcela_id", parcelaIds);

  if (erroRecebimentos) throw erroRecebimentos;

  for (const recebimento of recebimentos ?? []) {
    const vendaId = vendaPorParcela.get(Number(recebimento.parcela_id));
    if (vendaId) totais[vendaId] = (totais[vendaId] ?? 0) + Number(recebimento.valor);
  }

  return totais;
}

