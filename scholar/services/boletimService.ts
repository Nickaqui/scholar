import api from './api';

export interface Nota {
  id: number;
  tipo_avaliacao: string;
  nota: number;
  peso: number;
  data_avaliacao: string;
  observacoes?: string;
}

export interface Disciplina {
  id: number;
  nome: string;
  codigo: string;
  carga_horaria: number;
  professor?: string;
}

export interface BoletimDisciplina {
  matricula_id: number;
  status: string;
  semestre: string;
  ano: number;
  disciplina: Disciplina;
  notas: Nota[];
  media: string;
  situacao: string;
}

export interface BoletimResponse {
  sucesso: boolean;
  aluno: {
    id: number;
    nome: string;
    matricula: string;
    curso: string;
    email: string;
  };
  boletim: BoletimDisciplina[];
}

export interface HistoricoItem {
  disciplina: string;
  codigo: string;
  carga_horaria: number;
  semestre: string;
  ano: number;
  status: string;
  media_final: string | null;
}

const boletimService = {
  async obterBoletim(alunoId?: number, semestre?: string, ano?: number): Promise<BoletimResponse> {
    try {
      // Se alunoId for fornecido, usa rota para admin/professor
      // Caso contrário, usa rota para aluno logado
      let url = alunoId ? `/boletim/aluno/${alunoId}` : `/boletim`;
      const params: string[] = [];
      
      if (semestre) params.push(`semestre=${semestre}`);
      if (ano) params.push(`ano=${ano}`);
      
      if (params.length > 0) {
        url += `?${params.join('&')}`;
      }
      
      const response = await api.get(url);
      
      // Transformar dados do backend (flat) para estrutura esperada pelo frontend (nested)
      const boletimTransformado = response.data.boletim.map((item: any) => ({
        matricula_id: item.matricula_id,
        status: item.status,
        semestre: item.periodo?.toString() || item.semestre?.toString() || '',
        ano: item.ano,
        disciplina: {
          id: item.disciplina_id,
          nome: item.disciplina_nome,
          codigo: item.disciplina_codigo,
          carga_horaria: item.carga_horaria,
          professor: item.professor_nome,
        },
        notas: item.notas || [],
        media: item.media_final?.toString() || '0',
        situacao: item.media_final >= 7 ? 'Aprovado' : item.media_final >= 5 ? 'Recuperação' : 'Reprovado',
      }));
      
      return {
        ...response.data,
        boletim: boletimTransformado,
      };
    } catch (error: any) {
      throw new Error(error.response?.data?.mensagem || 'Erro ao buscar boletim');
    }
  },

  async obterHistorico(alunoId?: number): Promise<HistoricoItem[]> {
    try {
      const url = alunoId ? `/boletim/aluno/${alunoId}/historico` : `/boletim/historico`;
      const response = await api.get(url);
      return response.data.historico;
    } catch (error: any) {
      throw new Error(error.response?.data?.mensagem || 'Erro ao buscar histórico');
    }
  },
};

export default boletimService;

