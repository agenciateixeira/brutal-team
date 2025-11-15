'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { Phone, Mail, Calendar, AlertTriangle, Trash2, Loader2, UserX } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface DadosPessoaisFormProps {
  profile: Profile;
  userEmail: string;
}

export default function DadosPessoaisForm({ profile, userEmail }: DadosPessoaisFormProps) {
  const [phone, setPhone] = useState(profile.phone || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || '');
  const [saving, setSaving] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const supabase = createClient();

  const handleSave = async () => {
    try {
      setSaving(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          phone,
          birth_date: birthDate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setToast({ type: 'success', message: 'Dados atualizados com sucesso!' });
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    try {
      setProcessing(true);

      // Update profile to mark as inactive
      const { error } = await supabase
        .from('profiles')
        .update({
          is_active: false,
          deactivated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      setToast({ type: 'success', message: 'Conta desativada. Redirecionando...' });

      // Sign out after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao desativar:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (confirmText !== 'EXCLUIR MINHA CONTA') {
        setToast({ type: 'error', message: 'Digite exatamente "EXCLUIR MINHA CONTA" para confirmar' });
        return;
      }

      setProcessing(true);

      // Call API to delete account and data
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir conta');
      }

      setToast({ type: 'success', message: 'Conta excluída. Redirecionando...' });

      // Sign out after 2 seconds
      setTimeout(async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
      }, 2000);
    } catch (error: any) {
      console.error('Erro ao excluir:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Informações de Contato
        </h3>

        <div className="space-y-4">
          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Para alterar o email, vá em Senha e Segurança
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Telefone
            </label>
            <div className="relative">
              <Phone size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(00) 00000-0000"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Data de Nascimento
            </label>
            <div className="relative">
              <Calendar size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar Alterações'
            )}
          </button>
        </div>
      </div>

      {/* Account Control */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          Propriedade e Controle da Conta
        </h3>

        <div className="space-y-4">
          {/* Deactivate Account */}
          <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-start gap-3">
              <UserX size={24} className="text-orange-600 dark:text-orange-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Desativar Conta Temporariamente
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Sua conta ficará inativa e você não poderá acessar até reativá-la
                </p>
                <button
                  onClick={() => setShowDeactivateModal(true)}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Desativar Conta
                </button>
              </div>
            </div>
          </div>

          {/* Delete Account */}
          <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <Trash2 size={24} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  Excluir Conta Permanentemente
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Esta ação é irreversível. Todos os seus dados serão excluídos permanentemente
                </p>
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Excluir Conta
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deactivate Modal */}
      {showDeactivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-orange-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Desativar Conta?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Sua conta será temporariamente desativada. Você poderá reativá-la fazendo login novamente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeactivateModal(false)}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeactivate}
                disabled={processing}
                className={`flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  processing ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Processando...
                  </>
                ) : (
                  'Desativar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle size={24} className="text-red-600" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Excluir Conta Permanentemente?
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Esta ação <strong>NÃO PODE SER DESFEITA</strong>. Todos os seus dados, incluindo:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1">
              <li>Progresso e estatísticas</li>
              <li>Fotos de evolução</li>
              <li>Histórico de treinos e dietas</li>
              <li>Posts na comunidade</li>
            </ul>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Para confirmar, digite <strong className="text-red-600">EXCLUIR MINHA CONTA</strong>:
            </p>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Digite aqui"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent mb-6"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText('');
                }}
                disabled={processing}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={processing || confirmText !== 'EXCLUIR MINHA CONTA'}
                className={`flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  processing || confirmText !== 'EXCLUIR MINHA CONTA' ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Excluindo...
                  </>
                ) : (
                  'Excluir Permanentemente'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
