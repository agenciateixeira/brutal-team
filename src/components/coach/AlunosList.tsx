'use client';

import { Profile } from '@/types';
import { User, MessageCircle, ChevronRight, Search, Filter, Calendar, Bell, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import AlunoNotificationIndicator from './AlunoNotificationIndicator';
import AlunoStatistics from './AlunoStatistics';

interface AlunosListProps {
  alunos: (Profile & {
    unread_messages_count?: number;
    last_activity?: string | null;
    has_unviewed_updates?: boolean;
    notifications?: {
      photo: boolean;
      message: boolean;
      diet: boolean;
      workout: boolean;
      protocol: boolean;
      count: number;
    };
    has_all_notifications?: boolean;
  })[];
}

type SortOption = 'newest' | 'oldest' | 'recent_activity' | 'name';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending' | 'overdue';
type UpdatesFilter = 'all' | 'unviewed' | 'viewed' | 'recent';
type AdesaoFilter = 'all' | 'excelente' | 'bom' | 'atencao';

export default function AlunosList({ alunos }: AlunosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [updatesFilter, setUpdatesFilter] = useState<UpdatesFilter>('all');
  const [adesaoFilter, setAdesaoFilter] = useState<AdesaoFilter>('all');

  const filteredAndSortedAlunos = useMemo(() => {
    let result = [...alunos];

    // Filtro por busca
    result = result.filter((aluno) =>
      aluno.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filtro por status
    if (statusFilter !== 'all') {
      result = result.filter((aluno) => {
        const status = aluno.payment_status || 'active';
        if (statusFilter === 'active') return status === 'active';
        if (statusFilter === 'inactive') return status === 'suspended';
        if (statusFilter === 'pending') return status === 'pending';
        if (statusFilter === 'overdue') return status === 'overdue';
        return true;
      });
    }

    // Filtro por atualizações
    if (updatesFilter !== 'all') {
      if (updatesFilter === 'unviewed') {
        result = result.filter((aluno) => aluno.has_unviewed_updates || aluno.unread_messages_count! > 0);
      } else if (updatesFilter === 'viewed') {
        result = result.filter((aluno) => !aluno.has_unviewed_updates && !aluno.unread_messages_count);
      } else if (updatesFilter === 'recent') {
        // Alunos com atividade nos últimos 7 dias
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        result = result.filter((aluno) => {
          if (!aluno.last_activity) return false;
          return new Date(aluno.last_activity) > sevenDaysAgo;
        });
      }
    }

    // Ordenação
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'recent_activity':
          const aActivity = a.last_activity ? new Date(a.last_activity).getTime() : 0;
          const bActivity = b.last_activity ? new Date(b.last_activity).getTime() : 0;
          return bActivity - aActivity;
        case 'name':
          const aName = a.full_name || a.email;
          const bName = b.full_name || b.email;
          return aName.localeCompare(bName);
        default:
          return 0;
      }
    });

    return result;
  }, [alunos, searchTerm, sortBy, statusFilter, updatesFilter]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <User size={24} />
            Meus Alunos
            <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
              ({filteredAndSortedAlunos.length} de {alunos.length})
            </span>
          </h2>
        </div>

        {/* Search */}
        {alunos.length > 0 && (
          <div className="relative">
            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar aluno por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        )}

        {/* Filters */}
        {alunos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Ordenação */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Calendar size={14} />
                Ordenar por
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="newest">Mais recente</option>
                <option value="oldest">Mais antigo</option>
                <option value="recent_activity">Atividade recente</option>
                <option value="name">Nome (A-Z)</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <CheckCircle size={14} />
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="pending">Pendentes</option>
                <option value="overdue">Atrasados</option>
                <option value="inactive">Inativos</option>
              </select>
            </div>

            {/* Atualizações */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <Bell size={14} />
                Atualizações
              </label>
              <select
                value={updatesFilter}
                onChange={(e) => setUpdatesFilter(e.target.value as UpdatesFilter)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todas</option>
                <option value="unviewed">Não visualizadas</option>
                <option value="viewed">Já visualizadas</option>
                <option value="recent">Últimos 7 dias</option>
              </select>
            </div>

            {/* Adesão */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                <TrendingUp size={14} />
                Adesão
              </label>
              <select
                value={adesaoFilter}
                onChange={(e) => setAdesaoFilter(e.target.value as AdesaoFilter)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todas</option>
                <option value="excelente">Excelente (≥80%)</option>
                <option value="bom">Bom (60-79%)</option>
                <option value="atencao">Precisa atenção (&lt;60%)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      <div className="divide-y divide-gray-200 dark:border-gray-700">
        {filteredAndSortedAlunos.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado ainda'}
          </div>
        ) : (
          filteredAndSortedAlunos.map((aluno) => (
            <Link
              key={aluno.id}
              href={`/coach/aluno/${aluno.id}`}
              className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group"
            >
              <div className="flex items-center gap-4 flex-1">
                <div className="relative">
                  {aluno.avatar_url ? (
                    <img
                      src={aluno.avatar_url}
                      alt={aluno.full_name || 'Avatar'}
                      className="w-12 h-12 rounded-full object-cover border-2 border-primary-500"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg">
                      {aluno.full_name?.[0]?.toUpperCase() || aluno.email[0].toUpperCase()}
                    </div>
                  )}
                  {/* Indicadores de notificações por tipo */}
                  <AlunoNotificationIndicator
                    hasPhoto={aluno.notifications?.photo || false}
                    hasMessage={aluno.notifications?.message || false}
                    hasAll={aluno.has_all_notifications || false}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm md:text-base text-gray-900 dark:text-white font-semibold group-hover:text-primary-600 dark:group-hover:text-primary-500 transition-colors truncate">
                      {aluno.full_name || 'Nome não definido'}
                    </h3>
                    {/* Badge de status */}
                    {aluno.payment_status && aluno.payment_status !== 'active' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        aluno.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        aluno.payment_status === 'overdue' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                      }`}>
                        {aluno.payment_status === 'pending' ? 'Pendente' :
                         aluno.payment_status === 'overdue' ? 'Atrasado' :
                         'Inativo'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">{aluno.email}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      Cadastrado em {format(new Date(aluno.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </span>
                    {aluno.last_activity && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Ativo {formatDistanceToNow(new Date(aluno.last_activity), { addSuffix: true, locale: ptBR })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {aluno.unread_messages_count! > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-primary-600 text-white rounded-full">
                    <MessageCircle size={16} />
                    <span className="text-sm font-semibold">
                      {aluno.unread_messages_count}
                    </span>
                  </div>
                )}

                <ChevronRight size={20} className="text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors" />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
