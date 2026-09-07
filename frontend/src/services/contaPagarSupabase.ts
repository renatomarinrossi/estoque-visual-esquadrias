import { supabase } from "./supabase";
import type { ContaPagar } from "../types/ContaPagar";

export async function buscarContasPagar(): Promise<ContaPagar[]> {
  const { data, error } = await supabase.from("contas_pagar").select("*").order("data_vencimento", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ContaPagar[];
}


export async function inserirContaPagar(conta: ContaPagar): Promise<void> {
 const {error}=await supabase.rpc("salvar_conta_pagar",{p_conta:conta,p_id:null}); if(error)throw error;
}
export async function atualizarContaPagar(conta: ContaPagar): Promise<void> {
 if(!conta.id)throw new Error("Conta sem ID.");
 const {error}=await supabase.rpc("salvar_conta_pagar",{p_conta:conta,p_id:conta.id}); if(error)throw error;
}
export async function confirmarPagamentoContaPagar(id:number,dataPagamento:string):Promise<void>{
 const {error}=await supabase.rpc("operar_conta_pagar",{p_id:id,p_acao:"PAGAR",p_data:dataPagamento});if(error)throw error;
}
export async function excluirContaPagar(id:number):Promise<void>{
 const {error}=await supabase.rpc("operar_conta_pagar",{p_id:id,p_acao:"CANCELAR"});if(error)throw error;
}
