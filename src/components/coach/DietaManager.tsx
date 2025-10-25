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
  const [setAsActive, setSetAsActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Estados para macronutrientes
  const [calorias, setCalorias] = useState('');
  const [proteinas, setProteinas] = useState('');
  const [carboidratos, setCarboidratos] = useState('');
  const [gorduras, setGorduras] = useState('');
  const [fibras, setFibras] = useState('');

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

      // Preparar macronutrientes se algum campo foi preenchido
      let macronutrientes = null;
      if (calorias || proteinas || carboidratos || gorduras || fibras) {
        macronutrientes = {
          calorias: calorias ? parseFloat(calorias) : 0,
          proteinas: proteinas ? parseFloat(proteinas) : 0,
          carboidratos: carboidratos ? parseFloat(carboidratos) : 0,
          gorduras: gorduras ? parseFloat(gorduras) : 0,
          ...(fibras && { fibras: parseFloat(fibras) }),
        };
      }

      const { error } = await supabase.from('dietas').insert({
        aluno_id: alunoId,
        title: title.trim(),
        content: content.trim(),
        meals_per_day: mealsPerDay,
        macronutrientes,
        active: setAsActive,
      });

      if (error) throw error;

      setTitle('');
      setContent('');
      setMealsPerDay(6);
      setCalorias('');
      setProteinas('');
      setCarboidratos('');
      setGorduras('');
      setFibras('');
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

    // Copiar macronutrientes se existirem
    if (dieta.macronutrientes) {
      setCalorias(dieta.macronutrientes.calorias?.toString() || '');
      setProteinas(dieta.macronutrientes.proteinas?.toString() || '');
      setCarboidratos(dieta.macronutrientes.carboidratos?.toString() || '');
      setGorduras(dieta.macronutrientes.gorduras?.toString() || '');
      setFibras(dieta.macronutrientes.fibras?.toString() || '');
    }

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
              placeholder="Ex: Dieta de Cutting"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Número de Refeições por Dia
            </label>
            <select
              value={mealsPerDay}
              onChange={(e) => setMealsPerDay(parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white"
            >
              <option value={2}>2 refeições</option>
              <option value={3}>3 refeições</option>
              <option value={4}>4 refeições</option>
              <option value={5}>5 refeições</option>
              <option value={6}>6 refeições</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">
              Define quantas refeições o aluno deve fazer por dia
            </p>
          </div>

          {/* Macronutrientes */}
          <div className="bg-gray-800 p-4 rounded-lg space-y-3">
            <h4 className="text-sm font-semibold text-gray-200 mb-2">
              Tabela de Macronutrientes (Opcional)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Calorias (kcal)
                </label>
                <input
                  type="number"
                  value={calorias}
                  onChange={(e) => setCalorias(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  placeholder="2000"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Proteínas (g)
                </label>
                <input
                  type="number"
                  value={proteinas}
                  onChange={(e) => setProteinas(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  placeholder="150"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Carboidratos (g)
                </label>
                <input
                  type="number"
                  value={carboidratos}
                  onChange={(e) => setCarboidratos(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  placeholder="200"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Gorduras (g)
                </label>
                <input
                  type="number"
                  value={gorduras}
                  onChange={(e) => setGorduras(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  placeholder="60"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Fibras (g) - Opcional
                </label>
                <input
                  type="number"
                  value={fibras}
                  onChange={(e) => setFibras(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white text-sm"
                  placeholder="30"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Preencha os valores diários recomendados de macronutrientes para esta dieta
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
              className="w-4 h-4 rounded border-gray-600 bg-gray-700 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="setAsActive" className="text-sm text-gray-300 cursor-pointer">
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
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors"
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
            className={`bg-gray-900 p-4 rounded-lg border-2 ${
              dieta.active ? 'border-green-500' : 'border-gray-700'
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
                <h3 className="text-white font-semibold">{dieta.title}</h3>
                {dieta.active && (
                  <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full">
                    Ativa
                  </span>
                )}
                <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full">
                  {dieta.meals_per_day} refeições/dia
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Criada em {format(new Date(dieta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>

            {/* Macronutrientes */}
            {dieta.macronutrientes && (
              <div className="bg-gray-800 p-3 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-2">Macronutrientes Diários:</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="bg-gray-700 px-2 py-1 rounded">
                    <span className="text-gray-400">Calorias:</span>
                    <span className="text-white font-semibold ml-1">{dieta.macronutrientes.calorias} kcal</span>
                  </div>
                  <div className="bg-gray-700 px-2 py-1 rounded">
                    <span className="text-gray-400">Proteínas:</span>
                    <span className="text-white font-semibold ml-1">{dieta.macronutrientes.proteinas}g</span>
                  </div>
                  <div className="bg-gray-700 px-2 py-1 rounded">
                    <span className="text-gray-400">Carboidratos:</span>
                    <span className="text-white font-semibold ml-1">{dieta.macronutrientes.carboidratos}g</span>
                  </div>
                  <div className="bg-gray-700 px-2 py-1 rounded">
                    <span className="text-gray-400">Gorduras:</span>
                    <span className="text-white font-semibold ml-1">{dieta.macronutrientes.gorduras}g</span>
                  </div>
                  {dieta.macronutrientes.fibras && (
                    <div className="bg-gray-700 px-2 py-1 rounded">
                      <span className="text-gray-400">Fibras:</span>
                      <span className="text-white font-semibold ml-1">{dieta.macronutrientes.fibras}g</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            <pre className="whitespace-pre-wrap text-gray-300 text-sm bg-gray-800 p-3 rounded max-h-40 overflow-y-auto">
              {dieta.content}
            </pre>
          </div>
        ))}

        {dietas.length === 0 && !showForm && (
          <p className="text-center text-gray-400 py-8">
            Nenhuma dieta cadastrada ainda
          </p>
        )}
      </div>
    </div>
  );
}
