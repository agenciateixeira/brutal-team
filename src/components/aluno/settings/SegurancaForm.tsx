'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Shield, Eye, EyeOff, Loader2, Key } from 'lucide-react';
import Toast from '@/components/ui/Toast';

interface SegurancaFormProps {
  userEmail: string;
  userId: string;
}

export default function SegurancaForm({ userEmail, userId }: SegurancaFormProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  const supabase = createClient();

  const handleChangePassword = async () => {
    try {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setToast({ type: 'error', message: 'Preencha todos os campos' });
        return;
      }

      if (newPassword !== confirmPassword) {
        setToast({ type: 'error', message: 'As senhas não coincidem' });
        return;
      }

      if (newPassword.length < 6) {
        setToast({ type: 'error', message: 'A senha deve ter no mínimo 6 caracteres' });
        return;
      }

      setChangingPassword(true);

      // Supabase update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setToast({ type: 'success', message: 'Senha alterada com sucesso!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Erro ao alterar senha:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleChangeEmail = async () => {
    try {
      if (!newEmail) {
        setToast({ type: 'error', message: 'Digite o novo email' });
        return;
      }

      if (!newEmail.includes('@')) {
        setToast({ type: 'error', message: 'Email inválido' });
        return;
      }

      setChangingEmail(true);

      // Supabase update email (will send confirmation email)
      const { error } = await supabase.auth.updateUser({
        email: newEmail,
      });

      if (error) throw error;

      setToast({
        type: 'info',
        message: 'Email de confirmação enviado! Verifique sua caixa de entrada.',
      });
      setNewEmail('');
    } catch (error: any) {
      console.error('Erro ao alterar email:', error);
      setToast({ type: 'error', message: `Erro: ${error.message}` });
    } finally {
      setChangingEmail(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Change Password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Lock size={24} className="text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alterar Senha
          </h3>
        </div>

        <div className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Senha Atual
            </label>
            <div className="relative">
              <Lock size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Digite sua senha atual"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showCurrentPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <Key size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (min. 6 caracteres)"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <Key size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirme a nova senha"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleChangePassword}
            disabled={changingPassword}
            className={`w-full px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              changingPassword ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {changingPassword ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Alterando...
              </>
            ) : (
              'Alterar Senha'
            )}
          </button>
        </div>
      </div>

      {/* Change Email */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={24} className="text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Alterar Email
          </h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Atual
            </label>
            <input
              type="email"
              value={userEmail}
              disabled
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Novo Email
            </label>
            <div className="relative">
              <Mail size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Digite o novo email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleChangeEmail}
            disabled={changingEmail}
            className={`w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              changingEmail ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {changingEmail ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Enviando...
              </>
            ) : (
              'Alterar Email'
            )}
          </button>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Um email de confirmação será enviado para o novo endereço
          </p>
        </div>
      </div>

      {/* 2FA Section */}
      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-gray-800 dark:to-gray-900 rounded-xl border border-green-200 dark:border-gray-700 p-6">
        <div className="flex items-start gap-3 mb-4">
          <Shield size={24} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Autenticação em Dois Fatores (2FA)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Adicione uma camada extra de segurança à sua conta usando um aplicativo autenticador
            </p>
            <button
              className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors opacity-50 cursor-not-allowed"
              disabled
            >
              Em Breve
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>

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
