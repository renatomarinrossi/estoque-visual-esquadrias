import { supabase } from "./supabase";

import {
  atualizarStatusParcela,
} from "./vendaParcelaSupabase";

import {
  atualizarStatusVenda,
} from "./vendaSupabase";

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
) {

  const { data, error } =
    await supabase
      .from("vendas_recebimentos")
      .select("*")
      .eq("parcela_id", parcelaId)
      .order("data_recebimento", {
        ascending: true,
      });

  if (error) {

    console.error(error);

    return [];

  }

  return data;

}

export async function calcularTotalRecebido(
  parcelaId: number
) {

  const recebimentos =
    await buscarRecebimentosParcela(
      parcelaId
    );

  return recebimentos.reduce(

    (total: number, item: any) =>

      total + Number(item.valor),

    0

  );

}

export async function inserirRecebimento(
  recebimento: VendaRecebimento
) {

  const { error } =
    await supabase
      .from("vendas_recebimentos")
      .insert({

        parcela_id:
          recebimento.parcela_id,

        data_recebimento:
          recebimento.data_recebimento,

        valor:
          recebimento.valor,

        observacao:
          recebimento.observacao,

      });

  if (error) {

    console.error(error);

    throw error;

  }

  const resultado =
    await atualizarStatusParcela(
      recebimento.parcela_id
    );

  await atualizarStatusVenda(
    resultado.vendaId
  );

}

export async function excluirRecebimento(
  id: number
) {

  const { data } =
    await supabase
      .from("vendas_recebimentos")
      .select("parcela_id")
      .eq("id", id)
      .single();

  const { error } =
    await supabase
      .from("vendas_recebimentos")
      .delete()
      .eq("id", id);

  if (error) {

    console.error(error);

    throw error;

  }

  if (data?.parcela_id) {

    const resultado =
      await atualizarStatusParcela(
        data.parcela_id
      );

    await atualizarStatusVenda(
      resultado.vendaId
    );

  }

}

export async function editarRecebimento(
  recebimento: VendaRecebimento
) {

  if (!recebimento.id) {

    throw new Error(
      "Recebimento sem ID."
    );

  }

  const { error } =
    await supabase
      .from("vendas_recebimentos")
      .update({

        data_recebimento:
          recebimento.data_recebimento,

        valor:
          recebimento.valor,

        observacao:
          recebimento.observacao,

      })
      .eq("id", recebimento.id);

  if (error) {

    console.error(error);

    throw error;

  }

  const resultado =
    await atualizarStatusParcela(
      recebimento.parcela_id
    );

  await atualizarStatusVenda(
    resultado.vendaId
  );

}
