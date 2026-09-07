import { createContext, useEffect, useState, type ReactNode } from "react";

import { buscarUsuarioAutenticado } from "../services/authUsuario";
import { supabase } from "../services/supabase";
import type { UsuarioLogado } from "../types/usuario";

type AuthContextValue = {
  usuario: UsuarioLogado | null;
  carregando: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erroPerfil, setErroPerfil] = useState(false);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let componenteAtivo = true;
    let sequencia = 0;
    let timer: ReturnType<typeof setTimeout>;

    async function atualizarUsuario() {
      const pedido = ++sequencia;
      try {
        let perfil: UsuarioLogado | null = null;
        for (let n = 0; n < 3; n++) {
          try { perfil = await buscarUsuarioAutenticado(); break; }
          catch (e) { if (n === 2) throw e; await new Promise(r => setTimeout(r, 400 * (n + 1))); }
          if (!componenteAtivo || pedido !== sequencia) return;
        }
        if (componenteAtivo && pedido === sequencia) { setUsuario(perfil); setErroPerfil(false); }
      } catch (erro) {
        console.error(erro);
        if (componenteAtivo && pedido === sequencia) setErroPerfil(true);
      } finally {
        if (componenteAtivo && pedido === sequencia) setCarregando(false);
      }
    }

    void atualizarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(event => {
      clearTimeout(timer);
      if (event === "SIGNED_OUT") {
        sequencia++; setUsuario(null); setErroPerfil(false); setCarregando(false);
      } else timer = setTimeout(() => void atualizarUsuario(), 0);
    });

    return () => {
      componenteAtivo = false;
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [tentativa]);

  return (
    <AuthContext.Provider value={{ usuario, carregando }}>
      {erroPerfil ? <div role="alert" className="m-8 rounded-lg border p-6">
        <p>Não foi possível verificar seu acesso. Sua sessão foi preservada.</p>
        <button className="mt-4 rounded bg-blue-700 px-4 py-2 text-white" onClick={() => { setCarregando(true); setTentativa(t => t + 1); }}>Tentar novamente</button>
      </div> : children}
    </AuthContext.Provider>
  );
}

export { AuthContext };

