import { useEffect, useState } from "react";

import {
  buscarLixeira,
  excluirLixeira,
  restaurarProdutoLixeira,
  type ProdutoLixeira,
} from "../../services/produtoSupabase";

export default function Lixeira() {
  const [produtos, setProdutos] = useState<ProdutoLixeira[]>([]);

  async function carregarDados() {
    try {
      setProdutos(await buscarLixeira());
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar a lixeira.");
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  async function restaurarProduto(produto: ProdutoLixeira) {
    try {
      await restaurarProdutoLixeira(produto);
      await carregarDados();
      alert("Produto restaurado.");
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao restaurar produto.");
    }
  }

  async function excluirDefinitivo(produto: ProdutoLixeira) {
    if (!window.confirm("Excluir definitivamente? Esta ação não pode ser desfeita.")) return;

    try {
      await excluirLixeira(produto.id);
      await carregarDados();
      alert("Produto removido definitivamente.");
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao excluir produto.");
    }
  }

  return (
    <>
      <h1 className="mb-8 text-4xl font-bold text-blue-900">Lixeira</h1>
      <div className="rounded-xl bg-white p-6 shadow-md">
        <table className="w-full">
          <thead><tr className="border-b"><th className="py-3 text-left">Código</th><th className="text-left">Descrição</th><th>Data Exclusão</th><th>Ações</th></tr></thead>
          <tbody>
            {produtos.length === 0 ? (
              <tr><td colSpan={4} className="py-8 text-center text-gray-500">Lixeira vazia</td></tr>
            ) : produtos.map((produto) => (
              <tr key={produto.id} className="border-b"><td>{produto.codigo}</td><td>{produto.descricao}</td><td>{new Date(produto.data_exclusao).toLocaleDateString("pt-BR")}</td><td className="flex gap-2 py-2"><button type="button" onClick={() => void restaurarProduto(produto)} className="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700">Restaurar</button><button type="button" onClick={() => void excluirDefinitivo(produto)} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700">Excluir</button></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

