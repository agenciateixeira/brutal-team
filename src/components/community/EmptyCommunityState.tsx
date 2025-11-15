'use client';

export default function EmptyCommunityState() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl text-center space-y-6 p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-2xl">
        <div className="text-6xl mb-4">❌</div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Erro de Configuração
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300">
          Você não foi adicionado à comunidade pública automaticamente.
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
}
