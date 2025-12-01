import { Router, Response } from 'express';
import pool from '../config/database';
import { AuthRequest, CriarAvisoDTO, ApiResponse, Aviso } from '../types';
import { verificarToken } from '../middleware/auth';

const router = Router();

// Listar todos os avisos (públicos e ativos)
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = `
      SELECT 
        a.id,
        a.titulo,
        a.conteudo,
        a.tipo,
        a.autor_id,
        a.disciplina_id,
        a.data_publicacao,
        a.data_evento,
        a.ativo,
        a.criado_em,
        a.atualizado_em,
        CASE 
          WHEN u.tipo = 'administrador' THEN 'Administração'
          WHEN u.tipo = 'professor' THEN p.nome
          ELSE 'Sistema'
        END as autor_nome,
        d.nome as disciplina_nome
      FROM avisos a
      LEFT JOIN usuarios u ON a.autor_id = u.id
      LEFT JOIN professores p ON u.id = p.usuario_id
      LEFT JOIN disciplinas d ON a.disciplina_id = d.id
      WHERE a.ativo = true
      ORDER BY a.data_publicacao DESC
    `;

    const result = await pool.query(query);
    
    const response: ApiResponse<Aviso[]> = {
      sucesso: true,
      mensagem: 'Avisos listados com sucesso',
      dados: result.rows
    };

    res.json(response);
  } catch (error) {
    console.error('Erro ao listar avisos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar avisos'
    });
  }
});

// Criar novo aviso (apenas admin e professor)
router.post('/', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario;
    
    if (!usuario) {
      res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado'
      });
      return;
    }

    if (usuario.tipo !== 'administrador' && usuario.tipo !== 'professor') {
      res.status(403).json({
        sucesso: false,
        mensagem: 'Apenas administradores e professores podem criar avisos'
      });
      return;
    }

    const { titulo, conteudo, tipo, disciplina_id, data_evento }: CriarAvisoDTO = req.body;

    if (!titulo || !conteudo || !tipo) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Título, conteúdo e tipo são obrigatórios'
      });
      return;
    }

    // Validar tipo
    const tiposValidos = ['institucional', 'lembrete', 'comunicado', 'prova'];
    if (!tiposValidos.includes(tipo)) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Tipo de aviso inválido'
      });
      return;
    }

    // Se for professor e tiver disciplina_id, verificar se ele leciona essa disciplina
    if (usuario.tipo === 'professor' && disciplina_id) {
      const disciplinaCheck = await pool.query(
        `SELECT d.id 
         FROM disciplinas d
         INNER JOIN professores p ON d.professor_id = p.id
         WHERE d.id = $1 AND p.usuario_id = $2`,
        [disciplina_id, usuario.id]
      );

      if (disciplinaCheck.rows.length === 0) {
        res.status(403).json({
          sucesso: false,
          mensagem: 'Você não leciona esta disciplina'
        });
        return;
      }
    }

    const result = await pool.query(
      `INSERT INTO avisos (titulo, conteudo, tipo, autor_id, disciplina_id, data_evento)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [titulo, conteudo, tipo, usuario.id, disciplina_id || null, data_evento || null]
    );

    const avisoCriado = result.rows[0];

    // Buscar dados completos do aviso
    const avisoCompleto = await pool.query(
      `SELECT 
        a.id,
        a.titulo,
        a.conteudo,
        a.tipo,
        a.autor_id,
        a.disciplina_id,
        a.data_publicacao,
        a.data_evento,
        a.ativo,
        a.criado_em,
        a.atualizado_em,
        CASE 
          WHEN u.tipo = 'administrador' THEN 'Administração'
          WHEN u.tipo = 'professor' THEN p.nome
          ELSE 'Sistema'
        END as autor_nome,
        d.nome as disciplina_nome
      FROM avisos a
      LEFT JOIN usuarios u ON a.autor_id = u.id
      LEFT JOIN professores p ON u.id = p.usuario_id
      LEFT JOIN disciplinas d ON a.disciplina_id = d.id
      WHERE a.id = $1`,
      [avisoCriado.id]
    );

    const response: ApiResponse<Aviso> = {
      sucesso: true,
      mensagem: 'Aviso criado com sucesso',
      dados: avisoCompleto.rows[0]
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Erro ao criar aviso:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar aviso'
    });
  }
});

export default router;

