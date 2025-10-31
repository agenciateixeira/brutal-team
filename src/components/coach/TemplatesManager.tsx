'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Plus, Trash2, Edit2, Save, X, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DietTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  meals_per_day: number;
  observacoes_nutricionais: string | null;
  times_used: number;
  created_at: string;
  updated_at: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  workout_types: string[];
  times_used: number;
  created_at: string;
  updated_at: string;
}

interface ProtocolTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  times_used: number;
  created_at: string;
  updated_at: string;
}

interface TemplatesManagerProps {
  dietTemplates: DietTemplate[];
  workoutTemplates: WorkoutTemplate[];
  protocolTemplates: ProtocolTemplate[];
  coachId: string;
}

type TabType = 'diet' | 'workout' | 'protocol';

export default function TemplatesManager({
  dietTemplates,
  workoutTemplates,
  protocolTemplates,
  coachId,
}: TemplatesManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('diet');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(6);
  const [observacoesNutricionais, setObservacoesNutricionais] = useState('');

  const router = useRouter();
  const supabase = createClient();

  const resetForm = () => {
    setName('');
    setDescription('');
    setContent('');
    setMealsPerDay(6);
    setObservacoesNutricionais('');
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (template: any) => {
    setName(template.name);
    setDescription(template.description || '');
    setContent(template.content);
    if (activeTab === 'diet') {
      setMealsPerDay(template.meals_per_day || 6);
      setObservacoesNutricionais(template.observacoes_nutricionais || '');
    }
    setEditingId(template.id);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) {
      alert('Nome e conteudo sao obrigatorios');
      return;
    }

    setSaving(true);

    try {
      const tableName = activeTab === 'diet' ? 'dieta_templates' :
                        activeTab === 'workout' ? 'treino_templates' :
                        'protocolo_templates';

      const baseData = {
        coach_id: coachId,
        name: name.trim(),
        description: description.trim() || null,
        content: content.trim(),
      };

      const data = activeTab === 'diet'
        ? { ...baseData, meals_per_day: mealsPerDay, observacoes_nutricionais: observacoesNutricionais.trim() || null }
        : baseData;

      if (editingId) {
        const { error } = await supabase
          .from(tableName)
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(tableName)
          .insert(data);

        if (error) throw error;
      }

      resetForm();
      router.refresh();
    } catch (error: any) {
      alert('Erro ao salvar template: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (templateId: string) => {
    if (!confirm('Tem certeza que deseja excluir este template?')) return;

    try {
      const tableName = activeTab === 'diet' ? 'dieta_templates' :
                        activeTab === 'workout' ? 'treino_templates' :
                        'protocolo_templates';

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao excluir template: ' + error.message);
    }
  };

  const renderTemplatesList = () => {
    const templates = activeTab === 'diet' ? dietTemplates :
                      activeTab === 'workout' ? workoutTemplates :
                      protocolTemplates;

    if (templates.length === 0) {
      return (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum template criado ainda. Clique em Novo Template para comecar.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-4">
        {templates.map((template) => (
          <div
            key={template.id}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {template.name}
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                    <Copy size={12} />
                    Usado {template.times_used}x
                  </span>
                </div>
                {template.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {template.description}
                  </p>
                )}
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 mb-3">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3">
                    {template.content}
                  </p>
                </div>
                {activeTab === 'diet' && 'meals_per_day' in template && (
                  <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Refeicoes/dia: {template.meals_per_day}</span>
                    {template.observacoes_nutricionais && (
                      <span>Obs: {template.observacoes_nutricionais.substring(0, 50)}...</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 ml-4">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  title="Editar template"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(template.id)}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Excluir template"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderForm = () => {
    return (
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {editingId ? 'Editar Template' : 'Novo Template'}
          </h3>
          <button
            type="button"
            onClick={resetForm}
            className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome do Template *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Ex: Dieta Bulking Basica"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descricao
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
              placeholder="Descricao opcional do template"
            />
          </div>

          {activeTab === 'diet' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Refeicoes por Dia
                </label>
                <select
                  value={mealsPerDay}
                  onChange={(e) => setMealsPerDay(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                >
                  {[3, 4, 5, 6, 7, 8].map((num) => (
                    <option key={num} value={num}>{num} refeicoes</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Observacoes Nutricionais
                </label>
                <textarea
                  value={observacoesNutricionais}
                  onChange={(e) => setObservacoesNutricionais(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Observacoes gerais sobre a dieta"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conteudo do Template *
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
              placeholder="Digite o conteudo completo do template..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save size={18} />
              {saving ? 'Salvando...' : editingId ? 'Atualizar Template' : 'Salvar Template'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => { setActiveTab('diet'); resetForm(); }}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'diet'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Templates de Dieta ({dietTemplates.length})
          </button>
          <button
            onClick={() => { setActiveTab('workout'); resetForm(); }}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'workout'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Templates de Treino ({workoutTemplates.length})
          </button>
          <button
            onClick={() => { setActiveTab('protocol'); resetForm(); }}
            className={`px-4 py-3 border-b-2 font-medium transition-colors ${
              activeTab === 'protocol'
                ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Templates de Protocolo ({protocolTemplates.length})
          </button>
        </nav>
      </div>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          Novo Template
        </button>
      )}

      {showForm && renderForm()}

      {renderTemplatesList()}
    </div>
  );
}
