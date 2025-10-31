'use client';

import { useState } from 'react';
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
  BookOpen
} from 'lucide-react';
import { Profile } from '@/types';
import { createClient } from '@/lib/supabase/client';

interface BottomNavigationProps {
  profile: Profile;
}

export default function BottomNavigation({ profile }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [showMenu, setShowMenu] = useState(false);
  const isAluno = profile.role === 'aluno';

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const mainNavItems = isAluno
    ? [
        { href: '/aluno/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/aluno/dieta', icon: Apple, label: 'Dieta' },
        { href: '/aluno/treino', icon: Dumbbell, label: 'Treino' },
        { href: '/aluno/protocolo', icon: Syringe, label: 'Protocolo' },
      ]
    : [
        { href: '/coach/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/coach/alunos', icon: User, label: 'Alunos' },
        { href: '/coach/templates', icon: FileText, label: 'Templates' },
        { href: '/coach/pagamentos', icon: DollarSign, label: 'Pagamentos' },
      ];

  const menuItems = isAluno
    ? [
        { href: '/aluno/perfil', icon: User, label: 'Perfil' },
        { href: '/aluno/mensagens', icon: MessageCircle, label: 'Mensagens' },
        { href: '/aluno/progresso', icon: Calendar, label: 'Progresso' },
        { href: '/aluno/guia-nutricional', icon: BookOpen, label: 'Guia Nutricional' },
      ]
    : [
        { href: '/coach/perfil', icon: User, label: 'Perfil' },
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
                  <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                    <User size={20} className="text-primary-600 dark:text-primary-400" />
                  </div>
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
