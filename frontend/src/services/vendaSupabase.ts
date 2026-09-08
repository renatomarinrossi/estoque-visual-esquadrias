import { supabase } from "./supabase";
import { filtroBuscaVenda } from "./filtroBuscaVenda";

import type { Venda } from "../types/Venda";
import type { VendaParcela } from "../types/VendaParcela";

export async function buscarVendas(arquivadas = false, pagina = 0, busca = ""): Promise<Venda[]> {
  let consulta = supabase
    .from("vendas")
    .select("id,data_venda,cliente,valor_total,responsavel,endereco,cidade,status,observacoes,arquivada,arquivada_em,created_at")
    .eq("arquivada", arquivadas);
  const filtro = filtroBuscaVenda(busca);
  if (filtro) consulta = consulta.or(filtro);
  const { data, error } = await consulta
    .order("data_venda", { ascending: false }).order("id", {ascending:false}).range(pagina*50,pagina*50+49);

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
    p_endereco: venda.endereco ?? "",
    p_cidade: venda.cidade ?? "",
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

export async function excluirVenda(id: number): Promise<void> {
  const { error } = await supabase.rpc("operar_venda", { p_id: id, p_acao: "EXCLUIR" });

  if (error) throw error;
}

export async function arquivarVenda(id: number): Promise<void> {
  const { error } = await supabase.rpc("arquivar_venda", {
    p_venda_id: id,
  });

  if (error) throw error;
}

export async function restaurarVenda(id: number): Promise<void> {
  const { error } = await supabase.rpc("operar_venda", { p_id: id, p_acao: "RESTAURAR" });

  if (error) throw error;
}

