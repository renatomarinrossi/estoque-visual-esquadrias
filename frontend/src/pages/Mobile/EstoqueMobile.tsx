import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  LogOut,
  PackageSearch,
  RefreshCw,
  Search,
} from "lucide-react";

import useUsuario from "../../hooks/useUsuario";
import { buscarFornecedores } from "../../services/fornecedorSupabase";
import {
  buscarProdutos,
  registrarEntradaProduto,
  registrarSaidaProduto,
} from "../../services/produtoSupabase";
import { sairDoSistema } from "../../services/authUsuario";

type AbaMobile = "ESTOQUE" | "ENTRADA" | "SAIDA";

type ProdutoMobile = {
  id: number;
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number | string;
  estoque_minimo: number | string;
  fornecedor_id: number | null;
  preco_compra: number | string;
};

type FornecedorMobile = {
  id: number;
  nome_fantasia: string | null;
};

function formatarQuantidade(valor: number | string) {
  return Number(valor).toLocaleString("pt-BR", {
    maximumFractionDigits: 3,
  });
}

function ProdutoSelecionado({ produto }: { produto: ProdutoMobile }) {
  return (
    <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
        Produto selecionado
      </p>
      <p className="mt-1 font-semibold text-slate-900">{produto.descricao}</p>
      <p className="mt-1 text-sm text-slate-600">Código: {produto.codigo}</p>
      <p className="mt-3 text-sm text-slate-700">
        Estoque atual: {" "}
        <strong className={Number(produto.quantidade) < 0 ? "text-red-600" : "text-blue-900"}>
          {formatarQuantidade(produto.quantidade)} {produto.unidade}
        </strong>
      </p>
    </div>
  );
}

type SeletorProdutoProps = {
  produtos: ProdutoMobile[];
  produtoSelecionado: ProdutoMobile | undefined;
  onSelecionar: (produto: ProdutoMobile) => void;
};

function SeletorProduto({
  produtos,
  produtoSelecionado,
  onSelecionar,
}: SeletorProdutoProps) {
  const [busca, setBusca] = useState("");
  const termo = busca.trim().toLocaleLowerCase("pt-BR");
  const resultados = termo
    ? produtos
        .filter((produto) =>
          produto.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
          produto.descricao.toLocaleLowerCase("pt-BR").includes(termo)
        )
        .slice(0, 8)
    : [];

  function selecionar(produto: ProdutoMobile) {
    onSelecionar(produto);
    setBusca(`${produto.codigo} - ${produto.descricao}`);
  }

  return (
    <div className="relative mb-5">
      <label className="mb-2 block text-sm font-semibold text-slate-800">
        Produto
      </label>
      <div className="relative">
        <Search
          size={19}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Código ou descrição"
          className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
        />
      </div>

      {resultados.length > 0 && (
        <div className="absolute z-20 mt-2 max-h-72 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {resultados.map((produto) => (
            <button
              key={produto.id}
              type="button"
              onClick={() => selecionar(produto)}
              className="block w-full rounded-lg px-3 py-3 text-left hover:bg-slate-100"
            >
              <span className="block text-sm font-semibold text-slate-900">
                {produto.descricao}
              </span>
              <span className="block text-xs text-slate-500">
                {produto.codigo} · Estoque: {formatarQuantidade(produto.quantidade)} {produto.unidade}
              </span>
            </button>
          ))}
        </div>
      )}

      {busca && resultados.length === 0 && !produtoSelecionado && (
        <p className="mt-2 text-sm text-slate-500">Nenhum produto encontrado.</p>
      )}
    </div>
  );
}

