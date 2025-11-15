import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import PhotoUploadFull from '@/components/aluno/PhotoUploadFull';
import WeightChart from '@/components/evolution/WeightChart';
import MeasurementsChart from '@/components/evolution/MeasurementsChart';
import PhotoComparison from '@/components/evolution/PhotoComparison';
import { Activity, TrendingUp, Sparkles } from 'lucide-react';

export default async function ProgressoPage() {
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

  // Buscar fotos de progresso
  const { data: photos } = await supabase
    .from('progress_photos')
    .select('*')
    .eq('aluno_id', session.user.id)
    .order('week_number', { ascending: false});

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        {/* Header Moderno com Liquid Glass */}
        <div className="relative overflow-hidden backdrop-blur-2xl bg-white/40 dark:bg-gray-800/40 rounded-2xl p-8 shadow-2xl border-2 border-white/60 dark:border-gray-700/60">
          {/* Liquid Glass Layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-blue-500/10 to-purple-500/10"></div>

          {/* Glass shine effect - top */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent rounded-t-2xl"></div>

          {/* Shimmer animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>

          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/70 dark:border-gray-700/70 shadow-lg">
                <TrendingUp className="text-primary-600 dark:text-primary-400" size={32} />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 dark:text-white drop-shadow-sm">
                  Evolução & Progresso
                </h1>
                <p className="text-gray-700 dark:text-gray-300 text-sm md:text-base mt-1 flex items-center gap-2">
                  <Sparkles size={16} className="text-primary-600 dark:text-primary-400" />
                  Sua jornada de transformação em números e imagens
                </p>
              </div>
            </div>

            {/* Stats rápidas com Liquid Glass */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="relative overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-white/70 dark:border-gray-700/70 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative z-10">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Fotos enviadas</p>
                  <p className="text-gray-900 dark:text-white text-2xl font-bold mt-1">{photos?.length || 0}</p>
                </div>
              </div>
              <div className="relative overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-white/70 dark:border-gray-700/70 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative z-10">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Semanas ativas</p>
                  <p className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                    {photos?.length ? Math.ceil(photos.length / 4) : 0}
                  </p>
                </div>
              </div>
              <div className="relative overflow-hidden backdrop-blur-sm bg-white/50 dark:bg-gray-800/50 rounded-xl p-3 border border-white/70 dark:border-gray-700/70 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                <div className="relative z-10">
                  <p className="text-gray-600 dark:text-gray-400 text-xs font-medium">Esta semana</p>
                  <p className="text-gray-900 dark:text-white text-2xl font-bold mt-1">
                    {photos?.filter(p => {
                      const weekAgo = new Date();
                      weekAgo.setDate(weekAgo.getDate() - 7);
                      return new Date(p.created_at) > weekAgo;
                    }).length || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom highlight line */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </div>

        {/* Upload de Fotos */}
        <PhotoUploadFull alunoId={session.user.id} photos={photos || []} />

        {/* Comparador de Fotos */}
        <PhotoComparison alunoId={session.user.id} />

        {/* Grid de Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <WeightChart alunoId={session.user.id} />
          <MeasurementsChart alunoId={session.user.id} />
        </div>

        {/* Dica com Glassmorphism */}
        <div className="relative overflow-hidden backdrop-blur-xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-600/20 border-2 border-blue-400/50 shadow-xl shadow-blue-500/30 rounded-2xl p-6">
          {/* Glassmorphism layers */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-blue-600/20 opacity-80"></div>

          {/* Glass shine effect */}
          <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>

          <div className="relative z-10 flex items-start gap-4">
            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30">
              <Activity className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Sparkles size={18} className="text-blue-600" />
                Dica de Ouro: Consistência é a Chave!
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                Para resultados incríveis, registre seu peso e medidas <strong>toda semana</strong>.
                Tire suas fotos sempre no <strong>mesmo horário</strong>, com a <strong>mesma roupa</strong>
                e na <strong>mesma iluminação</strong>. Isso garante que você veja sua real evolução! 💪
              </p>
            </div>
          </div>

          {/* Bottom highlight */}
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
        </div>
      </div>
    </AppLayout>
  );
}
