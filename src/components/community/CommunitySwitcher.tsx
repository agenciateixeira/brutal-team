'use client';

import { useState } from 'react';
import { Users, Plus, ChevronDown, Globe, Lock } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  type: 'public' | 'private';
  member_count?: number;
}

interface CommunitySwitcherProps {
  communities: Community[];
  currentCommunityId: string;
  onSwitch: (communityId: string) => void;
  onCreateNew: () => void;
}

export default function CommunitySwitcher({
  communities,
  currentCommunityId,
  onSwitch,
  onCreateNew,
}: CommunitySwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentCommunity = communities.find((c) => c.id === currentCommunityId);

  return (
    <div className="relative">
      {/* Botão Principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        <div className="flex items-center gap-2 flex-1">
          {currentCommunity?.type === 'public' ? (
            <Globe className="w-5 h-5 text-primary-600" />
          ) : (
            <Lock className="w-5 h-5 text-purple-600" />
          )}
          <div className="flex flex-col items-start">
            <span className="font-semibold text-gray-900 dark:text-white text-sm">
              {currentCommunity?.name || 'Selecionar Comunidade'}
            </span>
            {currentCommunity?.member_count && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {currentCommunity.member_count} {currentCommunity.member_count === 1 ? 'membro' : 'membros'}
              </span>
            )}
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu */}
          <div className="absolute top-full left-0 mt-2 w-full md:w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
            {/* Lista de Comunidades */}
            <div className="max-h-64 overflow-y-auto">
              {communities.map((community) => (
                <button
                  key={community.id}
                  onClick={() => {
                    onSwitch(community.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    community.id === currentCommunityId
                      ? 'bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-600'
                      : ''
                  }`}
                >
                  {community.type === 'public' ? (
                    <Globe className="w-5 h-5 text-primary-600 flex-shrink-0" />
                  ) : (
                    <Lock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                  )}
                  <div className="flex-1 text-left">
                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                      {community.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {community.type === 'public' ? 'Comunidade Pública' : 'Comunidade Privada'}
                      {community.member_count && ` · ${community.member_count} membros`}
                    </p>
                  </div>
                  {community.id === currentCommunityId && (
                    <div className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Botão Criar Nova Comunidade */}
            <div className="border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  onCreateNew();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-primary-600 dark:text-primary-400 font-medium"
              >
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="text-sm">Criar Comunidade Privada</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
