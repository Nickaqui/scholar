import api from './api';

// ==================== DISCIPLINAS DO PROFESSOR ====================

export const listarDisciplinasProfessor = async (token: string) => {
  const response = await api.get('/disciplinas', {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const listarAlunosPorDisciplina = async (token: string, disciplinaId: number) => {
  const response = await api.get('/matriculas', {
    headers: { Authorization: `Bearer ${token}` },
    params: { disciplina_id: disciplinaId }
  });
  return response.data;
};

// ==================== GERENCIAMENTO DE NOTAS ====================

export const listarNotasPorDisciplina = async (token: string, disciplinaId: number) => {
  const response = await api.get('/notas', {
    headers: { Authorization: `Bearer ${token}` },
    params: { disciplina_id: disciplinaId }
  });
  return response.data;
};

export const lancarNota = async (token: string, dados: {
  aluno_id: number;
  disciplina_id: number;
  tipo_avaliacao: string;
  nota: number;
  peso: number;
  data_avaliacao: string;
  observacoes?: string;
}) => {
  const response = await api.post('/notas/lancar', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarNota = async (token: string, notaId: number, dados: {
  tipo_avaliacao?: string;
  nota?: number;
  peso?: number;
  data_avaliacao?: string;
  observacoes?: string;
}) => {
  const response = await api.put(`/notas/${notaId}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const excluirNota = async (token: string, notaId: number) => {
  const response = await api.delete(`/notas/${notaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== ESTATÍSTICAS ====================

export const obterEstatisticasDisciplina = async (token: string, disciplinaId: number) => {
  const response = await api.get('/notas', {
    headers: { Authorization: `Bearer ${token}` },
    params: { disciplina_id: disciplinaId }
  });
  
  const notas = response.data.dados || [];
  
  // Calcular estatísticas
  const totalAlunos = new Set(notas.map((n: any) => n.aluno_id)).size;
  const mediaGeral = notas.length > 0 
    ? notas.reduce((acc: number, n: any) => acc + parseFloat(n.nota), 0) / notas.length 
    : 0;
  
  return {
    totalAlunos,
    totalNotas: notas.length,
    mediaGeral: mediaGeral.toFixed(2),
    notas
  };
};

