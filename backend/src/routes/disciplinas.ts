import { Router, Response } from 'express';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest, CriarDisciplinaDTO, AtualizarDisciplinaDTO } from '../types';

const router = Router();

// Listar todas as disciplinas
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario;
    const { busca, professor_id, semestre, ativa } = req.query;
    
    let query = `
      SELECT 
        d.id, d.nome, d.codigo, d.carga_horaria, d.semestre,
        d.descricao, d.ativa, d.criado_em, d.atualizado_em,
        d.professor_id,
        p.nome as professor_nome,
        p.titulacao as professor_titulacao
      FROM disciplinas d
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    // Se for professor, mostrar apenas suas disciplinas
    if (usuario?.tipo === 'professor') {
      query += ` AND d.professor_id = (SELECT id FROM professores WHERE usuario_id = $${paramCount})`;
      params.push(usuario.id);
      paramCount++;
    }

    if (busca) {
      query += ` AND (d.nome ILIKE $${paramCount} OR d.codigo ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    // Se admin passar professor_id explicitamente, usar esse filtro
    if (professor_id && usuario?.tipo === 'administrador') {
      query += ` AND d.professor_id = $${paramCount}`;
      params.push(professor_id);
      paramCount++;
    }

    if (semestre) {
      query += ` AND d.semestre = $${paramCount}`;
      params.push(semestre);
      paramCount++;
    }

    if (ativa !== undefined) {
      query += ` AND d.ativa = $${paramCount}`;
      params.push(ativa === 'true');
      paramCount++;
    }

    query += ' ORDER BY d.semestre, d.nome';

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar disciplinas:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar disciplinas'
    });
  }
});

// Buscar disciplina por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        d.id, d.nome, d.codigo, d.carga_horaria, d.semestre,
        d.descricao, d.ativa, d.criado_em, d.atualizado_em,
        d.professor_id,
        p.nome as professor_nome,
        p.titulacao as professor_titulacao
      FROM disciplinas d
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE d.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Disciplina não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar disciplina'
    });
  }
});

// Criar nova disciplina
router.post('/', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      nome,
      codigo,
      carga_horaria,
      professor_id,
      descricao,
      semestre
    }: CriarDisciplinaDTO = req.body;

    if (!nome || !codigo || !carga_horaria) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Nome, código e carga horária são obrigatórios'
      });
      return;
    }

    // Verificar se o código já existe
    const codigoExiste = await pool.query(
      'SELECT id FROM disciplinas WHERE codigo = $1',
      [codigo]
    );

    if (codigoExiste.rows.length > 0) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Este código de disciplina já está cadastrado'
      });
      return;
    }

    const result = await pool.query(
      `INSERT INTO disciplinas (nome, codigo, carga_horaria, professor_id, descricao, semestre)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [nome, codigo, carga_horaria, professor_id || null, descricao || null, semestre || null]
    );

    res.status(201).json({
      sucesso: true,
      mensagem: 'Disciplina criada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar disciplina'
    });
  }
});

// Atualizar disciplina
router.put('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      nome,
      codigo,
      carga_horaria,
      professor_id,
      descricao,
      semestre,
      ativa
    }: AtualizarDisciplinaDTO = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (nome !== undefined) {
      fields.push(`nome = $${paramCount++}`);
      values.push(nome);
    }
    if (codigo !== undefined) {
      fields.push(`codigo = $${paramCount++}`);
      values.push(codigo);
    }
    if (carga_horaria !== undefined) {
      fields.push(`carga_horaria = $${paramCount++}`);
      values.push(carga_horaria);
    }
    if (professor_id !== undefined) {
      fields.push(`professor_id = $${paramCount++}`);
      values.push(professor_id);
    }
    if (descricao !== undefined) {
      fields.push(`descricao = $${paramCount++}`);
      values.push(descricao);
    }
    if (semestre !== undefined) {
      fields.push(`semestre = $${paramCount++}`);
      values.push(semestre);
    }
    if (ativa !== undefined) {
      fields.push(`ativa = $${paramCount++}`);
      values.push(ativa);
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
      `UPDATE disciplinas SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Disciplina não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Disciplina atualizada com sucesso',
      dados: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar disciplina'
    });
  }
});

// Desativar disciplina
router.delete('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'UPDATE disciplinas SET ativa = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Disciplina não encontrada'
      });
      return;
    }

    res.json({
      sucesso: true,
      mensagem: 'Disciplina desativada com sucesso'
    });

  } catch (error) {
    console.error('Erro ao desativar disciplina:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar disciplina'
    });
  }
});

export default router;

