import { supabase } from "./supabase";

import type { VendaParcela } from "../types/VendaParcela";

type StatusParcela =
  | "A_RECEBER"
  | "PARCIALMENTE_RECEBIDO"
  | "RECEBIDO";

export async function buscarParcelasVenda(
  vendaId: number
): Promise<VendaParcela[]> {
  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .order("numero_parcela", { ascending: true });

  if (error) {
    console.error(error);
    throw error;
  }

  return (data ?? []) as VendaParcela[];
}

export async function inserirParcela(
  parcela: VendaParcela
): Promise<void> {
  const { error } = await supabase.from("vendas_parcelas").insert({
    venda_id: parcela.venda_id,
    numero_parcela: parcela.numero_parcela,
    total_parcelas: parcela.total_parcelas,
    valor: parcela.valor,
    data_vencimento: parcela.data_vencimento || null,
    forma_pagamento: parcela.forma_pagamento,
    status: "A_RECEBER",
    condicionado_entrega:
      parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
    descricao_entrega:
      parcela.forma_pagamento === "CONDICIONADO_ENTREGA"
        ? parcela.descricao_entrega
        : "",
  });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarParcela(
  parcela: VendaParcela
): Promise<void> {
  if (!parcela.id) {
    throw new Error("Parcela sem ID.");
  }

  const { error } = await supabase
    .from("vendas_parcelas")
    .update({
      numero_parcela: parcela.numero_parcela,
      total_parcelas: parcela.total_parcelas,
      valor: parcela.valor,
      data_vencimento: parcela.data_vencimento || null,
      forma_pagamento: parcela.forma_pagamento,
      condicionado_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
      descricao_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA"
          ? parcela.descricao_entrega
          : "",
    })
    .eq("id", parcela.id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function excluirParcela(id: number): Promise<void> {
  const { error } = await supabase
    .from("vendas_parcelas")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function salvarParcelasVenda(
  vendaId: number,
  parcelas: VendaParcela[]
): Promise<void> {
  const atuais = await buscarParcelasVenda(vendaId);
  const idsAtuais = atuais.flatMap((parcela) =>
    parcela.id ? [parcela.id] : []
  );
  const idsMantidos = parcelas.flatMap((parcela) =>
    parcela.id ? [parcela.id] : []
  );

  for (const id of idsAtuais) {
    if (!idsMantidos.includes(id)) {
      await excluirParcela(id);
    }
  }

  for (const parcela of parcelas) {
    const parcelaNormalizada: VendaParcela = {
      ...parcela,
      venda_id: vendaId,
      condicionado_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
      descricao_entrega:
        parcela.forma_pagamento === "CONDICIONADO_ENTREGA"
          ? parcela.descricao_entrega
          : "",
    };

    if (parcelaNormalizada.id) {
      await atualizarParcela(parcelaNormalizada);
      await atualizarStatusParcela(parcelaNormalizada.id);
    } else {
      await inserirParcela(parcelaNormalizada);
    }
  }
}

export async function atualizarStatusParcela(parcelaId: number): Promise<{
  vendaId: number;
  status: StatusParcela;
  totalRecebido: number;
  saldo: number;
}> {
  const { data: parcela, error: erroParcela } = await supabase
    .from("vendas_parcelas")
    .select("id, venda_id, valor")
    .eq("id", parcelaId)
    .single();

  if (erroParcela) {
    console.error(erroParcela);
    throw erroParcela;
  }

  const { data: recebimentos, error: erroRecebimentos } = await supabase
    .from("vendas_recebimentos")
    .select("valor")
    .eq("parcela_id", parcelaId);

  if (erroRecebimentos) {
    console.error(erroRecebimentos);
    throw erroRecebimentos;
  }

  const totalRecebido = (recebimentos ?? []).reduce(
    (total, recebimento) => total + Number(recebimento.valor),
    0
  );
  const saldo = Number(parcela.valor) - totalRecebido;

  let status: StatusParcela = "A_RECEBER";

  if (totalRecebido > 0 && totalRecebido < Number(parcela.valor)) {
    status = "PARCIALMENTE_RECEBIDO";
  }

  if (totalRecebido >= Number(parcela.valor)) {
    status = "RECEBIDO";
  }

  const { error: erroAtualizacao } = await supabase
    .from("vendas_parcelas")
    .update({ status })
    .eq("id", parcelaId);

  if (erroAtualizacao) {
    console.error(erroAtualizacao);
    throw erroAtualizacao;
  }

  return {
    vendaId: parcela.venda_id,
    status,
    totalRecebido,
    saldo,
  };
}

export async function buscarProximaParcela(
  vendaId: number
): Promise<VendaParcela | null> {
  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .in("status", ["A_RECEBER", "PARCIALMENTE_RECEBIDO"])
    .order("data_vencimento", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(error);
    throw error;
  }

  return data as VendaParcela | null;
}
