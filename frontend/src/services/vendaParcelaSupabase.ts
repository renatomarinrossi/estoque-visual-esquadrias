import { supabase } from "./supabase";

import type { VendaParcela } from "../types/VendaParcela";



export async function buscarParcelasVenda(vendaId: number): Promise<VendaParcela[]> {
  const { data, error } = await supabase
    .from("vendas_parcelas")
    .select("*")
    .eq("venda_id", vendaId)
    .order("numero_parcela", { ascending: true });

  if (error) throw error;

  return (data ?? []) as VendaParcela[];
}

export async function buscarResumoVendas(vendaIds:number[]):Promise<{venda_id:number;total_recebido:number;proxima:VendaParcela|null}[]>{
 if(!vendaIds.length)return [];
 const {data,error}=await supabase.rpc("resumo_vendas",{p_ids:vendaIds});if(error)throw error;return data??[];
}
