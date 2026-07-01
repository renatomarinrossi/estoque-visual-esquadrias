import { useEffect, useState } from "react";

export default function Saida() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [codigo, setCodigo] = useState("");
  const [quantidade, setQuantidade] = useState("");

  useEffect(() => {
    const dados = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_produtos"
      ) || "[]"
    );

    setProdutos(dados);
  }, []);

  const produtoSelecionado =
    produtos.find(
      (p) => p.codigo === codigo
    );

  function registrarSaida() {
    const produtosAtualizados = [...produtos];

    const index =
      produtosAtualizados.findIndex(
        (p) => p.codigo === codigo
      );

    if (index === -1) {
      alert("Selecione um produto");
      return;
    }

    const estoqueAtual =
      produtosAtualizados[index]
        .quantidade;

    if (
      estoqueAtual -
        Number(quantidade) <
      0
    ) {
      alert(
        "Estoque insuficiente"
      );

      return;
    }

    produtosAtualizados[index].quantidade -=
      Number(quantidade);

    localStorage.setItem(
      "visual_esquadrias_produtos",
      JSON.stringify(produtosAtualizados)
    );

    setProdutos(produtosAtualizados);

    alert("Saída registrada");

    setCodigo("");
    setQuantidade("");
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Saída de Estoque
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-xl">

        <div className="mb-4">
          <label className="block mb-2">
            Produto
          </label>

          <select
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          >
            <option value="">
              Selecione
            </option>

            {produtos.map((produto) => (
              <option
                key={produto.codigo}
                value={produto.codigo}
              >
                {produto.codigo} - {produto.descricao}
              </option>
            ))}
          </select>
        </div>

        {produtoSelecionado && (
          <div className="mb-4 p-3 bg-slate-100 rounded">
            Estoque Atual:
            <strong>
              {" "}
              {produtoSelecionado.quantidade}
            </strong>
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2">
            Quantidade
          </label>

          <input
            type="number"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button
          onClick={registrarSaida}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
        >
          Registrar Saída
        </button>

      </div>
    </>
  );
}
