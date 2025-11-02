'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  LayoutDashboard,
  User,
  Image as ImageIcon,
  MessageCircle,
  Apple,
  Dumbbell,
  Syringe,
  Menu,
  X,
  LogOut,
  Users,
  DollarSign,
  FileText,
  BookOpen
} from 'lucide-react';
import { Profile } from '@/types';
import ThemeToggle from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useLoading } from '@/components/providers/LoadingProvider';
import NavLink from './NavLink';

interface SidebarProps {
  profile: Profile;
}

interface UnreadCounts {
  messages: number;
  dietas: number;
  treinos: number;
  protocolos: number;
}

export default function Sidebar({ profile }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState<UnreadCounts>({
    messages: 0,
    dietas: 0,
    treinos: 0,
    protocolos: 0,
  });
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { showLoading } = useLoading();

  const isCoach = profile.role === 'coach';

  // Prefetch das páginas principais para navegação instantânea
  useEffect(() => {
    const pagesToPrefetch = isCoach
      ? ['/coach/dashboard', '/coach/alunos', '/coach/templates', '/coach/anamnese', '/coach/pagamentos', '/coach/perfil']
      : ['/aluno/dashboard', '/aluno/dieta', '/aluno/treino', '/aluno/protocolo', '/aluno/mensagens', '/aluno/progresso', '/aluno/perfil'];

    pagesToPrefetch.forEach((path) => {
      router.prefetch(path);
    });
  }, [isCoach, router]);

  // Carregar contadores de não lidos para alunos
  useEffect(() => {
    if (!isCoach) {
      loadUnreadCounts();

      // Subscription apenas para mensagens (único com controle de read/unread)
      const messagesChannel = supabase
        .channel('sidebar-messages')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `aluno_id=eq.${profile.id}`
        }, () => {
          loadUnreadCounts();
        })
        .subscribe();

      return () => {
        messagesChannel.unsubscribe();
      };
    }
  }, [isCoach, profile.id]);

  const loadUnreadCounts = async () => {
    try {
      // Mensagens não lidas (único com controle real de read/unread)
      const { count: messagesCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('aluno_id', profile.id)
        .eq('read', false)
        .neq('sender_id', profile.id);

      setUnreadCounts({
        messages: messagesCount || 0,
        dietas: 0, // Removido: não tem controle de visualizado
        treinos: 0, // Removido: não tem controle de visualizado
        protocolos: 0, // Removido: não tem controle de visualizado
      });
    } catch (error) {
      console.error('Erro ao carregar contadores:', error);
    }
  };

  const menuItems = isCoach ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/coach/dashboard' },
    { icon: Users, label: 'Alunos', href: '/coach/alunos' },
    { icon: FileText, label: 'Templates', href: '/coach/templates' },
    { icon: BookOpen, label: 'Anamnese', href: '/coach/anamnese' },
    { icon: DollarSign, label: 'Pagamentos', href: '/coach/pagamentos' },
    { icon: User, label: 'Perfil', href: '/coach/perfil' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/aluno/dashboard' },
    { icon: ImageIcon, label: 'Atualização Semanal', href: '/aluno/progresso' },
    { icon: MessageCircle, label: 'Mensagens', href: '/aluno/mensagens' },
    { icon: Apple, label: 'Dieta', href: '/aluno/dieta' },
    { icon: Dumbbell, label: 'Treino', href: '/aluno/treino' },
    { icon: Syringe, label: 'Protocolo', href: '/aluno/protocolo' },
    { icon: BookOpen, label: 'Guia Nutricional', href: '/aluno/guia-nutricional' },
    { icon: User, label: 'Perfil', href: '/aluno/perfil' },
  ];

  const handleLogout = async () => {
    const userName = profile.full_name || profile.email.split('@')[0];
    showLoading(`Te aguardamos amanhã, ${userName}!`, 1300); // 1.3 segundos para logout

    try {
      // Usar scope local para evitar erro 403
      await supabase.auth.signOut({ scope: 'local' });

      // Redirecionar após logout
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      // Mesmo com erro, limpar sessão local e redirecionar
      router.push('/login');
      router.refresh();
    }
  };

  return (
    <>
      {/* Mobile Menu Button */}
      {/* Sidebar - Only visible on desktop */}
      <aside
        className="hidden lg:block fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-40"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 mb-2">
                <Image
                  src="/logo.png"
                  alt="Brutal Team"
                  fill
                  className="object-contain"
                />
              </div>
              {isCoach && (
                <span className="inline-block px-2 py-1 text-xs font-semibold bg-primary-100 text-primary-600 rounded">
                  Coach
                </span>
              )}
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold">
                {profile.full_name?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {profile.full_name || 'Usuário'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {profile.email}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              // Lógica especial: "Alunos" nunca é marcado como ativo, apenas Dashboard
              const isActive = item.label !== 'Alunos' && (pathname === item.href || pathname.startsWith(item.href + '/'));

              // Determinar badge count baseado no label
              let badgeCount = 0;
              let badgeColor = 'bg-blue-500';

              if (!isCoach) {
                if (item.label === 'Mensagens') {
                  badgeCount = unreadCounts.messages;
                  badgeColor = 'bg-blue-500';
                } else if (item.label === 'Dieta') {
                  badgeCount = unreadCounts.dietas;
                  badgeColor = 'bg-green-500';
                } else if (item.label === 'Treino') {
                  badgeCount = unreadCounts.treinos;
                  badgeColor = 'bg-orange-500';
                } else if (item.label === 'Protocolo') {
                  badgeCount = unreadCounts.protocolos;
                  badgeColor = 'bg-purple-500';
                }
              }

              return (
                <NavLink
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  loadingMessage={`Carregando ${item.label}...`}
                  onClick={() => setIsOpen(false)}
                  disableLoading={isCoach}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 relative
                    ${isActive
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold scale-105'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                    }
                  `}
                >
                  <Icon
                    size={20}
                    className={`transition-transform duration-200 ${
                      isActive
                        ? 'animate-pulse'
                        : 'group-hover:scale-110 group-hover:rotate-12'
                    }`}
                  />
                  <span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full ${badgeColor} text-white text-xs font-bold`}>
                      {badgeCount}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tema</span>
              <ThemeToggle />
            </div>

            <button
              onClick={handleLogout}
              className="group flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:scale-105 transition-all duration-200"
            >
              <LogOut size={20} className="group-hover:scale-110 group-hover:-rotate-12 transition-transform duration-200" />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
