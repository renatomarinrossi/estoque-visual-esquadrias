import { useEffect, useMemo, useState } from "react";

import { buscarProdutos } from "../../services/produtoSupabase";
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

type ProdutoCompra = {
  id: number;
  codigo: string;
  descricao: string;
  categoria: string | null;
  quantidade: number | string;
  estoque_minimo: number | string;
};

export default function Compras() {
  const [produtos, setProdutos] = useState<ProdutoCompra[]>([]);
  const [categoria, setCategoria] = useState("Todas");

  async function carregarCompras() {
    try {
      const dados = await buscarProdutos();
      const abaixoMinimo = (dados as ProdutoCompra[]).filter(
        (produto) => Number(produto.quantidade) <= Number(produto.estoque_minimo)
      );
      setProdutos(abaixoMinimo);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar a lista de compras.");
    }
  }

  useEffect(() => {
    void carregarCompras();
  }, []);

  const produtosFiltrados = useMemo(
    () => categoria === "Todas" ? produtos : produtos.filter((produto) => produto.categoria === categoria),
    [categoria, produtos]
  );

  async function gerarPDF() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();
    await adicionarCabecalhoPdf(doc, `Lista de Compras - ${categoria}`);
    doc.setFontSize(10);
    doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, 43);

    autoTable(doc, {
      startY: 49,
      head: [["Código", "Descrição", "Categoria", "Estoque", "Mínimo", "Comprar"]],
      body: produtosFiltrados.map((produto) => [
        produto.codigo,
        produto.descricao,
        produto.categoria || "-",
        Number(produto.quantidade),
        Number(produto.estoque_minimo),
        Number(produto.estoque_minimo) - Number(produto.quantidade),
      ]),
    });

    doc.save(`compras-${categoria}.pdf`);
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-900">Compras</h1>
        <button type="button" onClick={gerarPDF} className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700">Gerar PDF</button>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <label className="mb-2 block font-semibold">Categoria</label>
        <select value={categoria} onChange={(event) => setCategoria(event.target.value)} className="w-80 rounded-lg border p-2">
          <option>Todas</option>
          <option>Vidros</option><option>Alumínio</option><option>Acessórios</option><option>Ferramentas</option>
          <option>Parafusos/Brocas</option><option>Silicone/PU</option><option>Borrachas</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md">
        <table className="w-full min-w-[760px]">
          <thead>
            <tr className="border-b">
              <th className="border-r py-3 pr-2 text-left whitespace-nowrap">Código</th>
              <th className="border-r px-2 text-left">Descrição</th>
              <th className="border-r px-2 text-center whitespace-nowrap">Categ.</th>
              <th className="border-r px-2 text-center leading-tight whitespace-nowrap"><span className="block">Estoque</span><span className="block">Atual</span></th>
              <th className="border-r px-2 text-center leading-tight whitespace-nowrap"><span className="block">Estoque</span><span className="block">Mínimo</span></th>
              <th className="pl-2 text-center whitespace-nowrap">Comprar</th>
            </tr>
          </thead>
          <tbody>
            {produtosFiltrados.length === 0 ? (
              <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhum item precisa de reposição</td></tr>
            ) : produtosFiltrados.map((produto) => {
              const quantidade = Number(produto.quantidade);
              const minimo = Number(produto.estoque_minimo);
              return <tr key={produto.id} className="border-b"><td className="border-r py-2 pr-2">{produto.codigo}</td><td className="border-r px-2">{produto.descricao}</td><td className="border-r px-2 text-center">{produto.categoria || "-"}</td><td className="border-r px-2 text-center font-bold text-red-600">{quantidade}</td><td className="border-r px-2 text-center">{minimo}</td><td className="pl-2 text-center font-bold text-orange-600">{minimo - quantidade}</td></tr>;
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}


