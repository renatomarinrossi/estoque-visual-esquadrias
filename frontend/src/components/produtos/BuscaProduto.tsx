import { useEffect, useState } from "react";

type Props = {
  produtos: any[];
  onSelecionar: (produto: any) => void;
};

export default function BuscaProduto({
  produtos,
  onSelecionar,
}: Props) {
  const [texto, setTexto] =
    useState("");

  const [resultados, setResultados] =
    useState<any[]>([]);

  useEffect(() => {
    if (!texto.trim()) {
      setResultados([]);
      return;
    }

    const filtrados =
      produtos.filter((produto) =>
        produto.descricao
          .toLowerCase()
          .includes(
            texto.toLowerCase()
          )
      );

    setResultados(
      filtrados.slice(0, 15)
    );
  }, [texto, produtos]);

  function selecionarProduto(
    produto: any
  ) {
    setTexto(
      `${produto.codigo} - ${produto.descricao}`
    );

    setResultados([]);

    onSelecionar(produto);
  }

  return (
    <div className="relative">

      <input
        type="text"
        placeholder="Pesquisar produto..."
        value={texto}
        onChange={(e) =>
          setTexto(
            e.target.value
          )
        }
        className="w-full border rounded-lg p-2"
      />

      {resultados.length > 0 && (

        <div className="absolute z-50 bg-white border rounded-lg shadow-lg w-full max-h-72 overflow-y-auto">

          {resultados.map(
            (produto) => (

              <div
                key={
                  produto.codigo
                }
                onClick={() =>
                  selecionarProduto(
                    produto
                  )
                }
                className="p-2 cursor-pointer hover:bg-slate-100"
              >
                <strong>
                  {
                    produto.codigo
                  }
                </strong>

                {" - "}

                {
                  produto.descricao
                }
              </div>

            )
          )}

        </div>

      )}

    </div>
  );
}
