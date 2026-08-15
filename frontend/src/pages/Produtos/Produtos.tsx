import { useEffect, useMemo, useState } from "react";

import ProdutoForm from "../../components/produtos/ProdutoForm";
import ProdutoTable from "../../components/produtos/ProdutoTable";
import type { Produto } from "../../types/produto";
import {
  atualizarProduto,
  buscarProdutos,
  inserirProduto,
  moverParaLixeira,
} from "../../services/produtoSupabase";
import { buscarFornecedores } from "../../services/fornecedorSupabase";
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

type ProdutoBanco = {
  id: number;
  codigo: string;
  descricao: string;
  categoria: string | null;
  unidade: string;
  quantidade: number | string;
  estoque_minimo: number | string;
  preco_compra: number | string;
  observacao: string | null;
  fornecedor_id: number | null;
  ultima_entrada: string | null;
};

type FornecedorResumo = {
  id: number;
  nome_fantasia: string | null;
};

export default function Produtos() {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [categoria, setCategoria] = useState("Todas");
  const [produtos, setProdutos] = useState<Produto[]>([]);

  async function carregarDados() {
    try {
      const [dados, fornecedores] = await Promise.all([
        buscarProdutos() as Promise<ProdutoBanco[]>,
        buscarFornecedores() as Promise<FornecedorResumo[]>,
      ]);

      const produtosConvertidos = dados.map((produto) => {
        const fornecedor = fornecedores.find(
          (item) => item.id === produto.fornecedor_id
        );

        return {
          id: produto.id,
          codigo: produto.codigo,
          descricao: produto.descricao,
          categoria: produto.categoria || "",
          unidade: produto.unidade,
          quantidade: Number(produto.quantidade),
          estoqueMinimo: Number(produto.estoque_minimo),
          precoCompra: Number(produto.preco_compra),
          observacao: produto.observacao || "",
          fornecedorId: produto.fornecedor_id,
          fornecedorNome: fornecedor?.nome_fantasia || "-",
          ultimaEntrada: produto.ultima_entrada || "",
        } satisfies Produto;
      });

      setProdutos(produtosConvertidos);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os produtos.");
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  async function salvarProduto(produto: Produto) {
    try {
      if (produtoEditando) {
        await atualizarProduto(produto);
        setProdutoEditando(null);
      } else {
        await inserirProduto(produto);
      }

      await carregarDados();
      setMostrarFormulario(false);
    } catch (erro) {
      console.error(erro);
      alert("Erro ao salvar produto.");
    }
  }

  function editarProduto(produto: Produto) {
    setProdutoEditando(produto);
    setMostrarFormulario(true);
  }

  async function excluirProduto(produto: Produto) {
    if (!window.confirm(`Excluir o produto ${produto.descricao}?`)) return;

    try {
      await moverParaLixeira(produto);
      await carregarDados();
      alert("Produto enviado para a lixeira.");
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao excluir produto.");
    }
  }

  const produtosFiltrados = useMemo(() => {
    const texto = pesquisa.trim().toLocaleLowerCase("pt-BR");

    return produtos
      .filter((produto) => {
        const pesquisaOk =
          !texto ||
          produto.codigo.toLocaleLowerCase("pt-BR").includes(texto) ||
          produto.descricao.toLocaleLowerCase("pt-BR").includes(texto);
        const categoriaOk = categoria === "Todas" || produto.categoria === categoria;

        return pesquisaOk && categoriaOk;
      })
      .sort((produtoA, produtoB) =>
        produtoA.descricao.localeCompare(produtoB.descricao, "pt-BR", {
          sensitivity: "base",
        })
      );
  }, [categoria, pesquisa, produtos]);

  async function gerarPDF() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();
    await adicionarCabecalhoPdf(doc, `Relatório de Produtos - ${categoria}`);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 43);

    autoTable(doc, {
      startY: 49,
      head: [["Código", "Descrição", "Categoria", "Unidade", "Estoque", "Mínimo", "Preço Compra"]],
      body: produtosFiltrados.map((produto) => [
        produto.codigo,
        produto.descricao,
        produto.categoria || "-",
        produto.unidade,
        produto.quantidade,
        produto.estoqueMinimo,
        `R$ ${produto.precoCompra.toFixed(2)}`,
      ]),
    });

    doc.save(`produtos-${categoria}.pdf`);
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-900">Produtos</h1>
        <div className="flex gap-3">
          <button type="button" onClick={gerarPDF} className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700">Gerar PDF</button>
          <button type="button" onClick={() => { setProdutoEditando(null); setMostrarFormulario(true); }} className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800">Novo produto</button>
        </div>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="Pesquisar..." value={pesquisa} onChange={(event) => setPesquisa(event.target.value)} className="w-full rounded-xl border bg-white p-4" />
      </div>

      <div className="mb-6">
        <label className="mb-2 block font-semibold">Categoria</label>
        <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="w-80 rounded-xl border bg-white p-3">
          <option>Todas</option>
          <option>Vidros</option>
          <option>Alumínio</option>
          <option>Acessórios</option>
          <option>Ferramentas</option>
          <option>Parafusos/Brocas</option>
          <option>Silicone/PU</option>
          <option>Borrachas</option>
        </select>
      </div>

      {mostrarFormulario && <ProdutoForm produtoInicial={produtoEditando} onSalvar={salvarProduto} onCancelar={() => { setMostrarFormulario(false); setProdutoEditando(null); }} />}

      <ProdutoTable produtos={produtosFiltrados} onExcluir={excluirProduto} onEditar={editarProduto} />
    </>
  );
}

