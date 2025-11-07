'use client';

import { motion } from 'framer-motion';
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
  // Top 3 apenas
  const top3 = members.slice(0, 3);

  if (top3.length === 0) {
    return null;
  }

  const getPositionEmoji = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    return '🥉';
  };

  const getRingColor = (index: number) => {
    if (index === 0) return 'ring-yellow-400';
    if (index === 1) return 'ring-gray-400';
    return 'ring-amber-600';
  };

  return (
    <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 dark:border-gray-700/50">
      {/* Header minimalista */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🏆</span>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">Top Guerreiros</h3>
      </div>

      {/* Lista horizontal */}
      <div className="flex items-center gap-3 overflow-x-auto pb-1">
        {top3.map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center gap-1.5 min-w-[70px]"
          >
            {/* Avatar com ring */}
            <div className="relative">
              <div className={`w-14 h-14 rounded-full ring-2 ${getRingColor(index)} p-0.5`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.full_name}
                      width={56}
                      height={56}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary-600 to-blue-600 flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {member.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Badge posição */}
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-600">
                <span className="text-xs">{getPositionEmoji(index)}</span>
              </div>
            </div>

            {/* Nome e check-ins */}
            <div className="text-center">
              <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight truncate max-w-[70px]">
                {member.full_name.split(' ')[0]}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 font-semibold">
                {member.yearly_check_ins} check-ins
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
