'use client';

import { useState } from 'react';
import { ProtocoloHormonal } from '@/types';
import { Syringe, Calendar, FileText, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRealtimeProtocolos } from '@/hooks/useRealtimeProtocolos';

interface ProtocoloViewProps {
  alunoId: string;
  protocoloAtivo: ProtocoloHormonal | null;
  historico: ProtocoloHormonal[];
}

export default function ProtocoloView({ alunoId, protocoloAtivo: initialProtocoloAtivo, historico: initialHistorico }: ProtocoloViewProps) {
  const [showHistorico, setShowHistorico] = useState(false);
  const [selectedProtocolo, setSelectedProtocolo] = useState<ProtocoloHormonal | null>(null);

  // Hook de realtime
  const { protocolos, protocoloAtivo } = useRealtimeProtocolos(alunoId, initialHistorico);

  return (
    <div className="space-y-6">
      {/* Protocolo Ativo */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Syringe size={24} className="text-purple-600" />
            Protocolo Atual
          </h2>
          {protocoloAtivo && (
            <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-sm font-semibold rounded-full">
              Ativo
            </span>
          )}
        </div>

        {protocoloAtivo ? (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {protocoloAtivo.title}
              </h3>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Calendar size={16} />
                  Criado em {format(new Date(protocoloAtivo.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                {protocoloAtivo.updated_at !== protocoloAtivo.created_at && (
                  <span className="flex items-center gap-1">
                    <FileText size={16} />
                    Atualizado em {format(new Date(protocoloAtivo.updated_at), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-gray-900 dark:text-gray-100 font-sans text-sm leading-relaxed">
                {protocoloAtivo.content}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Syringe size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Nenhum protocolo ativo no momento
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Aguarde seu coach enviar seu protocolo hormonal personalizado
            </p>
          </div>
        )}
      </div>

      {/* Histórico */}
      {protocolos.length > 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <button
            onClick={() => setShowHistorico(!showHistorico)}
            className="w-full flex items-center justify-between mb-4"
          >
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FileText size={24} className="text-gray-600 dark:text-gray-400" />
              Histórico de Protocolos ({protocolos.length})
            </h2>
            <ChevronRight
              size={20}
              className={`text-gray-400 transition-transform ${
                showHistorico ? 'rotate-90' : ''
              }`}
            />
          </button>

          {showHistorico && (
            <div className="space-y-3">
              {protocolos.map((protocolo) => (
                <div
                  key={protocolo.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    protocolo.active
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                  onClick={() => setSelectedProtocolo(selectedProtocolo?.id === protocolo.id ? null : protocolo)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        {protocolo.title}
                        {protocolo.active && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white text-xs rounded-full">
                            Ativo
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {format(new Date(protocolo.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className={`text-gray-400 transition-transform self-end sm:self-center ${
                        selectedProtocolo?.id === protocolo.id ? 'rotate-90' : ''
                      }`}
                    />
                  </div>

                  {selectedProtocolo?.id === protocolo.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 font-sans text-sm leading-relaxed">
                        {protocolo.content}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
