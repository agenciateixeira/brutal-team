'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressPhoto } from '@/types';
import { Upload, Image as ImageIcon, Calendar, FileText, Trash2, Camera, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';
import { sendPushNotification } from '@/lib/push-notifications';
import { motion, AnimatePresence } from 'framer-motion';

interface PhotoUploadFullProps {
  alunoId: string;
  photos: ProgressPhoto[];
}

export default function PhotoUploadFull({ alunoId, photos }: PhotoUploadFullProps) {
  const [uploading, setUploading] = useState(false);
  const [weekNumber, setWeekNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [bicepsContraido, setBicepsContraido] = useState('');
  const [pernas, setPernas] = useState('');
  const [panturrilha, setPanturrilha] = useState('');

  // Perguntas condicionais - Dieta
  const [seguiuDieta, setSeguiuDieta] = useState<boolean | null>(null);
  const [problemaRefeicao, setProblemaRefeicao] = useState('');
  const [consumoAguaSim, setConsumoAguaSim] = useState('');
  const [qualidadeSonoSim, setQualidadeSonoSim] = useState('');
  const [diaNaoSeguiu, setDiaNaoSeguiu] = useState('');
  const [refeicoesFora, setRefeicoesFora] = useState('');
  const [consumoAguaNao, setConsumoAguaNao] = useState('');
  const [qualidadeSonoNao, setQualidadeSonoNao] = useState('');

  // Perguntas sobre Treino
  const [faltouTreino, setFaltouTreino] = useState<boolean | null>(null);
  const [quantosDiasFaltou, setQuantosDiasFaltou] = useState('');
  const [desempenhoTreino, setDesempenhoTreino] = useState('');
  const [horarioProximaSemana, setHorarioProximaSemana] = useState('');

  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Validar se é uma imagem
    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Por favor, selecione apenas arquivos de imagem' });
      e.target.value = '';
      return;
    }

    setSelectedFile(file);

    // Criar preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1080 },
          height: { ideal: 1920 }
        },
        audio: false
      });

      streamRef.current = stream;
      setShowCamera(true);

      // Aguardar o próximo tick para garantir que o video element existe
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      setToast({ type: 'error', message: 'Não foi possível acessar a câmera. Verifique as permissões do navegador.' });
    }
  };

  const closeCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;

      const file = new File([blob], `foto-${Date.now()}.jpg`, { type: 'image/jpeg' });
      setSelectedFile(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
        closeCamera();
      };
      reader.readAsDataURL(file);
    }, 'image/jpeg', 0.95);
  };

  useEffect(() => {
    return () => {
      // Cleanup: parar a câmera quando o componente desmontar
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleUpload = async () => {
    console.log('🚀 handleUpload iniciado');
    console.log('📁 selectedFile:', selectedFile);
    console.log('📅 weekNumber:', weekNumber);
    console.log('👤 alunoId:', alunoId);

    if (!selectedFile) {
      console.log('❌ Sem arquivo selecionado');
      setToast({ type: 'error', message: 'Por favor, selecione uma foto' });
      return;
    }

    if (!weekNumber) {
      console.log('❌ Sem número da semana');
      setToast({ type: 'error', message: 'Por favor, informe o número da semana' });
      return;
    }

    if (!peso || !cintura || !bicepsContraido || !pernas || !panturrilha) {
      setToast({ type: 'error', message: 'Por favor, preencha todas as medidas corporais' });
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

    // Verificar se pode enviar (7 dias)
    const { data: lastPhoto } = await supabase
      .from('progress_photos')
      .select('next_allowed_date, created_at')
      .eq('aluno_id', alunoId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (lastPhoto && lastPhoto.next_allowed_date) {
      const nextAllowedDate = new Date(lastPhoto.next_allowed_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      nextAllowedDate.setHours(0, 0, 0, 0);

      if (today < nextAllowedDate) {
        const formattedDate = format(nextAllowedDate, "dd/MM/yyyy", { locale: ptBR });
        setToast({
          type: 'error',
          message: `Seu resumo semanal já foi enviado. Aguarde até ${formattedDate} para enviar o próximo.`
        });
        return;
      }
    }

    setUploading(true);
    console.log('⏳ Iniciando upload...');

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${alunoId}/${Date.now()}.${fileExt}`;
      console.log('📝 Nome do arquivo:', fileName);

      console.log('☁️ Fazendo upload para Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('progress-photos')
        .upload(fileName, selectedFile);

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);
        throw uploadError;
      }
      console.log('✅ Upload concluído');

      const { data: { publicUrl } } = supabase.storage
        .from('progress-photos')
        .getPublicUrl(fileName);
      console.log('🔗 URL pública:', publicUrl);

      console.log('💾 Salvando no banco de dados...');

      // 1. Salvar foto no progress_photos
      const { error: dbError } = await supabase.from('progress_photos').insert({
        aluno_id: alunoId,
        photo_url: publicUrl,
        week_number: parseInt(weekNumber),
        notes: notes || null,
        peso: parseFloat(peso),
        cintura: parseFloat(cintura),
        biceps_contraido: parseFloat(bicepsContraido),
        pernas: parseFloat(pernas),
        panturrilha: parseFloat(panturrilha),
      });

      if (dbError) {
        console.error('❌ Erro no banco progress_photos:', dbError);
        throw dbError;
      }
      console.log('✅ Salvo em progress_photos com sucesso');

      // 2. Salvar resumo semanal no weekly_summary
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();
      const dayOfMonth = now.getDate();
      let weekOfMonth = 1;
      if (dayOfMonth > 21) weekOfMonth = 4;
      else if (dayOfMonth > 14) weekOfMonth = 3;
      else if (dayOfMonth > 7) weekOfMonth = 2;

      const { error: summaryError } = await supabase.from('weekly_summary').insert({
        aluno_id: alunoId,
        week_of_month: weekOfMonth,
        month: currentMonth,
        year: currentYear,
        weight: parseFloat(peso),
        waist_measurement: parseFloat(cintura),
        arm_measurement: parseFloat(bicepsContraido),
        leg_measurement: parseFloat(pernas),
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
        front_photo_url: publicUrl, // Usando a mesma foto
        completed: true,
      });

      if (summaryError) {
        console.error('❌ Erro no banco weekly_summary:', summaryError);
        // Não throw aqui porque foto já foi salva
        console.log('⚠️ Foto salva, mas resumo semanal falhou');
      } else {
        console.log('✅ Salvo em weekly_summary com sucesso');

        // Buscar coach_id do aluno para enviar notificação
        const { data: profileData } = await supabase
          .from('profiles')
          .select('coach_id, full_name')
          .eq('id', alunoId)
          .single();

        if (profileData?.coach_id) {
          try {
            await sendPushNotification({
              userId: profileData.coach_id,
              title: '📸 Novo Resumo Semanal!',
              body: `${profileData.full_name || 'Seu aluno'} enviou o resumo semanal da semana ${weekNumber}`,
              url: `/coach/aluno/${alunoId}`,
              data: {
                type: 'weekly_summary',
                alunoId: alunoId,
                weekNumber: parseInt(weekNumber),
              },
            });
            console.log('✅ Notificação enviada para o coach');
          } catch (pushError) {
            console.error('❌ Erro ao enviar notificação para o coach:', pushError);
            // Não falhar a operação principal
          }
        }
      }

      setToast({ type: 'success', message: 'Foto enviada com sucesso!' });
      setWeekNumber('');
      setNotes('');
      setPeso('');
      setCintura('');
      setBicepsContraido('');
      setPernas('');
      setPanturrilha('');
      setSeguiuDieta(null);
      setProblemaRefeicao('');
      setConsumoAguaSim('');
      setQualidadeSonoSim('');
      setDiaNaoSeguiu('');
      setRefeicoesFora('');
      setConsumoAguaNao('');
      setQualidadeSonoNao('');
      setFaltouTreino(null);
      setQuantosDiasFaltou('');
      setDesempenhoTreino('');
      setHorarioProximaSemana('');
      setSelectedFile(null);
      setPreviewUrl(null);

      console.log('🔄 Atualizando página...');
      router.refresh();
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);
      setToast({ type: 'error', message: `Erro ao fazer upload: ${error.message}` });
    } finally {
      setUploading(false);
      console.log('✅ handleUpload finalizado');
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto? Esta ação não pode ser desfeita.')) return;

    try {
      setToast({ type: 'info', message: 'Excluindo foto...' });

      // Extrair o caminho do arquivo da URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      console.log('🗑️ Deletando arquivo:', filePath);

      // Deletar do storage
      const { error: storageError } = await supabase.storage
        .from('progress-photos')
        .remove([filePath]);

      if (storageError) {
        console.error('Erro ao deletar do storage:', storageError);
        // Continua mesmo se der erro no storage, pois pode já ter sido deletado
      }

      // Deletar do banco
      const { error: dbError } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (dbError) throw dbError;

      setToast({ type: 'success', message: 'Foto excluída com sucesso!' });
      router.refresh();
    } catch (error: any) {
      console.error('Erro ao excluir foto:', error);
      setToast({ type: 'error', message: `Erro ao excluir foto: ${error.message}` });
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
      >
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Upload size={24} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Enviar Nova Foto
            </h2>
          </div>

        <div className="space-y-4">
          {/* Week Number Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Semana
            </label>
            <input
              type="number"
              min="1"
              value={weekNumber}
              onChange={(e) => setWeekNumber(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Ex: 1"
              disabled={uploading}
            />
          </div>

          {/* Medidas Corporais */}
          <div className="bg-primary-50 dark:bg-primary-900/10 border-2 border-primary-200 dark:border-primary-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-600">
                <path d="M12 2v20M2 12h20"/>
              </svg>
              Resumo Semanal - Medidas Corporais
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Peso */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Peso (kg) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={(e) => setPeso(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 75.5"
                  disabled={uploading}
                  required
                />
              </div>

              {/* Cintura */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cintura (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={cintura}
                  onChange={(e) => setCintura(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 85.0"
                  disabled={uploading}
                  required
                />
              </div>

              {/* Bíceps Contraído */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bíceps Contraído (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={bicepsContraido}
                  onChange={(e) => setBicepsContraido(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 38.5"
                  disabled={uploading}
                  required
                />
              </div>

              {/* Pernas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pernas (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={pernas}
                  onChange={(e) => setPernas(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 58.0"
                  disabled={uploading}
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  📏 Medir 1 palmo acima do joelho
                </p>
              </div>

              {/* Panturrilha */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Panturrilha (cm) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={panturrilha}
                  onChange={(e) => setPanturrilha(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 38.0"
                  disabled={uploading}
                  required
                />
              </div>
            </div>
          </div>

          {/* Perguntas sobre Dieta */}
          <div className="bg-green-50 dark:bg-green-900/10 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Sobre a Dieta
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Seguiu a dieta esta semana? *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSeguiuDieta(true)}
                  disabled={uploading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                    seguiuDieta === true
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ✅ SIM
                </button>
                <button
                  type="button"
                  onClick={() => setSeguiuDieta(false)}
                  disabled={uploading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                    seguiuDieta === false
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  ❌ NÃO
                </button>
              </div>
            </div>

            {seguiuDieta === true && (
              <div className="space-y-3 pl-3 border-l-4 border-green-500">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teve problema em alguma refeição?
                  </label>
                  <textarea
                    value={problemaRefeicao}
                    onChange={(e) => setProblemaRefeicao(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Ex: Dificuldade no jantar"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Consumo de água?
                  </label>
                  <select
                    value={consumoAguaSim}
                    onChange={(e) => setConsumoAguaSim(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="excelente">Excelente (2L+)</option>
                    <option value="bom">Bom (1.5L - 2L)</option>
                    <option value="regular">Regular (1L - 1.5L)</option>
                    <option value="ruim">Ruim (&lt;1L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Qualidade do sono?
                  </label>
                  <select
                    value={qualidadeSonoSim}
                    onChange={(e) => setQualidadeSonoSim(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
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

            {seguiuDieta === false && (
              <div className="space-y-3 pl-3 border-l-4 border-red-500">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Em qual(is) dia(s) não seguiu?
                  </label>
                  <input
                    type="text"
                    value={diaNaoSeguiu}
                    onChange={(e) => setDiaNaoSeguiu(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Ex: Segunda e Sábado"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantas refeições fora de casa?
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={refeicoesFora}
                    onChange={(e) => setRefeicoesFora(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                    placeholder="Ex: 3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Consumo de água?
                  </label>
                  <select
                    value={consumoAguaNao}
                    onChange={(e) => setConsumoAguaNao(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  >
                    <option value="">Selecione</option>
                    <option value="excelente">Excelente (2L+)</option>
                    <option value="bom">Bom (1.5L - 2L)</option>
                    <option value="regular">Regular (1L - 1.5L)</option>
                    <option value="ruim">Ruim (&lt;1L)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Qualidade do sono?
                  </label>
                  <select
                    value={qualidadeSonoNao}
                    onChange={(e) => setQualidadeSonoNao(e.target.value)}
                    disabled={uploading}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
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
          <div className="bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Sobre o Treino
            </h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Faltou algum treino esta semana? *
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setFaltouTreino(true)}
                  disabled={uploading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                    faltouTreino === true
                      ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  SIM
                </button>
                <button
                  type="button"
                  onClick={() => setFaltouTreino(false)}
                  disabled={uploading}
                  className={`flex-1 py-2 px-4 rounded-lg border-2 transition-colors disabled:opacity-50 ${
                    faltouTreino === false
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  NÃO
                </button>
              </div>
            </div>

            {faltouTreino === true && (
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Quantos dias faltou?
                </label>
                <input
                  type="number"
                  min="1"
                  max="7"
                  value={quantosDiasFaltou}
                  onChange={(e) => setQuantosDiasFaltou(e.target.value)}
                  disabled={uploading}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                  placeholder="Ex: 2"
                />
              </div>
            )}

            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Como foi o desempenho nos treinos?
              </label>
              <select
                value={desempenhoTreino}
                onChange={(e) => setDesempenhoTreino(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              >
                <option value="">Selecione</option>
                <option value="excelente">Excelente - Superei expectativas</option>
                <option value="bom">Bom - Cumpri o planejado</option>
                <option value="regular">Regular - Abaixo do esperado</option>
                <option value="ruim">Ruim - Muito fraco</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Horário de treino para próxima semana?
              </label>
              <input
                type="time"
                value={horarioProximaSemana}
                onChange={(e) => setHorarioProximaSemana(e.target.value)}
                disabled={uploading}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Photo Selection Buttons */}
          {!previewUrl && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-center w-full px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg cursor-pointer transition-colors">
                <ImageIcon size={18} className="mr-2" />
                Selecionar da Galeria
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  disabled={uploading}
                  className="hidden"
                />
              </label>

              <button
                onClick={openCamera}
                disabled={uploading}
                className="flex items-center justify-center w-full px-4 py-3 bg-accent-700 hover:bg-accent-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              >
                <Camera size={18} className="mr-2" />
                Tirar Foto
              </button>
            </div>
          )}

          {/* Image Preview */}
          {previewUrl && (
            <div className="relative">
              <div className="relative w-full aspect-square max-w-md mx-auto rounded-lg overflow-hidden border-2 border-gray-300 dark:border-gray-600">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={handleClearSelection}
                className="absolute top-2 right-2 p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg transition-colors"
                disabled={uploading}
              >
                <X size={20} />
              </button>
            </div>
          )}

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
              placeholder="Como você está se sentindo? Alguma mudança notada?"
              disabled={uploading}
            />
          </div>

          {/* Send Button */}
          {previewUrl && (
            <button
              onClick={() => {
                console.log('🔘 Botão clicado!');
                console.log('  - uploading:', uploading);
                console.log('  - weekNumber:', weekNumber);
                console.log('  - disabled:', uploading || !weekNumber);
                handleUpload();
              }}
              disabled={uploading || !weekNumber || !peso || !cintura || !bicepsContraido || !pernas || !panturrilha}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              {uploading ? 'Enviando...' : 'Enviar Foto'}
            </button>
          )}
        </div>
        </div>
      </motion.div>

      {/* Photos Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="relative overflow-hidden backdrop-blur-xl bg-white/80 dark:bg-gray-800/80 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6"
      >
        {/* Glassmorphism effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-pink-500/5 to-orange-500/5 pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl shadow-lg">
              <ImageIcon size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Histórico de Fotos
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {photos.length} {photos.length === 1 ? 'foto enviada' : 'fotos enviadas'}
              </p>
            </div>
          </div>

        {photos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            </motion.div>
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma foto enviada ainda. Comece seu acompanhamento!
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="group relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800 rounded-xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all"
                onClick={() => setSelectedPhoto(photo)}
              >
                <div className="aspect-square relative">
                  <Image
                    src={photo.photo_url}
                    alt={`Semana ${photo.week_number}`}
                    fill
                    className="object-cover"
                  />
                </div>

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} />
                      <span className="text-sm font-semibold">Semana {photo.week_number}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo.id, photo.photo_url);
                      }}
                      className="p-1 hover:bg-red-600 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
        </div>
      </motion.div>

      {/* Modal de Visualização */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="max-w-4xl w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="relative aspect-square mb-4"
              >
                <Image
                  src={selectedPhoto.photo_url}
                  alt={`Semana ${selectedPhoto.week_number}`}
                  fill
                  className="object-contain rounded-2xl"
                />
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative overflow-hidden backdrop-blur-xl bg-white/90 dark:bg-gray-800/90 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6"
              >
                {/* Glassmorphism effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none" />

                <div className="relative z-10">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <Calendar size={18} />
                  <span className="font-semibold">Semana {selectedPhoto.week_number}</span>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {format(new Date(selectedPhoto.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </div>
              </div>

              {/* Medidas Corporais */}
              {(selectedPhoto.peso || selectedPhoto.cintura || selectedPhoto.biceps_contraido || selectedPhoto.pernas || selectedPhoto.panturrilha) && (
                <div className="mb-3 p-3 bg-primary-50 dark:bg-primary-900/10 rounded-lg border border-primary-200 dark:border-primary-800">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Medidas Corporais</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                    {selectedPhoto.peso && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Peso:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedPhoto.peso} kg</span>
                      </div>
                    )}
                    {selectedPhoto.cintura && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Cintura:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedPhoto.cintura} cm</span>
                      </div>
                    )}
                    {selectedPhoto.biceps_contraido && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Bíceps:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedPhoto.biceps_contraido} cm</span>
                      </div>
                    )}
                    {selectedPhoto.pernas && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Pernas:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedPhoto.pernas} cm</span>
                      </div>
                    )}
                    {selectedPhoto.panturrilha && (
                      <div>
                        <span className="text-gray-500 dark:text-gray-400">Panturrilha:</span>
                        <span className="ml-1 font-semibold text-gray-900 dark:text-white">{selectedPhoto.panturrilha} cm</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

                {selectedPhoto.notes && (
                  <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                    <FileText size={18} className="flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{selectedPhoto.notes}</p>
                  </div>
                )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal da Câmera */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25 }}
              className="max-w-lg w-full"
            >
            <div className="relative aspect-[9/16] bg-black rounded-lg overflow-hidden mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={closeCamera}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-800 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <X size={20} />
                Cancelar
              </button>

              <button
                onClick={capturePhoto}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2 font-semibold"
              >
                <Camera size={20} />
                Capturar Foto
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
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
