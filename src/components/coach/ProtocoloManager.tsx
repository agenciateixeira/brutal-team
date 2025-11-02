'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProtocoloHormonal } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2, Edit, Copy } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { sendPushNotification } from '@/lib/push-notifications';
import { useAlert } from '@/contexts/AlertContext';

interface ProtocoloManagerProps {
  alunoId: string;
  protocolos: ProtocoloHormonal[];
  coachId: string;
}

interface ProtocolTemplate {
  id: string;
  name: string;
  description: string | null;
  content: string;
  times_used: number;
}

export default function ProtocoloManager({ alunoId, protocolos, coachId }: ProtocoloManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<ProtocolTemplate[]>([]);
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
        .from('protocolo_templates')
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
      return;
    }

    const template = templates.find(t => t.id === templateId);
    if (template) {
      setTitle(template.name);
      setContent(template.content);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);

    try {
      // Se está marcando como ativo, desativar todos os outros primeiro
      if (setAsActive) {
        await supabase
          .from('protocolos_hormonais')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      const { error } = await supabase.from('protocolos_hormonais').insert({
        aluno_id: alunoId,
        title: title.trim(),
        content: content.trim(),
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
            title: 'Novo protocolo disponível! 📋',
            body: `Seu coach atualizou seu protocolo: ${title.trim()}`,
            url: '/aluno/protocolo',
            data: { type: 'protocolo', action: 'created' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
        }
      }

      setTitle('');
      setContent('');
      setSetAsActive(true);
      setSelectedTemplateId('');
      setShowForm(false);
      router.refresh();
      showAlert({
        type: 'success',
        title: 'Protocolo salvo!',
        message: 'O protocolo foi criado com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao salvar',
        message: error.message || 'Não foi possível salvar o protocolo.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (protocoloId: string, currentActive: boolean) => {
    try {
      // Buscar título do protocolo
      const protocolo = protocolos.find(p => p.id === protocoloId);

      // Se está ativando, desativar todos os outros primeiro
      if (!currentActive) {
        await supabase
          .from('protocolos_hormonais')
          .update({ active: false })
          .eq('aluno_id', alunoId);
      }

      // Atualizar o protocolo selecionado
      const { error } = await supabase
        .from('protocolos_hormonais')
        .update({
          active: !currentActive,
          viewed_by_aluno: !currentActive ? false : undefined // Marca como não visualizado se estiver ativando
        })
        .eq('id', protocoloId);

      if (error) throw error;

      // Enviar push notification se está ATIVANDO
      if (!currentActive && protocolo) {
        try {
          await sendPushNotification({
            userId: alunoId,
            title: 'Novo protocolo disponível! 📋',
            body: `Seu coach ativou seu protocolo: ${protocolo.title}`,
            url: '/aluno/protocolo',
            data: { type: 'protocolo', action: 'activated' },
          });
        } catch (pushError) {
          console.error('Erro ao enviar push notification:', pushError);
        }
      }

      router.refresh();
      showAlert({
        type: 'success',
        title: 'Protocolo atualizado!',
        message: currentActive ? 'Protocolo desativado.' : 'Protocolo ativado com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao atualizar',
        message: error.message || 'Não foi possível atualizar o protocolo.',
      });
    }
  };

  const handleDelete = async (protocoloId: string) => {
    const confirmed = await showConfirm({
      title: 'Excluir protocolo?',
      message: 'Tem certeza que deseja excluir este protocolo? Esta ação não pode ser desfeita.',
      confirmText: 'Sim, excluir',
      cancelText: 'Cancelar',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('protocolos_hormonais')
        .delete()
        .eq('id', protocoloId);

      if (error) throw error;

      router.refresh();
      showAlert({
        type: 'success',
        title: 'Protocolo excluído!',
        message: 'O protocolo foi excluído com sucesso.',
      });
    } catch (error: any) {
      showAlert({
        type: 'error',
        title: 'Erro ao excluir',
        message: error.message || 'Não foi possível excluir o protocolo.',
      });
    }
  };

  const handleEdit = (protocolo: ProtocoloHormonal) => {
    setTitle(protocolo.title + ' (Nova Versão)');
    setContent(protocolo.content);
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
          Novo Protocolo
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
              placeholder="Ex: Protocolo de TRT"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conteúdo
            </label>

            {/* Instruções de Formatação */}
            <div className="mb-3 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg">
              <h4 className="text-sm font-semibold text-purple-900 dark:text-purple-300 mb-2">
                💉 Como formatar o protocolo para o sistema identificar automaticamente:
              </h4>
              <ul className="text-xs text-purple-800 dark:text-purple-200 space-y-1">
                <li>• <strong>Fases/Ciclos:</strong> Use &quot;Protocolo:&quot;, &quot;Ciclo 1:&quot;, &quot;Fase 1:&quot;, &quot;Semana 1-4:&quot; para separar períodos</li>
                <li>• <strong>Dosagens:</strong> Use &quot;250mg&quot;, &quot;2ml&quot;, &quot;4IU&quot; antes do medicamento</li>
                <li>• <strong>Frequência:</strong> Use &quot;diariamente&quot;, &quot;EOD&quot;, &quot;2x por semana&quot;, &quot;semanal&quot;</li>
                <li>• <strong>Horários:</strong> Use &quot;pela manhã&quot;, &quot;à noite&quot;, &quot;pré-treino&quot;, &quot;pós-treino&quot;</li>
                <li>• <strong>Categorias automáticas:</strong> TRT 💉, HGH 🧬, Peptídeos 💧, AI 🛡️, SERMs 💊, HCG ⚕️</li>
                <li>• <strong>Alternativas:</strong> Use &quot;ou&quot; no início da linha para opções</li>
              </ul>
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline">
                  Ver exemplo completo
                </summary>
                <pre className="mt-2 text-xs bg-white dark:bg-gray-800 p-3 rounded border border-purple-200 dark:border-purple-600 text-gray-800 dark:text-gray-200 overflow-x-auto">
{`Protocolo de TRT - Base

Testosterona Cipionato 250mg 2x por semana
ou Testosterona Enantato 250mg 2x por semana
Anastrozol 0.5mg dia sim, dia não
HCG 250IU 2x por semana

Fase de Crescimento (Semana 1-12)

HGH 4IU diariamente pela manhã
BPC-157 250mcg 2x ao dia
TB-500 2mg 2x por semana

Suplementação de Suporte

Levotiroxina 25mcg pela manhã em jejum
ou Puran T4 25mcg pela manhã`}</pre>
              </details>
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm min-h-[500px]"
              placeholder="Cole aqui o conteúdo do protocolo hormonal..."
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
              Ativar este protocolo imediatamente (desativa os outros)
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

      {/* Protocolos List */}
      <div className="space-y-3">
        {protocolos.map((protocolo) => (
          <div
            key={protocolo.id}
            className={`bg-white dark:bg-gray-900 p-4 rounded-lg border-2 ${
              protocolo.active ? 'border-purple-500' : 'border-gray-200 dark:border-gray-700'
            }`}
          >
            {/* Botões no topo */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <button
                onClick={() => handleEdit(protocolo)}
                className="p-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-2"
                title="Editar (criar nova versão)"
              >
                <Edit size={18} />
                <span className="sm:hidden text-white text-sm font-medium">Editar</span>
              </button>
              <button
                onClick={() => toggleActive(protocolo.id, protocolo.active)}
                className={`p-2 rounded-md transition-colors flex items-center justify-center gap-2 ${
                  protocolo.active
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
                title={protocolo.active ? 'Desativar' : 'Ativar'}
              >
                {protocolo.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                <span className="sm:hidden text-white text-sm font-medium">{protocolo.active ? 'Desativar' : 'Ativar'}</span>
              </button>
              <button
                onClick={() => handleDelete(protocolo.id)}
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
                <h3 className="text-gray-900 dark:text-white font-semibold">{protocolo.title}</h3>
                {protocolo.active && (
                  <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                    Ativo
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Criado em {format(new Date(protocolo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm bg-gray-50 dark:bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {protocolo.content}
            </pre>
          </div>
        ))}

        {protocolos.length === 0 && !showForm && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            Nenhum protocolo cadastrado ainda
          </p>
        )}
      </div>
    </div>
  );
}
