'use client';

import { motion } from 'framer-motion';
import { Trophy, Flame, Target } from 'lucide-react';
import Image from 'next/image';

interface Member {
  id: string;
  full_name: string;
  avatar_url: string | null;
  yearly_check_ins: number;
  current_streak: number;
}

interface TopMembersProps {
  members: Member[];
}

export default function TopMembers({ members }: TopMembersProps) {
  // Pegar apenas top 2
  const top2 = members.slice(0, 2);

  if (top2.length === 0) {
    return null;
  }

  const getPosition = (index: number) => {
    if (index === 0) return { emoji: '🥇', color: 'from-yellow-400 to-yellow-600', border: 'border-yellow-400', shadow: 'shadow-yellow-500/50' };
    return { emoji: '🥈', color: 'from-gray-300 to-gray-500', border: 'border-gray-400', shadow: 'shadow-gray-500/50' };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-yellow-500" size={24} />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          🔥 Top Guerreiros
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {top2.map((member, index) => {
          const position = getPosition(index);

          return (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`relative overflow-hidden backdrop-blur-xl bg-gradient-to-br ${position.color} rounded-2xl p-6 shadow-2xl border-2 ${position.border} ${position.shadow}`}
            >
              {/* Glass effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-white/10 to-transparent"></div>
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent"></div>

              {/* Badge de posição */}
              <div className="absolute top-4 right-4 text-5xl opacity-20 select-none">
                {position.emoji}
              </div>

              <div className="relative z-10">
                {/* Avatar */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${position.color} rounded-full blur-lg opacity-75`}></div>
                    <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-xl">
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          alt={member.full_name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
                          <span className="text-3xl font-bold text-white">
                            {member.full_name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Badge de posição sobreposto */}
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-gray-200">
                      <span className="text-xl">{position.emoji}</span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-black text-lg drop-shadow-lg leading-tight">
                      {member.full_name}
                    </h3>
                    <p className="text-white/90 text-sm font-semibold">
                      #{index + 1} no Ranking
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Check-ins do ano */}
                  <div className="bg-white/20 backdrop-blur-sm border border-white/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="text-white" size={16} />
                      <p className="text-white/90 text-xs font-medium">Check-ins {new Date().getFullYear()}</p>
                    </div>
                    <p className="text-white text-2xl font-black drop-shadow-lg">
                      {member.yearly_check_ins}
                    </p>
                  </div>

                  {/* Streak atual */}
                  <div className="bg-white/20 backdrop-blur-sm border border-white/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Flame className="text-orange-300" size={16} />
                      <p className="text-white/90 text-xs font-medium">Sequência</p>
                    </div>
                    <p className="text-white text-2xl font-black drop-shadow-lg flex items-center gap-1">
                      {member.current_streak}
                      <span className="text-orange-300 text-base">🔥</span>
                    </p>
                  </div>
                </div>

                {/* Badge motivacional */}
                {index === 0 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: 'spring' }}
                    className="mt-3 bg-white/30 backdrop-blur-sm border border-white/50 rounded-lg p-2 text-center"
                  >
                    <p className="text-white text-xs font-bold drop-shadow">
                      👑 LÍDER ABSOLUTO
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
