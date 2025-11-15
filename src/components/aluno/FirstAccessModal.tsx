'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Upload, Lock, CheckCircle, AlertCircle } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface FirstAccessModalProps {
  alunoId: string;
  onComplete: () => void;
}

type Step = 'code' | 'photos' | 'success';

export default function FirstAccessModal({ alunoId, onComplete }: FirstAccessModalProps) {
  const [step, setStep] = useState<Step>('code');
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fotos
  const [frontPhoto, setFrontPhoto] = useState<File | null>(null);
  const [sidePhoto, setSidePhoto] = useState<File | null>(null);
  const [backPhoto, setBackPhoto] = useState<File | null>(null);

  // Previews
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [sidePreview, setSidePreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const router = useRouter();
  const supabase = createClient();

  const handleValidateCode = async () => {
    if (!accessCode || accessCode.length !== 8) {
      setToast({ type: 'error', message: 'Digite um código válido de 8 caracteres' });
      return;
    }

    setLoading(true);

    try {
      // Verificar código no banco
      const { data: codeData, error: codeError } = await supabase
        .from('access_codes')
        .select('*')
        .eq('aluno_id', alunoId)
        .eq('code', accessCode.toUpperCase())
        .single();

      if (codeError || !codeData) {
        setToast({ type: 'error', message: 'Código inválido ou não encontrado' });
        return;
      }

      if (!codeData.is_active) {
        setToast({ type: 'error', message: 'Código ainda não foi ativado. Aguarde a confirmação do pagamento.' });
        return;
      }

      if (codeData.is_used) {
        setToast({ type: 'error', message: 'Este código já foi utilizado' });
        return;
      }

      // Marcar código como usado
      await supabase
        .from('access_codes')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', codeData.id);

      setToast({ type: 'success', message: 'Código validado! Agora envie suas fotos.' });
      setStep('photos');

    } catch (error: any) {
      console.error('Erro ao validar código:', error);
      setToast({ type: 'error', message: 'Erro ao validar código' });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'front' | 'side' | 'back'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setToast({ type: 'error', message: 'Apenas imagens são permitidas' });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToast({ type: 'error', message: 'A imagem deve ter no máximo 5MB' });
      return;
    }

    // Criar preview
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

  const handleUploadPhotos = async () => {
    if (!frontPhoto || !sidePhoto || !backPhoto) {
      setToast({ type: 'error', message: 'Por favor, envie as 3 fotos obrigatórias' });
      return;
    }

    setLoading(true);

    try {
      // Upload das 3 fotos para o Supabase Storage
      const timestamp = Date.now();

      const uploadPhoto = async (file: File, position: string) => {
        const filePath = `first-access/${alunoId}/${position}_${timestamp}.jpg`;

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

      const frontUrl = await uploadPhoto(frontPhoto, 'front');
      const sideUrl = await uploadPhoto(sidePhoto, 'side');
      const backUrl = await uploadPhoto(backPhoto, 'back');

      // Salvar URLs no banco
      const { error: insertError } = await supabase
        .from('first_access_photos')
        .insert({
          aluno_id: alunoId,
          front_photo_url: frontUrl,
          side_photo_url: sideUrl,
          back_photo_url: backUrl,
        });

      if (insertError) throw insertError;

      setStep('success');

    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      setToast({ type: 'error', message: 'Erro ao enviar fotos. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onComplete();
    router.refresh();
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {step === 'code' && '🔐 Bem-vindo! Insira seu Código de Acesso'}
              {step === 'photos' && '📸 Envie suas Fotos Iniciais'}
              {step === 'success' && '✅ Tudo Pronto!'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {step === 'code' && 'O coach enviou um código de 8 caracteres para você via WhatsApp'}
              {step === 'photos' && 'Precisamos de 3 fotos para acompanhar sua evolução'}
              {step === 'success' && 'Seu perfil foi configurado com sucesso'}
            </p>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* STEP 1: Código de Acesso */}
            {step === 'code' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Código de Acesso (8 caracteres)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      maxLength={8}
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-center text-2xl font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-primary-500"
                      placeholder="XXXXXXXX"
                    />
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    Digite exatamente como recebeu no WhatsApp
                  </p>
                </div>

                <button
                  onClick={handleValidateCode}
                  disabled={loading || accessCode.length !== 8}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Validando...' : 'Validar Código'}
                </button>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    ℹ️ Não recebeu o código? Entre em contato com seu coach pelo WhatsApp.
                  </p>
                </div>
              </div>
            )}

            {/* STEP 2: Upload de Fotos */}
            {step === 'photos' && (
              <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <p className="text-sm text-purple-800 dark:text-purple-300">
                    📸 <strong>Importante:</strong> Envie fotos nítidas, em local bem iluminado.
                    {' '}Homens sem camisa, mulheres de biquíni.
                  </p>
                </div>

                {/* Grid de Fotos */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Foto Frontal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Frontal
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'front')}
                        className="hidden"
                        id="front-photo"
                      />
                      <label
                        htmlFor="front-photo"
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
                  </div>

                  {/* Foto Lateral */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Lateral
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'side')}
                        className="hidden"
                        id="side-photo"
                      />
                      <label
                        htmlFor="side-photo"
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
                  </div>

                  {/* Foto de Costa */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Costa
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(e, 'back')}
                        className="hidden"
                        id="back-photo"
                      />
                      <label
                        htmlFor="back-photo"
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

                <button
                  onClick={handleUploadPhotos}
                  disabled={loading || !frontPhoto || !sidePhoto || !backPhoto}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Enviando...' : 'Enviar Fotos'}
                </button>
              </div>
            )}

            {/* STEP 3: Sucesso */}
            {step === 'success' && (
              <div className="text-center space-y-4 py-8">
                <div className="flex justify-center">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                    <CheckCircle size={48} className="text-green-600 dark:text-green-400" />
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    Primeiro Acesso Completo!
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Suas fotos foram enviadas com sucesso.
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    ⏰ <strong>Em até 7 dias</strong> seu protocolo personalizado (dieta + treino) estará disponível na plataforma.
                  </p>
                </div>

                <button
                  onClick={handleFinish}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors"
                >
                  Acessar Dashboard
                </button>
              </div>
            )}
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
    </>
  );
}