export default function EstoqueMobile() {
  const usuario = useUsuario();
  const [aba, setAba] = useState<AbaMobile>("ESTOQUE");
  const [produtos, setProdutos] = useState<ProdutoMobile[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorMobile[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [buscaEstoque, setBuscaEstoque] = useState("");
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState("");
  const [fornecedorId, setFornecedorId] = useState("");
  const [precoCompra, setPrecoCompra] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function carregarDados() {
    setCarregando(true);

    try {
      const [produtosBanco, fornecedoresBanco] = await Promise.all([
        buscarProdutos(),
        buscarFornecedores(),
      ]);

      const produtosOrdenados = [...(produtosBanco as ProdutoMobile[])].sort(
        (a, b) => a.descricao.localeCompare(b.descricao, "pt-BR")
      );
      const fornecedoresOrdenados = [...(fornecedoresBanco as FornecedorMobile[])].sort(
        (a, b) =>
          (a.nome_fantasia ?? "").localeCompare(b.nome_fantasia ?? "", "pt-BR")
      );

      setProdutos(produtosOrdenados);
      setFornecedores(fornecedoresOrdenados);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os produtos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  const produtoSelecionado = produtos.find((produto) => produto.id === produtoId);

  const produtosFiltrados = useMemo(() => {
    const termo = buscaEstoque.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return produtos;

    return produtos.filter(
      (produto) =>
        produto.codigo.toLocaleLowerCase("pt-BR").includes(termo) ||
        produto.descricao.toLocaleLowerCase("pt-BR").includes(termo)
    );
  }, [buscaEstoque, produtos]);

  function selecionarProduto(produto: ProdutoMobile) {
    setProdutoId(produto.id);
    setFornecedorId(produto.fornecedor_id ? String(produto.fornecedor_id) : "");
    setPrecoCompra(
      Number(produto.preco_compra) > 0 ? String(produto.preco_compra) : ""
    );
  }

  function limparFormulario() {
    setProdutoId(null);
    setQuantidade("");
    setFornecedorId("");
    setPrecoCompra("");
  }

  async function registrarEntrada() {
    const quantidadeNumerica = Number(quantidade);
    const precoNumerico = Number(precoCompra);

    if (produtoId === null) {
      alert("Selecione um produto.");
      return;
    }

    if (!fornecedorId) {
      alert("Selecione um fornecedor.");
      return;
    }

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      alert("Informe uma quantidade maior que zero.");
      return;
    }

    if (!Number.isFinite(precoNumerico) || precoNumerico < 0) {
      alert("Informe um preço de compra válido.");
      return;
    }

    setSalvando(true);

    try {
      await registrarEntradaProduto(
        produtoId,
        quantidadeNumerica,
        Number(fornecedorId),
        precoNumerico
      );
      await carregarDados();
      limparFormulario();
      setAba("ESTOQUE");
      alert("Entrada registrada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao registrar entrada.");
    } finally {
      setSalvando(false);
    }
  }

  async function registrarSaida() {
    const quantidadeNumerica = Number(quantidade);

    if (produtoId === null) {
      alert("Selecione um produto.");
      return;
    }

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      alert("Informe uma quantidade maior que zero.");
      return;
    }

    setSalvando(true);

    try {
      await registrarSaidaProduto(produtoId, quantidadeNumerica);
      await carregarDados();
      limparFormulario();
      setAba("ESTOQUE");
      alert("Saída registrada com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao registrar saída.");
    } finally {
      setSalvando(false);
    }
  }

  async function sair() {
    try {
      await sairDoSistema();
      window.location.reload();
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível encerrar a sessão.");
    }
  }

  function abrirAba(novaAba: AbaMobile) {
    if (novaAba !== aba) limparFormulario();
    setAba(novaAba);
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-24 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-blue-800 bg-blue-900 px-4 py-4 text-white shadow-sm">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold leading-tight">Visual Esquadrias</h1>
            <p className="text-xs text-blue-200">Estoque móvel</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="max-w-28 truncate text-right text-xs text-blue-100">
              {usuario?.nome}
            </span>
            <button
              type="button"
              onClick={() => void sair()}
              className="rounded-lg border border-blue-300 p-2 text-white hover:bg-blue-800"
              aria-label="Sair do sistema"
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-lg p-4">
        {aba === "ESTOQUE" && (
          <section>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold text-blue-950">Consultar estoque</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {produtos.length} produto(s) cadastrado(s)
                </p>
              </div>
              <button
                type="button"
                onClick={() => void carregarDados()}
                disabled={carregando}
                className="rounded-xl bg-white p-3 text-blue-800 shadow-sm disabled:opacity-50"
                aria-label="Atualizar estoque"
                title="Atualizar"
              >
                <RefreshCw size={20} className={carregando ? "animate-spin" : ""} />
              </button>
            </div>

            <div className="relative mb-4">
              <Search
                size={20}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={buscaEstoque}
                onChange={(event) => setBuscaEstoque(event.target.value)}
                placeholder="Buscar por código ou produto"
                className="w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="space-y-3">
              {carregando && (
                <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                  Carregando estoque...
                </div>
              )}

              {!carregando && produtosFiltrados.length === 0 && (
                <div className="rounded-xl bg-white p-6 text-center text-slate-500 shadow-sm">
                  Nenhum produto encontrado.
                </div>
              )}

              {!carregando && produtosFiltrados.map((produto) => {
                const quantidadeProduto = Number(produto.quantidade);
                const estoqueMinimo = Number(produto.estoque_minimo);
                const corQuantidade = quantidadeProduto < 0
                  ? "text-red-600"
                  : quantidadeProduto <= estoqueMinimo
                    ? "text-amber-600"
                    : "text-green-700";

                return (
                  <article
                    key={produto.id}
                    className="rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {produto.descricao}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">Código: {produto.codigo}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className={`text-xl font-bold ${corQuantidade}`}>
                          {formatarQuantidade(produto.quantidade)}
                        </p>
                        <p className="text-xs text-slate-500">{produto.unidade}</p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {aba === "ENTRADA" && (
          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-green-800">Entrada de estoque</h2>
              <p className="mt-1 text-sm text-slate-600">
                Registre a chegada de produtos.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <SeletorProduto
                produtos={produtos}
                produtoSelecionado={produtoSelecionado}
                onSelecionar={selecionarProduto}
              />

              {produtoSelecionado && <ProdutoSelecionado produto={produtoSelecionado} />}

              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Fornecedor
                </label>
                <select
                  value={fornecedorId}
                  onChange={(event) => setFornecedorId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Selecione o fornecedor</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome_fantasia ?? "Fornecedor sem nome"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Preço de compra
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={precoCompra}
                    onChange={(event) => setPrecoCompra(event.target.value)}
                    placeholder="0,00"
                    className="w-full rounded-xl border border-slate-300 p-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-800">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    inputMode="decimal"
                    value={quantidade}
                    onChange={(event) => setQuantidade(event.target.value)}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-300 p-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() => void registrarEntrada()}
                disabled={salvando}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-4 font-semibold text-white hover:bg-green-700 disabled:bg-green-300"
              >
                <ArrowDownCircle size={21} />
                {salvando ? "Registrando..." : "Registrar entrada"}
              </button>
            </div>
          </section>
        )}

        {aba === "SAIDA" && (
          <section>
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-red-800">Saída de estoque</h2>
              <p className="mt-1 text-sm text-slate-600">
                Registre a retirada de produtos.
              </p>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <SeletorProduto
                produtos={produtos}
                produtoSelecionado={produtoSelecionado}
                onSelecionar={selecionarProduto}
              />

              {produtoSelecionado && <ProdutoSelecionado produto={produtoSelecionado} />}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-800">
                  Quantidade
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={quantidade}
                  onChange={(event) => setQuantidade(event.target.value)}
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 p-3 text-base outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="button"
                onClick={() => void registrarSaida()}
                disabled={salvando}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-4 font-semibold text-white hover:bg-red-700 disabled:bg-red-300"
              >
                <ArrowUpCircle size={21} />
                {salvando ? "Registrando..." : "Registrar saída"}
              </button>
            </div>
          </section>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-slate-200 bg-white px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-4px_18px_rgba(15,23,42,0.08)]">
        <div className="mx-auto grid max-w-lg grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => abrirAba("ESTOQUE")}
            className={`flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold ${
              aba === "ESTOQUE" ? "bg-blue-100 text-blue-800" : "text-slate-500"
            }`}
          >
            <PackageSearch size={21} />
            <span className="mt-1">Estoque</span>
          </button>
          <button
            type="button"
            onClick={() => abrirAba("ENTRADA")}
            className={`flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold ${
              aba === "ENTRADA" ? "bg-green-100 text-green-800" : "text-slate-500"
            }`}
          >
            <ArrowDownCircle size={21} />
            <span className="mt-1">Entrada</span>
          </button>
          <button
            type="button"
            onClick={() => abrirAba("SAIDA")}
            className={`flex flex-col items-center rounded-xl px-2 py-2 text-xs font-semibold ${
              aba === "SAIDA" ? "bg-red-100 text-red-800" : "text-slate-500"
            }`}
          >
            <ArrowUpCircle size={21} />
            <span className="mt-1">Saída</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
