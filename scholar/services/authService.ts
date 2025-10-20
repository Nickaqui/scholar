import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface RegisterData {
  email: string;
  senha: string;
  tipo: 'aluno' | 'professor' | 'administrador';
  nome: string;
}

export interface Usuario {
  id: number;
  email: string;
  tipo: 'aluno' | 'professor' | 'administrador';
  nome?: string;
  matricula?: string;
  curso?: string;
  titulacao?: string;
}

export interface LoginResponse {
  sucesso: boolean;
  mensagem: string;
  token: string;
  usuario: Usuario;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await api.post('/auth/login', credentials);
      
      if (response.data.sucesso && response.data.token) {
        await AsyncStorage.setItem('token', response.data.token);
        await AsyncStorage.setItem('usuario', JSON.stringify(response.data.usuario));
      }
      
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensagem || 'Erro ao fazer login');
    }
  },

  async registrar(data: RegisterData): Promise<any> {
    try {
      const response = await api.post('/auth/registrar', data);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensagem || 'Erro ao registrar usuário');
    }
  },

  async validarToken(): Promise<Usuario | null> {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return null;

      const response = await api.get('/auth/validar');
      
      if (response.data.sucesso) {
        return response.data.usuario;
      }
      
      return null;
    } catch (error) {
      await this.logout();
      return null;
    }
  },

  async logout(): Promise<void> {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('usuario');
  },

  async getUsuarioLocal(): Promise<Usuario | null> {
    try {
      const usuarioStr = await AsyncStorage.getItem('usuario');
      return usuarioStr ? JSON.parse(usuarioStr) : null;
    } catch (error) {
      return null;
    }
  },
};

export default authService;

