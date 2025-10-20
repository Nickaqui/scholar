import { Router, Response } from 'express';
import pool from '../config/database';
import { verificarToken, verificarTipoUsuario } from '../middleware/auth';
import { AuthRequest } from '../types';

const router = Router();

router.get('/', verificarToken, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const usuario = req.usuario!;
    let alunoId: number;

    if (usuario.tipo === 'aluno') {
      const alunoResult = await pool.query(
        'SELECT id FROM alunos WHERE usuario_id = $1',
        [usuario.id]
      );

      if (alunoResult.rows.length === 0) {
        res.status(404).json({
          sucesso: false,
          mensagem: 'Aluno não encontrado'
        });
        return;
      }

      alunoId = alunoResult.rows[0].id;
    } else if (usuario.tipo === 'administrador') {
      const alunoIdParam = req.query.aluno_id;
      
      if (!alunoIdParam) {
        res.status(400).json({
          sucesso: false,
          mensagem: 'ID do aluno é obrigatório para administradores'
        });
        return;
      }

      alunoId = parseInt(alunoIdParam as string);
    } else {
      res.status(403).json({
        sucesso: false,
        mensagem: 'Acesso negado'
      });
      return;
    }

    const boletimResult = await pool.query(`
      SELECT 
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo,
        d.carga_horaria,
        d.semestre,
        p.nome as professor_nome,
        m.id as matricula_id,
        m.status,
        m.ano,
        m.semestre as periodo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', n.id,
                'tipo_avaliacao', n.tipo_avaliacao,
                'nota', n.nota,
                'peso', n.peso,
                'data_avaliacao', n.data_avaliacao,
                'observacoes', n.observacoes
              ) ORDER BY n.data_avaliacao
            )
            FROM notas n
            WHERE n.matricula_id = m.id
          ),
          '[]'::json
        ) as notas,
        COALESCE(
          (
            SELECT ROUND(
              SUM(n.nota * n.peso) / NULLIF(SUM(n.peso), 0),
              2
            )
            FROM notas n
            WHERE n.matricula_id = m.id
          ),
          0
        ) as media_final
      FROM matriculas m
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE m.aluno_id = $1
      ORDER BY m.ano DESC, m.semestre DESC, d.nome
    `, [alunoId]);

    const alunoInfoResult = await pool.query(`
      SELECT a.nome, a.matricula, a.curso, u.email
      FROM alunos a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = $1
    `, [alunoId]);

    res.json({
      sucesso: true,
      aluno: alunoInfoResult.rows[0] || null,
      boletim: boletimResult.rows
    });

  } catch (error) {
    console.error('Erro ao buscar boletim:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar boletim'
    });
  }
});

router.get('/aluno/:alunoId', verificarToken, verificarTipoUsuario('administrador', 'professor'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { alunoId } = req.params;

    const boletimResult = await pool.query(`
      SELECT 
        d.id as disciplina_id,
        d.nome as disciplina_nome,
        d.codigo as disciplina_codigo,
        d.carga_horaria,
        d.semestre,
        p.nome as professor_nome,
        m.id as matricula_id,
        m.status,
        m.ano,
        m.semestre as periodo,
        COALESCE(
          (
            SELECT json_agg(
              json_build_object(
                'id', n.id,
                'tipo_avaliacao', n.tipo_avaliacao,
                'nota', n.nota,
                'peso', n.peso,
                'data_avaliacao', n.data_avaliacao,
                'observacoes', n.observacoes
              ) ORDER BY n.data_avaliacao
            )
            FROM notas n
            WHERE n.matricula_id = m.id
          ),
          '[]'::json
        ) as notas,
        COALESCE(
          (
            SELECT ROUND(
              SUM(n.nota * n.peso) / NULLIF(SUM(n.peso), 0),
              2
            )
            FROM notas n
            WHERE n.matricula_id = m.id
          ),
          0
        ) as media_final
      FROM matriculas m
      INNER JOIN disciplinas d ON m.disciplina_id = d.id
      LEFT JOIN professores p ON d.professor_id = p.id
      WHERE m.aluno_id = $1
      ORDER BY m.ano DESC, m.semestre DESC, d.nome
    `, [alunoId]);

    const alunoInfoResult = await pool.query(`
      SELECT a.nome, a.matricula, a.curso, u.email
      FROM alunos a
      INNER JOIN usuarios u ON a.usuario_id = u.id
      WHERE a.id = $1
    `, [alunoId]);

    if (alunoInfoResult.rows.length === 0) {
      res.status(404).json({
        sucesso: false,
        mensagem: 'Aluno não encontrado'
      });
      return;
    }

    res.json({
      sucesso: true,
      aluno: alunoInfoResult.rows[0],
      boletim: boletimResult.rows
    });

  } catch (error) {
    console.error('Erro ao buscar boletim do aluno:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar boletim do aluno'
    });
  }
});

export default router;

