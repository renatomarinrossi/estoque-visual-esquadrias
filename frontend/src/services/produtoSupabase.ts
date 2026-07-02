import { supabase } from "./supabase";
import type { Produto } from "../types/produto";

export async function buscarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("codigo");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function inserirProduto(
  produto: Produto
) {
  const { error } = await supabase
    .from("produtos")
    .insert({
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoque_minimo:
        produto.estoqueMinimo,
      preco_compra:
        produto.precoCompra,
      observacao:
        produto.observacao,
      fornecedor_id:
        produto.fornecedorId || null,
      ultima_entrada:
        produto.ultimaEntrada || null,
    });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarProduto(
  codigoOriginal: string,
  produto: Produto
) {
  const { error } = await supabase
    .from("produtos")
    .update({
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoque_minimo:
        produto.estoqueMinimo,
      preco_compra:
        produto.precoCompra,
      observacao:
        produto.observacao,
      fornecedor_id:
        produto.fornecedorId || null,
    })
    .eq("codigo", codigoOriginal);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function registrarEntradaProduto(
  codigo: string,
  quantidade: number,
  fornecedorId: number,
  precoCompra: number
) {
  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (!produto) {
    throw new Error(
      "Produto não encontrado"
    );
  }

  const novaQuantidade =
    produto.quantidade + quantidade;

  const { error } = await supabase
    .from("produtos")
    .update({
      quantidade: novaQuantidade,

      fornecedor_id:
        fornecedorId,

      preco_compra:
        precoCompra,

      ultima_entrada:
        new Date().toISOString(),
    })
    .eq("codigo", codigo);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function registrarSaidaProduto(
  codigo: string,
  quantidade: number
) {
  const { data: produto } = await supabase
    .from("produtos")
    .select("*")
    .eq("codigo", codigo)
    .single();

  if (!produto) {
    throw new Error(
      "Produto não encontrado"
    );
  }

  if (
    produto.quantidade - quantidade <
    0
  ) {
    throw new Error(
      "Estoque insuficiente"
    );
  }

  const { error } = await supabase
    .from("produtos")
    .update({
      quantidade:
        produto.quantidade -
        quantidade,
    })
    .eq("codigo", codigo);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function moverParaLixeira(
  produto: Produto
) {
  const { error } = await supabase
    .from("lixeira")
    .insert({
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoque_minimo:
        produto.estoqueMinimo,
      preco_compra:
        produto.precoCompra,
      observacao:
        produto.observacao,
      fornecedor_id:
        produto.fornecedorId || null,
      ultima_entrada:
        produto.ultimaEntrada || null,
      data_exclusao:
        new Date().toISOString(),
    });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirProduto(
  codigo: string
) {
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("codigo", codigo);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function buscarLixeira() {
  const { data, error } = await supabase
    .from("lixeira")
    .select("*")
    .order("id", {
      ascending: false,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function restaurarProdutoLixeira(
  produto: any
) {
  const { error: erroInserir } =
    await supabase
      .from("produtos")
      .insert({
        codigo: produto.codigo,
        descricao:
          produto.descricao,
        unidade:
          produto.unidade,
        quantidade:
          produto.quantidade,
        estoque_minimo:
          produto.estoque_minimo,
        preco_compra:
          produto.preco_compra,
        observacao:
          produto.observacao,
        fornecedor_id:
          produto.fornecedor_id,
        ultima_entrada:
          produto.ultima_entrada,
      });

  if (erroInserir) {
    console.error(
      erroInserir
    );
    throw erroInserir;
  }

  const { error: erroExcluir } =
    await supabase
      .from("lixeira")
      .delete()
      .eq("id", produto.id);

  if (erroExcluir) {
    console.error(
      erroExcluir
    );
    throw erroExcluir;
  }
}

export async function excluirLixeira(
  id: number
) {
  const { error } = await supabase
    .from("lixeira")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}
