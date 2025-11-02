'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Dieta } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2, Edit, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendPushNotification } from '@/lib/push-notifications';
import { useAlert } from '@/contexts/AlertContext';

interface DietaManagerProps {
  alunoId: string;
  dietas: Dieta[];
  coachId: string;
}

interface DietTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  meals_per_day: number;
  observacoes_nutricionais: string | null;
  times_used: number;
}

export default function DietaManager({ alunoId, dietas, coachId }: DietaManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mealsPerDay, setMealsPerDay] = useState(6);
  const [observacoesNutricionais, setObservacoesNutricionais] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<DietTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');

  const router = useRouter();
  const supabase = createClient();
  const { showAlert, showConfirm } = useAlert();

  // Buscar templates ao abrir o formulário
  useEffect(() => {
    if (showForm) {
      loadTemplates();
    }
  }, [showForm]);

  const loadTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('dieta_templates')
        .select('*')
        .eq('coach_id', coachId)
        .order('times_used', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);

    if (!templateId) {
      // Limpar formulário se desselecionar template
      setTitle('');
      setContent('');
      setMealsPerDay(6);
      setObservacoesNutricionais('');
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContent(template.content);
      setMealsPerDay(template.meals_per_day);
      setObservacoesNutricionais(template.observacoes_nutricionais || '');
    }
  };

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
        viewed_by_aluno: false, // Marca como não visualizada pelo aluno
        template_id: selectedTemplateId || null,
      });

      if (error) throw error;

      // Enviar push notification se foi marcada como ativa
      if (setAsActive) {
        try {
          await sendPushNotification({
            userId: alunoId,
            title: 'Nova dieta disponível! 🍽️',
            body: `Seu coach atualizou sua dieta: ${title.trim()}`,
            url: '/aluno/dieta',
            data: { type: 'dieta', action: 'created' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
          // Não falhar a operação principal se o push falhar
        }
      }

      setTitle('');
      setContent('');
      setMealsPerDay(6);
      setObservacoesNutricionais('');
      setSetAsActive(true);
      setSelectedTemplateId('');
      setShowForm(false);
      router.refresh();

      showAlert({
        type: 'success',
        title: 'Dieta salva',
        message: 'A dieta foi criada com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Erro ao salvar dieta: ' + error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (dietaId: string, currentActive: boolean) => {
    try {
      // Buscar título da dieta
      const dieta = dietas.find(d => d.id === dietaId);

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
        .update({
          active: !currentActive,
          viewed_by_aluno: !currentActive ? false : undefined // Marca como não visualizada se estiver ativando
        })
        .eq('id', dietaId);

      if (error) throw error;

      // Enviar push notification se está ATIVANDO
      if (!currentActive && dieta) {
        try {
          await sendPushNotification({
            userId: alunoId,
            title: 'Nova dieta disponível! 🍽️',
            body: `Seu coach ativou sua dieta: ${dieta.title}`,
            url: '/aluno/dieta',
            data: { type: 'dieta', action: 'activated' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
        }
      }

      router.refresh();

      showAlert({
        type: 'success',
        title: 'Dieta atualizada',
        message: currentActive ? 'A dieta foi desativada.' : 'A dieta foi ativada.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Erro ao atualizar dieta: ' + error.message,
      });
    }
  };

  const handleDelete = async (dietaId: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Dieta',
      message: 'Tem certeza que deseja excluir esta dieta? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('dietas')
        .delete()
        .eq('id', dietaId);

      if (error) throw error;

      router.refresh();

      showAlert({
        type: 'success',
        title: 'Dieta excluída',
        message: 'A dieta foi excluída com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Erro ao excluir dieta: ' + error.message,
      });
    }
  };

  const handleEdit = (dieta: Dieta) => {
    setTitle(dieta.title);
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
          {/* Template Selector */}
          {templates.length > 0 && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700 p-3 rounded-lg">
              <label className="block text-sm font-medium text-primary-900 dark:text-primary-300 mb-2 flex items-center gap-2">
                <Copy size={16} />
                Usar Template (Opcional)
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-primary-300 dark:border-primary-600 rounded-md text-gray-900 dark:text-white"
              >
                <option value="">Começar do zero</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} {template.description ? `- ${template.description}` : ''} (usado {template.times_used}x)
                  </option>
                ))}
              </select>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-1">
                Selecione um template para pré-preencher os campos automaticamente
              </p>
            </div>
          )}

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
              Conteúdo da Dieta
            </label>

            {/* Instruções de Formatação */}
            <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📝 Como formatar a dieta para o sistema identificar automaticamente:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Títulos de refeições:</strong> Comece com &quot;Refeição 1:&quot;, &quot;Café da manhã:&quot;, &quot;Almoço:&quot;, etc</li>
                <li>• <strong>Quantidades:</strong> Use &quot;150g&quot;, &quot;200ml&quot;, &quot;2 ovos&quot; antes do alimento</li>
                <li>• <strong>Alternativas:</strong> Use &quot;ou&quot; no início da linha para opções</li>
                <li>• <strong>Categorias automáticas:</strong> Sistema identifica proteínas 🥩, gorduras 💧 e vegetais 🥗</li>
              </ul>

              <details className="mt-3">
                <summary className="text-xs font-semibold text-blue-900 dark:text-blue-300 cursor-pointer hover:underline">
                  Ver exemplo completo
                </summary>
                <pre className="mt-2 p-3 bg-white dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap border border-blue-200 dark:border-blue-600">
{`Refeição 1 - Café da manhã (8h)
3 ovos inteiros mexidos
ou 150g frango desfiado
2 colheres de azeite
Vegetais à vontade

Refeição 2 - Lanche da manhã (11h)
150g peito de frango grelhado
1 colher de pasta de amendoim
Salada verde

Refeição 3 - Almoço (14h)
200g carne vermelha magra
ou 200g salmão
2 colheres de azeite extra virgem
Brócolis e couve-flor à vontade`}
                </pre>
              </details>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white font-mono text-sm min-h-[500px]"
              placeholder="Cole ou digite a dieta aqui seguindo o formato acima..."
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
                className="p-2 bg-white dark:bg-gray-800 border-2 border-blue-600 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:bg-blue-600 hover:scale-105 group"
                title="Editar (criar nova versão)"
              >
                <Edit size={18} className="text-blue-600 group-hover:text-white transition-colors" />
                <span className="sm:hidden text-blue-600 group-hover:text-white text-sm font-medium transition-colors">Editar</span>
              </button>
              <button
                onClick={() => toggleActive(dieta.id, dieta.active)}
                className={`p-2 bg-white dark:bg-gray-800 border-2 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 group ${
                  dieta.active
                    ? 'border-yellow-600 hover:bg-yellow-600'
                    : 'border-green-600 hover:bg-green-600'
                }`}
                title={dieta.active ? 'Desativar' : 'Ativar'}
              >
                {dieta.active ? (
                  <XCircle size={18} className="text-yellow-600 group-hover:text-white transition-colors" />
                ) : (
                  <CheckCircle size={18} className="text-green-600 group-hover:text-white transition-colors" />
                )}
                <span className={`sm:hidden text-sm font-medium transition-colors group-hover:text-white ${
                  dieta.active ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {dieta.active ? 'Desativar' : 'Ativar'}
                </span>
              </button>
              <button
                onClick={() => handleDelete(dieta.id)}
                className="p-2 bg-white dark:bg-gray-800 border-2 border-red-600 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:bg-red-600 hover:scale-105 group"
                title="Excluir"
              >
                <Trash2 size={18} className="text-red-600 group-hover:text-white transition-colors" />
                <span className="sm:hidden text-red-600 group-hover:text-white text-sm font-medium transition-colors">Excluir</span>
              </button>
            </div>

            {/* Conteúdo */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-gray-900 dark:text-white font-semibold">{dieta.title}</h3>
                {dieta.active && (
                  <span className="px-2 py-1 bg-white dark:bg-gray-800 border-2 border-green-600 text-green-600 text-xs rounded-full hover:bg-green-600 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">
                    Ativa
                  </span>
                )}
                <span className="px-2 py-1 bg-white dark:bg-gray-800 border-2 border-blue-600 text-blue-600 text-xs rounded-full hover:bg-blue-600 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">
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
