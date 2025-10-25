'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Clock, LogOut } from 'lucide-react';

export default function AguardandoAprovacaoPage() {
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    // Verificar periodicamente se foi aprovado
    const checkApproval = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('approved, role')
        .eq('id', user.id)
        .single();

      if (profile?.approved) {
        // Foi aprovado, redirecionar para dashboard
        if (profile.role === 'aluno') {
          router.push('/aluno/dashboard');
        } else {
          router.push('/coach/dashboard');
        }
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkApproval, 30000);
    checkApproval(); // Verificar imediatamente

    return () => clearInterval(interval);
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-2xl border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="relative w-48 h-48 mb-4">
            <Image
              src="/logo.png"
              alt="Brutal Team"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock size={32} className="text-yellow-600 animate-pulse" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">
            Aguardando Aprovação
          </h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-gray-700">
              Seu cadastro foi recebido com sucesso e está aguardando aprovação do coach.
            </p>
            <p className="text-gray-600 text-sm mt-2">
              Você receberá acesso ao sistema assim que seu cadastro for aprovado.
              Isso pode levar alguns minutos.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              💡 Esta página atualiza automaticamente a cada 30 segundos.
              Você será redirecionado assim que for aprovado.
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 mx-auto px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} />
            Sair
          </button>
        </div>
      </div>
    </div>
  );
}
