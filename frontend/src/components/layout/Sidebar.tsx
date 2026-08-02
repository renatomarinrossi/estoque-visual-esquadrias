import { NavLink } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ClipboardList,
  CreditCard,
  DollarSign,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingCart,
  Trash2,
  Truck,
  Users,
} from "lucide-react";

import useUsuario from "../../hooks/useUsuario";

type ItemMenu = {
  nome: string;
  rota: string;
  icone: typeof LayoutDashboard;
};

function ItemNavegacao({ item }: { item: ItemMenu }) {
  const Icon = item.icone;

  return (
    <NavLink
      to={item.rota}
      className={({ isActive }) =>
        `flex items-center gap-4 px-8 py-4 transition ${
          isActive ? "bg-blue-800 border-l-4 border-white" : "hover:bg-blue-800"
        }`
      }
    >
      <Icon size={22} />
      {item.nome}
    </NavLink>
  );
}

export default function Sidebar() {
  const usuario = useUsuario();
  const eDesenvolvedor = usuario?.perfil === "DESENVOLVEDOR";

  const menuEstoque: ItemMenu[] = [
    { nome: "Dashboard", rota: "/dashboard", icone: LayoutDashboard },
    { nome: "Produtos", rota: "/produtos", icone: Package },
    { nome: "Entrada", rota: "/entrada", icone: ArrowDownCircle },
    { nome: "Saída", rota: "/saida", icone: ArrowUpCircle },
    ...(eDesenvolvedor
      ? [{ nome: "Movimentações", rota: "/movimentacoes", icone: ClipboardList }]
      : []),
    { nome: "Compras", rota: "/compras", icone: ShoppingCart },
    { nome: "Fornecedores", rota: "/fornecedores", icone: Truck },
    { nome: "Lixeira", rota: "/lixeira", icone: Trash2 },
  ];

  const menuFinanceiro: ItemMenu[] = [
    ...(usuario?.perfil === "DESENVOLVEDOR" || usuario?.perfil === "GERENCIAL"
      ? [{ nome: "Dashboard Financeiro", rota: "/dashboard-financeiro", icone: LayoutDashboard }]
      : []),
    { nome: "Vendas", rota: "/vendas", icone: DollarSign },
    { nome: "Contas a Receber", rota: "/contas-receber", icone: DollarSign },
    { nome: "Contas a Pagar", rota: "/contas-pagar", icone: CreditCard },
  ];

  const menuAdministracao: ItemMenu[] = eDesenvolvedor
    ? [
        { nome: "Sistema", rota: "/sistema", icone: Settings },
        { nome: "Usuários", rota: "/usuarios", icone: Users },
      ]
    : [];

  return (
    <aside className="w-72 bg-blue-900 text-white flex flex-col">
      <div className="text-4xl font-bold p-8 border-b border-blue-700">Visual Esquadrias</div>

      <nav className="flex-1 mt-6 overflow-y-auto">
        {menuEstoque.map((item) => <ItemNavegacao key={item.rota} item={item} />)}
        <div className="border-t border-blue-700 my-2" />
        {menuFinanceiro.map((item) => <ItemNavegacao key={item.rota} item={item} />)}
        {menuAdministracao.length > 0 && <><div className="border-t border-blue-700 my-2" />{menuAdministracao.map((item) => <ItemNavegacao key={item.rota} item={item} />)}</>}
      </nav>
    </aside>
  );
}

