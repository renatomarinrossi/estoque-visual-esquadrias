import { createContext, useEffect, useState, type ReactNode } from "react";

import { buscarUsuarioAutenticado, sairDoSistema } from "../services/authUsuario";
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

export { AuthContext };

