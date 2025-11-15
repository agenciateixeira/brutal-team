'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { X, Users, Loader2, Check } from 'lucide-react';
import Image from 'next/image';

interface Friend {
  id: string;
  full_name: string;
  avatar_url: string | null;
}

interface CreateCommunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  alunoId: string;
  friends: Friend[];
}

export default function CreateCommunityModal({
  isOpen,
  onClose,
  onSuccess,
  alunoId,
  friends,
}: CreateCommunityModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  if (!isOpen) return null;

  const toggleFriend = (friendId: string) => {
    setSelectedFriends((prev) =>
      prev.includes(friendId)
        ? prev.filter((id) => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      setError('Digite um nome para a comunidade');
      return;
    }

    if (selectedFriends.length === 0) {
      setError('Selecione pelo menos um amigo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Criar comunidade
      const { data: community, error: communityError } = await supabase
        .from('communities')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          type: 'private',
          created_by: alunoId,
        })
        .select()
        .single();

      if (communityError) throw communityError;

      // Adicionar o criador como admin
      const { error: creatorError } = await supabase
        .from('community_members')
        .insert({
          community_id: community.id,
          aluno_id: alunoId,
          role: 'admin',
        });

      if (creatorError) throw creatorError;

      // Adicionar amigos selecionados
      const membersToAdd = selectedFriends.map((friendId) => ({
        community_id: community.id,
        aluno_id: friendId,
        role: 'member',
      }));

      const { error: membersError } = await supabase
        .from('community_members')
        .insert(membersToAdd);

      if (membersError) throw membersError;

      // Sucesso!
      onSuccess();
      onClose();

      // Resetar formulário
      setName('');
      setDescription('');
      setSelectedFriends([]);
    } catch (err: any) {
      console.error('Erro ao criar comunidade:', err);
      setError(err.message || 'Erro ao criar comunidade');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Criar Comunidade Privada
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Crie um grupo privado com seus amigos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 flex items-start gap-2">
              <span className="text-red-500 mt-0.5">⚠️</span>
              <span className="text-sm text-red-700 dark:text-red-400">{error}</span>
            </div>
          )}

          {/* Nome da Comunidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nome da Comunidade *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Meu Grupo de Treino"
              maxLength={50}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {name.length}/50 caracteres
            </p>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objetivo do grupo..."
              rows={3}
              maxLength={200}
              className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {description.length}/200 caracteres
            </p>
          </div>

          {/* Seleção de Amigos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Adicionar Amigos * ({selectedFriends.length} selecionados)
            </label>

            {friends.length === 0 ? (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-8 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 dark:text-gray-400">
                  Você ainda não tem amigos na rede
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Indique amigos para criar comunidades privadas com eles
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                {friends.map((friend) => {
                  const isSelected = selectedFriends.includes(friend.id);
                  return (
                    <button
                      key={friend.id}
                      onClick={() => toggleFriend(friend.id)}
                      className={`w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                        isSelected ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                      }`}
                    >
                      <div className="relative w-10 h-10 flex-shrink-0">
                        {friend.avatar_url ? (
                          <Image
                            src={friend.avatar_url}
                            alt={friend.full_name}
                            fill
                            className="rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <span className="flex-1 text-left text-sm font-medium text-gray-900 dark:text-white">
                        {friend.full_name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-purple-600 border-purple-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-6 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim() || selectedFriends.length === 0}
            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Criando...' : 'Criar Comunidade'}
          </button>
        </div>
      </div>
    </div>
  );
}
