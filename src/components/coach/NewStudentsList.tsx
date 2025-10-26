'use client';

import { useState } from 'react';
import { Profile } from '@/types';
import { UserPlus, Upload, FileText, Dumbbell, Calendar, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Toast from '@/components/ui/Toast';

interface NewStudentsListProps {
  newStudents: (Profile & {
    has_diet?: boolean;
    has_workout?: boolean;
  })[];
}

export default function NewStudentsList({ newStudents }: NewStudentsListProps) {
  const [uploading, setUploading] = useState<{ alunoId: string; type: 'diet' | 'workout' } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [hiddenStudents, setHiddenStudents] = useState<Set<string>>(new Set());
  const router = useRouter();

  // Filtrar alunos que já foram processados
  const visibleStudents = newStudents.filter(student => !hiddenStudents.has(student.id));

  const handleFileUpload = async (alunoId: string, type: 'diet' | 'workout', file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (file.type !== 'application/pdf') {
      setToast({ type: 'error', message: 'Apenas arquivos PDF são permitidos' });
      return;
    }

    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setToast({ type: 'error', message: 'O arquivo deve ter no máximo 10MB' });
      return;
    }

    setUploading({ alunoId, type });

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('alunoId', alunoId);
      formData.append('type', type);

      const response = await fetch('/api/upload-student-files', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `Erro ao enviar ${type === 'diet' ? 'dieta' : 'treino'}`);
      }

      setToast({
        type: 'success',
        message: `${type === 'diet' ? 'Dieta' : 'Treino'} enviado com sucesso!`
      });

      // Se ambos foram enviados, remover da lista
      const student = newStudents.find(s => s.id === alunoId);
      const bothUploaded = type === 'diet'
        ? result.has_workout
        : result.has_diet;

      if (bothUploaded) {
        setToast({
          type: 'success',
          message: 'Aluno configurado! Dieta e treino enviados com sucesso.'
        });
        setHiddenStudents(prev => new Set(prev).add(alunoId));

        // Refresh após um delay
        setTimeout(() => {
          router.refresh();
        }, 1500);
      } else {
        // Apenas refresh para atualizar o status
        setTimeout(() => {
          router.refresh();
        }, 500);
      }
    } catch (error: any) {
      console.error(`Erro ao enviar ${type}:`, error);
      setToast({ type: 'error', message: error.message });
    } finally {
      setUploading(null);
    }
  };

  const triggerFileInput = (alunoId: string, type: 'diet' | 'workout') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        handleFileUpload(alunoId, type, file);
      }
    };
    input.click();
  };

  if (visibleStudents.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={24} className="text-purple-600" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Novos Alunos - Aguardando Dieta/Treino ({visibleStudents.length})
          </h2>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Estes alunos foram aprovados mas ainda não receberam sua dieta e/ou treino. Envie os arquivos PDF para que apareçam na lista de alunos ativos.
        </p>

        <div className="space-y-3">
          {visibleStudents.map((student) => (
            <div
              key={student.id}
              className="bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-4"
            >
              <div className="mb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student.full_name || 'Sem nome'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    {student.phone_number && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.phone_number}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      Aprovado em {format(new Date(student.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col gap-1">
                    {student.has_diet && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} />
                        Dieta OK
                      </span>
                    )}
                    {student.has_workout && (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full">
                        <CheckCircle2 size={12} />
                        Treino OK
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botões de Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Upload Dieta */}
                <button
                  onClick={() => triggerFileInput(student.id, 'diet')}
                  disabled={uploading?.alunoId === student.id || student.has_diet}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    student.has_diet
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                  }`}
                >
                  {uploading?.alunoId === student.id && uploading.type === 'diet' ? (
                    <>
                      <Upload size={18} className="animate-pulse" />
                      Enviando...
                    </>
                  ) : student.has_diet ? (
                    <>
                      <CheckCircle2 size={18} />
                      Dieta Enviada
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      Enviar Dieta (PDF)
                    </>
                  )}
                </button>

                {/* Upload Treino */}
                <button
                  onClick={() => triggerFileInput(student.id, 'workout')}
                  disabled={uploading?.alunoId === student.id || student.has_workout}
                  className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                    student.has_workout
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed'
                      : 'bg-orange-600 hover:bg-orange-700 text-white disabled:opacity-50'
                  }`}
                >
                  {uploading?.alunoId === student.id && uploading.type === 'workout' ? (
                    <>
                      <Upload size={18} className="animate-pulse" />
                      Enviando...
                    </>
                  ) : student.has_workout ? (
                    <>
                      <CheckCircle2 size={18} />
                      Treino Enviado
                    </>
                  ) : (
                    <>
                      <Dumbbell size={18} />
                      Enviar Treino (PDF)
                    </>
                  )}
                </button>
              </div>

              {/* Mensagem informativa */}
              {(!student.has_diet || !student.has_workout) && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  {!student.has_diet && !student.has_workout
                    ? 'Envie a dieta e o treino para o aluno aparecer na lista principal'
                    : !student.has_diet
                    ? 'Envie a dieta para completar o cadastro'
                    : 'Envie o treino para completar o cadastro'}
                </p>
              )}
            </div>
          ))}
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
