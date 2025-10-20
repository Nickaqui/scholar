import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest, CriarAlunoDTO, AtualizarAlunoDTO } from '../types';

const router = Router();

// Listar todos os alunos
router.get('/', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { busca, curso, ativo } = req.query;
    
    let query = `
      SELECT 
        a.id, a.nome, a.matricula, a.curso, a.data_nascimento, a.endereco,
        a.criado_em, a.atualizado_em,
        u.email, u.ativo
      FROM alunos a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    let paramCount = 1;

    if (busca) {
      query += ` AND (a.nome ILIKE $${paramCount} OR a.matricula ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${busca}%`);
      paramCount++;
    }

    if (curso) {
      query += ` AND a.curso ILIKE $${paramCount}`;
      params.push(`%${curso}%`);
      paramCount++;
    }

    if (ativo !== undefined) {
      query += ` AND u.ativo = $${paramCount}`;
      params.push(ativo === 'true');
      paramCount++;
    }

    query += ' ORDER BY a.nome';

    const result = await pool.query(query, params);

    res.json({
      sucesso: true,
      dados: result.rows
    });
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao listar alunos'
    });
  }
});

// Buscar aluno por ID
router.get('/:id', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT 
        a.id, a.nome, a.matricula, a.curso, a.data_nascimento, a.endereco,
        a.criado_em, a.atualizado_em,
        u.email, u.ativo
      FROM alunos a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Aluno não encontrado'
      });
      return;
    }

    res.json({
      sucesso: true,
      dados: result.rows[0]
    });
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar aluno'
    });
  }
});

// Criar novo aluno
router.post('/', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const {
      nome,
      email,
      senha,
      matricula,
      curso,
      data_nascimento,
      endereco
    }: CriarAlunoDTO = req.body;

    if (!nome || !email || !senha || !matricula || !curso) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Nome, email, senha, matrícula e curso são obrigatórios'
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

    // Verificar se a matrícula já existe
    const matriculaExiste = await client.query(
      'SELECT id FROM alunos WHERE matricula = $1',
      [matricula]
    );

    if (matriculaExiste.rows.length > 0) {
      await client.query('ROLLBACK');
      res.status(400).json({
        sucesso: false,
        mensagem: 'Esta matrícula já está cadastrada'
      });
      return;
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    // Criar usuário
    const usuarioResult = await client.query(
      "INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, 'aluno') RETURNING id",
      [email, senhaHash]
    );

    const usuarioId = usuarioResult.rows[0].id;

    // Criar aluno
    const alunoResult = await client.query(
      `INSERT INTO alunos (usuario_id, nome, matricula, curso, data_nascimento, endereco)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [usuarioId, nome, matricula, curso, data_nascimento || null, endereco || null]
    );

    await client.query('COMMIT');

    res.status(201).json({
      sucesso: true,
      mensagem: 'Aluno criado com sucesso',
      dados: {
        ...alunoResult.rows[0],
        email
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar aluno:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao criar aluno'
    });
  } finally {
    client.release();
  }
});

// Atualizar aluno
router.put('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      matricula,
      curso,
      data_nascimento,
      endereco,
      ativo
    }: AtualizarAlunoDTO = req.body;

    await client.query('BEGIN');

    // Buscar aluno e seu usuario_id
    const alunoAtual = await client.query(
      'SELECT usuario_id FROM alunos WHERE id = $1',
      [id]
    );

    if (alunoAtual.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        sucesso: false,
        mensagem: 'Aluno não encontrado'
      });
      return;
    }

    const usuarioId = alunoAtual.rows[0].usuario_id;

    // Atualizar dados do aluno
    const alunoFields: string[] = [];
    const alunoValues: any[] = [];
    let alunoParamCount = 1;

    if (nome !== undefined) {
      alunoFields.push(`nome = $${alunoParamCount++}`);
      alunoValues.push(nome);
    }
    if (matricula !== undefined) {
      alunoFields.push(`matricula = $${alunoParamCount++}`);
      alunoValues.push(matricula);
    }
    if (curso !== undefined) {
      alunoFields.push(`curso = $${alunoParamCount++}`);
      alunoValues.push(curso);
    }
    if (data_nascimento !== undefined) {
      alunoFields.push(`data_nascimento = $${alunoParamCount++}`);
      alunoValues.push(data_nascimento);
    }
    if (endereco !== undefined) {
      alunoFields.push(`endereco = $${alunoParamCount++}`);
      alunoValues.push(endereco);
    }

    if (alunoFields.length > 0) {
      alunoFields.push(`atualizado_em = CURRENT_TIMESTAMP`);
      alunoValues.push(id);
      await client.query(
        `UPDATE alunos SET ${alunoFields.join(', ')} WHERE id = $${alunoParamCount}`,
        alunoValues
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
      mensagem: 'Aluno atualizado com sucesso'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao atualizar aluno:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar aluno'
    });
  } finally {
    client.release();
  }
});

// Desativar aluno (soft delete)
router.delete('/:id', verificarToken, verificarTipoUsuario('administrador'), async (req: AuthRequest, res: Response): Promise<void> => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const alunoResult = await client.query(
      'SELECT usuario_id FROM alunos WHERE id = $1',
      [id]
    );

    if (alunoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      res.status(404).json({
        sucesso: false,
        mensagem: 'Aluno não encontrado'
      });
      return;
    }

    const usuarioId = alunoResult.rows[0].usuario_id;

    await client.query(
      'UPDATE usuarios SET ativo = false, atualizado_em = CURRENT_TIMESTAMP WHERE id = $1',
      [usuarioId]
    );

    await client.query('COMMIT');

    res.json({
      sucesso: true,
      mensagem: 'Aluno desativado com sucesso'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erro ao desativar aluno:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao desativar aluno'
    });
  } finally {
    client.release();
  }
});

export default router;

