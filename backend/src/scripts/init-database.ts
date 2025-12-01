import pool from '../config/database';
import bcrypt from 'bcryptjs';

async function initDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Iniciando configuração do banco de dados...\n');
    
    await client.query('BEGIN');
    
    // Dropar tabelas existentes (em ordem reversa devido a foreign keys)
    console.log('🧹 Limpando tabelas antigas (se existirem)...');
    await client.query('DROP TABLE IF EXISTS avisos CASCADE');
    await client.query('DROP TABLE IF EXISTS notas CASCADE');
    await client.query('DROP TABLE IF EXISTS matriculas CASCADE');
    await client.query('DROP TABLE IF EXISTS disciplinas CASCADE');
    await client.query('DROP TABLE IF EXISTS professores CASCADE');
    await client.query('DROP TABLE IF EXISTS alunos CASCADE');
    await client.query('DROP TABLE IF EXISTS usuarios CASCADE');
    console.log('✅ Limpeza concluída\n');
    
    console.log('📦 Criando estrutura das tabelas...');
    
    // Tabela de usuários
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('administrador', 'professor', 'aluno')),
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "usuarios" criada');
    
    // Tabela de alunos (SEM cpf e telefone)
    await client.query(`
      CREATE TABLE IF NOT EXISTS alunos (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        matricula VARCHAR(50) UNIQUE NOT NULL,
        curso VARCHAR(255) NOT NULL,
        data_nascimento DATE,
        endereco TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "alunos" criada');
    
    // Tabela de professores (SEM cpf e telefone)
    await client.query(`
      CREATE TABLE IF NOT EXISTS professores (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
        nome VARCHAR(255) NOT NULL,
        titulacao VARCHAR(100) NOT NULL,
        tempo_docencia INTEGER,
        especializacao TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "professores" criada');
    
    // Tabela de disciplinas
    await client.query(`
      CREATE TABLE IF NOT EXISTS disciplinas (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        codigo VARCHAR(50) UNIQUE NOT NULL,
        carga_horaria INTEGER NOT NULL,
        semestre INTEGER,
        professor_id INTEGER REFERENCES professores(id) ON DELETE SET NULL,
        descricao TEXT,
        ativa BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "disciplinas" criada');
    
    // Tabela de matrículas
    await client.query(`
      CREATE TABLE IF NOT EXISTS matriculas (
        id SERIAL PRIMARY KEY,
        aluno_id INTEGER REFERENCES alunos(id) ON DELETE CASCADE,
        disciplina_id INTEGER REFERENCES disciplinas(id) ON DELETE CASCADE,
        semestre INTEGER NOT NULL,
        ano INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'cursando' CHECK (status IN ('cursando', 'aprovado', 'reprovado', 'trancado')),
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(aluno_id, disciplina_id, semestre, ano)
      )
    `);
    console.log('✅ Tabela "matriculas" criada');
    
    // Tabela de notas
    await client.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id SERIAL PRIMARY KEY,
        matricula_id INTEGER REFERENCES matriculas(id) ON DELETE CASCADE,
        tipo_avaliacao VARCHAR(100) NOT NULL,
        nota DECIMAL(4,2) NOT NULL CHECK (nota >= 0 AND nota <= 10),
        peso DECIMAL(4,2) NOT NULL DEFAULT 1.0,
        data_avaliacao DATE NOT NULL,
        observacoes TEXT,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "notas" criada');
    
    // Tabela de avisos acadêmicos
    await client.query(`
      CREATE TABLE IF NOT EXISTS avisos (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        conteudo TEXT NOT NULL,
        tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('institucional', 'lembrete', 'comunicado', 'prova')),
        autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        disciplina_id INTEGER REFERENCES disciplinas(id) ON DELETE SET NULL,
        data_publicacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        data_evento DATE,
        ativo BOOLEAN DEFAULT true,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabela "avisos" criada');
    
    // Verificar se já existe um usuário admin
    const adminResult = await client.query(
      "SELECT id FROM usuarios WHERE email = 'admin@scholar.com'"
    );
    
    if (adminResult.rows.length === 0) {
      const senhaHash = await bcrypt.hash('admin123', 10);
      await client.query(
        "INSERT INTO usuarios (email, senha, tipo) VALUES ('admin@scholar.com', $1, 'administrador')",
        [senhaHash]
      );
      console.log('✅ Usuário administrador padrão criado');
      console.log('📧 Email: admin@scholar.com');
      console.log('🔑 Senha: admin123');
    } else {
      console.log('ℹ️  Usuário administrador já existe');
    }
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BANCO DE DADOS INICIALIZADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n✅ Estrutura criada (SEM campos CPF e telefone)');
    console.log('✅ Usuário admin criado');
    console.log('\n🔑 Credencial do Administrador:');
    console.log('   📧 Email: admin@scholar.com');
    console.log('   🔐 Senha: admin123');
    console.log('\n💡 Próximo passo: npm run seed (para adicionar dados de teste)');
    console.log('='.repeat(60));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('\n❌ ERRO ao inicializar banco de dados:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Executar a função
initDatabase()
  .then(() => {
    console.log('\n✨ Script finalizado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

