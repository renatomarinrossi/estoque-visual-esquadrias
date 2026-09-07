import { supabase } from "./supabase";
import { SYSTEM } from "../config/system";
import { validarBackup } from "./backup/restaurarBackup";
export async function gerarBackup(finalidade = "MANUAL") {
 const {data,error}=await supabase.rpc("gerar_backup_operacional",{p_versao_sistema:SYSTEM.version,p_finalidade:finalidade});
 if(error)throw error; return validarBackup(data);
}
export async function buscarUltimoBackup() {
 const {data,error}=await supabase.from("backup_historico").select("created_at").order("id",{ascending:false}).limit(1).maybeSingle();
 if(error)throw error;return data?new Date(data.created_at).toLocaleString("pt-BR"):"Nunca gerado";
}
export async function verificarBanco() {
 const {error}=await supabase.from("produtos").select("codigo").limit(1);return !error;
}
