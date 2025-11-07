'use client';

import { motion } from 'framer-motion';
import { Trophy, TrendingUp, Flame, Target, Medal } from 'lucide-react';
import Image from 'next/image';

interface Member {
  id: string;
  full_name: string;
  avatar_url: string | null;
  yearly_check_ins: number;
  current_streak: number;
  total_posts: number;
}

interface CommunityRankingProps {
  members: Member[];
  currentUserId: string;
}

export default function CommunityRanking({ members, currentUserId }: CommunityRankingProps) {
  // Ordenar por check-ins do ano
  const sortedMembers = [...members].sort((a, b) => b.yearly_check_ins - a.yearly_check_ins);

  const getMedalIcon = (position: number) => {
    if (position === 1) return <span className="text-2xl">🥇</span>;
    if (position === 2) return <span className="text-2xl">🥈</span>;
    if (position === 3) return <span className="text-2xl">🥉</span>;
    return <span className="text-gray-400 font-bold text-sm">#{position}</span>;
  };

  const getPositionColor = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (position === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (position === 3) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800';
  };

  const isCurrentUser = (memberId: string) => memberId === currentUserId;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Medal className="text-primary-600" size={24} />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ranking da Comunidade
          </h2>
        </div>
        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
          <TrendingUp size={16} />
          <span className="font-semibold">{sortedMembers.length} membros</span>
        </div>
      </div>

      {/* Lista do Ranking */}
      <div className="space-y-3">
        {sortedMembers.map((member, index) => {
          const position = index + 1;
          const isCurrent = isCurrentUser(member.id);

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-xl ${
                isCurrent
                  ? 'bg-gradient-to-r from-primary-500/20 to-blue-500/20 border-2 border-primary-500 shadow-lg shadow-primary-500/30'
                  : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              } p-4 hover:shadow-lg transition-all duration-300`}
            >
              {/* Highlight para usuário atual */}
              {isCurrent && (
                <>
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/10 via-blue-500/10 to-primary-500/10 animate-shimmer"></div>
                  <div className="absolute top-2 right-2 bg-primary-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    VOCÊ
                  </div>
                </>
              )}

              <div className="relative z-10 flex items-center gap-4">
                {/* Posição */}
                <div className={`w-16 h-16 flex items-center justify-center rounded-xl ${getPositionColor(position)} shadow-lg`}>
                  {getMedalIcon(position)}
                </div>

                {/* Avatar */}
                <div className="relative w-14 h-14 rounded-full overflow-hidden border-3 border-white dark:border-gray-700 shadow-md">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                      <span className="text-xl font-bold text-white">
                        {member.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-base truncate ${
                    isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'
                  }`}>
                    {member.full_name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    {/* Check-ins */}
                    <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                      <Target size={14} className="text-green-600" />
                      <span className="font-semibold">{member.yearly_check_ins} dias</span>
                    </div>

                    {/* Streak */}
                    {member.current_streak > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                        <Flame size={14} className="text-orange-600" />
                        <span className="font-semibold">{member.current_streak} 🔥</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Badge de destaque para top 3 */}
                {position <= 3 && (
                  <div className="hidden md:flex items-center gap-2">
                    <div className={`px-3 py-1 rounded-full ${getPositionColor(position)} text-white text-xs font-bold shadow-md`}>
                      Top {position}
                    </div>
                  </div>
                )}
              </div>

              {/* Barra de progresso visual (apenas para top 10) */}
              {position <= 10 && (
                <div className="mt-3 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((member.yearly_check_ins / sortedMembers[0].yearly_check_ins) * 100, 100)}%` }}
                    transition={{ duration: 0.8, delay: index * 0.05 }}
                    className={`h-full ${getPositionColor(position)}`}
                  />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Footer motivacional */}
      <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary-100 dark:bg-primary-900/50 rounded-lg">
            <Trophy className="text-primary-600" size={20} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              💡 Dica: Consistência vence intensidade!
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Poste seu treino todos os dias para subir no ranking e manter sua sequência ativa. 🔥
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
