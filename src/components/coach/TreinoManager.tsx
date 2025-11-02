'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Treino } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2, Edit, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendPushNotification } from '@/lib/push-notifications';
import { useAlert } from '@/contexts/AlertContext';

interface TreinoManagerProps {
  alunoId: string;
  treinos: Treino[];
  coachId: string;
}

interface WorkoutTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  workout_types: string[];
  times_used: number;
}

const workoutTypeOptions = [
  { value: 'cardio', label: 'Cardio' },
  { value: 'musculacao', label: 'Musculação' },
  { value: 'luta', label: 'Luta' },
  { value: 'outros', label: 'Outros' },
];

export default function TreinoManager({ alunoId, treinos, coachId }: TreinoManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [workoutTypes, setWorkoutTypes] = useState<string[]>(['musculacao']);
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
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
        .from('treino_templates')
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
      setWorkoutTypes(['musculacao']);
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContent(template.content);
      setWorkoutTypes(template.workout_types);
    }
  };

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
      showAlert({
        type: 'error',
        title: 'Tipo de treino obrigatório',
        message: 'Selecione pelo menos um tipo de treino.',
      });
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
        viewed_by_aluno: false, // Marca como não visualizado pelo aluno
        template_id: selectedTemplateId || null,
      });

      if (error) throw error;

      // Enviar push notification se foi marcado como ativo
      if (setAsActive) {
        try {
          await sendPushNotification({
            userId: alunoId,
            title: 'Novo treino disponível! 💪',
            body: `Seu coach atualizou seu treino: ${title.trim()}`,
            url: '/aluno/treino',
            data: { type: 'treino', action: 'created' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
        }
      }

      setTitle('');
      setContent('');
      setWorkoutTypes(['musculacao']);
      setSetAsActive(true);
      setSelectedTemplateId('');
      setShowForm(false);
      router.refresh();

      showAlert({
        type: 'success',
        title: 'Treino salvo',
        message: 'O treino foi criado com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao salvar',
        message: 'Erro ao salvar treino: ' + error.message,
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (treinoId: string, currentActive: boolean) => {
    try {
      // Buscar título do treino
      const treino = treinos.find(t => t.id === treinoId);

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
        .update({
          active: !currentActive,
          viewed_by_aluno: !currentActive ? false : undefined // Marca como não visualizado se estiver ativando
        })
        .eq('id', treinoId);

      if (error) throw error;

      // Enviar push notification se está ATIVANDO
      if (!currentActive && treino) {
        try {
          await sendPushNotification({
            userId: alunoId,
            title: 'Novo treino disponível! 💪',
            body: `Seu coach ativou seu treino: ${treino.title}`,
            url: '/aluno/treino',
            data: { type: 'treino', action: 'activated' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
        }
      }

      router.refresh();

      showAlert({
        type: 'success',
        title: 'Treino atualizado',
        message: currentActive ? 'O treino foi desativado.' : 'O treino foi ativado.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao atualizar',
        message: 'Erro ao atualizar treino: ' + error.message,
      });
    }
  };

  const handleDelete = async (treinoId: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir Treino',
      message: 'Tem certeza que deseja excluir este treino? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('treinos')
        .delete()
        .eq('id', treinoId);

      if (error) throw error;

      router.refresh();

      showAlert({
        type: 'success',
        title: 'Treino excluído',
        message: 'O treino foi excluído com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao excluir',
        message: 'Erro ao excluir treino: ' + error.message,
      });
    }
  };

  const handleEdit = (treino: Treino) => {
    setTitle(treino.title);
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
              placeholder="Ex: Treino ABC"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tipos de Treino
            </label>
            <div className="grid grid-cols-2 gap-2">
              {workoutTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    workoutTypes.includes(option.value)
                      ? 'border-primary-500 bg-primary-900/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={workoutTypes.includes(option.value)}
                    onChange={() => toggleWorkoutType(option.value)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecione os tipos de treino que o aluno deve fazer
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conteúdo
            </label>

            {/* Instruções de Formatação */}
            <div className="mb-3 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                📝 Como formatar o treino para o sistema identificar automaticamente:
              </h4>
              <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                <li>• <strong>Dias/Sessões:</strong> Use &quot;Treino A:&quot;, &quot;Dia 1:&quot;, &quot;Segunda-feira:&quot; para separar sessões</li>
                <li>• <strong>Séries e Reps:</strong> Use &quot;3x12&quot;, &quot;4 x 15&quot; ou &quot;3 séries de 12 reps&quot;</li>
                <li>• <strong>Exercícios:</strong> O sistema categoriza automaticamente em superior 🏋️, inferior 🎯, cardio 💓 e core 🎯</li>
                <li>• <strong>Alternativas:</strong> Use &quot;ou&quot; no início da linha para opções de substituição</li>
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-blue-700 dark:text-blue-300 hover:underline">
                  Ver exemplo completo
                </summary>
                <pre className="mt-2 text-xs bg-white dark:bg-gray-800 p-3 rounded border border-blue-200 dark:border-blue-600 text-gray-800 dark:text-gray-200 overflow-x-auto">
{`Treino A - Peito e Tríceps

Supino reto 4x12
ou Supino inclinado 4x12
Crucifixo 3x15
Tríceps testa 3x12
ou Tríceps corda 3x15

Treino B - Costas e Bíceps

Barra fixa 4x10
Remada curvada 4x12
ou Remada cavalinho 4x12
Rosca direta 3x12
Rosca martelo 3x15

Cardio 20 minutos esteira`}</pre>
              </details>
            </div>

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
              className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-primary-600 focus:ring-primary-500"
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
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-md transition-colors"
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
            className={`bg-white dark:bg-gray-900 p-4 rounded-lg border-2 ${
              treino.active ? 'border-green-500' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Botões no topo */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <button
                onClick={() => handleEdit(treino)}
                className="p-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:bg-blue-600 hover:border-blue-600 hover:scale-105 group"
                title="Editar (criar nova versão)"
              >
                <Edit size={18} className="text-gray-900 dark:text-gray-300 group-hover:text-white transition-colors" />
                <span className="sm:hidden text-gray-900 dark:text-gray-300 group-hover:text-white text-sm font-medium transition-colors">Editar</span>
              </button>
              <button
                onClick={() => toggleActive(treino.id, treino.active)}
                className={`p-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:scale-105 group ${
                  treino.active
                    ? 'hover:bg-yellow-600 hover:border-yellow-600'
                    : 'hover:bg-green-600 hover:border-green-600'
                }`}
                title={treino.active ? 'Desativar' : 'Ativar'}
              >
                {treino.active ? (
                  <XCircle size={18} className="text-gray-900 dark:text-gray-300 group-hover:text-white transition-colors" />
                ) : (
                  <CheckCircle size={18} className="text-gray-900 dark:text-gray-300 group-hover:text-white transition-colors" />
                )}
                <span className="sm:hidden text-gray-900 dark:text-gray-300 text-sm font-medium transition-colors group-hover:text-white">
                  {treino.active ? 'Desativar' : 'Ativar'}
                </span>
              </button>
              <button
                onClick={() => handleDelete(treino.id)}
                className="p-2 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 rounded-md transition-all duration-200 flex items-center justify-center gap-2 hover:bg-red-600 hover:border-red-600 hover:scale-105 group"
                title="Excluir"
              >
                <Trash2 size={18} className="text-gray-900 dark:text-gray-300 group-hover:text-white transition-colors" />
                <span className="sm:hidden text-gray-900 dark:text-gray-300 group-hover:text-white text-sm font-medium transition-colors">Excluir</span>
              </button>
            </div>

            {/* Conteúdo */}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-gray-900 dark:text-white font-semibold">{treino.title}</h3>
                {treino.active && (
                  <span className="px-2 py-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-300 text-xs rounded-full hover:bg-purple-600 hover:border-purple-600 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">
                    Ativo
                  </span>
                )}
                <div className="flex gap-1">
                  {treino.workout_types.map((type) => {
                    const typeLabel = workoutTypeOptions.find(opt => opt.value === type)?.label || type;
                    return (
                      <span key={type} className="px-2 py-1 bg-white dark:bg-gray-800 border-2 border-gray-900 dark:border-gray-300 text-gray-900 dark:text-gray-300 text-xs rounded-full hover:bg-purple-600 hover:border-purple-600 hover:text-white hover:scale-105 transition-all duration-200 cursor-default">
                        {typeLabel}
                      </span>
                    );
                  })}
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Criado em {format(new Date(treino.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {treino.content}
            </pre>
          </div>
        ))}

        {treinos.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum treino cadastrado ainda
          </p>
        )}
      </div>
    </div>
  );
}
