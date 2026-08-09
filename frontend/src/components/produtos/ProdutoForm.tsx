import { useEffect, useState } from "react";

import { buscarFornecedores } from "../../services/fornecedorSupabase";
import type { Fornecedor } from "../../types/fornecedor";
import type { Produto } from "../../types/produto";

type Props = {
  onSalvar: (produto: Produto) => void;
  onCancelar: () => void;
  produtoInicial?: Produto | null;
};

function criarProdutoVazio(): Produto {
  return {
    codigo: "",
    descricao: "",
    categoria: "",
    unidade: "UN",
    quantidade: 0,
    estoqueMinimo: 0,
    precoCompra: 0,
    observacao: "",
    fornecedorId: undefined,
  };
}

export default function ProdutoForm({ onSalvar, onCancelar, produtoInicial }: Props) {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [produto, setProduto] = useState<Produto>(produtoInicial || criarProdutoVazio());

  useEffect(() => {
    async function carregarFornecedores() {
      try {
        setFornecedores(await buscarFornecedores());
      } catch (erro) {
        console.error(erro);
        alert("Não foi possível carregar os fornecedores.");
      }
    }

    void carregarFornecedores();
  }, []);

  useEffect(() => {
    setProduto(produtoInicial || criarProdutoVazio());
  }, [produtoInicial]);

  function salvar() {
    if (!produto.codigo.trim() || !produto.descricao.trim()) {
      alert("Informe o código e a descrição do produto.");
      return;
    }

    if (!produto.categoria) {
      alert("Selecione uma categoria.");
      return;
    }

    if (produto.estoqueMinimo < 0 || produto.precoCompra < 0) {
      alert("Estoque mínimo e preço não podem ser negativos.");
      return;
    }

    onSalvar({ ...produto, codigo: produto.codigo.trim(), descricao: produto.descricao.trim() });
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-xl font-semibold">{produtoInicial ? "Editar Produto" : "Cadastro de Produto"}</h2>

      <div className="grid grid-cols-4 gap-4">
        <div><label className="mb-2 block">Código</label><input placeholder="Código" className="w-full rounded-lg border p-2" value={produto.codigo} onChange={(event) => setProduto({ ...produto, codigo: event.target.value })} /></div>
        <div><label className="mb-2 block">Descrição</label><input placeholder="Descrição" className="w-full rounded-lg border p-2" value={produto.descricao} onChange={(event) => setProduto({ ...produto, descricao: event.target.value })} /></div>
        <div>
          <label className="mb-2 block">Categoria</label>
          <select className="w-full rounded-lg border p-2" value={produto.categoria} onChange={(event) => setProduto({ ...produto, categoria: event.target.value })}>
            <option value="">Selecione</option><option>Vidros</option><option>Alumínio</option><option>Acessórios</option><option>Ferramentas</option><option>Parafusos/Brocas</option><option>Silicone/PU</option><option>Borrachas</option>
          </select>
        </div>
        <div>
          <label className="mb-2 block">Unidade</label>
          <select className="w-full rounded-lg border p-2" value={produto.unidade} onChange={(event) => setProduto({ ...produto, unidade: event.target.value })}>
            <option>UN</option><option>Barra</option><option>Kg</option><option>M²</option><option>M³</option><option>Caixa</option>
          </select>
        </div>
        <div><label className="mb-2 block">Quantidade</label><input type="number" className="w-full rounded-lg border p-2" value={produto.quantidade} onChange={(event) => setProduto({ ...produto, quantidade: Number(event.target.value) })} /></div>
        <div><label className="mb-2 block">Estoque Mínimo</label><input type="number" min="0" className="w-full rounded-lg border p-2" value={produto.estoqueMinimo} onChange={(event) => setProduto({ ...produto, estoqueMinimo: Number(event.target.value) })} /></div>
        <div><label className="mb-2 block">Preço de Compra</label><input type="number" min="0" step="0.01" className="w-full rounded-lg border p-2" value={produto.precoCompra} onChange={(event) => setProduto({ ...produto, precoCompra: Number(event.target.value) })} /></div>
        <div>
          <label className="mb-2 block">Fornecedor</label>
          <select className="w-full rounded-lg border p-2" value={produto.fornecedorId || ""} onChange={(event) => setProduto({ ...produto, fornecedorId: event.target.value ? Number(event.target.value) : undefined })}>
            <option value="">Selecione</option>
            {fornecedores.map((fornecedor) => <option key={fornecedor.id} value={fornecedor.id}>{fornecedor.nome_fantasia}</option>)}
          </select>
        </div>
        <div className="col-span-4"><label className="mb-2 block">Observação</label><input className="w-full rounded-lg border p-2" value={produto.observacao} onChange={(event) => setProduto({ ...produto, observacao: event.target.value })} /></div>
      </div>

      <div className="mt-6 flex gap-3">
        <button type="button" onClick={salvar} className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700">Salvar</button>
        <button type="button" onClick={onCancelar} className="rounded-lg bg-gray-300 px-5 py-2 hover:bg-gray-400">Cancelar</button>
      </div>
    </div>
  );
}

