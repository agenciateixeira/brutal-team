@echo off
cd /d "C:\Users\guilh\Documents\brutal-team"
set SUPABASE_ACCESS_TOKEN=sbp_52bab6b69c3a4e53df44daa9b95c935493729063

echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     FIX COMPLETO - BRUTAL TEAM                         ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Este script vai corrigir:
echo   1. Comunidade - outros alunos vão ver a comunidade
echo   2. Dashboard - treinos e dietas vão aparecer ao marcar
echo   3. Streak - vai calcular corretamente ao desmarcar
echo.
pause

echo.
echo ============================================
echo [1/2] Corrigindo Comunidade...
echo ============================================
echo.
npx supabase@latest db query --db-url "postgresql://postgres.bgohxramptkrnepvmefc:Brutal@2025!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" --file sql\fix_comunidade_outros_alunos.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO ao executar fix_comunidade_outros_alunos.sql
    echo Verifique o erro acima e tente novamente.
    pause
    exit /b 1
)

echo.
echo ✅ Comunidade corrigida com sucesso!
echo.
echo ============================================
echo [2/2] Corrigindo Dashboard e Streak...
echo ============================================
echo.
npx supabase@latest db query --db-url "postgresql://postgres.bgohxramptkrnepvmefc:Brutal@2025!@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" --file sql\fix_desmarcar_treino_v2.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERRO ao executar fix_desmarcar_treino_v2.sql
    echo Verifique o erro acima e tente novamente.
    pause
    exit /b 1
)

echo.
echo ✅ Dashboard e Streak corrigidos com sucesso!
echo.
echo ╔════════════════════════════════════════════════════════╗
echo ║     ✅ TUDO CORRIGIDO COM SUCESSO!                     ║
echo ╚════════════════════════════════════════════════════════╝
echo.
echo Agora você precisa:
echo   1. Parar o servidor (Ctrl+C se estiver rodando)
echo   2. Executar: limpar_cache.bat
echo   3. Iniciar o servidor novamente: npm run dev
echo   4. Pedir para os alunos fazerem logout e login
echo.
echo Pressione qualquer tecla para fechar...
pause >nul
