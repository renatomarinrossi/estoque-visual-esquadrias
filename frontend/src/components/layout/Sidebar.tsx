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
        `flex items-center gap-4 px-8 py-3.5 transition-colors ${
          isActive
            ? "border-l-4 border-white bg-blue-800"
            : "border-l-4 border-transparent hover:bg-blue-800"
        }`
      }
    >
      <Icon size={21} />
      <span>{item.nome}</span>
    </NavLink>
  );
}

function TituloGrupo({ titulo }: { titulo: string }) {
  return (
    <div className="px-8 pb-2 pt-5 text-xs font-semibold uppercase tracking-wider text-blue-200">
      {titulo}
    </div>
  );
}

export default function Sidebar() {
  const usuario = useUsuario();
  const eDesenvolvedor = usuario?.perfil === "DESENVOLVEDOR";
  const podeVerFinanceiro = eDesenvolvedor || usuario?.perfil === "GERENCIAL";

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
    ...(podeVerFinanceiro
      ? [{ nome: "Dashboard Financeiro", rota: "/dashboard-financeiro", icone: LayoutDashboard }]
      : []),
    { nome: "Vendas", rota: "/vendas", icone: DollarSign },
    { nome: "Obras Finalizadas", rota: "/obras-finalizadas", icone: ClipboardList },
    ...(eDesenvolvedor
      ? [{ nome: "Logs Financeiros", rota: "/logs-financeiros", icone: ClipboardList }]
      : []),
    { nome: "Contas a Receber", rota: "/contas-receber", icone: DollarSign },
    { nome: "Contas a Pagar", rota: "/contas-pagar", icone: CreditCard },
  ];

  const menuSistema: ItemMenu[] = [
    { nome: "Sistema", rota: "/sistema", icone: Settings },
  ];

  const menuAdministracao: ItemMenu[] = eDesenvolvedor
    ? [
        { nome: "Usuários", rota: "/usuarios", icone: Users },
      ]
    : [];

  return (
    <aside className="flex w-72 flex-col bg-blue-900 text-white">
      <div className="border-b border-blue-700 p-8 text-4xl font-bold">Visual Esquadrias</div>

      <nav className="mt-2 flex-1 overflow-y-auto pb-5">
        <TituloGrupo titulo="Estoque" />
        {menuEstoque.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        <div className="mx-5 mt-4 border-t border-blue-700" />
        <TituloGrupo titulo="Financeiro" />
        {menuFinanceiro.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        <div className="mx-5 mt-4 border-t border-blue-700" />
        <TituloGrupo titulo="Sistema" />
        {menuSistema.map((item) => <ItemNavegacao key={item.rota} item={item} />)}

        {menuAdministracao.length > 0 && (
          <>
            <div className="mx-5 mt-4 border-t border-blue-700" />
            <TituloGrupo titulo="Administração" />
            {menuAdministracao.map((item) => <ItemNavegacao key={item.rota} item={item} />)}
          </>
        )}
      </nav>
    </aside>
  );
}




