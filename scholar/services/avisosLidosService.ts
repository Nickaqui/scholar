import AsyncStorage from '@react-native-async-storage/async-storage';

const AVISOS_LIDOS_KEY = 'avisos_lidos';

// Serviço para gerenciar quais avisos o usuário já leu
export const avisosLidosService = {
  // Obter lista de IDs de avisos lidos
  async obterAvisosLidos(): Promise<number[]> {
    try {
      const data = await AsyncStorage.getItem(AVISOS_LIDOS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Erro ao obter avisos lidos:', error);
      return [];
    }
  },

  // Marcar aviso como lido
  async marcarComoLido(avisoId: number): Promise<void> {
    try {
      const lidos = await this.obterAvisosLidos();
      if (!lidos.includes(avisoId)) {
        lidos.push(avisoId);
        await AsyncStorage.setItem(AVISOS_LIDOS_KEY, JSON.stringify(lidos));
      }
    } catch (error) {
      console.error('Erro ao marcar aviso como lido:', error);
    }
  },

  // Marcar múltiplos avisos como lidos
  async marcarMultiplosComoLidos(avisoIds: number[]): Promise<void> {
    try {
      const lidos = await this.obterAvisosLidos();
      const novosLidos = [...new Set([...lidos, ...avisoIds])];
      await AsyncStorage.setItem(AVISOS_LIDOS_KEY, JSON.stringify(novosLidos));
    } catch (error) {
      console.error('Erro ao marcar múltiplos avisos como lidos:', error);
    }
  },

  // Verificar se há novos avisos (não lidos)
  async contarNovosAvisos(todosAvisos: { id: number }[]): Promise<number> {
    try {
      const lidos = await this.obterAvisosLidos();
      const novos = todosAvisos.filter(aviso => !lidos.includes(aviso.id));
      return novos.length;
    } catch (error) {
      console.error('Erro ao contar novos avisos:', error);
      return 0;
    }
  },

  // Limpar todos os avisos lidos (útil para testes)
  async limpar(): Promise<void> {
    try {
      await AsyncStorage.removeItem(AVISOS_LIDOS_KEY);
    } catch (error) {
      console.error('Erro ao limpar avisos lidos:', error);
    }
  },
};

