import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, UsuarioAutenticado, TipoUsuario } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'scholar-secret-key-2024';

export function verificarToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({
      sucesso: false,
      mensagem: 'Token não fornecido'
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as UsuarioAutenticado;
    req.usuario = decoded;
    next();
  } catch (error) {
    res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido ou expirado'
    });
  }
}

export function verificarTipoUsuario(...tiposPermitidos: TipoUsuario[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      res.status(401).json({
        sucesso: false,
        mensagem: 'Usuário não autenticado'
      });
      return;
    }

    if (!tiposPermitidos.includes(req.usuario.tipo)) {
      res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado. Você não tem permissão para esta operação.'
      });
      return;
    }

    next();
  };
}

