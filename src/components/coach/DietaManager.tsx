'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dieta } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface DietaManagerProps {
  alunoId: string;
  dietas: Dieta[];
}

export default function DietaManager({ alunoId, dietas }: DietaManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(6);
  const [observacoesNutricionais, setObservacoesNutricionais] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);

    try {
      // Se está marcando como ativa, desativar todas as outras primeiro
      if (setAsActive) {
        await supabase
          .from('dietas')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      const { error } = await supabase.from('dietas').insert({
        aluno_id: alunoId,
        title: title.trim(),
        content: content.trim(),
        meals_per_day: mealsPerDay,
        observacoes_nutricionais: observacoesNutricionais.trim() || null,
        active: setAsActive,
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setMealsPerDay(6);
      setObservacoesNutricionais('');
      setSetAsActive(true);
      setShowForm(false);
      router.refresh();
    } catch (error: any) {
      alert('Erro ao salvar dieta: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (dietaId: string, currentActive: boolean) => {
    try {
      // Se está ativando, desativar todas as outras primeiro
      if (!currentActive) {
        await supabase
          .from('dietas')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      // Atualizar a dieta selecionada
      const { error } = await supabase
        .from('dietas')
        .update({ active: !currentActive })
        .eq('id', dietaId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao atualizar dieta: ' + error.message);
    }
  };

  const handleDelete = async (dietaId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta dieta?')) return;

    try {
      const { error } = await supabase
        .from('dietas')
        .delete()
        .eq('id', dietaId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao excluir dieta: ' + error.message);
    }
  };

  const handleEdit = (dieta: Dieta) => {
    setTitle(dieta.title + ' (Nova Versão)');
    setContent(dieta.content);
    setMealsPerDay(dieta.meals_per_day);
    setObservacoesNutricionais(dieta.observacoes_nutricionais || '');
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
          Nova Dieta
        </button>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-4 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
              placeholder="Ex: Dieta de Cutting"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Número de Refeições por Dia
            </label>
            <select
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white"
            >
              <option value={2}>2 refeições</option>
              <option value={3}>3 refeições</option>
              <option value={4}>4 refeições</option>
              <option value={5}>5 refeições</option>
              <option value={6}>6 refeições</option>
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Define quantas refeições o aluno deve fazer por dia
            </p>
          </div>

          {/* Observações Nutricionais */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações Nutricionais (Opcional)
            </label>
            <textarea
              value={observacoesNutricionais}
              onChange={(e) => setObservacoesNutricionais(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white text-sm"
              placeholder="Ex: Total diário: ~1500 kcal, 150g proteína, 150g gordura, 0-20g carbo"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Informações gerais sobre macros ou totais diários (aparece destacado para o aluno)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conteúdo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono text-sm min-h-[500px]"
              placeholder="Cole aqui o conteúdo da dieta..."
              required
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="setAsActive"
              checked={setAsActive}
              onChange={(e) => setSetAsActive(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="setAsActive" className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
              Ativar esta dieta imediatamente (desativa as outras)
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
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Dietas List */}
      <div className="space-y-3">
        {dietas.map((dieta) => (
          <div
            key={dieta.id}
            className={`bg-white dark:bg-gray-900 p-4 rounded-lg border-2 ${
              dieta.active ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Botões no topo */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <button
                onClick={() => handleEdit(dieta)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2"
                title="Editar (criar nova versão)"
              >
                <Edit size={18} />
                <span className="sm:hidden text-white text-sm font-medium">Editar</span>
              </button>
              <button
                onClick={() => toggleActive(dieta.id, dieta.active)}
                className={`p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                  dieta.active
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                title={dieta.active ? 'Desativar' : 'Ativar'}
              >
                {dieta.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                <span className="sm:hidden text-white text-sm font-medium">{dieta.active ? 'Desativar' : 'Ativar'}</span>
              </button>
              <button
                onClick={() => handleDelete(dieta.id)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors flex items-center justify-center gap-2"
                title="Excluir"
              >
                <Trash2 size={18} />
                <span className="sm:hidden text-white text-sm font-medium">Excluir</span>
              </button>
            </div>

            {/* Conteúdo */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-gray-900 dark:text-white font-semibold">{dieta.title}</h3>
                {dieta.active && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    Ativa
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {dieta.meals_per_day} refeições/dia
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Criada em {format(new Date(dieta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Observações Nutricionais */}
            {dieta.observacoes_nutricionais && (
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">📊 Observações Nutricionais:</h4>
                <p className="text-sm text-blue-900 dark:text-gray-300">{dieta.observacoes_nutricionais}</p>
              </div>
            )}

            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {dieta.content}
            </pre>
          </div>
        ))}

        {dietas.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhuma dieta cadastrada ainda
          </p>
        )}
      </div>
    </div>
  );
}
