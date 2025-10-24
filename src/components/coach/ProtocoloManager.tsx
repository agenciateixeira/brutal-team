'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ProtocoloHormonal } from '@/types';
import { Plus, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ProtocoloManagerProps {
  alunoId: string;
  protocolos: ProtocoloHormonal[];
}

export default function ProtocoloManager({ alunoId, protocolos }: ProtocoloManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const supabase = createClient();

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
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setSetAsActive(true);
      setShowForm(false);
      router.refresh();
    } catch (error: any) {
      alert('Erro ao salvar protocolo: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (protocoloId: string, currentActive: boolean) => {
    try {
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
        .update({ active: !currentActive })
        .eq('id', protocoloId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao atualizar protocolo: ' + error.message);
    }
  };

  const handleDelete = async (protocoloId: string) => {
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) return;

    try {
      const { error } = await supabase
        .from('protocolos_hormonais')
        .delete()
        .eq('id', protocoloId);

      if (error) throw error;

      router.refresh();
    } catch (error: any) {
      alert('Erro ao excluir protocolo: ' + error.message);
    }
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
              placeholder="Ex: Protocolo de TRT"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Conteúdo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white font-mono text-sm"
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
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500"
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
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
            className={`bg-gray-900 p-4 rounded-lg border-2 ${
              protocolo.active ? 'border-purple-500' : 'border-gray-700'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-semibold">{protocolo.title}</h3>
                  {protocolo.active && (
                    <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                      Ativo
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Criado em {format(new Date(protocolo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => toggleActive(protocolo.id, protocolo.active)}
                  className={`p-2 rounded-md transition-colors ${
                    protocolo.active
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  title={protocolo.active ? 'Desativar' : 'Ativar'}
                >
                  {protocolo.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                </button>
                <button
                  onClick={() => handleDelete(protocolo.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  title="Excluir"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {protocolo.content}
            </pre>
          </div>
        ))}

        {protocolos.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-8">
            Nenhum protocolo cadastrado ainda
          </p>
        )}
      </div>
    </div>
  );
}
