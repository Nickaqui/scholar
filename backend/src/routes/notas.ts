import { Router, Response } from 'express';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest, CriarNotaDTO, LancarNotaDTO, AtualizarNotaDTO } from '../types';

const router = Router();

// Listar todas as notas
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { matricula_id, aluno_id, disciplina_id } = req.query;
    
    let query = `
      SELECT 
        n.id, n.tipo_avaliacao, n.nota, n.peso,
        n.data_avaliacao, n.observacoes,
        n.criado_em, n.atualizado_em,
        m.id as matricula_id,
        a.id as aluno_id,
        a.nome as aluno_nome,
        a.matricula as aluno_matricula,
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo
      FROM notas n
      INNER JOIN matriculas m ON n.matricula_id = m.id
      INNER JOIN alunos a ON m.aluno_id = a.id
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    if (matricula_id) {
      query += ` AND n.matricula_id = $${paramCount}`;
      params.push(matricula_id);
      paramCount++;
    }

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

    query += ' ORDER BY n.data_avaliacao DESC';

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar notas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar notas'
    });
  }
});

// Buscar nota por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        n.id, n.tipo_avaliacao, n.nota, n.peso,
        n.data_avaliacao, n.observacoes,
        n.criado_em, n.atualizado_em,
        m.id as matricula_id,
        a.id as aluno_id,
        a.nome as aluno_nome,
        a.matricula as aluno_matricula,
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo
      FROM notas n
      INNER JOIN matriculas m ON n.matricula_id = m.id
      INNER JOIN alunos a ON m.aluno_id = a.id
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      WHERE n.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar nota:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar nota'
    });
  }
});

// Criar nova nota (usa matricula_id diretamente)
router.post('/', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      matricula_id,
      tipo_avaliacao,
      nota,
      peso,
      data_avaliacao,
      observacoes
    }: CriarNotaDTO = req.body;

    if (!matricula_id || !tipo_avaliacao || nota === undefined || !data_avaliacao) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Matrícula, tipo de avaliação, nota e data são obrigatórios'
      });
      return;
    }

    if (nota < 0 || nota > 10) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'A nota deve estar entre 0 e 10'
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO notas (matricula_id, tipo_avaliacao, nota, peso, data_avaliacao, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [matricula_id, tipo_avaliacao, nota, peso || 1.0, data_avaliacao, observacoes || null]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Nota criada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar nota:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar nota'
    });
  }
});

// Lançar nota (busca matrícula por aluno_id e disciplina_id)
router.post('/lancar', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      aluno_id,
      disciplina_id,
      tipo_avaliacao,
      nota,
      peso,
      data_avaliacao,
      observacoes
    }: LancarNotaDTO = req.body;

    if (!aluno_id || !disciplina_id || !tipo_avaliacao || nota === undefined || !data_avaliacao) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Aluno, disciplina, tipo de avaliação, nota e data são obrigatórios'
      });
      return;
    }

    if (nota < 0 || nota > 10) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'A nota deve estar entre 0 e 10'
      });
      return;
    }

    // Buscar matrícula
    const matriculaResult = await pool.query(
      'SELECT id FROM matriculas WHERE aluno_id = $1 AND disciplina_id = $2 ORDER BY ano DESC, semestre DESC LIMIT 1',
      [aluno_id, disciplina_id]
    );

    if (matriculaResult.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Matrícula não encontrada para este aluno e disciplina'
      });
      return;
    }

    const matricula_id = matriculaResult.rows[0].id;

    const result = await pool.query(
      `INSERT INTO notas (matricula_id, tipo_avaliacao, nota, peso, data_avaliacao, observacoes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [matricula_id, tipo_avaliacao, nota, peso || 1.0, data_avaliacao, observacoes || null]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Nota lançada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao lançar nota:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao lançar nota'
    });
  }
});

// Atualizar nota
router.put('/:id', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      tipo_avaliacao,
      nota,
      peso,
      data_avaliacao,
      observacoes
    }: AtualizarNotaDTO = req.body;

    if (nota !== undefined && (nota < 0 || nota > 10)) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'A nota deve estar entre 0 e 10'
      });
      return;
    }

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (tipo_avaliacao !== undefined) {
      fields.push(`tipo_avaliacao = $${paramCount++}`);
      values.push(tipo_avaliacao);
    }
    if (nota !== undefined) {
      fields.push(`nota = $${paramCount++}`);
      values.push(nota);
    }
    if (peso !== undefined) {
      fields.push(`peso = $${paramCount++}`);
      values.push(peso);
    }
    if (data_avaliacao !== undefined) {
      fields.push(`data_avaliacao = $${paramCount++}`);
      values.push(data_avaliacao);
    }
    if (observacoes !== undefined) {
      fields.push(`observacoes = $${paramCount++}`);
      values.push(observacoes);
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
      `UPDATE notas SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Nota atualizada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar nota:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar nota'
    });
  }
});

// Deletar nota
router.delete('/:id', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM notas WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Nota não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Nota deletada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao deletar nota:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao deletar nota'
    });
  }
});

export default router;

