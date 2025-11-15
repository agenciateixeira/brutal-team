const fs = require('fs');
const { Client } = require('pg');

const connectionString = 'postgresql://postgres.bgohxramptkrnepvmefc:Brutal@2025!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres';

async function executarSQL(arquivo) {
  const client = new Client({ connectionString });

  try {
    console.log(`\n🔄 Conectando ao banco de dados...`);
    await client.connect();
    console.log('✅ Conectado!\n');

    console.log(`📄 Lendo arquivo: ${arquivo}`);
    const sql = fs.readFileSync(arquivo, 'utf8');

    console.log(`⚙️  Executando SQL...\n`);
    console.log('═'.repeat(60));

    const result = await client.query(sql);

    console.log('═'.repeat(60));
    console.log('\n✅ SQL executado com sucesso!');

    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 RESULTADOS:');
      console.log(JSON.stringify(result.rows, null, 2));
    }

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    if (error.stack) {
      console.error('\nStack:', error.stack);
    }
  } finally {
    await client.end();
    console.log('\n🔌 Desconectado do banco.\n');
  }
}

async function executarTodos() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     FIX COMPLETO - BRUTAL TEAM                         ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log('[1/2] Executando fix_comunidade_outros_alunos.sql...');
  await executarSQL('sql/fix_comunidade_outros_alunos.sql');

  console.log('\n[2/2] Executando fix_desmarcar_treino_v2.sql...');
  await executarSQL('sql/fix_desmarcar_treino_v2.sql');

  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     ✅ TUDO EXECUTADO!                                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log('Próximos passos:');
  console.log('  1. Executar: limpar_cache.bat');
  console.log('  2. Reiniciar servidor: npm run dev');
  console.log('  3. Pedir para alunos fazerem logout e login\n');
}

executarTodos();
