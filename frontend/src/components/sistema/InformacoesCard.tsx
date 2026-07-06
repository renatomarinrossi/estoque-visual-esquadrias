type Props = {
  versao: string;
  ultimaAtualizacao: string;
};

export default function InformacoesCard({
  versao,
  ultimaAtualizacao,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold text-blue-900 mb-5">
        Informações do Sistema
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between">

          <span className="font-semibold">
            Versão
          </span>

          <span>
            {versao}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">
            Última Atualização
          </span>

          <span>
            {ultimaAtualizacao}
          </span>

        </div>

      </div>

      <div className="border-t mt-6 pt-4 text-center text-gray-500 text-sm">

        © Visual Esquadrias

        <br />

        Controle de Estoque

      </div>

    </div>
  );
}
