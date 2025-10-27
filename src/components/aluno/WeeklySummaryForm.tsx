'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, Scale, Activity, Droplet, Moon, Dumbbell, Clock } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface WeeklySummaryFormProps {
  alunoId: string;
  currentWeek: number;
  currentMonth: number;
  currentYear: number;
}

export default function WeeklySummaryForm({
  alunoId,
  currentWeek,
  currentMonth,
  currentYear,
}: WeeklySummaryFormProps) {
  const router = useRouter();
  const supabase = createClient();

  // Estado do formulário
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Medidas
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [waist, setWaist] = useState('');
  const [chest, setChest] = useState('');
  const [arm, setArm] = useState('');
  const [leg, setLeg] = useState('');

  // Perguntas condicionais
  const [seguiuDieta, setSeguiuDieta] = useState<boolean | null>(null);

  // Se seguiu dieta (SIM)
  const [problemaRefeicao, setProblemaRefeicao] = useState('');
  const [consumoAguaSim, setConsumoAguaSim] = useState('');
  const [qualidadeSonoSim, setQualidadeSonoSim] = useState('');

  // Se NÃO seguiu dieta
  const [diaNaoSeguiu, setDiaNaoSeguiu] = useState('');
  const [refeicoesFora, setRefeicoesFora] = useState('');
  const [consumoAguaNao, setConsumoAguaNao] = useState('');
  const [qualidadeSonoNao, setQualidadeSonoNao] = useState('');

  // Treino
  const [faltouTreino, setFaltouTreino] = useState<boolean | null>(null);
  const [quantosDiasFaltou, setQuantosDiasFaltou] = useState('');
  const [desempenhoTreino, setDesempenhoTreino] = useState('');
  const [horarioProximaSemana, setHorarioProximaSemana] = useState('');

  // Fotos
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [sidePreview, setSidePreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'side' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Apenas imagens são permitidas' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'A imagem deve ter no máximo 5MB' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const preview = reader.result as string;
      if (type === 'front') {
        setFrontPhoto(file);
        setFrontPreview(preview);
      } else if (type === 'side') {
        setSidePhoto(file);
        setSidePreview(preview);
      } else {
        setBackPhoto(file);
        setBackPreview(preview);
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async (file: File, position: string) => {
    const timestamp = Date.now();
    const filePath = `weekly-summary/${alunoId}/${currentYear}-${currentMonth}-week${currentWeek}/${position}_${timestamp}.jpg`;

    const { data, error } = await supabase.storage
      .from('progress-photos')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('progress-photos')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!weight) {
      setToast({ type: 'error', message: 'Por favor, informe seu peso' });
      return;
    }

    if (seguiuDieta === null) {
      setToast({ type: 'error', message: 'Por favor, responda se seguiu a dieta' });
      return;
    }

    if (faltouTreino === null) {
      setToast({ type: 'error', message: 'Por favor, responda se faltou treino' });
      return;
    }

    setLoading(true);

    try {
      // Upload de fotos (se houver)
      let frontUrl = null;
      let sideUrl = null;
      let backUrl = null;

      if (frontPhoto) {
        frontUrl = await uploadPhoto(frontPhoto, 'front');
      }
      if (sidePhoto) {
        sideUrl = await uploadPhoto(sidePhoto, 'side');
      }
      if (backPhoto) {
        backUrl = await uploadPhoto(backPhoto, 'back');
      }

      // Preparar dados para inserção
      const summaryData = {
        aluno_id: alunoId,
        week_of_month: currentWeek,
        month: currentMonth,
        year: currentYear,
        weight: parseFloat(weight),
        body_fat_percentage: bodyFat ? parseFloat(bodyFat) : null,
        muscle_mass: muscleMass ? parseFloat(muscleMass) : null,
        waist_measurement: waist ? parseFloat(waist) : null,
        chest_measurement: chest ? parseFloat(chest) : null,
        arm_measurement: arm ? parseFloat(arm) : null,
        leg_measurement: leg ? parseFloat(leg) : null,
        seguiu_dieta: seguiuDieta,
        problema_refeicao: seguiuDieta ? problemaRefeicao : null,
        consumo_agua_sim: seguiuDieta ? consumoAguaSim : null,
        qualidade_sono_sim: seguiuDieta ? qualidadeSonoSim : null,
        dia_nao_seguiu: !seguiuDieta ? diaNaoSeguiu : null,
        refeicoes_fora_casa: !seguiuDieta && refeicoesFora ? parseInt(refeicoesFora) : null,
        consumo_agua_nao: !seguiuDieta ? consumoAguaNao : null,
        qualidade_sono_nao: !seguiuDieta ? qualidadeSonoNao : null,
        faltou_treino: faltouTreino,
        quantos_dias_faltou: faltouTreino && quantosDiasFaltou ? parseInt(quantosDiasFaltou) : null,
        desempenho_treino: desempenhoTreino,
        horario_treino_proxima_semana: horarioProximaSemana || null,
        front_photo_url: frontUrl,
        side_photo_url: sideUrl,
        back_photo_url: backUrl,
        completed: true,
      };

      const { error } = await supabase
        .from('weekly_summary')
        .insert(summaryData);

      if (error) throw error;

      setToast({ type: 'success', message: 'Resumo enviado ao coach com sucesso!' });

      // Redirecionar após 2 segundos
      setTimeout(() => {
        router.push('/aluno/dashboard');
        router.refresh();
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao enviar resumo:', error);
      setToast({ type: 'error', message: `Erro ao enviar: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const weekNames = ['1ª', '2ª', '3ª', '4ª'];

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-primary-200 dark:border-primary-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Resumo Semanal
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Você está na <strong>{weekNames[currentWeek - 1]} semana de {monthNames[currentMonth - 1]}</strong>
          </p>
        </div>

        {/* Medidas */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Scale size={20} className="text-primary-600" />
            Medidas Corporais
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peso (kg) *
              </label>
              <input
                type="number"
                step="0.1"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 75.5"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Gordura Corporal (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={bodyFat}
                onChange={(e) => setBodyFat(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 15.2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Massa Muscular (kg)
              </label>
              <input
                type="number"
                step="0.1"
                value={muscleMass}
                onChange={(e) => setMuscleMass(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 60.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cintura (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 80.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Peito (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={chest}
                onChange={(e) => setChest(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 100.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Braço (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={arm}
                onChange={(e) => setArm(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 35.0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Perna (cm)
              </label>
              <input
                type="number"
                step="0.1"
                value={leg}
                onChange={(e) => setLeg(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 55.0"
              />
            </div>
          </div>
        </div>

        {/* Perguntas sobre Dieta */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity size={20} className="text-green-600" />
            Sobre a Dieta
          </h3>

          {/* Pergunta 1: Seguiu a dieta? */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Seguiu a dieta esta semana? *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSeguiuDieta(true)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  seguiuDieta === true
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                ✅ SIM
              </button>
              <button
                type="button"
                onClick={() => setSeguiuDieta(false)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  seguiuDieta === false
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                ❌ NÃO
              </button>
            </div>
          </div>

          {/* Se seguiu (SIM) */}
          {seguiuDieta === true && (
            <div className="space-y-4 pl-4 border-l-4 border-green-500">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Teve problema em alguma refeição específica?
                </label>
                <textarea
                  value={problemaRefeicao}
                  onChange={(e) => setProblemaRefeicao(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Dificuldade no jantar, falta de tempo no café, etc."
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como foi o consumo de água?
                </label>
                <select
                  value={consumoAguaSim}
                  onChange={(e) => setConsumoAguaSim(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Selecione</option>
                  <option value="excelente">Excelente (2L+)</option>
                  <option value="bom">Bom (1.5L - 2L)</option>
                  <option value="regular">Regular (1L - 1.5L)</option>
                  <option value="ruim">Ruim (&lt;1L)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como foi a qualidade do sono?
                </label>
                <select
                  value={qualidadeSonoSim}
                  onChange={(e) => setQualidadeSonoSim(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Selecione</option>
                  <option value="excelente">Excelente (8h+)</option>
                  <option value="bom">Bom (6-8h)</option>
                  <option value="regular">Regular (4-6h)</option>
                  <option value="ruim">Ruim (&lt;4h)</option>
                </select>
              </div>
            </div>
          )}

          {/* Se NÃO seguiu */}
          {seguiuDieta === false && (
            <div className="space-y-4 pl-4 border-l-4 border-red-500">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Em qual(is) dia(s) não seguiu?
                </label>
                <input
                  type="text"
                  value={diaNaoSeguiu}
                  onChange={(e) => setDiaNaoSeguiu(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: Segunda e Sábado"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Quantas refeições fez fora de casa?
                </label>
                <input
                  type="number"
                  min="0"
                  value={refeicoesFora}
                  onChange={(e) => setRefeicoesFora(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como foi o consumo de água?
                </label>
                <select
                  value={consumoAguaNao}
                  onChange={(e) => setConsumoAguaNao(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Selecione</option>
                  <option value="excelente">Excelente (2L+)</option>
                  <option value="bom">Bom (1.5L - 2L)</option>
                  <option value="regular">Regular (1L - 1.5L)</option>
                  <option value="ruim">Ruim (&lt;1L)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Como foi a qualidade do sono?
                </label>
                <select
                  value={qualidadeSonoNao}
                  onChange={(e) => setQualidadeSonoNao(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                >
                  <option value="">Selecione</option>
                  <option value="excelente">Excelente (8h+)</option>
                  <option value="bom">Bom (6-8h)</option>
                  <option value="regular">Regular (4-6h)</option>
                  <option value="ruim">Ruim (&lt;4h)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Perguntas sobre Treino */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Dumbbell size={20} className="text-blue-600" />
            Sobre o Treino
          </h3>

          {/* Faltou treino? */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Faltou algum treino esta semana? *
            </label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setFaltouTreino(true)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  faltouTreino === true
                    ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                SIM
              </button>
              <button
                type="button"
                onClick={() => setFaltouTreino(false)}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                  faltouTreino === false
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                }`}
              >
                NÃO
              </button>
            </div>
          </div>

          {faltouTreino === true && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Quantos dias faltou?
              </label>
              <input
                type="number"
                min="1"
                max="7"
                value={quantosDiasFaltou}
                onChange={(e) => setQuantosDiasFaltou(e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                placeholder="Ex: 2"
              />
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Como foi o desempenho nos treinos?
            </label>
            <select
              value={desempenhoTreino}
              onChange={(e) => setDesempenhoTreino(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            >
              <option value="">Selecione</option>
              <option value="excelente">Excelente - Superei expectativas</option>
              <option value="bom">Bom - Cumpri o planejado</option>
              <option value="regular">Regular - Abaixo do esperado</option>
              <option value="ruim">Ruim - Muito fraco</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Clock size={16} />
              Qual horário pretende treinar na próxima semana?
            </label>
            <input
              type="time"
              value={horarioProximaSemana}
              onChange={(e) => setHorarioProximaSemana(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
            />
          </div>
        </div>

        {/* Fotos de Progresso (Opcional) */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Upload size={20} className="text-purple-600" />
            Fotos de Progresso (Opcional)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Envie fotos nítidas, em local bem iluminado. Homens sem camisa, mulheres de biquíni.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Frontal */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Frontal
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'front')}
                className="hidden"
                id="front-photo-weekly"
              />
              <label
                htmlFor="front-photo-weekly"
                className={`block aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  frontPreview
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-primary-500'
                }`}
              >
                {frontPreview ? (
                  <img src={frontPreview} alt="Frontal" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Clique para enviar</span>
                  </div>
                )}
              </label>
            </div>

            {/* Lateral */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lateral
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'side')}
                className="hidden"
                id="side-photo-weekly"
              />
              <label
                htmlFor="side-photo-weekly"
                className={`block aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  sidePreview
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-primary-500'
                }`}
              >
                {sidePreview ? (
                  <img src={sidePreview} alt="Lateral" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Clique para enviar</span>
                  </div>
                )}
              </label>
            </div>

            {/* Costa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Costa
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'back')}
                className="hidden"
                id="back-photo-weekly"
              />
              <label
                htmlFor="back-photo-weekly"
                className={`block aspect-[3/4] rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                  backPreview
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 hover:border-primary-500'
                }`}
              >
                {backPreview ? (
                  <img src={backPreview} alt="Costa" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Upload size={32} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Clique para enviar</span>
                  </div>
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Botão de Enviar */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            disabled={loading}
          >
            Voltar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 transition-colors"
          >
            {loading ? 'Enviando...' : 'Enviar Resumo ao Coach'}
          </button>
        </div>
      </form>

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
