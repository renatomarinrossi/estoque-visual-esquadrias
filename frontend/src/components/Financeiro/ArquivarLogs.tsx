import { useState } from "react";
import { supabase } from "../../services/supabase";
import { baixarJson } from "../../services/backup/backupService";

export default function ArquivarLogs(){
 const [corte,setCorte]=useState("");const [ocupado,setOcupado]=useState(false);const [mensagem,setMensagem]=useState("");
 const [lote,setLote]=useState<{id:number;arquivo:string}|null>(null);
 async function exportar(){
  if(!corte)return;setOcupado(true);setMensagem("");
  try{
   const {data,error}=await supabase.rpc("exportar_logs_antigos",{p_corte:`${corte}T00:00:00-03:00`});if(error)throw error;
   if(!data.quantidade){setMensagem("Nenhum log no período escolhido.");return;}
   const arquivo=JSON.stringify(data,null,2);baixarJson(data,`Arquivo-Logs-Lote-${data.lote}.json`);
   setLote({id:Number(data.lote),arquivo});setMensagem(`${data.quantidade} logs exportados. Guarde o arquivo em local seguro. Os registros continuam no banco até a confirmação abaixo.`);
  }catch(e){setMensagem(e instanceof Error?e.message:String((e as {message?:string})?.message??e));}finally{setOcupado(false);}
 }
 async function confirmar(file:File){
  if(!lote)return;setOcupado(true);
  try{
   if(file.size>50*1024*1024)throw new Error("Arquivo maior que 50 MB.");
   const conteudo=await file.text();if(conteudo!==lote.arquivo)throw new Error("O arquivo não corresponde ao lote exportado nesta sessão.");
   if(!window.confirm("O arquivo foi conferido e está guardado em local seguro? Confirmar removerá este lote do histórico online."))return;
   const hash=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(conteudo));
   const sha=[...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,"0")).join("");
   const {data,error}=await supabase.rpc("confirmar_arquivo_logs",{p_lote:lote.id,p_sha256:sha});if(error)throw error;
   setMensagem(`${data} logs arquivados. O banco mantém o lote, a quantidade, o usuário e o SHA-256 do arquivo.`);setLote(null);
  }catch(e){setMensagem(e instanceof Error?e.message:String((e as {message?:string})?.message??e));}finally{setOcupado(false);}
 }
 return <details className="my-4 rounded-xl border bg-white p-4"><summary className="cursor-pointer font-semibold">Exportar e arquivar logs antigos</summary>
  <p className="my-3 text-sm">Escolha o corte conforme a política da empresa. Os últimos 90 dias permanecem online. Cada arquivo contém até 5.000 registros; repita para lotes maiores.</p>
  <div className="flex flex-wrap gap-3"><input aria-label="Exportar logs anteriores a" type="date" value={corte} onChange={e=>setCorte(e.target.value)} className="rounded border p-2"/><button disabled={ocupado||!corte} className="rounded bg-blue-700 px-4 py-2 text-white" onClick={()=>void exportar()}>Exportar lote</button></div>
  {mensagem&&<p role="status" className="my-3">{mensagem}</p>}
  {lote&&<label className="my-3 block">Selecione o arquivo exportado para conferir e confirmar o arquivamento<input disabled={ocupado} type="file" accept="application/json,.json" onChange={e=>{const f=e.target.files?.[0];if(f)void confirmar(f);e.target.value="";}} className="mt-2 block"/></label>}
 </details>;
}
