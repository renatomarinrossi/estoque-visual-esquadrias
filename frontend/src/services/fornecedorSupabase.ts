import { supabase } from "./supabase";

import type { Fornecedor } from "../types/fornecedor";

export async function buscarFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome_fantasia");

  if (error) throw error;

  return (data ?? []) as Fornecedor[];
}

function dadosFornecedor(fornecedor: Fornecedor) {
  return {
    razao_social: fornecedor.razao_social,
    nome_fantasia: fornecedor.nome_fantasia,
    categoria: fornecedor.categoria,
    contato: fornecedor.contato,
    telefone: fornecedor.telefone,
    whatsapp: fornecedor.whatsapp,
    email: fornecedor.email,
    cidade: fornecedor.cidade,
    estado: fornecedor.estado,
    observacoes: fornecedor.observacoes,
  };
}

export async function inserirFornecedor(fornecedor: Fornecedor) {
  const { error } = await supabase
    .from("fornecedores")
    .insert(dadosFornecedor(fornecedor));

  if (error) throw error;
}

export async function atualizarFornecedor(
  id: number,
  fornecedor: Fornecedor
) {
  const { error } = await supabase
    .from("fornecedores")
    .update(dadosFornecedor(fornecedor))
    .eq("id", id);

  if (error) throw error;
}

export async function excluirFornecedor(id: number) {
  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

