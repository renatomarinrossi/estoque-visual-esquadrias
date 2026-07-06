type Props = {
  ultimoBackup: string;
  onBackup: () => void;
};

export default function BackupCard({
  ultimoBackup,
  onBackup,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold text-blue-900 mb-5">
        Backup
      </h2>

      <button
        onClick={onBackup}
        className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
      >
        Fazer Backup
      </button>

      <div className="mt-6">

        <p className="font-semibold">
          Último Backup
        </p>

        <p className="text-gray-600 mt-1">
          {ultimoBackup}
        </p>

      </div>

    </div>
  );
}
