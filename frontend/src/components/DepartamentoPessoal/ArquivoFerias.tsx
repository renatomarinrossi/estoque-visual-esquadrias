import { useEffect, useState } from "react";
import { supabase } from "../../services/supabase";
import { mensagemErroDP } from "../../services/departamentoPessoalSupabase";
import type { Ferias } from "../../types/DepartamentoPessoal";
import { dataBR, moeda } from "./utils";
import Paginacao from "../Paginacao";
export default function ArquivoFerias() {
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(0);
  const [registros, setRegistros] = useState<Ferias[]>([]);
  const [erro, setErro] = useState("");
  useEffect(() => {
    let ativo = true;
    if (aberto)
      void (async () => {
        const { data, error } = await supabase
          .from("dp_ferias")
          .select(
            "id,nome_funcionario,inicio,fim,valor_ferias,valor_terco,valor_abono,status,data_prevista_pagamento,data_prevista_terco,data_prevista_abono,pagamentos:dp_ferias_pagamentos(valor)",
          )
          .order("id", { ascending: false })
          .range(pagina * 50, pagina * 50 + 49);
        if (!ativo) return;
        if (error) setErro(mensagemErroDP(error));
        else {
          setErro("");
          setRegistros(data as unknown as Ferias[]);
        }
      })();
    return () => {
      ativo = false;
    };
  }, [aberto, pagina]);
  return (
    <section className="mt-4 rounded-lg border bg-white p-4">
      <button
        className="font-semibold text-blue-900"
        onClick={() => setAberto((a) => !a)}
      >
        Consultar programação antiga de férias
      </button>
      {aberto && (
        <>
          <p className="my-3 text-sm">
            Arquivo somente para consulta. Dias e pagamentos antigos foram
            migrados para o histórico de movimentações. Esta programação não
            desconta saldo novamente. Confira valores antigos ainda não pagos
            antes de lançar o pagamento no período correspondente.
          </p>
          {erro && <p role="alert">{erro}</p>}
          {registros.map((f) => (
            <div className="border-t py-3 text-sm" key={f.id}>
              <strong>
                #{f.id} · {f.nome_funcionario}
              </strong>
              <p>
                {dataBR(f.inicio)} a {dataBR(f.fim)} · {f.status}
              </p>
              <p>
                Férias: {moeda(f.valor_ferias)} (
                {dataBR(f.data_prevista_pagamento)}) · Terço:{" "}
                {moeda(f.valor_terco)} ({dataBR(f.data_prevista_terco)}) ·
                Abono: {moeda(f.valor_abono)} ({dataBR(f.data_prevista_abono)})
              </p>
              <p>
                Pagamentos no modelo antigo:{" "}
                {moeda(f.pagamentos.reduce((s, p) => s + Number(p.valor), 0))}
              </p>
            </div>
          ))}
          <Paginacao
            pagina={pagina}
            temMais={registros.length === 50}
            mudar={setPagina}
          />
        </>
      )}
    </section>
  );
}
