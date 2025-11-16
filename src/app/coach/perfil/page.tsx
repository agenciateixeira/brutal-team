import { redirect } from 'next/navigation';

/**
 * Página antiga de perfil do coach
 * Redireciona para a nova estrutura de configurações
 */
export default function CoachPerfilPage() {
  redirect('/coach/configuracoes');
}
