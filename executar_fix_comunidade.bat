@echo off
cd /d "C:\Users\guilh\Documents\brutal-team"
set SUPABASE_ACCESS_TOKEN=sbp_52bab6b69c3a4e53df44daa9b95c935493729063

echo ============================================
echo Executando fix_comunidade_outros_alunos.sql
echo ============================================
echo.

npx supabase@latest db query --db-url "postgresql://postgres.bgohxramptkrnepvmefc:Brutal@2025!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" --file sql\fix_comunidade_outros_alunos.sql

echo.
echo ============================================
echo Pressione qualquer tecla para continuar...
pause
