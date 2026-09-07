export default function Paginacao({pagina,temMais,ocupado=false,mudar}:{pagina:number;temMais:boolean;ocupado?:boolean;mudar:(pagina:number)=>void}) {
 return <nav aria-label="Paginação" className="my-4 flex items-center justify-end gap-4">
  <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={ocupado||pagina===0} onClick={()=>mudar(pagina-1)}>Anterior</button>
  <span>Página {pagina+1}</span>
  <button className="rounded border px-3 py-2 disabled:opacity-40" disabled={ocupado||!temMais} onClick={()=>mudar(pagina+1)}>Próxima</button>
 </nav>;
}
