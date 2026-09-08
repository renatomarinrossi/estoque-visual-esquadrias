import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../../services/supabase";
import { mensagemErroDP } from "../../services/departamentoPessoalSupabase";
import { botao, campo, dataBR, secundario } from "./utils";
import Paginacao from "../Paginacao";
import useUsuario from "../../hooks/useUsuario";

type Feriado = {
  id: number;
  data: string;
  descricao: string;
  abrangencia: string;
};
type Auditoria = {
  id: number;
  created_at: string;
  usuario_auth: string | null;
  tabela: string;
  registro_id: number;
  acao: string;
  antes: unknown;
  depois: unknown;
};
export default function ConfiguracaoDP() {
  const desenvolvedor = useUsuario()?.perfil === "DESENVOLVEDOR";
  const [aba, setAba] = useState<"" | "feriados" | "auditoria">("");
  const [ano, setAno] = useState(new Date().getFullYear());
  const [feriados, setFeriados] = useState<Feriado[]>([]);
  const [logs, setLogs] = useState<Auditoria[]>([]);
  const [pagina, setPagina] = useState(0);
  const [erro, setErro] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [revisao, setRevisao] = useState(0);
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (!aba || (aba === "auditoria" && !desenvolvedor)) return;
      setOcupado(true);
      setErro("");
      try {
        if (aba === "feriados") {
          const { data, error } = await supabase
            .from("dp_feriados")
            .select("id,data,descricao,abrangencia")
            .gte("data", `${ano}-01-01`)
            .lte("data", `${ano}-12-31`)
            .order("data");
          if (error) throw error;
          if (ativo) setFeriados(data ?? []);
        } else {
          const { data, error } = await supabase
            .from("dp_auditoria")
            .select(
              "id,created_at,usuario_auth,tabela,registro_id,acao,antes,depois",
            )
            .order("id", { ascending: false })
            .range(pagina * 50, pagina * 50 + 49);
          if (error) throw error;
          if (ativo) setLogs(data ?? []);
        }
      } catch (e) {
        if (ativo) setErro(mensagemErroDP(e));
      } finally {
        if (ativo) setOcupado(false);
      }
    }
    void carregar();
    return () => {
      ativo = false;
    };
  }, [aba, ano, pagina, revisao, desenvolvedor]);
  async function adicionar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    setOcupado(true);
    setErro("");
    try {
      const { error } = await supabase
        .from("dp_feriados")
        .insert({
          data: String(d.get("data")),
          descricao: String(d.get("descricao")).trim(),
          abrangencia: String(d.get("abrangencia")),
        });
      if (error) throw error;
      form.reset();
      setRevisao((r) => r + 1);
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  async function remover(f: Feriado) {
    if (
      !window.confirm(
        `Remover ${f.descricao} (${dataBR(f.data)}) do calendário?`,
      )
    )
      return;
    setOcupado(true);
    try {
      const { error } = await supabase
        .from("dp_feriados")
        .delete()
        .eq("id", f.id);
      if (error) throw error;
      setRevisao((r) => r + 1);
    } catch (e) {
      setErro(mensagemErroDP(e));
    } finally {
      setOcupado(false);
    }
  }
  return (
    <section className="mt-6 rounded-xl border bg-white p-5">
      <div className="flex flex-wrap gap-3">
        <button
          className={secundario}
          onClick={() => setAba(aba === "feriados" ? "" : "feriados")}
        >
          Calendário de Fernandópolis/SP
        </button>
        {desenvolvedor && (
          <button
            className={secundario}
            onClick={() => setAba(aba === "auditoria" ? "" : "auditoria")}
          >
            Auditoria do Departamento Pessoal
          </button>
        )}
      </div>
      {erro && (
        <p role="alert" className="my-3 text-red-700">
          {erro}
        </p>
      )}
      {aba === "feriados" && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">
            Calendário de feriados usado no quinto dia útil. Pontos facultativos
            não são incluídos. Alterações valem para novas folhas; revise
            vencimentos de folhas já geradas.
          </p>
          <label>
            Ano
            <input
              aria-label="Ano do calendário"
              className={campo}
              type="number"
              min="2026"
              max="2036"
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
            />
          </label>
          <ul className="grid gap-2 md:grid-cols-2">
            {feriados.map((f) => (
              <li
                key={f.id}
                className="flex items-center justify-between rounded border p-2 text-sm"
              >
                <span>
                  {dataBR(f.data)} · {f.descricao}
                </span>
                <button
                  disabled={ocupado}
                  className="text-red-700"
                  onClick={() => void remover(f)}
                >
                  Remover
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={(e) => void adicionar(e)}>
            <fieldset disabled={ocupado} className="grid gap-3 md:grid-cols-4">
              <input
                aria-label="Data do feriado"
                className={campo}
                type="date"
                name="data"
                required
                min={`${ano}-01-01`}
                max={`${ano}-12-31`}
              />
              <input
                aria-label="Nome do feriado"
                className={campo}
                name="descricao"
                required
                maxLength={160}
                placeholder="Nome do feriado"
              />
              <select
                aria-label="Abrangência"
                className={campo}
                name="abrangencia"
              >
                <option value="MUNICIPAL">Municipal</option>
                <option value="ESTADUAL">Estadual</option>
                <option value="NACIONAL">Nacional</option>
              </select>
              <button className={botao}>Adicionar feriado</button>
            </fieldset>
          </form>
        </div>
      )}
      {aba === "auditoria" && desenvolvedor && (
        <div className="mt-4 space-y-2">
          {logs.map((l) => (
            <details key={l.id} className="rounded border p-3 text-sm">
              <summary>
                {new Date(l.created_at).toLocaleString("pt-BR")} · {l.acao} ·{" "}
                {l.tabela} #{l.registro_id}
              </summary>
              <p className="mt-2 break-all">
                Usuário Auth: {l.usuario_auth ?? "Sistema"}
              </p>
              <div className="grid gap-3 md:grid-cols-2">
                <pre className="overflow-auto">
                  {JSON.stringify(l.antes, null, 2)}
                </pre>
                <pre className="overflow-auto">
                  {JSON.stringify(l.depois, null, 2)}
                </pre>
              </div>
            </details>
          ))}
          <Paginacao
            pagina={pagina}
            temMais={logs.length === 50}
            ocupado={ocupado}
            mudar={setPagina}
          />
        </div>
      )}
    </section>
  );
}
