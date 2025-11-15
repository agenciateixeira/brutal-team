# LGPD & Compliance

> Sistema completo de conformidade com a Lei Geral de Proteção de Dados

## 📋 Visão Geral

Implementação completa para conformidade com a LGPD (Lei 13.709/2018), incluindo Termos de Uso, Política de Privacidade, consentimento explícito e direito ao esquecimento.

## 📄 Documentos Legais

### 1. Termos de Uso

**URL:** `/termos-de-uso`
**Arquivo:** `src/app/termos-de-uso/page.tsx`

#### Seções Incluídas:
1. Aceitação dos Termos
2. Descrição do Serviço
3. Cadastro e Conta de Usuário
4. Responsabilidades do Usuário
5. Responsabilidade Médica e de Saúde ⚠️
6. Relação Coach-Aluno
7. Propriedade Intelectual
8. Privacidade e Proteção de Dados
9. Modificações dos Termos
10. Suspensão e Cancelamento
11. Isenção de Garantias
12. Limitação de Responsabilidade
13. **Lei Aplicável e Foro: Campinas - SP**
14. Contato: contato@brutalteam.blog.br

#### Avisos Importantes:
```tsx
⚠️ ATENÇÃO: A plataforma Brutal Team NÃO substitui orientação médica profissional.
```

### 2. Política de Privacidade

**URL:** `/politica-de-privacidade`
**Arquivo:** `src/app/politica-de-privacidade/page.tsx`

#### Seções Incluídas:
1. Introdução
2. Dados Coletados
   - Dados Cadastrais
   - Dados de Saúde e Fitness (sensíveis)
   - Dados de Uso da Plataforma
3. Finalidade do Tratamento de Dados
4. Base Legal para Tratamento
5. Compartilhamento de Dados
6. Armazenamento e Segurança
7. **Seus Direitos (LGPD)**
8. Exclusão de Conta e Dados
9. Cookies e Tecnologias Similares
10. Uso de IA (Google Gemini)
11. Menores de Idade
12. Transferência Internacional de Dados
13. Alterações nesta Política
14. Encarregado de Dados (DPO)
15. Autoridade Nacional de Proteção de Dados (ANPD)
16. Contato

## ✅ Sistema de Consentimento

### Checkbox Obrigatório no Cadastro

**Arquivo:** `src/app/cadastro/page.tsx`

```tsx
<div className="flex items-start gap-2">
  <input
    type="checkbox"
    id="acceptTerms"
    checked={acceptedTerms}
    onChange={(e) => setAcceptedTerms(e.target.checked)}
    required
  />
  <label htmlFor="acceptTerms">
    Li e aceito os{' '}
    <Link href="/termos-de-uso" target="_blank">
      Termos de Uso
    </Link>
    {' '}e a{' '}
    <Link href="/politica-de-privacidade" target="_blank">
      Política de Privacidade
    </Link>
  </label>
</div>

<button disabled={!acceptedTerms}>
  Criar Conta
</button>
```

#### Validação:
```tsx
if (!acceptedTerms) {
  setError('Você deve aceitar os Termos de Uso e Política de Privacidade');
  return;
}
```

## 🗑️ Direito ao Esquecimento

### Sistema de Exclusão de Conta

**Arquivo:** `src/components/perfil/PerfilForm.tsx`

#### Interface do Usuário:

```tsx
{/* Zona de Perigo */}
<div className="mt-6 pt-6 border-t border-red-200">
  <h3 className="text-red-700">Zona de Perigo</h3>
  <p>A exclusão da conta é permanente e não pode ser desfeita.</p>

  <button onClick={() => setShowDeleteConfirm(true)}>
    <Trash2 /> Excluir Minha Conta
  </button>
</div>
```

#### Modal de Confirmação:

```tsx
<div className="modal">
  <h3>Excluir Conta</h3>
  <p>Tem certeza que deseja excluir sua conta?</p>

  <p>Esta ação é <strong>permanente e irreversível</strong>.</p>

  <ul>
    <li>Perfil e informações pessoais</li>
    <li>Histórico de treinos e refeições</li>
    <li>Dietas e protocolos</li>
    <li>Conversas do chat</li>
    <li>Todos os outros dados associados</li>
  </ul>

  <p>Você não poderá recuperar estes dados após a exclusão.</p>

  <button onClick={handleDeleteAccount}>
    Sim, Excluir
  </button>
</div>
```

### API de Exclusão

**Arquivo:** `src/app/api/delete-account/route.ts`

#### Dados Deletados (em ordem):

