// Script para gerar chaves VAPID
// Execute: node generate-vapid-keys.js

const crypto = require('crypto');

function generateVAPIDKeys() {
  const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
    namedCurve: 'prime256v1',
    publicKeyEncoding: {
      type: 'spki',
      format: 'der'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'der'
    }
  });

  const publicKeyBase64 = publicKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  const privateKeyBase64 = privateKey.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return {
    publicKey: publicKeyBase64,
    privateKey: privateKeyBase64
  };
}

const keys = generateVAPIDKeys();

console.log('\n========================================');
console.log('🔑 CHAVES VAPID GERADAS COM SUCESSO!');
console.log('========================================\n');
console.log('📋 COPIE ESTAS CHAVES E GUARDE COM SEGURANÇA:\n');
console.log('NEXT_PUBLIC_VAPID_PUBLIC_KEY=');
console.log(keys.publicKey);
console.log('\nVAPID_PRIVATE_KEY=');
console.log(keys.privateKey);
console.log('\n========================================');
console.log('⚠️  IMPORTANTE:');
console.log('1. Adicione essas chaves no arquivo .env.local');
console.log('2. Adicione também no Vercel (Environment Variables)');
console.log('3. NUNCA compartilhe a PRIVATE KEY publicamente!');
console.log('========================================\n');
