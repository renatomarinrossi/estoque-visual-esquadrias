import { createContext, useContext, useEffect, useState } from "react";

import { buscarUsuarioAutenticado, sairDoSistema } from "../services/authUsuario";
import { supabase } from "../services/supabase";
import type { UsuarioLogado } from "../types/usuario";

type AuthContextValue = {
  usuario: UsuarioLogado | null;
  carregando: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioLogado | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let componenteAtivo = true;

    async function atualizarUsuario() {
      try {
        const perfil = await buscarUsuarioAutenticado();
        if (componenteAtivo) setUsuario(perfil);
      } catch (erro) {
        console.error(erro);
        await sairDoSistema();
        if (componenteAtivo) setUsuario(null);
      } finally {
        if (componenteAtivo) setCarregando(false);
      }
    }

    void atualizarUsuario();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void atualizarUsuario();
    });

    return () => {
      componenteAtivo = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  }

  return contexto;
}

