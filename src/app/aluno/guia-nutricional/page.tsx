import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/ui/Sidebar';
import BottomNavigation from '@/components/ui/BottomNavigation';
import NutritionGuide from '@/components/aluno/NutritionGuide';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function GuiaNutricionalPage() {
  const supabase = createServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (profile?.role !== 'aluno') {
    redirect('/coach/dashboard');
  }

  // Buscar todas as opções de carboidratos
  const { data: carbOptions } = await supabase
    .from('carb_food_options')
    .select('*')
    .order('carb_amount_g', { ascending: true })
    .order('display_order', { ascending: true });

  return (
    <div className="flex h-screen bg-white">
      <Sidebar profile={profile} />

      <main className="flex-1 overflow-y-auto lg:ml-64 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-16 lg:mt-0 pb-24 md:pb-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Guia Nutricional</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Equivalencias de alimentos para suas refeicoes
              </p>
            </div>

            <NutritionGuide carbOptions={carbOptions || []} />
          </div>
        </div>
      </main>

      <BottomNavigation profile={profile} />
    </div>
  );
}
