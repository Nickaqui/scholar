import React, { createContext, useState, useContext, useEffect } from 'react';
import authService, { Usuario, LoginCredentials } from '../services/authService';

interface AuthContextData {
  usuario: Usuario | null;
  carregando: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  autenticado: boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarUsuario();
  }, []);

  const carregarUsuario = async () => {
    try {
      const usuarioLocal = await authService.getUsuarioLocal();
      if (usuarioLocal) {
        const usuarioValidado = await authService.validarToken();
        setUsuario(usuarioValidado || usuarioLocal);
      }
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
    } finally {
      setCarregando(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await authService.login(credentials);
      setUsuario(response.usuario);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
      setUsuario(null);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        carregando,
        login,
        logout,
        autenticado: !!usuario,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

