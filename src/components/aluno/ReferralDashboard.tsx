'use client';

import { useState } from 'react';
import { Profile } from '@/types';
import { Copy, Check, Share2, Gift, Users, Trophy, Sparkles, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import Toast from '@/components/ui/Toast';

interface ReferralStats {
  user_id: string;
  full_name: string;
  referral_code: string;
  active_referrals: number;
  pending_referrals: number;
  total_referrals: number;
  discount_percentage: number;
  has_full_discount: boolean;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  referred_email: string | null;
  referred_name: string | null;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  discount_applied: boolean;
  created_at: string;
  activated_at: string | null;
}

interface ReferralDashboardProps {
  profile: Profile;
  stats: ReferralStats | null;
  referrals: Referral[];
}

export default function ReferralDashboard({ profile, stats, referrals }: ReferralDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const referralCode = profile.referral_code || 'Carregando...';
  const referralLink = `${window.location.origin}/cadastro?ref=${referralCode}`;

  const activeCount = stats?.active_referrals || 0;
  const pendingCount = stats?.pending_referrals || 0;
  const totalCount = stats?.total_referrals || 0;
  const discountPercentage = stats?.discount_percentage || 0;
  const progress = Math.min((activeCount / 10) * 100, 100);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setToast({ type: 'success', message: 'Código copiado!' });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setToast({ type: 'success', message: 'Link copiado!' });
  };

  const handleShareWhatsApp = () => {
    const message = encodeURIComponent(
      `🔥 Fala! Conhece a Brutal Team? É uma assessoria fitness top!\n\n` +
      `Usa meu código ${referralCode} no cadastro e ganha 10% OFF!\n\n` +
      `Link: ${referralLink}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
      active: { label: 'Ativo', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' },
      expired: { label: 'Expirado', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300' },
    };
    const badge = badges[status as keyof typeof badges] || badges.pending;
    return <span className={`px-2 py-1 rounded-full text-xs font-semibold ${badge.color}`}>{badge.label}</span>;
  };

  const getBadgeTitle = () => {
    if (activeCount >= 10) return { emoji: '👑', title: 'LENDA BRUTAL', color: 'from-yellow-400 to-orange-500' };
    if (activeCount >= 5) return { emoji: '🏆', title: 'EMBAIXADOR BRUTAL', color: 'from-purple-400 to-pink-500' };
    if (activeCount >= 3) return { emoji: '⭐', title: 'INFLUENCER', color: 'from-blue-400 to-cyan-500' };
    if (activeCount >= 1) return { emoji: '🎯', title: 'INICIANTE', color: 'from-green-400 to-emerald-500' };
    return { emoji: '🎁', title: 'COMECE A INDICAR', color: 'from-gray-400 to-gray-500' };
  };

  const badge = getBadgeTitle();

  return (
    <div className="space-y-6">
      {/* Badge e Progresso */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-blue-600 rounded-2xl p-8 text-white shadow-2xl"
      >
        {/* Efeito de brilho */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">{badge.emoji}</span>
                <div>
                  <div className={`text-sm font-bold bg-gradient-to-r ${badge.color} bg-clip-text text-transparent`}>
                    NÍVEL ATUAL
                  </div>
                  <h2 className="text-2xl font-black tracking-tight">{badge.title}</h2>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-5xl font-black">{discountPercentage}%</div>
              <div className="text-sm opacity-90">de desconto</div>
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="font-semibold">Progresso para mensalidade grátis</span>
              <span className="font-bold">{activeCount}/10 indicações ativas</span>
            </div>
            <div className="h-4 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-white rounded-full shadow-lg"
              />
            </div>
            {activeCount >= 10 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2 text-yellow-300 font-bold"
              >
                <Trophy size={20} />
                <span>🎉 PARABÉNS! Você conquistou 1 mês grátis!</span>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Seu Código */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Gift size={20} className="text-primary-600" />
          Seu Código de Indicação
        </h3>

        <div className="space-y-4">
          {/* Código */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 border-2 border-primary-500 rounded-lg px-6 py-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Código único</div>
              <div className="text-2xl font-black text-primary-600 dark:text-primary-400 tracking-wider">
                {referralCode}
              </div>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-4 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
            >
              {copied ? <Check size={24} /> : <Copy size={24} />}
            </button>
          </div>

          {/* Link */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3">
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Link de cadastro</div>
              <div className="text-sm text-gray-700 dark:text-gray-300 truncate font-mono">
                {referralLink}
              </div>
            </div>
            <button
              onClick={handleCopyLink}
              className="p-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              <ExternalLink size={20} />
            </button>
          </div>

          {/* Compartilhar */}
          <button
            onClick={handleShareWhatsApp}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <Share2 size={20} />
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      {/* Como Funciona */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-blue-600" />
          Como Funciona?
        </h3>
        <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">1</span>
            <p><strong>Compartilhe</strong> seu código ou link com amigos</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">2</span>
            <p>Seu amigo usa o código ao <strong>fechar contrato</strong> e ganha <strong>10% OFF</strong></p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">3</span>
            <p><strong>Você ganha 10%</strong> de desconto para cada amigo ativo (até 100%)</p>
          </div>
          <div className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center font-bold">🎁</span>
            <p className="font-bold text-yellow-700 dark:text-yellow-300">
              Indique 10 amigos = <span className="text-lg">1 MÊS GRÁTIS!</span>
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <Check size={20} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{activeCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Indicações Ativas</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Users size={20} className="text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{pendingCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Pendentes</div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <Trophy size={20} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total de Indicações</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Indicações */}
      {referrals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Users size={20} className="text-primary-600" />
            Suas Indicações ({referrals.length})
          </h3>

          <div className="space-y-3">
            {referrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {referral.referred_name || referral.referred_email || 'Aguardando cadastro'}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(referral.created_at).toLocaleDateString('pt-BR')}
                  </div>
                </div>
                <div>
                  {getStatusBadge(referral.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
