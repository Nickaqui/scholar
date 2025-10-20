import { Request } from 'express';

// Tipos de usuário
export type TipoUsuario = 'aluno' | 'professor' | 'administrador';
export type StatusMatricula = 'cursando' | 'aprovado' | 'reprovado' | 'trancado';

// Interface para usuário autenticado (usado no middleware)
export interface UsuarioAutenticado {
  id: number;
  email: string;
  tipo: TipoUsuario;
  nome?: string;
  matricula?: string;
  curso?: string;
  titulacao?: string;
}

// Extensão do Request do Express para incluir usuário autenticado
export interface AuthRequest extends Request {
  usuario?: UsuarioAutenticado;
}

// DTOs para criar usuários
export interface CriarUsuarioDTO {
  email: string;
  senha: string;
  tipo: TipoUsuario;
}

// DTOs para alunos
export interface CriarAlunoDTO {
  nome: string;
  email: string;
  senha: string;
  matricula: string;
  curso: string;
  data_nascimento?: string;
  endereco?: string;
}

export interface AtualizarAlunoDTO {
  nome?: string;
  email?: string;
  senha?: string;
  matricula?: string;
  curso?: string;
  data_nascimento?: string;
  endereco?: string;
  ativo?: boolean;
}

// DTOs para professores
export interface CriarProfessorDTO {
  nome: string;
  email: string;
  senha: string;
  titulacao: string;
  tempo_docencia?: number;
  especializacao?: string;
}

export interface AtualizarProfessorDTO {
  nome?: string;
  email?: string;
  senha?: string;
  titulacao?: string;
  tempo_docencia?: number;
  especializacao?: string;
  ativo?: boolean;
}

// DTOs para disciplinas
export interface CriarDisciplinaDTO {
  nome: string;
  codigo: string;
  carga_horaria: number;
  professor_id?: number;
  descricao?: string;
  semestre?: number;
}

export interface AtualizarDisciplinaDTO {
  nome?: string;
  codigo?: string;
  carga_horaria?: number;
  professor_id?: number;
  descricao?: string;
  semestre?: number;
  ativa?: boolean;
}

// DTOs para matrículas
export interface CriarMatriculaDTO {
  aluno_id: number;
  disciplina_id: number;
  semestre: number;
  ano: number;
}

export interface AtualizarMatriculaDTO {
  status?: StatusMatricula;
  semestre?: number;
  ano?: number;
}

// DTOs para notas
export interface CriarNotaDTO {
  matricula_id: number;
  tipo_avaliacao: string;
  nota: number;
  peso?: number;
  data_avaliacao: string;
  observacoes?: string;
}

export interface LancarNotaDTO {
  aluno_id: number;
  disciplina_id: number;
  tipo_avaliacao: string;
  nota: number;
  peso?: number;
  data_avaliacao: string;
  observacoes?: string;
}

export interface AtualizarNotaDTO {
  tipo_avaliacao?: string;
  nota?: number;
  peso?: number;
  data_avaliacao?: string;
  observacoes?: string;
}

// Respostas padronizadas da API
export interface ApiResponse<T = any> {
  sucesso: boolean;
  mensagem: string;
  dados?: T;
}

export interface LoginResponse {
  sucesso: boolean;
  mensagem: string;
  token?: string;
  usuario?: {
    id: number;
    email: string;
    tipo: TipoUsuario;
    nome?: string;
    matricula?: string;
    curso?: string;
    titulacao?: string;
  };
}

export interface PaginatedResponse<T> {
  sucesso: boolean;
  dados: T[];
  total: number;
  pagina: number;
  limite: number;
}

