import { useEffect, useState } from "react";

import BuscaProduto, {
  type ProdutoBuscavel,
} from "../../components/produtos/BuscaProduto";
import { buscarFornecedores } from "../../services/fornecedorSupabase";
import {
  buscarProdutos,
  registrarEntradaProduto,
} from "../../services/produtoSupabase";

type ProdutoEstoque = ProdutoBuscavel & {
  quantidade: number | string;
  fornecedor_id: number | null;
  preco_compra: number | string;
};

type FornecedorResumo = {
  id: number;
  nome_fantasia: string;
};

export default function Entrada() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [fornecedores, setFornecedores] = useState<FornecedorResumo[]>([]);
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [fornecedorId, setFornecedorId] = useState("");
  const [precoCompra, setPrecoCompra] = useState("");
  const [quantidade, setQuantidade] = useState("");

  async function carregarDados() {
    try {
      const [produtosBanco, fornecedoresBanco] = await Promise.all([
        buscarProdutos(),
        buscarFornecedores(),
      ]);

      const produtosOrdenados = (produtosBanco as ProdutoEstoque[]).sort((a, b) =>
        a.descricao.localeCompare(b.descricao, "pt-BR")
      );

      setProdutos(produtosOrdenados);
      setFornecedores(fornecedoresBanco as FornecedorResumo[]);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os dados de entrada.");
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  const produtoSelecionado = produtos.find((produto) => produto.id === produtoId);

  useEffect(() => {
    if (!produtoSelecionado) return;

    setFornecedorId(produtoSelecionado.fornecedor_id ? String(produtoSelecionado.fornecedor_id) : "");
    setPrecoCompra(produtoSelecionado.preco_compra ? String(produtoSelecionado.preco_compra) : "");
  }, [produtoSelecionado]);

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

    try {
      await registrarEntradaProduto(
        produtoId,
        quantidadeNumerica,
        Number(fornecedorId),
        precoNumerico
      );

      alert("Entrada registrada.");
      setProdutoId(null);
      setFornecedorId("");
      setPrecoCompra("");
      setQuantidade("");
      await carregarDados();
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao registrar entrada.");
    }
  }

  return (
    <>
      <h1 className="mb-8 text-4xl font-bold text-blue-900">Entrada de Estoque</h1>

      <div className="max-w-xl rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4">
          <label className="mb-2 block">Produto</label>
          <BuscaProduto produtos={produtos} onSelecionar={(produto) => setProdutoId(produto.id)} />
        </div>

        {produtoSelecionado && (
          <div className="mb-4 rounded bg-slate-100 p-3">
            Estoque Atual: <strong>{produtoSelecionado.quantidade}</strong>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block">Fornecedor</label>
          <select value={fornecedorId} onChange={(event) => setFornecedorId(event.target.value)} className="w-full rounded-lg border p-2">
            <option value="">Selecione</option>
            {fornecedores.map((fornecedor) => (
              <option key={fornecedor.id} value={fornecedor.id}>
                {fornecedor.nome_fantasia}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-4">
          <label className="mb-2 block">Preço Compra</label>
          <input type="number" min="0" step="0.01" value={precoCompra} onChange={(event) => setPrecoCompra(event.target.value)} className="w-full rounded-lg border p-2" />
        </div>

        <div className="mb-4">
          <label className="mb-2 block">Quantidade</label>
          <input type="number" min="0" step="any" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} className="w-full rounded-lg border p-2" />
        </div>

        <button type="button" onClick={() => void registrarEntrada()} className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700">
          Registrar Entrada
        </button>
      </div>
    </>
  );
}

