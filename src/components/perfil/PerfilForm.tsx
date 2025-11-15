'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile } from '@/types';
import { User, Mail, Save, Phone, Camera, Trash2, ExternalLink, Download, Gift, Users, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface ReferrerInfo {
  name: string;
  email: string;
  code: string;
}

interface ReferralStats {
  user_id: string;
  full_name: string;
  referral_code: string;
  active_referrals: number;
  pending_referrals: number;
  total_referrals: number;
  discount_percentage: number;
  has_full_discount: boolean;
}

interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string | null;
  referral_code: string;
  referred_email: string | null;
  referred_name: string | null;
  status: 'pending' | 'active' | 'cancelled' | 'expired';
  discount_applied: boolean;
  created_at: string;
  activated_at: string | null;
}

interface PerfilFormProps {
  profile: Profile;
  referrerInfo?: ReferrerInfo | null;
  stats?: ReferralStats | null;
  myReferrals?: Referral[];
}

export default function PerfilForm({ profile, referrerInfo, stats, myReferrals = [] }: PerfilFormProps) {
  const [fullName, setFullName] = useState(profile.full_name || '');
  const [phoneNumber, setPhoneNumber] = useState(profile.phone_number || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setMessage(null);

      if (!e.target.files || e.target.files.length === 0) {
        return;
      }

      const file = e.target.files[0];

      // Validar tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: 'A foto deve ter no máximo 5MB' });
        return;
      }

      // Validar tipo do arquivo
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Apenas imagens são permitidas' });
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      console.log('📤 Iniciando upload da foto:', fileName);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('❌ Erro no upload:', uploadError);

        // Verificar se o bucket não existe
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          setMessage({
            type: 'error',
            text: '❌ Bucket "avatars" não encontrado! Execute o arquivo supabase-create-avatars-bucket.sql no Supabase.'
          });
        } else {
          setMessage({ type: 'error', text: `Erro: ${uploadError.message}` });
        }
        return;
      }

      console.log('✅ Upload concluído com sucesso');

      // Get public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);

      setAvatarUrl(data.publicUrl);
      setMessage({ type: 'success', text: '✅ Foto carregada! Clique em "Salvar Alterações" para confirmar.' });
    } catch (error: any) {
      console.error('❌ Erro inesperado:', error);
      setMessage({ type: 'error', text: error.message || 'Erro ao fazer upload da foto' });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone_number: phoneNumber,
          avatar_url: avatarUrl
        })
        .eq('id', profile.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      router.refresh();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao atualizar perfil' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setMessage(null);

    try {
      // Chamar API route para deletar conta
      const response = await fetch('/api/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao excluir conta');
      }

      // Fazer logout
      await supabase.auth.signOut();

      // Redirecionar para página de login
      router.push('/login?deleted=true');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao excluir conta' });
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportData = async () => {
    try {
      setExporting(true);
      setMessage(null);

      const response = await fetch('/api/export-data', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Erro ao exportar dados');
      }

      // Criar blob e fazer download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brutal-team-dados-${profile.id}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setMessage({ type: 'success', text: 'Dados exportados com sucesso!' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erro ao exportar dados' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            {avatarUrl ? (
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary-500">
                <Image
                  src={avatarUrl}
                  alt="Avatar"
                  width={96}
                  height={96}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-3xl font-bold border-4 border-primary-500">
                {fullName?.[0]?.toUpperCase() || profile.email[0].toUpperCase()}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 p-2 bg-primary-500 hover:bg-primary-600 text-white rounded-full shadow-lg transition-colors disabled:opacity-50"
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          {uploading && (
            <p className="text-sm text-primary-600 dark:text-primary-400">
              Carregando foto...
            </p>
          )}
        </div>

        {message && (
          <div
            className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Nome Completo */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <User size={18} />
            Nome Completo
          </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="Digite seu nome"
          />
        </div>

        {/* Email (somente leitura) */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Mail size={18} />
            Email
          </label>
          <input
            type="email"
            value={profile.email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 cursor-not-allowed"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            O email não pode ser alterado
          </p>
        </div>

        {/* Telefone */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Phone size={18} />
            Telefone
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            placeholder="(00) 00000-0000"
          />
        </div>

        {/* Role Badge */}
        <div>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tipo de Conta
          </label>
          <span
            className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
              profile.role === 'coach'
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
            }`}
          >
            {profile.role === 'coach' ? 'Coach' : 'Aluno'}
          </span>
        </div>

        {/* Botão Salvar */}
        <button
          type="submit"
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save size={20} />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </form>

      {/* Seção de Indicação - Quem me indicou */}
      {referrerInfo && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Gift size={18} className="text-primary-600 dark:text-primary-400" />
            Você foi indicado por
          </h3>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <User size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {referrerInfo.name}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {referrerInfo.email}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full font-medium">
                    Código: {referrerInfo.code}
                  </span>
                  <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle size={14} />
                    10% OFF aplicado
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Seção de Indicações - Quem eu indiquei */}
      {myReferrals.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <Users size={18} className="text-primary-600 dark:text-primary-400" />
            Suas Indicações ({myReferrals.length})
          </h3>

          {stats && stats.discount_percentage > 0 && (
            <div className="mb-4 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Seu desconto atual</p>
                  <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400">
                    {stats.discount_percentage}% OFF
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Indicações ativas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.active_referrals}/10
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {myReferrals.map((referral) => (
              <div
                key={referral.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {referral.referred_name || referral.referred_email || 'Aguardando cadastro'}
                  </p>
                  {referral.referred_email && referral.referred_name && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {referral.referred_email}
                    </p>
                  )}
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full font-medium ${
                    referral.status === 'active'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                  }`}
                >
                  {referral.status === 'active' ? 'Ativo' : 'Pendente'}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              💡 <strong>Dica:</strong> Acesse a página de{' '}
              <Link href="/aluno/indicacao" className="underline font-semibold hover:text-blue-900 dark:hover:text-blue-200">
                Indicação
              </Link>
              {' '}para compartilhar seu código e ganhar mais descontos!
            </p>
          </div>
        </div>
      )}

      {/* Links de Termos e Privacidade */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Informações Legais
        </h3>
        <div className="flex flex-col gap-2">
          <Link
            href="/termos-de-uso"
            target="_blank"
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <ExternalLink size={16} />
            Termos de Uso
          </Link>
          <Link
            href="/politica-de-privacidade"
            target="_blank"
            className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            <ExternalLink size={16} />
            Política de Privacidade
          </Link>
        </div>
      </div>

      {/* Exportação de Dados (LGPD) */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Seus Dados
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Baixe uma cópia de todos os seus dados armazenados na plataforma (LGPD).
        </p>
        <button
          type="button"
          onClick={handleExportData}
          disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <Download size={18} />
          {exporting ? 'Exportando...' : 'Baixar Meus Dados'}
        </button>
      </div>

      {/* Zona de Perigo - Exclusão de Conta */}
      <div className="mt-6 pt-6 border-t border-red-200 dark:border-red-900">
        <h3 className="text-sm font-semibold text-red-700 dark:text-red-400 mb-2">
          Zona de Perigo
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          A exclusão da conta é permanente e não pode ser desfeita. Todos os seus dados serão removidos.
        </p>
        <button
          type="button"
          onClick={() => setShowDeleteConfirm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          Excluir Minha Conta
        </button>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                <Trash2 size={24} className="text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Excluir Conta
              </h3>
            </div>

            <div className="mb-6 space-y-3">
              <p className="text-gray-700 dark:text-gray-300 font-semibold">
                Tem certeza que deseja excluir sua conta?
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Esta ação é <strong className="text-red-600 dark:text-red-400">permanente e irreversível</strong>.
                Todos os seus dados serão excluídos, incluindo:
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                <li>Perfil e informações pessoais</li>
                <li>Histórico de treinos e refeições</li>
                <li>Dietas e protocolos</li>
                <li>Conversas do chat</li>
                <li>Todos os outros dados associados</li>
              </ul>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">
                Você não poderá recuperar estes dados após a exclusão.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? (
                  <>Excluindo...</>
                ) : (
                  <>
                    <Trash2 size={18} />
                    Sim, Excluir
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
