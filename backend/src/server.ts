import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importar rotas
import authRoutes from './routes/auth';
import boletimRoutes from './routes/boletim';
import alunosRoutes from './routes/alunos';
import professoresRoutes from './routes/professores';
import disciplinasRoutes from './routes/disciplinas';
import matriculasRoutes from './routes/matriculas';
import notasRoutes from './routes/notas';
import avisosRoutes from './routes/avisos';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/boletim', boletimRoutes);
app.use('/api/alunos', alunosRoutes);
app.use('/api/professores', professoresRoutes);
app.use('/api/disciplinas', disciplinasRoutes);
app.use('/api/matriculas', matriculasRoutes);
app.use('/api/notas', notasRoutes);
app.use('/api/avisos', avisosRoutes);

// Rota raiz
app.get('/', (req, res) => {
  res.json({
    mensagem: 'Scholar API - Sistema de Gerenciamento Acadêmico',
    versao: '2.0.0',
    status: 'online',
    endpoints: [
      'POST /api/auth/login',
      'GET /api/boletim',
      'GET /api/alunos',
      'GET /api/professores',
      'GET /api/disciplinas',
      'GET /api/matriculas',
      'GET /api/notas',
      'GET /api/avisos',
      'POST /api/avisos'
    ]
  });
});

// Tratamento de erros 404
app.use((req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Rota não encontrada'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor TypeScript rodando na porta ${PORT}`);
  console.log(`📚 API disponível em http://localhost:${PORT}`);
});

