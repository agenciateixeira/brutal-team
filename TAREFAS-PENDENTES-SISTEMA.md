# 📋 Lista de Tarefas Pendentes - Sistema Brutal Team

## 🔴 URGENTE - Execute Primeiro

### 1. ✅ **Corrigir RLS Upload de Fotos**
**Status**: Script atualizado, precisa executar
**Ação**: Execute `supabase/fix-storage-rls-first-access.sql` no Supabase SQL Editor

O script foi atualizado para aceitar 3 formatos de upload:
- `first-access/{aluno_id}/foto.jpg` (fotos de primeiro acesso)
- `weekly-photos/{aluno_id}/foto.jpg` (fotos semanais - novo formato)
- `{aluno_id}/foto.jpg` (formato antigo - retrocompatibilidade)

---

## 🟡 EM DESENVOLVIMENTO

### 2. **Exibir Código de Primeiro Acesso no Perfil do Aluno (para o Coach)**

**O que fazer**:
- ✅ Página `coach/aluno/[id]/page.tsx` já busca o código
- ⏳ Atualizar componente `AlunoDetails.tsx` para receber e exibir:
  - `accessCode` - código de 8 caracteres
  - `anamneseResponse` - respostas do questionário
  - `firstAccessPhotos` - 3 fotos do primeiro acesso

**Onde exibir**:
- Na aba "Perfil" do aluno
- Card com:
  - Código de 8 caracteres
  - Status (ativo/usado/expirado)
  - Data de criação
  - Data de uso (se já foi usado)

**Regra importante**: O código SÓ expira DEPOIS que o aluno fizer login e usar ele (não antes!)

---

### 3. **Exibir Respostas do Questionário no Perfil**

**O que fazer**:
- ✅ Dados já sendo buscados
- ⏳ Criar seção "Anamnese" na aba Perfil com todas as 16 perguntas e respostas:

**Perguntas do questionário**:
1. E-mail, Nome, Idade, Altura, Peso
2. Medidas (cintura, braço, perna)
3. Profissão, rotina de trabalho, estuda
4. Pratica atividade física, modalidades, horários de sono
5. Trajetória e objetivos
6. Tempo de treino, resultados estagnados, percepção de pump, uso de esteroides

---

### 4. **Salvar Fotos de Primeiro Acesso no Histórico**

**O que fazer**:
- Quando aluno envia as 3 fotos do primeiro acesso, salvar também em `progress_photos`
- Marcar como "Semana 0" ou "Primeiro Acesso"
- Adicionar campo `is_first_access: true` para diferenciar

**Estrutura**:
```sql
ALTER TABLE progress_photos ADD COLUMN IF NOT EXISTS is_first_access BOOLEAN DEFAULT FALSE;

-- Quando salvar fotos de primeiro acesso, também inserir em progress_photos:
INSERT INTO progress_photos (aluno_id, photo_url, week_number, notes, is_first_access)
VALUES
  (aluno_id, front_url, 0, 'Foto frontal - primeiro acesso', true),
  (aluno_id, side_url, 0, 'Foto lateral - primeiro acesso', true),
  (aluno_id, back_url, 0, 'Foto de costas - primeiro acesso', true);
```

---

### 5. **Permitir 3 Fotos Semanais (Frente, Lado, Costa)**

**Arquivos a modificar**:
- `src/components/aluno/PhotoUpload.tsx`
- `src/components/aluno/PhotoUploadFull.tsx`

**Mudanças**:
- Em vez de 1 foto por semana, permitir 3 fotos
- Mesmo esquema do primeiro acesso: frontal, lateral, costas
- Salvar as 3 fotos na tabela `progress_photos`
- Adicionar colunas:

```sql
ALTER TABLE progress_photos
ADD COLUMN IF NOT EXISTS position VARCHAR(10), -- 'front', 'side', 'back'
ADD COLUMN IF NOT EXISTS group_id UUID; -- agrupar as 3 fotos da mesma semana

-- Criar índice
CREATE INDEX IF NOT EXISTS idx_progress_photos_group ON progress_photos(group_id);
```

