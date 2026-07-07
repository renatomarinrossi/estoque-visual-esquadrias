import { supabase } from "./supabase";
import type { Produto } from "../types/produto";

export async function buscarProdutos() {
  const { data, error } = await supabase
    .from("produtos")
    .select("*")
    .order("id", {
  ascending: true,
});

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
      categoria: produto.categoria,
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
  produto: Produto
) {
  console.log("ATUALIZAR PRODUTO:", produto);

  if (!produto.id) {
    throw new Error(
      "Produto sem ID."
    );
  }

  const { error } = await supabase
    .from("produtos")
    .update({
      codigo: produto.codigo,
      descricao: produto.descricao,
      categoria: produto.categoria,
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
    .eq("id", produto.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function registrarEntradaProduto(
  produtoId: number,
  quantidade: number,
  fornecedorId: number,
  precoCompra: number
) {
  const { data: produto } =
    await supabase
      .from("produtos")
      .select("*")
      .eq("id", produtoId)
      .single();

  if (!produto) {
    throw new Error(
      "Produto não encontrado"
    );
  }

  const novaQuantidade =
    produto.quantidade + quantidade;

  const { error } =
    await supabase
      .from("produtos")
      .update({
        quantidade:
          novaQuantidade,
        fornecedor_id:
          fornecedorId,
        preco_compra:
          precoCompra,
        ultima_entrada:
          new Date().toISOString(),
      })
      .eq("id", produtoId);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function registrarSaidaProduto(
  produtoId: number,
  quantidade: number
) {
  const { data: produto } =
    await supabase
      .from("produtos")
      .select("*")
      .eq("id", produtoId)
      .single();

  if (!produto) {
    throw new Error(
      "Produto não encontrado"
    );
  }

  if (
    produto.quantidade -
      quantidade <
    0
  ) {
    throw new Error(
      "Estoque insuficiente"
    );
  }

  const { error } =
    await supabase
      .from("produtos")
      .update({
        quantidade:
          produto.quantidade -
          quantidade,
      })
      .eq("id", produtoId);

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
      produto_id: produto.id,

      codigo: produto.codigo,
      descricao: produto.descricao,
      categoria: produto.categoria,
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
  id: number
) {
  const { error } = await supabase
    .from("produtos")
    .delete()
    .eq("id", id);

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
        id: produto.produto_id,

        codigo: produto.codigo,
        descricao:
          produto.descricao,
        categoria:
          produto.categoria,
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

  // Atualiza a sequência da tabela produtos
  await supabase.rpc(
    "reset_produtos_sequence"
  );
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
