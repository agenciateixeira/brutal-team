'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Treino } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TreinoManagerProps {
  alunoId: string;
  treinos: Treino[];
}

const workoutTypeOptions = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'luta', label: 'Luta' },
  { value: 'outros', label: 'Outros' },
];

export default function TreinoManager({ alunoId, treinos }: TreinoManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(['musculacao']);
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleWorkoutType = (type: string) => {
    setWorkoutTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (workoutTypes.length === 0) {
      alert('Selecione pelo menos um tipo de treino');
      return;
    }

    setSaving(true);

    try {
      // Se está marcando como ativo, desativar todos os outros primeiro
      if (setAsActive) {
        await supabase
          .from('treinos')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      const { error } = await supabase.from('treinos').insert({
        aluno_id: alunoId,
        title: title.trim(),
        content: content.trim(),
        workout_types: workoutTypes,
        active: setAsActive,
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setWorkoutTypes(['musculacao']);
      setSetAsActive(true);
      setShowForm(false);
      router.refresh();
    } catch (error: any) {
      alert('Erro ao salvar treino: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (treinoId: string, currentActive: boolean) => {
    try {
      // Se está ativando, desativar todos os outros primeiro
      if (!currentActive) {
        await supabase
          .from('treinos')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      // Atualizar o treino selecionado
      const { error } = await supabase
        .from('treinos')
        .update({ active: !currentActive })
        .eq('id', treinoId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao atualizar treino: ' + error.message);
    }
  };

  const handleDelete = async (treinoId: string) => {
    if (!confirm('Tem certeza que deseja excluir este treino?')) return;

    try {
      const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', treinoId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao excluir treino: ' + error.message);
    }
  };

  const handleEdit = (treino: Treino) => {
    setTitle(treino.title + ' (Nova Versão)');
    setContent(treino.content);
    setWorkoutTypes(treino.workout_types);
    setSetAsActive(true);
    setShowForm(true);
  };

  return (
    <div className="space-y-4">
      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
        >
          <Plus size={20} />
          Novo Treino
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-gray-900 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
              placeholder="Ex: Treino ABC"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tipos de Treino
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workoutTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    workoutTypes.includes(option.value)
                      ? 'border-primary-500 bg-primary-900/30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={workoutTypes.includes(option.value)}
                    onChange={() => toggleWorkoutType(option.value)}
                    className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Selecione os tipos de treino que o aluno deve fazer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Conteúdo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm min-h-[500px]"
              placeholder="Cole aqui o conteúdo do treino..."
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setAsActive"
              checked={setAsActive}
              onChange={(e) => setSetAsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="setAsActive" className="text-sm text-gray-300 cursor-pointer">
              Ativar este treino imediatamente (desativa os outros)
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Treinos List */}
      <div className="space-y-3">
        {treinos.map((treino) => (
          <div
            key={treino.id}
            className={`bg-gray-900 p-4 rounded-lg border-2 ${
              treino.active ? 'border-green-500' : 'border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-white font-semibold">{treino.title}</h3>
                  {treino.active && (
                    <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                      Ativo
                    </span>
                  )}
                  <div className="flex gap-1">
                    {treino.workout_types.map((type) => {
                      const typeLabel = workoutTypeOptions.find(opt => opt.value === type)?.label || type;
                      return (
                        <span key={type} className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                          {typeLabel}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Criado em {format(new Date(treino.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(treino)}
                  className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  title="Editar (criar nova versão)"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => toggleActive(treino.id, treino.active)}
                  className={`p-2 rounded-md transition-colors ${
                    treino.active
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={treino.active ? 'Desativar' : 'Ativar'}
                >
                  {treino.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(treino.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {treino.content}
            </pre>
          </div>
        ))}

        {treinos.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-8">
            Nenhum treino cadastrado ainda
          </p>
        )}
      </div>
    </div>
  );
}
