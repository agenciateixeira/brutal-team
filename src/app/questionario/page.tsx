'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft, Check } from 'lucide-react';
import Toast from '@/components/ui/Toast';

export default function QuestionarioPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Dados do formulário
  const [tempEmail, setTempEmail] = useState('');
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [idade, setIdade] = useState('');
  const [altura, setAltura] = useState('');
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [braco, setBraco] = useState('');
  const [perna, setPerna] = useState('');
  const [profissao, setProfissao] = useState('');
  const [rotinaTrabalho, setRotinaTrabalho] = useState('');
  const [estuda, setEstuda] = useState<boolean | null>(null);
  const [horariosEstudo, setHorariosEstudo] = useState('');
  const [praticaAtividadeFisica, setPraticaAtividadeFisica] = useState<boolean | null>(null);
  const [modalidadesExercicio, setModalidadesExercicio] = useState('');
  const [diasHorariosAtividade, setDiasHorariosAtividade] = useState('');
  const [horariosSono, setHorariosSono] = useState('');
  const [trajetoriaObjetivos, setTrajetoriaObjetivos] = useState('');
  const [mudancasEsperadas, setMudancasEsperadas] = useState('');
  const [resultadoEsteticoFinal, setResultadoEsteticoFinal] = useState('');
  const [tempoTreinoContinuo, setTempoTreinoContinuo] = useState('');
  const [resultadosEstagnados, setResultadosEstagnados] = useState<boolean | null>(null);
  const [percepcaoPump, setPercepcaoPump] = useState('');
  const [usoEsteroides, setUsoEsteroides] = useState<boolean | null>(null);
  const [quaisEsteroides, setQuaisEsteroides] = useState('');
  const [outrasSubstancias, setOutrasSubstancias] = useState('');

  const totalSteps = 6;

  const validateStep = () => {
    switch (currentStep) {
      case 1: // Informações Básicas
        if (!tempEmail || !nomeCompleto || !idade || !altura || !peso) {
          setToast({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios' });
          return false;
        }
        if (!tempEmail.includes('@')) {
          setToast({ type: 'error', message: 'Digite um e-mail válido' });
          return false;
        }
        break;
      case 2: // Medidas
        if (!cintura || !braco || !perna) {
          setToast({ type: 'error', message: 'Por favor, preencha todas as medidas' });
          return false;
        }
        break;
      case 3: // Rotina
        if (!profissao || !rotinaTrabalho || estuda === null) {
          setToast({ type: 'error', message: 'Por favor, responda todas as perguntas' });
          return false;
        }
        if (estuda && !horariosEstudo) {
          setToast({ type: 'error', message: 'Informe os horários de estudo' });
          return false;
        }
        break;
      case 4: // Atividade Física
        if (praticaAtividadeFisica === null || !horariosSono) {
          setToast({ type: 'error', message: 'Por favor, responda todas as perguntas' });
          return false;
        }
        if (praticaAtividadeFisica && (!modalidadesExercicio || !diasHorariosAtividade)) {
          setToast({ type: 'error', message: 'Informe as modalidades e horários de atividade física' });
          return false;
        }
        break;
      case 5: // Objetivos
        if (!trajetoriaObjetivos || !mudancasEsperadas || !resultadoEsteticoFinal) {
          setToast({ type: 'error', message: 'Por favor, preencha todas as perguntas' });
          return false;
        }
        break;
      case 6: // Treino e Substâncias
        if (!tempoTreinoContinuo || resultadosEstagnados === null || !percepcaoPump || usoEsteroides === null) {
          setToast({ type: 'error', message: 'Por favor, responda todas as perguntas' });
          return false;
        }
        if (usoEsteroides && !quaisEsteroides) {
          setToast({ type: 'error', message: 'Especifique quais esteroides' });
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        handleSubmit();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error('Erro ao recuperar usuário antes de enviar anamnese:', userError);
      }

      let sanitizedEmail = tempEmail.trim().toLowerCase();
      if (user?.email) {
        sanitizedEmail = user.email.trim().toLowerCase();
      }

      if (!sanitizedEmail) {
        setToast({ type: 'error', message: 'Por favor, informe um e-mail válido' });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('anamnese_responses')
        .insert({
          temp_email: sanitizedEmail,
          nome_completo: nomeCompleto,
          idade: parseInt(idade),
          altura: parseFloat(altura),
          peso: parseFloat(peso),
          cintura: parseFloat(cintura),
          braco: parseFloat(braco),
          perna: parseFloat(perna),
          profissao,
          rotina_trabalho: rotinaTrabalho,
          estuda,
          horarios_estudo: estuda ? horariosEstudo : null,
          pratica_atividade_fisica: praticaAtividadeFisica,
          modalidades_exercicio: praticaAtividadeFisica ? modalidadesExercicio : null,
          dias_horarios_atividade: praticaAtividadeFisica ? diasHorariosAtividade : null,
          horarios_sono: horariosSono,
          trajetoria_objetivos: trajetoriaObjetivos,
          mudancas_esperadas: mudancasEsperadas,
          resultado_estetico_final: resultadoEsteticoFinal,
          tempo_treino_continuo: tempoTreinoContinuo,
          resultados_estagnados: resultadosEstagnados,
          percepcao_pump: percepcaoPump,
          uso_esteroides: usoEsteroides,
          quais_esteroides: usoEsteroides ? quaisEsteroides : null,
          outras_substancias: outrasSubstancias || null,
          completed: true,
          completed_at: new Date().toISOString(),
        });

      if (error) throw error;

      setToast({ type: 'success', message: 'Questionário enviado com sucesso!' });

      setTimeout(() => {
        if (user) {
          router.push('/aluno/dashboard');
        } else {
          router.push('/cadastro');
        }
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao enviar questionário:', error);
      setToast({ type: 'error', message: `Erro ao enviar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Questionário de Anamnese
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Passo {currentStep} de {totalSteps}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Step 1: Informações Básicas */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Informações Básicas
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  E-mail (será usado no cadastro) *
                </label>
                <input
                  type="email"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="seu@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={nomeCompleto}
                  onChange={(e) => setNomeCompleto(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="João Silva"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Idade *
                  </label>
                  <input
                    type="number"
                    value={idade}
                    onChange={(e) => setIdade(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="25"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Altura (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="175"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Peso (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={peso}
                    onChange={(e) => setPeso(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="75"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Medidas */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Medidas Corporais
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Cintura (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={cintura}
                    onChange={(e) => setCintura(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="80"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Braço (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={braco}
                    onChange={(e) => setBraco(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="35"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Perna (cm) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={perna}
                    onChange={(e) => setPerna(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="55"
                    required
                  />
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  📏 <strong>Dica:</strong> Tire as medidas pela manhã, antes de treinar, para maior precisão.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Rotina */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Rotina Diária
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profissão *
                </label>
                <input
                  type="text"
                  value={profissao}
                  onChange={(e) => setProfissao(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Engenheiro, Vendedor, Estudante..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Descreva sua rotina de trabalho *
                </label>
                <textarea
                  value={rotinaTrabalho}
                  onChange={(e) => setRotinaTrabalho(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Trabalho das 8h às 17h, sentado no escritório..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Você estuda? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setEstuda(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      estuda === true
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setEstuda(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      estuda === false
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {estuda && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Horários de estudo *
                  </label>
                  <input
                    type="text"
                    value={horariosEstudo}
                    onChange={(e) => setHorariosEstudo(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Ex: Das 19h às 22h, segunda a sexta"
                    required
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 4: Atividade Física */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Atividade Física
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Você pratica atividade física atualmente? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setPraticaAtividadeFisica(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      praticaAtividadeFisica === true
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setPraticaAtividadeFisica(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      praticaAtividadeFisica === false
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {praticaAtividadeFisica && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Quais modalidades você pratica? *
                    </label>
                    <input
                      type="text"
                      value={modalidadesExercicio}
                      onChange={(e) => setModalidadesExercicio(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      placeholder="Ex: Musculação, corrida, natação..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Dias e horários de treino *
                    </label>
                    <textarea
                      value={diasHorariosAtividade}
                      onChange={(e) => setDiasHorariosAtividade(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                      placeholder="Ex: Segunda, quarta e sexta das 7h às 8h"
                      rows={3}
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Horários de sono (que horas dorme e acorda) *
                </label>
                <input
                  type="text"
                  value={horariosSono}
                  onChange={(e) => setHorariosSono(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Durmo às 23h e acordo às 6h"
                  required
                />
              </div>
            </div>
          )}

          {/* Step 5: Objetivos */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Objetivos e Expectativas
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Conte sua trajetória e objetivos *
                </label>
                <textarea
                  value={trajetoriaObjetivos}
                  onChange={(e) => setTrajetoriaObjetivos(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Sempre fui magro, quero ganhar massa muscular..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quais mudanças você espera? *
                </label>
                <textarea
                  value={mudancasEsperadas}
                  onChange={(e) => setMudancasEsperadas(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Ganhar músculos, definir abdômen, melhorar saúde..."
                  rows={4}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Resultado estético final desejado *
                </label>
                <textarea
                  value={resultadoEsteticoFinal}
                  onChange={(e) => setResultadoEsteticoFinal(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Corpo definido, peso ideal de 80kg, braços de 40cm..."
                  rows={4}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 6: Treino e Substâncias */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Histórico de Treino
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Há quanto tempo treina de forma contínua? *
                </label>
                <input
                  type="text"
                  value={tempoTreinoContinuo}
                  onChange={(e) => setTempoTreinoContinuo(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 2 anos, 6 meses, nunca treinei..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Seus resultados estão estagnados? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setResultadosEstagnados(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      resultadosEstagnados === true
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setResultadosEstagnados(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      resultadosEstagnados === false
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como é sua percepção de pump durante o treino? *
                </label>
                <textarea
                  value={percepcaoPump}
                  onChange={(e) => setPercepcaoPump(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Sinto o músculo inchando, quase não sinto pump, muito forte..."
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Você faz ou já fez uso de esteroides anabolizantes? *
                </label>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setUsoEsteroides(true)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      usoEsteroides === true
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Sim
                  </button>
                  <button
                    type="button"
                    onClick={() => setUsoEsteroides(false)}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      usoEsteroides === false
                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                        : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    Não
                  </button>
                </div>
              </div>

              {usoEsteroides && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quais esteroides? *
                  </label>
                  <input
                    type="text"
                    value={quaisEsteroides}
                    onChange={(e) => setQuaisEsteroides(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Ex: Durateston, Oxandrolona..."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Outras substâncias (opcional)
                </label>
                <input
                  type="text"
                  value={outrasSubstancias}
                  onChange={(e) => setOutrasSubstancias(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Creatina, whey protein, termogênico..."
                />
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <p className="text-sm text-green-800 dark:text-green-300">
                  ✅ Última etapa! Clique em &quot;Finalizar e Ir para Cadastro&quot; para enviar suas respostas.
                </p>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-4 mt-8">
            {currentStep > 1 && (
              <button
                onClick={handlePrevious}
                disabled={loading}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                <ChevronLeft size={20} />
                Voltar
              </button>
            )}

            <button
              onClick={handleNext}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {currentStep === totalSteps ? (
                loading ? 'Enviando...' : (
                  <>
                    <Check size={20} />
                    Finalizar e Ir para Cadastro
                  </>
                )
              ) : (
                <>
                  Próximo
                  <ChevronRight size={20} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

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
