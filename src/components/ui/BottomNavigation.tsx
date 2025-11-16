'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Apple,
  Dumbbell,
  Syringe,
  Menu,
  X,
  User,
  MessageCircle,
  Calendar,
  FileText,
  Settings,
  LogOut,
  DollarSign,
  BookOpen,
  Gift,
  Users2,
  UserPlus,
  CreditCard,
  Landmark,
  Receipt,
  ArrowRightLeft
} from 'lucide-react';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';
import { useLoading } from '@/components/providers/LoadingProvider';

interface BottomNavigationProps {
  profile: Profile;
}

export default function BottomNavigation({ profile }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { showLoading } = useLoading();
  const [showMenu, setShowMenu] = useState(false);
  const [hasReferrals, setHasReferrals] = useState(false);
  const isAluno = profile.role === 'aluno';

  // Prefetch das páginas principais para navegação instantânea
  useEffect(() => {
    const pagesToPrefetch = isAluno
      ? ['/aluno/dashboard', '/aluno/dieta', '/aluno/treino', '/aluno/protocolo', '/aluno/mensagens', '/aluno/progresso']
      : ['/coach/dashboard', '/coach/alunos', '/coach/templates', '/coach/pagamentos-stripe'];

    pagesToPrefetch.forEach((path) => {
      router.prefetch(path);
    });
  }, [isAluno, router]);

  // Verificar se tem indicados (para mostrar comunidade)
  useEffect(() => {
    if (isAluno) {
      checkHasReferrals();
    }
  }, [isAluno]);

  const checkHasReferrals = async () => {
    try {
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', profile.id)
        .eq('status', 'active')
        .limit(1);

      setHasReferrals(referrals && referrals.length > 0);
    } catch (error) {
      console.error('Erro ao verificar indicações:', error);
    }
  };

  const handleLogout = async () => {
    const userName = profile.full_name || profile.email.split('@')[0];
    showLoading(`Até amanhã, ${userName}!`, 1300); // 1.3 segundos para logout

    try {
      // Limpar todos os storages
      localStorage.clear();
      sessionStorage.clear();

      // Limpar todos os cookies do Supabase manualmente
      const cookies = document.cookie.split(';');
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf('=');
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        // Remover cookie em todos os domínios possíveis
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=' + window.location.hostname;
      }

      // Fazer logout no Supabase
      await supabase.auth.signOut({ scope: 'local' });

      // Forçar redirecionamento completo
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar tudo e redirecionar
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const mainNavItems = isAluno
    ? [
        { href: '/aluno/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/aluno/dieta', icon: Apple, label: 'Dieta' },
        { href: '/aluno/treino', icon: Dumbbell, label: 'Treino' },
        { href: '/aluno/comunidade', icon: Users2, label: 'Comunidade' },
      ]
    : [
        { href: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/coach/alunos', icon: User, label: 'Alunos' },
        { href: '/coach/templates', icon: FileText, label: 'Templates' },
        { href: '/coach/pagamentos-stripe', icon: Receipt, label: 'Pagamentos' },
      ];

  const menuItems = isAluno
    ? [
        { href: '/aluno/configuracoes', icon: Settings, label: 'Configurações' },
        { href: '/aluno/mensagens', icon: MessageCircle, label: 'Mensagens' },
        { href: '/aluno/progresso', icon: Calendar, label: 'Progresso' },
        { href: '/aluno/guia-nutricional', icon: BookOpen, label: 'Guia Nutricional' },
        { href: '/aluno/protocolo', icon: Syringe, label: 'Protocolo' },
        { href: '/aluno/indicacao', icon: Gift, label: 'Indicação' },
      ]
    : [
        { href: '/coach/pagamentos-stripe', icon: Receipt, label: 'Pagamentos Stripe' },
        { href: '/coach/transferencias', icon: ArrowRightLeft, label: 'Transferências' },
        { href: '/coach/dados-bancarios', icon: Landmark, label: 'Dados Bancários' },
        { href: '/coach/assinatura', icon: CreditCard, label: 'Assinatura' },
        { href: '/coach/perfil', icon: Settings, label: 'Configurações' },
        { href: '/coach/anamnese', icon: BookOpen, label: 'Anamnese' },
      ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Bottom Navigation - Fixed */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 pb-safe">
        <div className="grid grid-cols-5 h-20 px-1">
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-gray-600 dark:text-gray-400 active:text-primary-600'
                }`}
              >
                <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[10px] leading-tight ${active ? 'font-semibold' : 'font-medium'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`flex flex-col items-center justify-center gap-0.5 transition-colors ${
              showMenu
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-600 dark:text-gray-400 active:text-primary-600'
            }`}
          >
            {showMenu ? (
              <X size={24} strokeWidth={showMenu ? 2.5 : 2} />
            ) : (
              <Menu size={24} strokeWidth={2} />
            )}
            <span className={`text-[10px] leading-tight ${showMenu ? 'font-semibold' : 'font-medium'}`}>
              Menu
            </span>
          </button>
        </div>
      </nav>

      {/* Menu Overlay */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/50 z-40 animate-in fade-in duration-200"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu Panel */}
          <div className="md:hidden fixed bottom-20 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50 animate-in slide-in-from-bottom duration-300">
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="p-4">
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  Mais Opções
                </h3>
                <div className="space-y-1">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowMenu(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                          active
                            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <Icon size={20} />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Sair</span>
                  </button>
                </div>
              </div>

              {/* User Info */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Avatar'}
                      className="w-10 h-10 rounded-full object-cover border-2 border-primary-500"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                      {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                      {profile.full_name || 'Usuário'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {profile.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Spacer para evitar que o conteúdo fique atrás da barra */}
      <div className="md:hidden h-20" />
    </>
  );
}
