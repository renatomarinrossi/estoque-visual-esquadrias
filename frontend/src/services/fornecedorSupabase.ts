import { supabase } from "./supabase";

export async function buscarFornecedores() {
  const { data, error } = await supabase
    .from("fornecedores")
    .select("*")
    .order("nome_fantasia");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function inserirFornecedor(
  fornecedor: any
) {
  const { error } = await supabase
    .from("fornecedores")
    .insert({
      razao_social:
        fornecedor.razao_social,
      nome_fantasia:
        fornecedor.nome_fantasia,
      categoria:
        fornecedor.categoria,
      contato:
        fornecedor.contato,
      telefone:
        fornecedor.telefone,
      whatsapp:
        fornecedor.whatsapp,
      email:
        fornecedor.email,
      cidade:
        fornecedor.cidade,
      estado:
        fornecedor.estado,
      observacoes:
        fornecedor.observacoes,
    });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarFornecedor(
  id: number,
  fornecedor: any
) {
  const { error } = await supabase
    .from("fornecedores")
    .update({
      razao_social:
        fornecedor.razao_social,
      nome_fantasia:
        fornecedor.nome_fantasia,
      categoria:
        fornecedor.categoria,
      contato:
        fornecedor.contato,
      telefone:
        fornecedor.telefone,
      whatsapp:
        fornecedor.whatsapp,
      email:
        fornecedor.email,
      cidade:
        fornecedor.cidade,
      estado:
        fornecedor.estado,
      observacoes:
        fornecedor.observacoes,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirFornecedor(
  id: number
) {
  const { error } = await supabase
    .from("fornecedores")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
