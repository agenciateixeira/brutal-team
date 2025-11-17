'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layouts/AdminLayout';
import AdminReportsClient from '@/components/admin/AdminReportsClient';
import { Profile } from '@/types';

const ADMIN_EMAIL = 'guilherme@agenciagtx.com.br';

export default function AdminRelatoriosPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<any[]>([]);
  const [coaches, setCoaches] = useState<any[]>([]);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [dataError, setDataError] = useState<string | null>(null);
  const [usingFallbackClient, setUsingFallbackClient] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push('/login');
          return;
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileData?.email !== ADMIN_EMAIL) {
          router.push(profileData?.role === 'coach' ? '/coach/dashboard' : '/aluno/dashboard');
          return;
        }

        setProfile(profileData);

        const response = await fetch('/api/admin/metrics?include=reports', { cache: 'no-store' });
        const payload = await response.json();

        if (!response.ok) {
          const errorMessage = payload.error || 'Erro ao carregar relatórios';
          setDataError(errorMessage);
          setPayments(payload.payments || []);
          setCoaches(payload.coaches || []);
          setAlunos(payload.alunos || []);
          setUsingFallbackClient(Boolean(payload.usingFallbackClient));
          return;
        }

        setPayments(payload.reports?.payments || []);
        setCoaches(payload.reports?.coaches || []);
        setAlunos(payload.reports?.alunos || []);
        setUsingFallbackClient(Boolean(payload.usingFallbackClient));
        setDataError(payload.reportsError || null);
      } catch (error: any) {
        console.error('Erro ao carregar dados:', error);
        setDataError(error.message || 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router, supabase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <AdminLayout profile={profile}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8">
        <AdminReportsClient
          payments={payments}
          coaches={coaches}
          alunos={alunos}
          dataError={dataError}
          usingFallbackClient={usingFallbackClient}
        />
      </div>
    </AdminLayout>
  );
}
