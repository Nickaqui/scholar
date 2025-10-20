import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/database';
import { LoginResponse } from '../types';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'scholar-secret-key-2024';

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      res.status(400).json({
        sucesso: false,
        mensagem: 'Email e senha são obrigatórios'
      });
      return;
    }

    const usuarioResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
      [email]
    );

    if (usuarioResult.rows.length === 0) {
      res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
      return;
    }

    const usuario = usuarioResult.rows[0];
    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais inválidas'
      });
      return;
    }

    let dadosAdicionais = {};

    if (usuario.tipo === 'aluno') {
      const alunoResult = await pool.query(
        'SELECT nome, matricula, curso FROM alunos WHERE usuario_id = $1',
        [usuario.id]
      );
      if (alunoResult.rows.length > 0) {
        dadosAdicionais = alunoResult.rows[0];
      }
    } else if (usuario.tipo === 'professor') {
      const professorResult = await pool.query(
        'SELECT nome, titulacao FROM professores WHERE usuario_id = $1',
        [usuario.id]
      );
      if (professorResult.rows.length > 0) {
        dadosAdicionais = professorResult.rows[0];
      }
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        ...dadosAdicionais
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const response: LoginResponse = {
      sucesso: true,
      mensagem: 'Login realizado com sucesso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        ...dadosAdicionais
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao realizar login'
    });
  }
});

export default router;

