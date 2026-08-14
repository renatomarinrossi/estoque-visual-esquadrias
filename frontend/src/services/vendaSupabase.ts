import { supabase } from "./supabase";

import type { Venda } from "../types/Venda";
import type { VendaParcela } from "../types/VendaParcela";

export async function buscarVendas(arquivadas = false): Promise<Venda[]> {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .eq("arquivada", arquivadas)
    .order("data_venda", { ascending: false });

  if (error) throw error;

  return (data ?? []) as Venda[];
}

export async function buscarVendaPorId(id: number): Promise<Venda> {
  const { data, error } = await supabase
    .from("vendas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  return data as Venda;
}

type ParcelaParaSalvar = {
  id: number | null;
  numero_parcela: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string | null;
  forma_pagamento: VendaParcela["forma_pagamento"];
  descricao_entrega: string;
};

function prepararParcelas(parcelas: VendaParcela[]): ParcelaParaSalvar[] {
  return parcelas.map((parcela, indice) => ({
    id: parcela.id ?? null,
    numero_parcela: indice + 1,
    total_parcelas: parcelas.length,
    valor: Number(parcela.valor),
    data_vencimento: parcela.data_vencimento || null,
    forma_pagamento: parcela.forma_pagamento,
    descricao_entrega:
      parcela.forma_pagamento === "CONDICIONADO_ENTREGA"
        ? parcela.descricao_entrega ?? ""
        : "",
  }));
}

// A função RPC executa venda e parcelas dentro de uma única transação no banco.
// Em caso de erro, nenhuma parte da alteração é gravada.
export async function salvarVendaComParcelas(
  venda: Venda,
  parcelas: VendaParcela[]
): Promise<number> {
  const { data, error } = await supabase.rpc("salvar_venda_com_parcelas", {
    p_venda_id: venda.id ?? null,
    p_data_venda: venda.data_venda,
    p_cliente: venda.cliente,
    p_valor_total: Number(venda.valor_total),
    p_responsavel: venda.responsavel,
    p_observacoes: venda.observacoes,
    p_parcelas: prepararParcelas(parcelas),
  });

  if (error) throw error;

  const vendaId = Number(data);
  if (!Number.isInteger(vendaId) || vendaId <= 0) {
    throw new Error("A venda foi salva sem um identificador válido.");
  }

  return vendaId;
}

// Mantidas para compatibilidade com outros pontos do sistema.
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

  if (error) throw error;

  return data as Venda;
}

export async function atualizarVenda(venda: Venda): Promise<Venda> {
  if (!venda.id) throw new Error("Venda sem ID.");

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

  if (error) throw error;

  return data as Venda;
}

export async function atualizarStatusVenda(vendaId: number): Promise<void> {
  const { data: parcelas, error: erroParcelas } = await supabase
    .from("vendas_parcelas")
    .select("status")
    .eq("venda_id", vendaId);

  if (erroParcelas) throw erroParcelas;

  const todasRecebidas =
    (parcelas?.length ?? 0) > 0 &&
    parcelas?.every((parcela) => parcela.status === "RECEBIDO");

  const { error } = await supabase
    .from("vendas")
    .update({ status: todasRecebidas ? "RECEBIDO" : "A_RECEBER" })
    .eq("id", vendaId);

  if (error) throw error;
}

export async function excluirVenda(id: number): Promise<void> {
  const { error } = await supabase.from("vendas").delete().eq("id", id);

  if (error) throw error;
}

export async function arquivarVenda(id: number): Promise<void> {
  const { error } = await supabase.rpc("arquivar_venda", {
    p_venda_id: id,
  });

  if (error) throw error;
}

export async function restaurarVenda(id: number): Promise<void> {
  const { error } = await supabase
    .from("vendas")
    .update({ arquivada: false, arquivada_em: null })
    .eq("id", id);

  if (error) throw error;
}


