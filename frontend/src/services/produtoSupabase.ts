import { supabase } from "./supabase";
import type { Produto } from "../types/produto";

export async function buscarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function inserirProduto(produto: Produto) {
  const { error } = await supabase.from("produtos").insert({
    codigo: produto.codigo,
    descricao: produto.descricao,
    categoria: produto.categoria,
    unidade: produto.unidade,
    quantidade: produto.quantidade,
    estoque_minimo: produto.estoqueMinimo,
    preco_compra: produto.precoCompra,
    observacao: produto.observacao,
    fornecedor_id: produto.fornecedorId || null,
    ultima_entrada: produto.ultimaEntrada || null,
  });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarProduto(produto: Produto) {
  if (!produto.id) throw new Error("Produto sem ID.");

  const { error } = await supabase
    .from("produtos")
    .update({
      codigo: produto.codigo,
      descricao: produto.descricao,
      categoria: produto.categoria,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoque_minimo: produto.estoqueMinimo,
      preco_compra: produto.precoCompra,
      observacao: produto.observacao,
      fornecedor_id: produto.fornecedorId || null,
    })
    .eq("id", produto.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

function validarQuantidade(quantidade: number) {
  if (!Number.isFinite(quantidade) || quantidade <= 0) {
    throw new Error("Informe uma quantidade maior que zero.");
  }
}

async function ajustarEstoque(
  produtoId: number,
  variacao: number,
  opcoes: {
    fornecedorId?: number;
    precoCompra?: number;
    registrarEntrada?: boolean;
  } = {}
) {
  const { data, error } = await supabase.rpc("ajustar_estoque", {
    p_produto_id: produtoId,
    p_variacao: variacao,
    p_fornecedor_id: opcoes.fornecedorId ?? null,
    p_preco_compra: opcoes.precoCompra ?? null,
    p_registrar_entrada: opcoes.registrarEntrada ?? false,
  });

  if (error) {
    console.error(error);
    throw error;
  }

  return data?.[0];
}

export async function registrarEntradaProduto(
  produtoId: number,
  quantidade: number,
  fornecedorId: number,
  precoCompra: number
) {
  validarQuantidade(quantidade);

  return ajustarEstoque(produtoId, quantidade, {
    fornecedorId,
    precoCompra,
    registrarEntrada: true,
  });
}

export async function registrarSaidaProduto(produtoId: number, quantidade: number) {
  validarQuantidade(quantidade);

  // O saldo pode ficar negativo de propósito: isso aponta uma possível divergência.
  return ajustarEstoque(produtoId, -quantidade);
}

export async function moverParaLixeira(produto: Produto) {
  const { error } = await supabase.from("lixeira").insert({
    produto_id: produto.id,
    codigo: produto.codigo,
    descricao: produto.descricao,
    categoria: produto.categoria,
    unidade: produto.unidade,
    quantidade: produto.quantidade,
    estoque_minimo: produto.estoqueMinimo,
    preco_compra: produto.precoCompra,
    observacao: produto.observacao,
    fornecedor_id: produto.fornecedorId || null,
    ultima_entrada: produto.ultimaEntrada || null,
    data_exclusao: new Date().toISOString(),
  });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirProduto(id: number) {
  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function buscarLixeira() {
  const { data, error } = await supabase
    .from("lixeira")
    .select("*")
    .order("id", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function restaurarProdutoLixeira(produto: {
  id: number;
  produto_id: number;
  codigo: string;
  descricao: string;
  categoria: string;
  unidade: string;
  quantidade: number;
  estoque_minimo: number;
  preco_compra: number;
  observacao: string | null;
  fornecedor_id: number | null;
  ultima_entrada: string | null;
}) {
  const { error: erroInserir } = await supabase.from("produtos").insert({
    id: produto.produto_id,
    codigo: produto.codigo,
    descricao: produto.descricao,
    categoria: produto.categoria,
    unidade: produto.unidade,
    quantidade: produto.quantidade,
    estoque_minimo: produto.estoque_minimo,
    preco_compra: produto.preco_compra,
    observacao: produto.observacao,
    fornecedor_id: produto.fornecedor_id,
    ultima_entrada: produto.ultima_entrada,
  });

  if (erroInserir) {
    console.error(erroInserir);
    throw erroInserir;
  }

  const { error: erroExcluir } = await supabase.from("lixeira").delete().eq("id", produto.id);

  if (erroExcluir) {
    console.error(erroExcluir);
    throw erroExcluir;
  }

  await supabase.rpc("reset_produtos_sequence");
}

export async function excluirLixeira(id: number) {
  const { error } = await supabase.from("lixeira").delete().eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

