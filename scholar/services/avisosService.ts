import api from './api';

export interface Aviso {
  id: number;
  titulo: string;
  conteudo: string;
  tipo: 'institucional' | 'lembrete' | 'comunicado' | 'prova';
  autor_id: number;
  autor_nome?: string;
  disciplina_id?: number;
  disciplina_nome?: string;
  data_publicacao: string;
  data_evento?: string;
  ativo: boolean;
  criado_em: string;
  atualizado_em: string;
}

export interface CriarAvisoDTO {
  titulo: string;
  conteudo: string;
  tipo: 'institucional' | 'lembrete' | 'comunicado' | 'prova';
  disciplina_id?: number;
  data_evento?: string;
}

export const avisosService = {
  // Listar todos os avisos
  async listar(): Promise<Aviso[]> {
    const response = await api.get('/avisos');
    return response.data.dados || [];
  },

  // Criar novo aviso
  async criar(aviso: CriarAvisoDTO): Promise<Aviso> {
    const response = await api.post('/avisos', aviso);
    return response.data.dados;
  },
};