---

### 6. **Ativar Aluno Automaticamente ao Selecionar Plano**

**Arquivos a modificar**:
- `src/components/coach/PendingApprovals.tsx` (ou similar)
- Lógica de aprovação de aluno

**Mudanças**:
Quando coach seleciona o plano e gera o código:
1. Marcar aluno como `approved = true`
2. Definir campo `subscription_status = 'active'`
3. Gerar código de primeiro acesso
4. **Considerar como "já pago"** (não exigir confirmação de pagamento adicional)

---

### 7. **Ajustar Estilo dos Botões de Dieta/Treino**

**Arquivos a modificar**:
- `src/components/coach/DietaManager.tsx`
- `src/components/coach/TreinoManager.tsx`
- `src/components/coach/ProtocoloManager.tsx`

**Mudanças**:
- Botões de ação (excluir, editar, desativar): cores neutras (cinza)
- Hover: colorido (vermelho para excluir, azul para editar, amarelo para desativar)
- Tags (ativo, quantidade de refeições): estilo consistente, não chamativos

**Exemplo**:
```tsx
// Antes
<button className="bg-red-600 hover:bg-red-700 ...">Excluir</button>

// Depois
<button className="bg-gray-600 hover:bg-red-600 transition-colors ...">Excluir</button>
```

---

## 🟢 FEATURES NOVAS

### 8. **Menu Mobile Fixo Estilo WhatsApp**

**Requisitos**:
- 5 ícones fixos na parte inferior da tela (mobile only)
- Ícones principais:
  1. 📊 Dashboard
  2. 🍎 Dieta
  3. 💪 Treino
  4. 💉 Protocolo
  5. ☰ Menu (hambúrguer - abre demais opções)

**Implementação**:
1. Criar componente `src/components/ui/BottomNavigation.tsx`
2. Adicionar no layout mobile
3. Fixo, não se move ao scrollar
4. Responsivo (apenas mobile/tablet)

**Estrutura**:
```tsx
<nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden z-50">
  <div className="flex justify-around items-center h-16">
    <button>Dashboard</button>
    <button>Dieta</button>
    <button>Treino</button>
    <button>Protocolo</button>
    <button>Menu</button>
  </div>
</nav>
```

---

### 9. **Adicionar Tabelas de Carboidratos ao Sistema**

**Tabelas fornecidas**:
- 20g de carboidratos
- 40g de carboidratos
- 60g de carboidratos
- 80g de carboidratos
- 100g de carboidratos

**O que fazer**:
1. Criar tabela no banco `carb_tables`:
```sql
CREATE TABLE carb_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  amount_grams INT NOT NULL, -- 20, 40, 60, 80, 100
  category VARCHAR(50), -- 'melhores', 'secundarias', 'liquidas'
  food_name TEXT NOT NULL,
  quantity TEXT NOT NULL, -- ex: "65g de arroz parboilizado cozido"
  observations TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

2. Criar página para coach visualizar/editar tabelas
3. Usar nas dietas como referência

---

## 📊 Resumo de Prioridades

### CRÍTICO (fazer agora):
1. ✅ Executar script SQL RLS (urgente!)
2. Exibir código + questionário no perfil do aluno
3. Corrigir erro CORS de e-mail (apareceu nos logs)

### IMPORTANTE (fazer depois):
4. 3 fotos semanais
5. Fotos primeiro acesso no histórico
6. Ativar aluno ao selecionar plano

### MELHORIAS (quando tiver tempo):
7. Estilo botões
8. Menu mobile fixo
9. Tabelas de carboidratos

---

## 🐛 Erros Detectados nos Logs

### Erro CORS - Email API
```
Access to fetch at 'https://news-cmry0k7yy-guilhermes-projects-2870101b.vercel.app/api/send-email.js'
from origin 'https://app.brutalteam.blog.br' has been blocked by CORS policy
```

**Solução**:
- Verificar configuração CORS na API de envio de e-mail
- Ou mover API para dentro do projeto atual (melhor opção)

---

✅ **Execute o script SQL agora e teste o upload de fotos!**
