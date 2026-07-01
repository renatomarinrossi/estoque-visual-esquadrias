import { useState } from "react";

export default function Entrada() {
  const [codigo, setCodigo] = useState("");
  const [quantidade, setQuantidade] = useState("");

  function registrarEntrada() {
    const produtos = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_produtos"
      ) || "[]"
    );

    const index = produtos.findIndex(
      (p: any) => p.codigo === codigo
    );

    if (index === -1) {
      alert("Produto não encontrado");
      return;
    }

    produtos[index].quantidade += Number(
      quantidade
    );

    localStorage.setItem(
      "visual_esquadrias_produtos",
      JSON.stringify(produtos)
    );

    alert("Entrada registrada");

    setCodigo("");
    setQuantidade("");
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Entrada de Estoque
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-xl">

        <div className="mb-4">

          <label className="block mb-2">
            Código do Produto
          </label>

          <input
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          />

        </div>

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
          onClick={registrarEntrada}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Registrar Entrada
        </button>

      </div>
    </>
  );
}
