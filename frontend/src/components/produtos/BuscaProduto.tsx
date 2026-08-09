import { useEffect, useState } from "react";

export type ProdutoBuscavel = {
  id: number;
  codigo: string;
  descricao: string;
};

type Props = {
  produtos: ProdutoBuscavel[];
  onSelecionar: (produto: ProdutoBuscavel) => void;
};

export default function BuscaProduto({ produtos, onSelecionar }: Props) {
  const [texto, setTexto] = useState("");
  const [resultados, setResultados] = useState<ProdutoBuscavel[]>([]);

  useEffect(() => {
    const termo = texto.trim().toLocaleLowerCase("pt-BR");

    if (!termo) {
      setResultados([]);
      return;
    }

    const filtrados = produtos.filter((produto) => {
      const codigo = produto.codigo.toLocaleLowerCase("pt-BR");
      const descricao = produto.descricao.toLocaleLowerCase("pt-BR");

      return codigo.includes(termo) || descricao.includes(termo);
    });

    setResultados(filtrados.slice(0, 15));
  }, [produtos, texto]);

  function selecionarProduto(produto: ProdutoBuscavel) {
    setTexto(`${produto.codigo} - ${produto.descricao}`);
    setResultados([]);
    onSelecionar(produto);
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Pesquisar produto..."
        value={texto}
        onChange={(event) => setTexto(event.target.value)}
        className="w-full border rounded-lg p-2"
      />

      {resultados.length > 0 && (
        <div className="absolute z-50 w-full max-h-72 overflow-y-auto rounded-lg border bg-white shadow-lg">
          {resultados.map((produto) => (
            <button
              key={produto.id}
              type="button"
              onClick={() => selecionarProduto(produto)}
              className="block w-full p-2 text-left hover:bg-slate-100"
            >
              <strong>{produto.codigo}</strong> - {produto.descricao}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

