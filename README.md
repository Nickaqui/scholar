# Scholar - Sistema Acadêmico

Sistema acadêmico mobile desenvolvido com React Native (Expo) e Node.js para gerenciamento de alunos, professores, disciplinas, matrículas e notas.

## Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd scholar
```

### 2. Backend

```bash
cd backend
npm install
```

Crie o arquivo `.env` na pasta `backend/`:
```env
PORT=3000
DB_HOST=localhost
DB_PORT=5433
DB_NAME=scholar
DB_USER=postgres
DB_PASSWORD=[sua_senha_aqui]
JWT_SECRET=seu_secret_super_seguro_aqui_123456
```

Inicialize o banco de dados:
```bash
npm run init-db    # Cria as tabelas
npm run seed       # Popula com dados de teste
```

### 3. Frontend

```bash
cd ../scholar
npm install
```

Edite o arquivo `scholar/services/api.ts` e configure o IP do seu backend:
```typescript
const API_URL = 'http://SEU_IP_LOCAL:3000/api';  // ex: http://192.168.1.100:3000/api
```

### Backend
```bash
cd backend
npm run dev
```

### Frontend
```bash
cd scholar
npm start
```

##  Usuários de Teste

| Tipo | Email | Senha |
|------|-------|-------|
| **Admin** | admin@scholar.com | admin123 |
| **Professor** | maria.santos@scholar.com | prof123 |
| **Aluno** | joao.silva@scholar.com | aluno123 |

## 🎯 Funcionalidades

### Administrador
- ✅ Gerenciar alunos, professores e disciplinas
- ✅ Criar e gerenciar matrículas
- ✅ Visualizar relatórios completos

### Professor
- ✅ Visualizar disciplinas lecionadas
- ✅ Lançar notas dos alunos
- ✅ Editar e excluir notas

### Aluno
- ✅ Visualizar boletim com notas
- ✅ Ver disciplinas matriculadas
- ✅ Acompanhar média por disciplina

