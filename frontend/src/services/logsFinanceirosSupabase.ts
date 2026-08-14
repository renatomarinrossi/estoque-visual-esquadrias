import { supabase } from "./supabase";

import type { LogFinanceiro } from "../types/LogFinanceiro";

type LogFinanceiroBanco = Omit<LogFinanceiro, "usuario_nome"> & {
  usuarios: { nome: string; login: string } | null;
};

function inicioDoDia(data: string) {
  return `${data}T00:00:00-03:00`;
}

function fimDoDia(data: string) {
  return `${data}T23:59:59.999-03:00`;
}

export async function buscarLogsFinanceiros(
  dataInicial: string,
  dataFinal: string
): Promise<LogFinanceiro[]> {
  let consulta = supabase
    .from("logs_financeiros")
    .select("id, created_at, usuario_id, modulo, acao, entidade, entidade_id, descricao, detalhes, usuarios(nome, login)")
    .order("created_at", { ascending: false });

  if (dataInicial) {
    consulta = consulta.gte("created_at", inicioDoDia(dataInicial));
  }

  if (dataFinal) {
    consulta = consulta.lte("created_at", fimDoDia(dataFinal));
  }

  const { data, error } = await consulta.limit(500);

  if (error) throw error;

  return ((data ?? []) as unknown as LogFinanceiroBanco[]).map((log) => ({
    ...log,
    usuario_nome: log.usuarios?.nome || log.usuarios?.login || "Sistema",
  }));
}

