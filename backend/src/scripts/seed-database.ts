import pool from '../config/database';
import bcrypt from 'bcryptjs';

async function seedDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Iniciando população do banco de dados...');
    
    await client.query('BEGIN');
    
    // Criar professores (SEM cpf e telefone)
    console.log('\n📚 Criando professores...');
    const professores = [
      {
        nome: 'Dr. João Silva',
        email: 'joao.silva@scholar.com',
        senha: 'prof123',
        titulacao: 'Doutorado',
        tempo_docencia: 15,
        especializacao: 'Engenharia de Software'
      },
      {
        nome: 'Dra. Maria Santos',
        email: 'maria.santos@scholar.com',
        senha: 'prof123',
        titulacao: 'Mestrado',
        tempo_docencia: 8,
        especializacao: 'Banco de Dados'
      },
      {
        nome: 'Prof. Carlos Oliveira',
        email: 'carlos.oliveira@scholar.com',
        senha: 'prof123',
        titulacao: 'Mestrado',
        tempo_docencia: 10,
        especializacao: 'Desenvolvimento Mobile'
      }
    ];
    
    const professoresIds: number[] = [];
    for (const prof of professores) {
      const senhaHash = await bcrypt.hash(prof.senha, 10);
      const usuarioResult = await client.query(
        "INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, 'professor') RETURNING id",
        [prof.email, senhaHash]
      );
      
      const professorResult = await client.query(
        `INSERT INTO professores (usuario_id, nome, titulacao, tempo_docencia, especializacao)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [usuarioResult.rows[0].id, prof.nome, prof.titulacao, prof.tempo_docencia, prof.especializacao]
      );
      
      professoresIds.push(professorResult.rows[0].id);
      console.log(`✅ Professor criado: ${prof.nome}`);
    }
    
    // Criar disciplinas
    console.log('\n📖 Criando disciplinas...');
    const disciplinas = [
      { nome: 'Engenharia de Software', codigo: 'ENG001', carga_horaria: 80, semestre: 1, professor_id: professoresIds[0] },
      { nome: 'Banco de Dados', codigo: 'BD001', carga_horaria: 80, semestre: 1, professor_id: professoresIds[1] },
      { nome: 'Desenvolvimento Mobile', codigo: 'MOB001', carga_horaria: 60, semestre: 2, professor_id: professoresIds[2] },
      { nome: 'Programação Web', codigo: 'WEB001', carga_horaria: 80, semestre: 2, professor_id: professoresIds[0] },
      { nome: 'Algoritmos e Estrutura de Dados', codigo: 'AED001', carga_horaria: 80, semestre: 1, professor_id: professoresIds[1] }
    ];
    
    const disciplinasIds: number[] = [];
    for (const disc of disciplinas) {
      const result = await client.query(
        `INSERT INTO disciplinas (nome, codigo, carga_horaria, semestre, professor_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [disc.nome, disc.codigo, disc.carga_horaria, disc.semestre, disc.professor_id]
      );
      disciplinasIds.push(result.rows[0].id);
      console.log(`✅ Disciplina criada: ${disc.nome}`);
    }
    
    // Criar alunos (SEM cpf e telefone)
    console.log('\n👨‍🎓 Criando alunos...');
    const alunos = [
      {
        nome: 'Pedro Costa',
        email: 'pedro.costa@aluno.scholar.com',
        senha: 'aluno123',
        curso: 'Desenvolvimento de Software Multiplataforma',
        data_nascimento: '2002-05-15'
      },
      {
        nome: 'Ana Paula',
        email: 'ana.paula@aluno.scholar.com',
        senha: 'aluno123',
        curso: 'Desenvolvimento de Software Multiplataforma',
        data_nascimento: '2001-08-22'
      },
      {
        nome: 'Lucas Ferreira',
        email: 'lucas.ferreira@aluno.scholar.com',
        senha: 'aluno123',
        curso: 'Desenvolvimento de Software Multiplataforma',
        data_nascimento: '2003-03-10'
      }
    ];
    
    const alunosIds: number[] = [];
    for (const aluno of alunos) {
      const senhaHash = await bcrypt.hash(aluno.senha, 10);
      const usuarioResult = await client.query(
        "INSERT INTO usuarios (email, senha, tipo) VALUES ($1, $2, 'aluno') RETURNING id",
        [aluno.email, senhaHash]
      );
      
      // Gerar matrícula aleatória
      const matricula = `ALU${Math.floor(Math.random() * 10000000000)}`;
      
      const alunoResult = await client.query(
        `INSERT INTO alunos (usuario_id, nome, matricula, curso, data_nascimento)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [usuarioResult.rows[0].id, aluno.nome, matricula, aluno.curso, aluno.data_nascimento]
      );
      
      alunosIds.push(alunoResult.rows[0].id);
      console.log(`✅ Aluno criado: ${aluno.nome} (${matricula})`);
    }
    
    // Criar matrículas
    console.log('\n📝 Criando matrículas...');
    const matriculas: { aluno_id: number; disciplina_id: number; semestre: number; ano: number }[] = [];
    
    // Cada aluno matriculado em 3 disciplinas
    for (const alunoId of alunosIds) {
      for (let i = 0; i < 3; i++) {
        matriculas.push({
          aluno_id: alunoId,
          disciplina_id: disciplinasIds[i],
          semestre: 1,
          ano: 2024
        });
      }
    }
    
    const matriculasIds: number[] = [];
    for (const mat of matriculas) {
      const result = await client.query(
        `INSERT INTO matriculas (aluno_id, disciplina_id, semestre, ano)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [mat.aluno_id, mat.disciplina_id, mat.semestre, mat.ano]
      );
      matriculasIds.push(result.rows[0].id);
    }
    console.log(`✅ ${matriculas.length} matrículas criadas`);
    
    // Criar notas
    console.log('\n📊 Criando notas...');
    const tiposAvaliacao = ['Prova 1', 'Prova 2', 'Trabalho Prático'];
    let notasCount = 0;
    
    for (const matriculaId of matriculasIds) {
      for (const tipo of tiposAvaliacao) {
        const nota = (Math.random() * 4 + 6).toFixed(2); // Notas entre 6.0 e 10.0
        const peso = tipo.includes('Prova') ? 3.0 : 1.0;
        
        await client.query(
          `INSERT INTO notas (matricula_id, tipo_avaliacao, nota, peso, data_avaliacao)
           VALUES ($1, $2, $3, $4, CURRENT_DATE - (RANDOM() * 60)::INTEGER)`,
          [matriculaId, tipo, nota, peso]
        );
        notasCount++;
      }
    }
    console.log(`✅ ${notasCount} notas criadas`);
    
    await client.query('COMMIT');
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 BANCO DE DADOS POPULADO COM SUCESSO!');
    console.log('='.repeat(60));
    console.log('\n📋 Resumo:');
    console.log(`   • ${professores.length} professores`);
    console.log(`   • ${disciplinas.length} disciplinas`);
    console.log(`   • ${alunos.length} alunos`);
    console.log(`   • ${matriculas.length} matrículas`);
    console.log(`   • ${notasCount} notas`);
    console.log('\n🔑 Credenciais de teste:');
    console.log('\n   Admin:');
    console.log('   📧 admin@scholar.com');
    console.log('   🔐 admin123');
    console.log('\n   Professor:');
    console.log('   📧 joao.silva@scholar.com');
    console.log('   🔐 prof123');
    console.log('\n   Aluno:');
    console.log('   📧 pedro.costa@aluno.scholar.com');
    console.log('   🔐 aluno123');
    console.log('\n💡 Próximo passo: npm run dev (para iniciar o servidor)');
    console.log('='.repeat(60));
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Erro ao popular banco de dados:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seedDatabase()
  .then(() => {
    console.log('\n✨ Script finalizado com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro fatal:', error);
    process.exit(1);
  });

