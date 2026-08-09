import { supabase } from "./supabase";

export type VendaRecebimento = {
  id?: number;
  parcela_id: number;
  data_recebimento: string;
  valor: number;
  observacao?: string;
  created_at?: string;
};

export async function buscarRecebimentosParcela(
  parcelaId: number
): Promise<VendaRecebimento[]> {
  const { data, error } = await supabase
    .from("vendas_recebimentos")
    .select("*")
    .eq("parcela_id", parcelaId)
    .order("data_recebimento", { ascending: true });

  if (error) throw error;

  return (data ?? []) as VendaRecebimento[];
}

export async function calcularTotalRecebido(parcelaId: number): Promise<number> {
  const recebimentos = await buscarRecebimentosParcela(parcelaId);

  return recebimentos.reduce(
    (total, recebimento) => total + Number(recebimento.valor),
    0
  );
}

export async function inserirRecebimento(
  recebimento: VendaRecebimento
): Promise<void> {
  if (!recebimento.parcela_id) {
    throw new Error("Informe a parcela do recebimento.");
  }

  const { error } = await supabase.rpc("registrar_recebimento", {
    p_parcela_id: recebimento.parcela_id,
    p_data_recebimento: recebimento.data_recebimento,
    p_valor: Number(recebimento.valor),
    p_observacao: recebimento.observacao?.trim() || null,
  });

  if (error) throw error;
}

export async function editarRecebimento(
  recebimento: VendaRecebimento
): Promise<void> {
  if (!recebimento.id) {
    throw new Error("Recebimento sem ID.");
  }

  const { error } = await supabase.rpc("alterar_recebimento", {
    p_recebimento_id: recebimento.id,
    p_data_recebimento: recebimento.data_recebimento,
    p_valor: Number(recebimento.valor),
    p_observacao: recebimento.observacao?.trim() || null,
  });

  if (error) throw error;
}

export async function excluirRecebimento(id: number): Promise<void> {
  const { error } = await supabase.rpc("excluir_recebimento", {
    p_recebimento_id: id,
  });

  if (error) throw error;
}

