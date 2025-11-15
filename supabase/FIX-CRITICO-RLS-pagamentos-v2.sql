-- ============================================
-- FIX CRÍTICO: CORRIGIR RLS POLICIES DE PAGAMENTOS
-- Impedir que coaches vejam dados de outros coaches
-- ============================================

-- ============================================
-- 1. CORRIGIR POLICY: payment_history
-- ============================================

-- Remover policy antiga (insegura)
DROP POLICY IF EXISTS "Coaches podem ver pagamentos de seus alunos" ON public.payment_history;

-- Criar policy CORRETA que filtra por alunos do coach
CREATE POLICY "Coaches podem ver pagamentos APENAS de seus alunos"
  ON public.payment_history FOR SELECT
  USING (
    -- Verificar se o aluno do pagamento pertence ao coach logado
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = payment_history.aluno_id
      AND coach_id = auth.uid()
      AND role = 'aluno'
    )
  );

-- Atualizar policy de INSERT também
DROP POLICY IF EXISTS "Coaches podem criar pagamentos" ON public.payment_history;

CREATE POLICY "Coaches podem criar pagamentos APENAS para seus alunos"
  ON public.payment_history FOR INSERT
  WITH CHECK (
    -- Verificar se o aluno pertence ao coach logado
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = aluno_id
      AND coach_id = auth.uid()
      AND role = 'aluno'
    )
  );

-- ============================================
-- 2. CORRIGIR POLICY: student_plans
-- ============================================

-- Verificar se a tabela tem RLS habilitado
ALTER TABLE public.student_plans ENABLE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Coaches podem ver planos" ON public.student_plans;
DROP POLICY IF EXISTS "Coaches podem criar planos" ON public.student_plans;
DROP POLICY IF EXISTS "Coaches podem atualizar planos" ON public.student_plans;

-- Criar policy CORRETA de SELECT
CREATE POLICY "Coaches podem ver planos APENAS de seus alunos"
  ON public.student_plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = student_plans.aluno_id
      AND coach_id = auth.uid()
      AND role = 'aluno'
    )
  );

-- Policy de INSERT
CREATE POLICY "Coaches podem criar planos APENAS para seus alunos"
  ON public.student_plans FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = aluno_id
      AND coach_id = auth.uid()
      AND role = 'aluno'
    )
  );

-- Policy de UPDATE
CREATE POLICY "Coaches podem atualizar planos APENAS de seus alunos"
  ON public.student_plans FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = aluno_id
      AND coach_id = auth.uid()
      AND role = 'aluno'
    )
  );

-- ============================================
-- 3. VERIFICAR SEGURANÇA (TESTE)
-- ============================================

-- Execute estas queries como coach para testar:
-- Deve retornar APENAS pagamentos dos seus alunos:
-- SELECT * FROM payment_history;

-- Deve retornar APENAS planos dos seus alunos:
-- SELECT * FROM student_plans;

-- ============================================
-- RESUMO DAS CORREÇÕES
-- ============================================

-- ✅ payment_history: Agora filtra por coach_id dos alunos
-- ✅ student_plans: Agora filtra por coach_id dos alunos
-- ✅ Policies aplicadas para SELECT, INSERT e UPDATE
-- ✅ Segurança garantida: Um coach NÃO pode mais ver dados de outros coaches
