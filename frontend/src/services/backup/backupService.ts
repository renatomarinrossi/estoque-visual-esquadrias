import { gerarBackup } from "../sistemaSupabase";
export function baixarJson(dados: unknown, nome: string) {
 const blob=new Blob([JSON.stringify(dados,null,2)],{type:"application/json"});
 if(blob.size>50*1024*1024)throw new Error("Backup excede 50 MB. Use o procedimento de backup PostgreSQL documentado.");
 const url=URL.createObjectURL(blob);const link=document.createElement("a");
 link.href=url;link.download=nome;document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),30000);
}
export async function fazerBackupCompleto(finalidade="MANUAL") {
 const backup=await gerarBackup(finalidade);
 baixarJson(backup,"Backup-Operacional-"+finalidade+"-"+new Date().toISOString().replace(/[:.]/g,"-")+".json");
 return new Date(backup.dataBackup).toLocaleString("pt-BR");
}
