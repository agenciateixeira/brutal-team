'use client';

import { Profile } from '@/types';
import { UserPlus, FileText, Dumbbell, Calendar, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NewStudentsListProps {
  newStudents: (Profile & {
    has_diet?: boolean;
    has_workout?: boolean;
  })[];
}

export default function NewStudentsList({ newStudents }: NewStudentsListProps) {
  if (newStudents.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <UserPlus size={24} className="text-purple-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Novos Alunos - Aguardando Dieta/Treino ({newStudents.length})
        </h2>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Estes alunos foram aprovados mas ainda não receberam sua dieta e/ou treino. Configure dieta e treino para que apareçam na lista de alunos ativos.
      </p>

      <div className="space-y-3">
        {newStudents.map((student) => (
          <div
            key={student.id}
            className="bg-purple-50 dark:bg-purple-900/10 border-2 border-purple-400 dark:border-purple-600 rounded-lg p-4"
          >
            <div className="flex items-start justify-between gap-4">
              {/* Info do Aluno */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {student.full_name || 'Sem nome'}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{student.email}</p>
                    {student.phone_number && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{student.phone_number}</p>
                    )}
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1 flex items-center gap-1">
                      <Calendar size={12} />
                      Aprovado em {format(new Date(student.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </p>
                  </div>

                  {/* Status badges */}
                  <div className="flex flex-col gap-1">
                    {student.has_diet ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <CheckCircle2 size={12} />
                        Dieta OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <FileText size={12} />
                        Sem Dieta
                      </span>
                    )}
                    {student.has_workout ? (
                      <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <CheckCircle2 size={12} />
                        Treino OK
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-1 rounded-full whitespace-nowrap">
                        <Dumbbell size={12} />
                        Sem Treino
                      </span>
                    )}
                  </div>
                </div>

                {/* Mensagem informativa */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {!student.has_diet && !student.has_workout
                    ? '⚠️ Configure a dieta e o treino para o aluno aparecer na lista principal'
                    : !student.has_diet
                    ? '⚠️ Configure a dieta para completar o cadastro'
                    : '⚠️ Configure o treino para completar o cadastro'}
                </p>

                {/* Botão para gerenciar */}
                <Link
                  href={`/coach/aluno/${student.id}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  <FileText size={16} />
                  Configurar Dieta e Treino
                  <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          💡 <strong>Dica:</strong> Clique em "Configurar Dieta e Treino" para acessar a página do aluno onde você pode criar e ativar dieta e treino.
          Quando o aluno tiver dieta <strong>E</strong> treino ativos, ele será movido automaticamente para a lista de alunos ativos.
        </p>
      </div>
    </div>
  );
}
