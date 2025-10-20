import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest, CriarProfessorDTO, AtualizarProfessorDTO } from '../types';

const router = Router();

// Listar todos os professores
router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { busca, titulacao, ativo } = req.query;
    
    let query = `
      SELECT 
        p.id, p.nome, p.titulacao, p.tempo_docencia, p.especializacao,
        p.criado_em, p.atualizado_em,
        u.email, u.ativo
      FROM professores p
      INNER JOIN usuarios u ON p.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    if (busca) {
      query += ` AND (p.nome ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    if (titulacao) {
      query += ` AND p.titulacao ILIKE $${paramCount}`;
      params.push(`%${titulacao}%`);
      paramCount++;
    }

    if (ativo !== undefined) {
      query += ` AND u.ativo = $${paramCount}`;
      params.push(ativo === 'true');
      paramCount++;
    }

    query += ' ORDER BY p.nome';

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar professores:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar professores'
    });
  }
});

// Buscar professor por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        p.id, p.nome, p.titulacao, p.tempo_docencia, p.especializacao,
        p.criado_em, p.atualizado_em,
        u.email, u.ativo
      FROM professores p
      INNER JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Professor não encontrado'
      });
      return;
    }

    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar professor'
    });
  }
});

// Criar novo professor
router.post('/', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const {
      nome,
      email,
      senha,
      titulacao,
      tempo_docencia,
      especializacao
    }: CriarProfessorDTO = req.body;

    if (!nome || !email || !senha || !titulacao) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Nome, email, senha e titulação são obrigatórios'
      });
      return;
    }

    await client.query('BEGIN');

    // Verificar se o email já existe
    const emailExiste = await client.query(
      'SELECT id FROM usuarios WHERE email = $1',
      [email]
    );

    if (emailExiste.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        sucesso: false,
        mensagem: 'Este email já está cadastrado'
      });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const usuarioResult = await client.query(
      "INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, 'professor') RETURNING id",
      [email, senhaHash]
    );

    const usuarioId = usuarioResult.rows[0].id;

    // Criar professor
    const professorResult = await client.query(
      `INSERT INTO professores (usuario_id, nome, titulacao, tempo_docencia, especializacao)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [usuarioId, nome, titulacao, tempo_docencia || null, especializacao || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Professor criado com sucesso',
      dados: {
        ...professorResult.rows[0],
        email
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar professor:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar professor'
    });
  } finally {
    client.release();
  }
});

// Atualizar professor
router.put('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      titulacao,
      tempo_docencia,
      especializacao,
      ativo
    }: AtualizarProfessorDTO = req.body;

    await client.query('BEGIN');

    // Buscar professor e seu usuario_id
    const professorAtual = await client.query(
      'SELECT usuario_id FROM professores WHERE id = $1',
      [id]
    );

    if (professorAtual.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        sucesso: false,
        mensagem: 'Professor não encontrado'
      });
      return;
    }

    const usuarioId = professorAtual.rows[0].usuario_id;

    // Atualizar dados do professor
    const professorFields: string[] = [];
    const professorValues: any[] = [];
    let professorParamCount = 1;

    if (nome !== undefined) {
      professorFields.push(`nome = $${professorParamCount++}`);
      professorValues.push(nome);
    }
    if (titulacao !== undefined) {
      professorFields.push(`titulacao = $${professorParamCount++}`);
      professorValues.push(titulacao);
    }
    if (tempo_docencia !== undefined) {
      professorFields.push(`tempo_docencia = $${professorParamCount++}`);
      professorValues.push(tempo_docencia);
    }
    if (especializacao !== undefined) {
      professorFields.push(`especializacao = $${professorParamCount++}`);
      professorValues.push(especializacao);
    }

    if (professorFields.length > 0) {
      professorFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
      professorValues.push(id);
      await client.query(
        `UPDATE professores SET ${professorFields.join(', ')} WHERE id = $${professorParamCount}`,
        professorValues
      );
    }

    // Atualizar dados do usuário
    const usuarioFields: string[] = [];
    const usuarioValues: any[] = [];
    let usuarioParamCount = 1;

    if (email !== undefined) {
      usuarioFields.push(`email = $${usuarioParamCount++}`);
      usuarioValues.push(email);
    }
    if (senha !== undefined) {
      const senhaHash = await bcrypt.hash(senha, 10);
      usuarioFields.push(`senha = $${usuarioParamCount++}`);
      usuarioValues.push(senhaHash);
    }
    if (ativo !== undefined) {
      usuarioFields.push(`ativo = $${usuarioParamCount++}`);
      usuarioValues.push(ativo);
    }

    if (usuarioFields.length > 0) {
      usuarioFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
      usuarioValues.push(usuarioId);
      await client.query(
        `UPDATE usuarios SET ${usuarioFields.join(', ')} WHERE id = $${usuarioParamCount}`,
        usuarioValues
      );
    }

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      mensagem: 'Professor atualizado com sucesso'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar professor'
    });
  } finally {
    client.release();
  }
});

// Desativar professor (soft delete)
router.delete('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const professorResult = await client.query(
      'SELECT usuario_id FROM professores WHERE id = $1',
      [id]
    );

    if (professorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        sucesso: false,
        mensagem: 'Professor não encontrado'
      });
      return;
    }

    const usuarioId = professorResult.rows[0].usuario_id;

    await client.query(
      'UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
      [usuarioId]
    );

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      mensagem: 'Professor desativado com sucesso'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao desativar professor:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar professor'
    });
  } finally {
    client.release();
  }
});

export default router;

