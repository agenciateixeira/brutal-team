import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import Link from 'next/link';
import {
  User,
  Shield,
  FileText,
  Bell,
  ChevronRight,
  Settings
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ConfiguracoesPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  const settingsCards = [
    {
      title: 'Notificações',
      description: 'Gerencie suas preferências de notificações',
      icon: Bell,
      href: '/aluno/configuracoes/notificacoes',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Perfil Público',
      description: 'Edite sua foto, nome e bio',
      icon: User,
      href: '/aluno/configuracoes/perfil',
      color: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Senha e Segurança',
      description: 'Altere senha, email e configure 2FA',
      icon: Shield,
      href: '/aluno/configuracoes/seguranca',
      color: 'from-green-500 to-green-600',
    },
    {
      title: 'Dados Pessoais',
      description: 'Informações de contato e controle da conta',
      icon: FileText,
      href: '/aluno/configuracoes/dados-pessoais',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <AppLayout profile={profile}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings size={32} className="text-primary-600 dark:text-primary-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configurações
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie suas preferências e informações da conta
          </p>
        </div>

        {/* Settings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
                className="group bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-all duration-200 hover:scale-[1.02]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center mb-4`}>
                      <Icon size={24} className="text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {card.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {card.description}
                    </p>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-gray-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors flex-shrink-0 mt-4"
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Info Card */}
        <div className="mt-8 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-primary-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || 'Avatar'}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-500"
              />
            ) : (
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {profile.full_name || 'Usuário'}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {profile.email}
              </p>
              {profile.bio && (
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1 italic">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
