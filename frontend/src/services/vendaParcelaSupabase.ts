import { supabase } from "./supabase";
import type { VendaParcela } from "../types/VendaParcela";

export async function buscarParcelasVenda(
  vendaId: number
) {

  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .order("numero_parcela", {
      ascending: true,
    });

  if (error) {
    console.error(error);
    return [];
  }

  return data;

}

export async function inserirParcela(
  parcela: VendaParcela
) {

  const { error } = await supabase
    .from("vendas_parcelas")
    .insert({

      venda_id: parcela.venda_id,

      numero_parcela:
        parcela.numero_parcela,

      total_parcelas:
        parcela.total_parcelas,

      valor: parcela.valor,

      data_vencimento:
        parcela.data_vencimento,

      forma_pagamento:
        parcela.forma_pagamento,

      status: parcela.status,

      condicionado_entrega:
        parcela.condicionado_entrega,

      descricao_entrega:
        parcela.descricao_entrega,

    });

  if (error) {
    console.error(error);
    throw error;
  }

}

export async function atualizarParcela(
  parcela: VendaParcela
) {

  if (!parcela.id) {

    throw new Error(
      "Parcela sem ID."
    );

  }

  const { error } = await supabase
    .from("vendas_parcelas")
    .update({

      numero_parcela:
        parcela.numero_parcela,

      total_parcelas:
        parcela.total_parcelas,

      valor: parcela.valor,

      data_vencimento:
        parcela.data_vencimento,

      forma_pagamento:
        parcela.forma_pagamento,

      status: parcela.status,

      condicionado_entrega:
        parcela.condicionado_entrega,

      descricao_entrega:
        parcela.descricao_entrega,

    })
    .eq("id", parcela.id);

  if (error) {
    console.error(error);
    throw error;
  }

}

export async function excluirParcela(
  id: number
) {

  const { error } = await supabase
    .from("vendas_parcelas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }

}export async function salvarParcelasVenda(
  vendaId: number,
  parcelas: VendaParcela[]
) {

  const atuais =
    await buscarParcelasVenda(vendaId);

  const atuaisIds =
    (atuais as VendaParcela[])
      .filter((p) => p.id)
      .map((p) => p.id!);

  const novosIds =
    parcelas
      .filter((p) => p.id)
      .map((p) => p.id!);

  // Exclui parcelas removidas
  for (const id of atuaisIds) {

    if (!novosIds.includes(id)) {

      await excluirParcela(id);

    }

  }

  // Atualiza ou insere
  for (const parcela of parcelas) {

    if (parcela.id) {

      await atualizarParcela(parcela);

    } else {

      await inserirParcela({

        ...parcela,

        venda_id: vendaId,

      });

    }

  }

}

export async function atualizarStatusParcela(
  parcelaId: number
) {

  const { data: parcela, error } =
    await supabase
      .from("vendas_parcelas")
      .select("*")
      .eq("id", parcelaId)
      .single();

  if (error) {
    console.error(error);
    throw error;
  }

  const {
    data: recebimentos,
    error: erroRecebimentos,
  } = await supabase
    .from("vendas_recebimentos")
    .select("valor")
    .eq("parcela_id", parcelaId);

  if (erroRecebimentos) {
    console.error(erroRecebimentos);
    throw erroRecebimentos;
  }

  const totalRecebido =
    (recebimentos ?? []).reduce(

      (total, item) =>

        total + Number(item.valor),

      0

    );

  let status:
    | "A_RECEBER"
    | "PARCIALMENTE_RECEBIDO"
    | "RECEBIDO";

  if (totalRecebido <= 0) {

    status = "A_RECEBER";

  } else if (
    totalRecebido <
    Number(parcela.valor)
  ) {

    status =
      "PARCIALMENTE_RECEBIDO";

  } else {

    status = "RECEBIDO";

  }

  const { error: erroUpdate } =
    await supabase
      .from("vendas_parcelas")
      .update({

        status,

      })
      .eq("id", parcelaId);

  if (erroUpdate) {
    console.error(erroUpdate);
    throw erroUpdate;
  }

  return {

    vendaId: parcela.venda_id,

    status,

    totalRecebido,

    saldo:
      Number(parcela.valor) -
      totalRecebido,

  };

}

export async function buscarProximaParcela(
  vendaId: number
) {

  const { data, error } =
    await supabase
      .from("vendas_parcelas")
      .select("*")
      .eq("venda_id", vendaId)
      .in("status", [
        "A_RECEBER",
        "PARCIALMENTE_RECEBIDO",
      ])
      .order("data_vencimento", {
        ascending: true,
      })
      .limit(1)
      .maybeSingle();

  if (error) {
    console.error(error);
    return null;
  }

  return data;

}
