import { useEffect } from "react";
import { buscarProdutos } from "../../services/produtoSupabase";

export default function TesteSupabase() {
  useEffect(() => {
    console.log("COMPONENTE CARREGOU");

    async function testar() {
      try {
        const dados = await buscarProdutos();

        console.log("SUPABASE:", dados);
      } catch (erro) {
        console.error("ERRO:", erro);
      }
    }

    testar();
  }, []);

  return (
    <h1 className="text-3xl font-bold">
      Teste Supabase
    </h1>
  );
}
