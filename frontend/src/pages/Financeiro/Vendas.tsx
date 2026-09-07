import Paginacao from "../../components/Paginacao";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";
import {
  buscarVendas,
  arquivarVenda,
  excluirVenda,
  restaurarVenda,
  salvarVendaComParcelas,
} from "../../services/vendaSupabase";
import VendaForm from "../../components/Financeiro/VendaForm";
import VendaTable from "../../components/Financeiro/VendaTable";

function criarVendaVazia(): Venda {
  return {
    data_venda: new Date().toISOString().split("T")[0],
    cliente: "",
    valor_total: 0,
    responsavel: "",
    endereco: "",
    cidade: "",
    status: "A_RECEBER",
    observacoes: "",
  };
}

function mensagemErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

type Props = {
  obrasFinalizadas?: boolean;
};

export default function Vendas({ obrasFinalizadas = false }: Props) {
  const [pagina, setPagina] = useState(0);
  const [carregando, setCarregando] = useState(false);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [venda, setVenda] = useState<Venda>(criarVendaVazia);
  const [busca, setBusca] = useState("");
  const [termoBusca, setTermoBusca] = useState("");
  const sequencia = useRef(0);

  const carregarDados = useCallback(async () => {
    const pedido = ++sequencia.current;
    setCarregando(true);
    try {
      const dados = await buscarVendas(obrasFinalizadas, pagina, termoBusca);
      if (pedido === sequencia.current) setVendas(dados);
    } catch (erro) {
      if (pedido !== sequencia.current) return;
      console.error(erro);
      alert("Não foi possível carregar as vendas.");
    } finally {
      if (pedido === sequencia.current) setCarregando(false);
    }
  }, [obrasFinalizadas, pagina, termoBusca]);

  useEffect(() => {
    const controle = sequencia;
    void carregarDados();
    return () => {
      controle.current++;
    };
  }, [carregarDados]);

  const vendasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return vendas;

    return vendas.filter((item) =>
      item.cliente.toLocaleLowerCase("pt-BR").includes(termo),
    );
  }, [termoBusca, vendas]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPagina(0);
    setTermoBusca(busca);
  }

  function limparBusca() {
    setBusca("");
    setPagina(0);
    setTermoBusca("");
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setVenda(criarVendaVazia());
  }

  async function salvarVenda(dadosVenda: Venda, parcelas: VendaParcela[]) {
    try {
      await salvarVendaComParcelas(dadosVenda, parcelas);
      await carregarDados();
      fecharFormulario();
    } catch (erro) {
      console.error(erro);
      alert(mensagemErro(erro, "Erro ao salvar venda."));
    }
  }

  function editarVenda(item: Venda) {
    setVenda({ ...item });
    setMostrarFormulario(true);
  }

  async function removerVenda(item: Venda) {
    if (!item.id || !window.confirm(`Excluir a venda de ${item.cliente}?`)) {
      return;
    }

    try {
      await excluirVenda(item.id);
      await carregarDados();
    } catch (erro) {
      console.error(erro);
      alert(mensagemErro(erro, "Erro ao excluir venda."));
    }
  }

  async function arquivarVendaConcluida(item: Venda) {
    if (!item.id) return;

    await arquivarVenda(item.id);
    await carregarDados();
  }

  async function restaurarVendaArquivada(item: Venda) {
    if (!item.id) return;
    if (
      !window.confirm(
        `Restaurar a obra de ${item.cliente} para a listagem de vendas?`,
      )
    ) {
      return;
    }

    try {
      await restaurarVenda(item.id);
      await carregarDados();
    } catch (erro) {
      console.error(erro);
      alert(mensagemErro(erro, "Não foi possível restaurar a obra."));
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">
            {obrasFinalizadas ? "Obras Finalizadas" : "Vendas"}
          </h1>
          <p className="mt-1 text-gray-600">
            {obrasFinalizadas
              ? "Histórico de obras recebidas e finalizadas."
              : "Vendas, parcelas e recebimentos."}
          </p>
        </div>
        {!obrasFinalizadas && (
          <button
            type="button"
            onClick={() => {
              setVenda(criarVendaVazia());
              setMostrarFormulario(true);
            }}
            className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
          >
            Nova venda
          </button>
        )}
      </div>

      <form
        onSubmit={buscar}
        className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-5 shadow-md sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-2 block font-semibold" htmlFor="buscar-venda">
            Buscar venda
          </label>
          <input
            id="buscar-venda"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar pelo nome do cliente"
            className="w-full rounded-lg border p-3"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={limparBusca}
            className="rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-700 hover:bg-gray-50"
          >
            Limpar
          </button>
        </div>
      </form>

      {!obrasFinalizadas && mostrarFormulario && (
        <VendaForm
          venda={venda}
          setVenda={setVenda}
          onSalvar={salvarVenda}
          onCancelar={fecharFormulario}
        />
      )}

      <VendaTable
        vendas={vendasFiltradas}
        onAtualizar={carregarDados}
        obrasFinalizadas={obrasFinalizadas}
        onArquivar={obrasFinalizadas ? undefined : arquivarVendaConcluida}
        onEditar={obrasFinalizadas ? undefined : editarVenda}
        onExcluir={obrasFinalizadas ? undefined : removerVenda}
        onRestaurar={obrasFinalizadas ? restaurarVendaArquivada : undefined}
      />
      <Paginacao
        pagina={pagina}
        temMais={vendas.length === 50}
        ocupado={carregando}
        mudar={setPagina}
      />
    </>
  );
}
