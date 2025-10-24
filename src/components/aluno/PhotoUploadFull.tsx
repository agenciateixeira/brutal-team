'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProgressPhoto } from '@/types';
import { Upload, Image as ImageIcon, Calendar, FileText, Trash2, Camera, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
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
      alert('Por favor, selecione apenas arquivos de imagem');
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
        video: { facingMode: 'environment' },
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
      alert('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
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
      alert('Por favor, selecione uma foto');
      return;
    }

    if (!weekNumber) {
      console.log('❌ Sem número da semana');
      alert('Por favor, informe o número da semana');
      return;
    }

    if (!peso || !cintura || !bicepsContraido || !pernas || !panturrilha) {
      alert('Por favor, preencha todas as medidas corporais');
      return;
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
        console.error('❌ Erro no banco:', dbError);
        throw dbError;
      }
      console.log('✅ Salvo no banco com sucesso');

      alert('Foto enviada com sucesso!');
      setWeekNumber('');
      setNotes('');
      setPeso('');
      setCintura('');
      setBicepsContraido('');
      setPernas('');
      setPanturrilha('');
      setSelectedFile(null);
      setPreviewUrl(null);

      console.log('🔄 Atualizando página...');
      router.refresh();
    } catch (error: any) {
      console.error('❌ Erro ao fazer upload:', error);
      alert('Erro ao fazer upload: ' + error.message);
    } finally {
      setUploading(false);
      console.log('✅ handleUpload finalizado');
    }
  };

  const handleDelete = async (photoId: string, photoUrl: string) => {
    if (!confirm('Tem certeza que deseja excluir esta foto?')) return;

    try {
      // Extrair o caminho do arquivo da URL
      const urlParts = photoUrl.split('/');
      const filePath = urlParts.slice(-2).join('/');

      // Deletar do storage
      await supabase.storage.from('progress-photos').remove([filePath]);

      // Deletar do banco
      const { error } = await supabase
        .from('progress_photos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao excluir foto: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Upload size={24} className="text-primary-600" />
          Enviar Nova Foto
        </h2>

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

      {/* Photos Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <ImageIcon size={24} className="text-primary-600" />
          Histórico de Fotos ({photos.length})
        </h2>

        {photos.length === 0 ? (
          <div className="text-center py-12">
            <ImageIcon size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              Nenhuma foto enviada ainda. Comece seu acompanhamento!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary-500 transition-all"
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Visualização */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-square mb-4">
              <Image
                src={selectedPhoto.photo_url}
                alt={`Semana ${selectedPhoto.week_number}`}
                fill
                className="object-contain"
              />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
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
          </div>
        </div>
      )}

      {/* Modal da Câmera */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
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
          </div>
        </div>
      )}
    </div>
  );
}
