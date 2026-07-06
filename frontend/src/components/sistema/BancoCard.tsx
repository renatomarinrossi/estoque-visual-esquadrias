type Props = {
  status: "ONLINE" | "OFFLINE";
};

export default function BancoCard({
  status,
}: Props) {
  const online = status === "ONLINE";

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold text-blue-900 mb-5">
        Banco de Dados
      </h2>

      <div className="space-y-4">

        <div className="flex justify-between items-center">

          <span className="font-semibold">
            Status
          </span>

          <span
            className={`font-bold ${
              online
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {online
              ? "🟢 ONLINE"
              : "🔴 OFFLINE"}
          </span>

        </div>

        <div className="flex justify-between">

          <span className="font-semibold">
            Servidor
          </span>

          <span>
            Supabase
          </span>

        </div>

      </div>

    </div>
  );
}