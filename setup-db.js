const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Iniciando configuração do banco de dados...\n');

  const sql = fs.readFileSync('supabase-schema.sql', 'utf8');

  // Dividir o SQL em statements individuais
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 Encontrados ${statements.length} comandos SQL para executar\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Pular comentários
    if (statement.startsWith('--')) continue;

    try {
      console.log(`[${i + 1}/${statements.length}] Executando...`);

      // Tentar executar usando rpc
      const { data, error } = await supabase.rpc('exec', { sql: statement });

      if (error) {
        console.error(`❌ Erro: ${error.message}`);
      } else {
        console.log(`✅ Sucesso`);
      }
    } catch (err) {
      console.error(`❌ Erro ao executar: ${err.message}`);
    }
  }

  console.log('\n✨ Configuração concluída!');
}

setupDatabase().catch(console.error);