```typescript
1. chat_messages          // Mensagens do chat
2. meal_tracking          // Tracking de refeições
3. workout_tracking       // Tracking de treinos
4. resumos_semanais       // Resumos semanais
5. dietas                 // Dietas
6. treinos                // Treinos
7. protocolos_hormonais   // Protocolos hormonais
8. solicitacoes_acesso    // Solicitações de acesso (aluno)
9. solicitacoes_acesso    // Solicitações de acesso (coach)
10. profiles              // Perfil do usuário
11. auth.users            // Conta de autenticação
```

#### Código:
```typescript
export async function POST() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const userId = session.user.id;

  // Deletar todos os dados relacionados...

  // Deletar usuário do Auth
  await supabaseAdmin.auth.admin.deleteUser(userId);

  return NextResponse.json({ success: true });
}
```

## 📍 Links de Acesso

### Login
- Footer com links para Termos e Política

### Cadastro
- Checkbox obrigatório com links
- Footer com links

### Perfil do Aluno
- Seção "Informações Legais"
- Links para Termos e Política
- Zona de Perigo com exclusão de conta

## 🔒 Direitos do Titular (LGPD)

Conforme Art. 18 da LGPD, o usuário tem direito a:

1. ✅ **Confirmação e acesso** - Ver se tratamos seus dados
2. ✅ **Correção** - Corrigir dados incorretos
3. ✅ **Anonimização/Bloqueio/Eliminação** - Deletar dados
4. ✅ **Portabilidade** - Exportar dados (futuro)
5. ✅ **Eliminação** - Deletar dados tratados com consentimento
6. ✅ **Revogação do consentimento** - Revogar a qualquer momento
7. ✅ **Oposição** - Opor-se ao tratamento

### Como Exercer os Direitos:

1. **Pelo Perfil:** Opção de exclusão de conta
2. **Por Email:** contato@brutalteam.blog.br
3. **ANPD:** www.gov.br/anpd (reclamações)

## 📧 Contatos

### Encarregado de Dados (DPO)
- **Email:** contato@brutalteam.blog.br

### Suporte Geral
- **Email:** contato@brutalteam.blog.br

### ANPD
- **Website:** www.gov.br/anpd

## 🛡️ Segurança Implementada

### Dados em Trânsito
- HTTPS obrigatório
- TLS 1.3

### Dados em Repouso
- Criptografia do Supabase
- Backups automáticos

### Acesso aos Dados
- Row Level Security (RLS)
- Service Role apenas para operações sensíveis
- Logs de acesso

## 📊 Tipos de Dados Tratados

### Dados Pessoais
- Nome completo
- Email
- Telefone
- Foto de perfil

### Dados Sensíveis (Art. 5º, II da LGPD)
- Informações de saúde
- Treinos e exercícios
- Alimentação e dietas
- Protocolos hormonais
- Fotos de progresso

### Dados de Uso
- Histórico de chat
- Logs de acesso
- Interações com a plataforma
- Preferências

## ⚖️ Base Legal

| Dado | Base Legal | Artigo LGPD |
|------|------------|-------------|
| Cadastro | Consentimento | Art. 7º, I |
| Execução de contrato | Execução de contrato | Art. 7º, V |
| Dados de saúde | Consentimento específico | Art. 11, I |
| Melhorias | Legítimo interesse | Art. 7º, IX |
| Obrigações legais | Cumprimento de lei | Art. 7º, II |

## 🔄 Ciclo de Vida dos Dados

```
1. Coleta
   └─> Cadastro com consentimento explícito

2. Processamento
   └─> Uso conforme finalidade informada

3. Armazenamento
   └─> Enquanto necessário ou por obrigação legal

4. Eliminação
   └─> Exclusão de conta ou término do relacionamento
```

## 📝 Registro de Atividades

Conforme Art. 37 da LGPD:

- Operações de tratamento registradas
- Finalidades documentadas
- Bases legais mapeadas
- Compartilhamento documentado
- Medidas de segurança implementadas

## ✅ Checklist de Conformidade

- [x] Termos de Uso
- [x] Política de Privacidade
- [x] Consentimento explícito
- [x] Direito ao esquecimento
- [x] Exclusão completa de dados
- [x] DPO designado
- [x] Informações sobre ANPD
- [x] Foro definido (Campinas - SP)
- [x] Contato disponível
- [x] Links acessíveis
- [x] Linguagem clara
- [x] Dados sensíveis protegidos
- [x] Criptografia implementada
- [x] RLS configurado

---

**Última atualização:** 25/10/2025
**Legislação:** LGPD (Lei 13.709/2018)
**Foro:** Campinas - SP
**Contato:** contato@brutalteam.blog.br
