@echo off
cd /d "C:\Users\guilh\Documents\brutal-team"

echo.
echo ============================================
echo Limpando cache do Next.js
echo ============================================
echo.
echo [1/3] Parando servidor...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo ✅ Servidor parado
echo.

echo [2/3] Removendo cache do Next.js...
if exist .next (
    rmdir /s /q .next
    echo ✅ Cache removido
) else (
    echo ⚠️  Pasta .next não existe
)
echo.

echo [3/3] Limpando node_modules/.cache (se existir)...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache
    echo ✅ Cache do node_modules removido
) else (
    echo ⚠️  Cache do node_modules não existe
)
echo.

echo ╔════════════════════════════════════════╗
echo ║   ✅ CACHE LIMPO COM SUCESSO!          ║
echo ╚════════════════════════════════════════╝
echo.
echo Agora você pode iniciar o servidor com:
echo   npm run dev
echo.
pause
