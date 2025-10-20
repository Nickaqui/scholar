import api from './api';

// ==================== ALUNOS ====================

export const listarAlunos = async (token: string, filtros?: any) => {
  const response = await api.get('/alunos', {
    headers: { Authorization: `Bearer ${token}` },
    params: filtros
  });
  return response.data;
};

export const buscarAluno = async (token: string, id: number) => {
  const response = await api.get(`/alunos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarAluno = async (token: string, dados: any) => {
  const response = await api.post('/alunos', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarAluno = async (token: string, id: number, dados: any) => {
  const response = await api.put(`/alunos/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const desativarAluno = async (token: string, id: number) => {
  const response = await api.delete(`/alunos/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== PROFESSORES ====================

export const listarProfessores = async (token: string, filtros?: any) => {
  const response = await api.get('/professores', {
    headers: { Authorization: `Bearer ${token}` },
    params: filtros
  });
  return response.data;
};

export const buscarProfessor = async (token: string, id: number) => {
  const response = await api.get(`/professores/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarProfessor = async (token: string, dados: any) => {
  const response = await api.post('/professores', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarProfessor = async (token: string, id: number, dados: any) => {
  const response = await api.put(`/professores/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const desativarProfessor = async (token: string, id: number) => {
  const response = await api.delete(`/professores/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== DISCIPLINAS ====================

export const listarDisciplinas = async (token: string, filtros?: any) => {
  const response = await api.get('/disciplinas', {
    headers: { Authorization: `Bearer ${token}` },
    params: filtros
  });
  return response.data;
};

export const buscarDisciplina = async (token: string, id: number) => {
  const response = await api.get(`/disciplinas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarDisciplina = async (token: string, dados: any) => {
  const response = await api.post('/disciplinas', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarDisciplina = async (token: string, id: number, dados: any) => {
  const response = await api.put(`/disciplinas/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const desativarDisciplina = async (token: string, id: number) => {
  const response = await api.delete(`/disciplinas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== MATRÍCULAS ====================

export const listarMatriculas = async (token: string, filtros?: any) => {
  const response = await api.get('/matriculas', {
    headers: { Authorization: `Bearer ${token}` },
    params: filtros
  });
  return response.data;
};

export const buscarMatricula = async (token: string, id: number) => {
  const response = await api.get(`/matriculas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const criarMatricula = async (token: string, dados: any) => {
  const response = await api.post('/matriculas', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarMatricula = async (token: string, id: number, dados: any) => {
  const response = await api.put(`/matriculas/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deletarMatricula = async (token: string, id: number) => {
  const response = await api.delete(`/matriculas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

// ==================== NOTAS ====================

export const listarNotas = async (token: string, filtros?: any) => {
  const response = await api.get('/notas', {
    headers: { Authorization: `Bearer ${token}` },
    params: filtros
  });
  return response.data;
};

export const lancarNota = async (token: string, dados: any) => {
  const response = await api.post('/notas/lancar', dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const atualizarNota = async (token: string, id: number, dados: any) => {
  const response = await api.put(`/notas/${id}`, dados, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

export const deletarNota = async (token: string, id: number) => {
  const response = await api.delete(`/notas/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
};

