import { supabase } from "./supabase";

export type FiltrosMovimentacao = {
  dataInicial?: string;
  dataFinal?: string;
  produto?: string;
  tipo?: "" | "ENTRADA" | "SAIDA";
};

export type MovimentacaoEstoque = {
  id: number;
  tipo: "ENTRADA" | "SAIDA";
  quantidade: number;
  saldo_anterior: number;
  saldo_resultante: number;
  preco_compra: number | null;
  data_movimentacao: string;
  produtos: { codigo: string; descricao: string } | null;
  usuarios: { nome: string; login: string } | null;
};

export async function buscarMovimentacoesEstoque(
  filtros: FiltrosMovimentacao = {}
): Promise<MovimentacaoEstoque[]> {
  let consulta = supabase
    .from("movimentacoes_estoque")
    .select(`
      id,
      tipo,
      quantidade,
      saldo_anterior,
      saldo_resultante,
      preco_compra,
      data_movimentacao,
      produtos (codigo, descricao),
      usuarios (nome, login)
    `)
    .order("data_movimentacao", { ascending: false });

  if (filtros.dataInicial) {
    consulta = consulta.gte("data_movimentacao", `${filtros.dataInicial}T00:00:00`);
  }

  if (filtros.dataFinal) {
    consulta = consulta.lte("data_movimentacao", `${filtros.dataFinal}T23:59:59.999`);
  }

  if (filtros.tipo) {
    consulta = consulta.eq("tipo", filtros.tipo);
  }

  const { data, error } = await consulta;

  if (error) throw error;

  const movimentacoes: MovimentacaoEstoque[] = (data ?? []).map((registro) => ({
    id: Number(registro.id),
    tipo: registro.tipo as "ENTRADA" | "SAIDA",
    quantidade: Number(registro.quantidade),
    saldo_anterior: Number(registro.saldo_anterior),
    saldo_resultante: Number(registro.saldo_resultante),
    preco_compra: registro.preco_compra === null ? null : Number(registro.preco_compra),
    data_movimentacao: String(registro.data_movimentacao),
    produtos: Array.isArray(registro.produtos)
      ? (registro.produtos[0] as { codigo: string; descricao: string } | undefined) ?? null
      : (registro.produtos as { codigo: string; descricao: string } | null),
    usuarios: Array.isArray(registro.usuarios)
      ? (registro.usuarios[0] as { nome: string; login: string } | undefined) ?? null
      : (registro.usuarios as { nome: string; login: string } | null),
  }));
  const busca = filtros.produto?.trim().toLocaleLowerCase("pt-BR");

  if (!busca) return movimentacoes;

  return movimentacoes.filter((movimentacao) => {
    const descricao = movimentacao.produtos?.descricao.toLocaleLowerCase("pt-BR") ?? "";
    const codigo = movimentacao.produtos?.codigo.toLocaleLowerCase("pt-BR") ?? "";
    return descricao.includes(busca) || codigo.includes(busca);
  });
}

