import { Router, Response } from 'express';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest, CriarMatriculaDTO, AtualizarMatriculaDTO } from '../types';

const router = Router();

// Listar todas as matrículas
router.get('/', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { aluno_id, disciplina_id, status, semestre, ano } = req.query;
    
    let query = `
      SELECT 
        m.id, m.semestre, m.ano, m.status,
        m.criado_em, m.atualizado_em,
        a.id as aluno_id,
        a.nome as aluno_nome,
        a.matricula as aluno_matricula,
        a.curso as aluno_curso,
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo,
        d.carga_horaria,
        p.nome as professor_nome
      FROM matriculas m
      INNER JOIN alunos a ON m.aluno_id = a.id
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    if (aluno_id) {
      query += ` AND m.aluno_id = $${paramCount}`;
      params.push(aluno_id);
      paramCount++;
    }

    if (disciplina_id) {
      query += ` AND m.disciplina_id = $${paramCount}`;
      params.push(disciplina_id);
      paramCount++;
    }

    if (status) {
      query += ` AND m.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (semestre) {
      query += ` AND m.semestre = $${paramCount}`;
      params.push(semestre);
      paramCount++;
    }

    if (ano) {
      query += ` AND m.ano = $${paramCount}`;
      params.push(ano);
      paramCount++;
    }

    query += ' ORDER BY m.ano DESC, m.semestre DESC, a.nome, d.nome';

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar matrículas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar matrículas'
    });
  }
});

// Buscar matrícula por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        m.id, m.semestre, m.ano, m.status,
        m.criado_em, m.atualizado_em,
        a.id as aluno_id,
        a.nome as aluno_nome,
        a.matricula as aluno_matricula,
        a.curso as aluno_curso,
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo,
        d.carga_horaria,
        p.nome as professor_nome
      FROM matriculas m
      INNER JOIN alunos a ON m.aluno_id = a.id
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE m.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Matrícula não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar matrícula:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar matrícula'
    });
  }
});

// Criar nova matrícula
router.post('/', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      aluno_id,
      disciplina_id,
      semestre,
      ano
    }: CriarMatriculaDTO = req.body;

    if (!aluno_id || !disciplina_id || !semestre || !ano) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Aluno, disciplina, semestre e ano são obrigatórios'
      });
      return;
    }

    // Verificar se a matrícula já existe
    const matriculaExiste = await pool.query(
      'SELECT id FROM matriculas WHERE aluno_id = $1 AND disciplina_id = $2 AND semestre = $3 AND ano = $4',
      [aluno_id, disciplina_id, semestre, ano]
    );

    if (matriculaExiste.rows.length > 0) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Este aluno já está matriculado nesta disciplina neste período'
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO matriculas (aluno_id, disciplina_id, semestre, ano)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [aluno_id, disciplina_id, semestre, ano]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Matrícula criada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar matrícula:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar matrícula'
    });
  }
});

// Atualizar matrícula
router.put('/:id', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      status,
      semestre,
      ano
    }: AtualizarMatriculaDTO = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (status !== undefined) {
      fields.push(`status = $${paramCount++}`);
      values.push(status);
    }
    if (semestre !== undefined) {
      fields.push(`semestre = $${paramCount++}`);
      values.push(semestre);
    }
    if (ano !== undefined) {
      fields.push(`ano = $${paramCount++}`);
      values.push(ano);
    }

    if (fields.length === 0) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Nenhum campo para atualizar'
      });
      return;
    }

    fields.push(`atualizado_em = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await pool.query(
      `UPDATE matriculas SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Matrícula não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Matrícula atualizada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar matrícula:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar matrícula'
    });
  }
});

// Deletar matrícula
router.delete('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM matriculas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Matrícula não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Matrícula deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar matrícula:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar matrícula'
    });
  }
});

export default router;

