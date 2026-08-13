import { useCallback, useEffect, useState } from "react";

import {
  buscarMovimentacoesEstoque,
  type FiltrosMovimentacao,
  type MovimentacaoEstoque,
} from "../../services/movimentacaoEstoqueSupabase";

function formatarData(data: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

function criarFiltrosIniciais(): FiltrosMovimentacao {
  const agora = new Date();

  return {
    dataInicial: new Date(agora.getFullYear(), agora.getMonth(), 1)
      .toISOString()
      .slice(0, 10),
    dataFinal: agora.toISOString().slice(0, 10),
    produto: "",
    tipo: "",
  };
}

export default function Movimentacoes() {
  const [movimentacoes, setMovimentacoes] = useState<MovimentacaoEstoque[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [filtros, setFiltros] = useState<FiltrosMovimentacao>(criarFiltrosIniciais);

  const carregar = useCallback(async (filtrosDaConsulta: FiltrosMovimentacao) => {
    setCarregando(true);
    try {
      setMovimentacoes(await buscarMovimentacoesEstoque(filtrosDaConsulta));
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar as movimentações.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar(criarFiltrosIniciais());
  }, [carregar]);

  function atualizarFiltro(campo: keyof FiltrosMovimentacao, valor: string) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  function limparFiltros() {
    setFiltros({ dataInicial: "", dataFinal: "", produto: "", tipo: "" });
  }

  return (
    <>
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Movimentações de Estoque</h1>
        <p className="mt-2 text-slate-600">
          Histórico automático das entradas e saídas registradas no sistema.
        </p>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="mb-2 block font-medium">Data inicial</label>
            <input type="date" value={filtros.dataInicial ?? ""} onChange={(event) => atualizarFiltro("dataInicial", event.target.value)} className="w-full rounded-lg border p-2" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Data final</label>
            <input type="date" value={filtros.dataFinal ?? ""} onChange={(event) => atualizarFiltro("dataFinal", event.target.value)} className="w-full rounded-lg border p-2" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Produto</label>
            <input value={filtros.produto ?? ""} onChange={(event) => atualizarFiltro("produto", event.target.value)} placeholder="Código ou descrição" className="w-full rounded-lg border p-2" />
          </div>
          <div>
            <label className="mb-2 block font-medium">Tipo</label>
            <select value={filtros.tipo ?? ""} onChange={(event) => atualizarFiltro("tipo", event.target.value)} className="w-full rounded-lg border p-2">
              <option value="">Todos</option>
              <option value="ENTRADA">Entradas</option>
              <option value="SAIDA">Saídas</option>
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="button" onClick={() => void carregar(filtros)} className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800">Filtrar</button>
            <button type="button" onClick={limparFiltros} className="rounded-lg bg-slate-500 px-4 py-2 text-white hover:bg-slate-600">Limpar</button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-md">
        <table className="w-full min-w-[900px]">
          <thead className="bg-blue-900 text-left text-white">
            <tr>
              <th className="p-4">Data e hora</th>
              <th className="p-4">Produto</th>
              <th className="p-4">Tipo</th>
              <th className="p-4 text-right">Quantidade</th>
              <th className="p-4 text-right">Saldo anterior</th>
              <th className="p-4 text-right">Saldo resultante</th>
              <th className="p-4">Responsável</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={7} className="p-6 text-center">Carregando...</td></tr>}
            {!carregando && movimentacoes.length === 0 && <tr><td colSpan={7} className="p-6 text-center text-slate-500">Nenhuma movimentação encontrada.</td></tr>}
            {movimentacoes.map((movimentacao) => (
              <tr key={movimentacao.id} className="border-t">
                <td className="p-4">{formatarData(movimentacao.data_movimentacao)}</td>
                <td className="p-4"><div className="font-medium">{movimentacao.produtos?.descricao ?? "Produto removido"}</div><div className="text-sm text-slate-500">{movimentacao.produtos?.codigo ?? "-"}</div></td>
                <td className="p-4"><span className={`rounded-full px-3 py-1 text-sm font-semibold ${movimentacao.tipo === "ENTRADA" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{movimentacao.tipo}</span></td>
                <td className="p-4 text-right font-semibold">{movimentacao.quantidade}</td>
                <td className="p-4 text-right">{movimentacao.saldo_anterior}</td>
                <td className={`p-4 text-right font-semibold ${movimentacao.saldo_resultante < 0 ? "text-red-600" : ""}`}>{movimentacao.saldo_resultante}</td>
                <td className="p-4">{movimentacao.usuarios?.nome ?? "Usuário não identificado"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

