import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ArrowDownCircle,
  ArrowUpCircle,
  ShoppingCart,
  Truck,
  Trash2,
} from "lucide-react";

const menu = [
  {
    nome: "Dashboard",
    rota: "/dashboard",
    icone: LayoutDashboard,
  },
  {
    nome: "Produtos",
    rota: "/produtos",
    icone: Package,
  },
  {
    nome: "Entrada",
    rota: "/entrada",
    icone: ArrowDownCircle,
  },
  {
    nome: "Saída",
    rota: "/saida",
    icone: ArrowUpCircle,
  },
  {
    nome: "Compras",
    rota: "/compras",
    icone: ShoppingCart,
  },
  {
    nome: "Fornecedores",
    rota: "/fornecedores",
    icone: Truck,
  },
  {
    nome: "Lixeira",
    rota: "/lixeira",
    icone: Trash2,
  },
];

export default function Sidebar() {
  return (
    <aside className="w-72 bg-blue-900 text-white flex flex-col">
      <div className="text-4xl font-bold p-8 border-b border-blue-700">
        Visual Esquadrias
      </div>

      <nav className="flex-1 mt-6">
        {menu.map((item) => {
          const Icon = item.icone;

          return (
            <NavLink
              key={item.rota}
              to={item.rota}
              className={({ isActive }) =>
                `flex items-center gap-4 px-8 py-4 transition ${
                  isActive
                    ? "bg-blue-800 border-l-4 border-white"
                    : "hover:bg-blue-800"
                }`
              }
            >
              <Icon size={22} />
              {item.nome}
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
}
