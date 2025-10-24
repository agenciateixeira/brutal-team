'use client';

import { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { Profile } from '@/types';
import ThemeToggle from './ThemeToggle';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface SidebarProps {
  profile: Profile;
}

export default function Sidebar({ profile }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const isCoach = profile.role === 'coach';

  const menuItems = isCoach ? [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/coach/dashboard' },
    { icon: Users, label: 'Alunos', href: '/coach/alunos' },
    { icon: DollarSign, label: 'Pagamentos', href: '/admin/dashboard' },
    { icon: User, label: 'Perfil', href: '/coach/perfil' },
  ] : [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/aluno/dashboard' },
    { icon: ImageIcon, label: 'Progresso', href: '/aluno/progresso' },
    { icon: MessageCircle, label: 'Mensagens', href: '/aluno/mensagens' },
    { icon: Apple, label: 'Dieta', href: '/aluno/dieta' },
    { icon: Dumbbell, label: 'Treino', href: '/aluno/treino' },
    { icon: Syringe, label: 'Protocolo', href: '/aluno/protocolo' },
    { icon: User, label: 'Perfil', href: '/aluno/perfil' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-lg text-gray-700"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200
          transform transition-transform duration-300 ease-in-out z-40
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
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

              return (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive
                      ? 'bg-primary-50 text-primary-600 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100'
                    }
                  `}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
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
              className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <LogOut size={20} />
              <span>Sair</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
