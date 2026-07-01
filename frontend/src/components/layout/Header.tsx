import SearchBar from "../dashboard/SearchBar";

export default function Header() {
  return (
    <header className="bg-white h-20 border-b px-8 flex items-center justify-between">

      <div className="w-96">
        <SearchBar />
      </div>

      <div className="text-right">

        <div className="font-semibold">
          Renato
        </div>

        <div className="text-sm text-gray-500">
          Administrador
        </div>

      </div>

    </header>
  );
}
