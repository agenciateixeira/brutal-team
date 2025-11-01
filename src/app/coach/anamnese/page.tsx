import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import AppLayout from '@/components/layouts/AppLayout';
import { BookOpen, User, Mail, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function CoachAnamnesePage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  // Buscar dados do coach
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'coach') {
    redirect('/aluno/dashboard');
  }

  // Buscar todas as anamneses completas
  const { data: anamneses, error: anamneseError } = await supabase
    .from('anamnese_responses')
    .select('*')
    .eq('completed', true)
    .order('completed_at', { ascending: false });

  console.log('=== DEBUG ANAMNESE PAGE ===');
  console.log('Anamneses encontradas:', anamneses?.length || 0);
  console.log('Erro:', anamneseError);
  console.log('Dados:', anamneses);

  // Buscar perfis dos alunos
  const emails = anamneses?.map(a => a.temp_email) || [];
  const { data: alunosProfiles } = await supabase
    .from('profiles')
    .select('email, full_name, id')
    .in('email', emails);

  // Criar mapa de email -> perfil
  const profileMap = new Map(alunosProfiles?.map(p => [p.email, p]) || []);

  return (
    <AppLayout profile={profile}>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <BookOpen size={28} className="text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                Anamneses dos Alunos
              </h1>
              <p className="text-sm md:text-base text-gray-600 dark:text-gray-400 mt-1">
                Visualize as respostas dos questionários de anamnese
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Anamneses */}
        <div className="space-y-4">
          {!anamneses || anamneses.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                Nenhuma anamnese completa encontrada
              </p>
            </div>
          ) : (
            anamneses.map((anamnese) => {
              const alunoProfile = profileMap.get(anamnese.temp_email);

              return (
                <details
                  key={anamnese.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden group"
                >
                  <summary className="px-6 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors list-none">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                          <User size={24} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                              {alunoProfile?.full_name || 'Aluno'}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                              <Mail size={14} />
                              <span className="truncate">{anamnese.temp_email}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>
                              Respondido em {format(new Date(anamnese.completed_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown size={20} className="text-gray-400 group-open:rotate-180 transition-transform flex-shrink-0" />
                    </div>
                  </summary>

                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <div className="space-y-6">
                      {/* Informações Básicas */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          📋 Informações Básicas
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Idade</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.idade} anos</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Altura</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.altura} cm</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Peso</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.peso} kg</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">IMC</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">
                              {(anamnese.peso / Math.pow(anamnese.altura / 100, 2)).toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Medidas */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          📏 Medidas Corporais
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Cintura</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.cintura} cm</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Braço</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.braco} cm</p>
                          </div>
                          <div className="bg-white dark:bg-gray-800 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400">Perna</span>
                            <p className="text-base font-semibold text-gray-900 dark:text-white">{anamnese.perna} cm</p>
                          </div>
                        </div>
                      </div>

                      {/* Rotina */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          💼 Rotina
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Profissão</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.profissao}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Rotina de Trabalho</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.rotina_trabalho}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Estuda</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">
                              {anamnese.estuda ? 'Sim' : 'Não'}
                              {anamnese.estuda && anamnese.horarios_estudo && ` - ${anamnese.horarios_estudo}`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Atividade Física */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          🏃 Atividade Física
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Pratica atividade física</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">
                              {anamnese.pratica_atividade_fisica ? 'Sim' : 'Não'}
                            </p>
                          </div>
                          {anamnese.pratica_atividade_fisica && (
                            <>
                              {anamnese.modalidades_exercicio && (
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Modalidades</span>
                                  <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.modalidades_exercicio}</p>
                                </div>
                              )}
                              {anamnese.dias_horarios_atividade && (
                                <div>
                                  <span className="text-xs text-gray-500 dark:text-gray-400">Dias e horários</span>
                                  <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.dias_horarios_atividade}</p>
                                </div>
                              )}
                            </>
                          )}
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Horários de sono</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.horarios_sono}</p>
                          </div>
                        </div>
                      </div>

                      {/* Objetivos */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          🎯 Objetivos
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Trajetória e objetivos</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.trajetoria_objetivos}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Mudanças esperadas</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.mudancas_esperadas}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Resultado estético final</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.resultado_estetico_final}</p>
                          </div>
                        </div>
                      </div>

                      {/* Histórico de Treino */}
                      <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
                          📊 Histórico de Treino
                        </h4>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-3">
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Tempo de treino contínuo</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.tempo_treino_continuo}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Resultados estagnados</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">
                              {anamnese.resultados_estagnados ? 'Sim' : 'Não'}
                            </p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Percepção de pump</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.percepcao_pump}</p>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500 dark:text-gray-400">Uso de esteroides</span>
                            <p className="text-sm text-gray-900 dark:text-white mt-1">
                              {anamnese.uso_esteroides ? 'Sim' : 'Não'}
                              {anamnese.uso_esteroides && anamnese.quais_esteroides && ` - ${anamnese.quais_esteroides}`}
                            </p>
                          </div>
                          {anamnese.outras_substancias && (
                            <div>
                              <span className="text-xs text-gray-500 dark:text-gray-400">Outras substâncias</span>
                              <p className="text-sm text-gray-900 dark:text-white mt-1">{anamnese.outras_substancias}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </details>
              );
            })
          )}
        </div>
      </div>
    </AppLayout>
  );
}
