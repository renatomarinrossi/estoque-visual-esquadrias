import type { Usuario } from "../../types/usuario";

interface Props {
  usuarios: Usuario[];
  onEditar: (usuario: Usuario) => void;
  onAlterarStatus: (usuario: Usuario) => void;
}

export default function UsuarioTable({ usuarios, onEditar, onAlterarStatus }: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <table className="w-full">
        <thead className="bg-blue-900 text-white"><tr><th className="text-left p-4">Nome</th><th className="text-left p-4">Usuário</th><th className="text-left p-4">Perfil</th><th className="text-center p-4">Status</th><th className="text-center p-4">Ações</th></tr></thead>
        <tbody>
          {usuarios.map((usuario) => (
            <tr key={usuario.id} className="border-b hover:bg-slate-50">
              <td className="p-4 font-medium">{usuario.nome}</td>
              <td className="p-4">{usuario.login}</td>
              <td className="p-4">{usuario.perfil}</td>
              <td className="text-center p-4"><span className={usuario.ativo ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>{usuario.ativo ? "Ativo" : "Inativo"}</span></td>
              <td className="text-center p-4"><button type="button" onClick={() => onEditar(usuario)} className="bg-blue-700 hover:bg-blue-800 text-white px-3 py-2 rounded-lg mr-2">Editar</button><button type="button" onClick={() => onAlterarStatus(usuario)} className={`px-3 py-2 rounded-lg text-white ${usuario.ativo ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}>{usuario.ativo ? "Inativar" : "Ativar"}</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

