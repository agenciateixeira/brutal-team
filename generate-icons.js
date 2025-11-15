const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
];

const inputFile = path.join(__dirname, 'public', 'pwa.png');
const outputDir = path.join(__dirname, 'public');

async function generateIcons() {
  console.log('🎨 Gerando ícones do PWA...\n');

  // Verificar se o arquivo existe
  if (!fs.existsSync(inputFile)) {
    console.error('❌ Arquivo pwa.png não encontrado em public/');
    process.exit(1);
  }

  // Gerar cada tamanho
  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);

    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 129, b: 167, alpha: 1 } // Cor #0081A7
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ ${name} criado!`);
    } catch (error) {
      console.error(`❌ Erro ao criar ${name}:`, error.message);
    }
  }

  // Gerar favicon.ico (32x32)
  try {
    const faviconPath = path.join(outputDir, 'favicon.ico');
    await sharp(inputFile)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 129, b: 167, alpha: 1 } // Cor #0081A7
      })
      .png()
      .toFile(faviconPath);

    console.log(`✅ favicon.ico criado!`);
  } catch (error) {
    console.error(`❌ Erro ao criar favicon.ico:`, error.message);
  }

  console.log('\n🎉 Todos os ícones foram gerados com sucesso!');
  console.log('\n📱 Agora você pode instalar o app no celular!');
}

generateIcons().catch(console.error);
