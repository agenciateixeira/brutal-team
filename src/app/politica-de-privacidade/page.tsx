import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Política de Privacidade | Brutal Team',
  description: 'Política de privacidade da plataforma Brutal Team',
};

export default function PoliticaDePrivacidade() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-primary-400 hover:text-primary-300 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Política de Privacidade
          </h1>

          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Introdução
              </h2>
              <p>
                A Brutal Team respeita sua privacidade e está comprometida em proteger seus dados pessoais. Esta Política de Privacidade explica como coletamos, usamos, armazenamos e protegemos suas informações, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Dados Coletados
              </h2>
              <p>
                Coletamos as seguintes categorias de dados:
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                2.1. Dados Cadastrais
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Tipo de usuário (Coach ou Aluno)</li>
                <li>Data e hora de cadastro</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                2.2. Dados de Saúde e Fitness (apenas para alunos)
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Informações sobre treinos realizados</li>
                <li>Informações sobre alimentação e dieta</li>
                <li>Protocolos hormonais (dados sensíveis)</li>
                <li>Resumos semanais de progresso</li>
                <li>Histórico de tracking de refeições e exercícios</li>
              </ul>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-4 mb-2">
                2.3. Dados de Uso da Plataforma
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Histórico de chat com IA</li>
                <li>Logs de acesso</li>
                <li>Interações com a plataforma</li>
                <li>Preferências de configuração</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Finalidade do Tratamento de Dados
              </h2>
              <p>
                Utilizamos seus dados pessoais para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criar e gerenciar sua conta na plataforma</li>
                <li>Conectar coaches e alunos</li>
                <li>Fornecer os serviços de gestão de treinos, dietas e protocolos</li>
                <li>Realizar tracking de progresso e gerar resumos semanais</li>
                <li>Oferecer suporte via chat com IA</li>
                <li>Melhorar nossos serviços e experiência do usuário</li>
                <li>Comunicar atualizações importantes sobre a plataforma</li>
                <li>Cumprir obrigações legais e regulatórias</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Base Legal para Tratamento de Dados
              </h2>
              <p>
                O tratamento de seus dados pessoais é fundamentado nas seguintes bases legais:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Consentimento:</strong> Ao aceitar esta política e criar sua conta</li>
                <li><strong>Execução de contrato:</strong> Para fornecer os serviços solicitados</li>
                <li><strong>Cumprimento de obrigação legal:</strong> Quando exigido por lei</li>
                <li><strong>Legítimo interesse:</strong> Para melhorar nossos serviços e segurança</li>
              </ul>
              <p className="mt-3">
                Para dados sensíveis (informações de saúde), solicitamos seu <strong>consentimento específico</strong>, que pode ser revogado a qualquer momento.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Compartilhamento de Dados
              </h2>
              <p>
                Seus dados podem ser compartilhados nas seguintes situações:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Com seu coach:</strong> Alunos compartilham dados de treinos, dietas e protocolos com seus coaches aprovados</li>
                <li><strong>Provedores de serviços:</strong> Empresas que nos auxiliam na operação da plataforma (hospedagem, banco de dados, IA), sob rígidos acordos de confidencialidade</li>
                <li><strong>Autoridades:</strong> Quando exigido por lei ou ordem judicial</li>
              </ul>
              <p className="mt-3 font-semibold">
                Nunca vendemos seus dados pessoais a terceiros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Armazenamento e Segurança
              </h2>
              <p>
                Implementamos medidas técnicas e organizacionais para proteger seus dados:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criptografia de dados em trânsito e em repouso</li>
                <li>Controles de acesso rigorosos</li>
                <li>Autenticação segura</li>
                <li>Monitoramento de segurança</li>
                <li>Backups regulares</li>
              </ul>
              <p className="mt-3">
                Seus dados são armazenados em servidores seguros e mantidos pelo tempo necessário para cumprir as finalidades descritas nesta política ou conforme exigido por lei.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Seus Direitos (LGPD)
              </h2>
              <p>
                De acordo com a LGPD, você tem os seguintes direitos:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Confirmação e acesso:</strong> Saber se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> Solicitar correção de dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Anonimização, bloqueio ou eliminação:</strong> Solicitar anonimização, bloqueio ou eliminação de dados desnecessários ou excessivos</li>
                <li><strong>Portabilidade:</strong> Solicitar a portabilidade de seus dados a outro fornecedor</li>
                <li><strong>Eliminação:</strong> Solicitar a eliminação de dados tratados com base no consentimento</li>
                <li><strong>Revogação do consentimento:</strong> Revogar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em determinadas situações</li>
              </ul>
              <p className="mt-3">
                Para exercer seus direitos, você pode:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Utilizar a opção de exclusão de conta disponível em seu perfil</li>
                <li>Enviar solicitação para: <a href="mailto:contato@brutalteam.blog.br" className="text-primary-600 hover:text-primary-500 underline">contato@brutalteam.blog.br</a></li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Exclusão de Conta e Dados
              </h2>
              <p>
                Você pode solicitar a exclusão de sua conta e dados a qualquer momento através de seu perfil na plataforma. Ao solicitar a exclusão:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Todos os seus dados pessoais serão permanentemente removidos</li>
                <li>O acesso à plataforma será imediatamente encerrado</li>
                <li>Esta ação é irreversível</li>
                <li>Alguns dados podem ser mantidos de forma anonimizada para fins estatísticos ou conforme exigido por lei</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                9. Cookies e Tecnologias Similares
              </h2>
              <p>
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Manter sua sessão ativa</li>
                <li>Lembrar suas preferências</li>
                <li>Melhorar a performance da plataforma</li>
                <li>Analisar o uso da plataforma</li>
              </ul>
              <p className="mt-3">
                Você pode gerenciar suas preferências de cookies através das configurações do seu navegador.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                10. Uso de IA (Inteligência Artificial)
              </h2>
              <p>
                Nossa plataforma utiliza IA para fornecer suporte através do chat. As mensagens enviadas ao chat podem ser processadas por serviços de IA de terceiros (Google Gemini) para:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Responder dúvidas sobre nutrição e fitness</li>
                <li>Fornecer informações baseadas em seus treinos e dietas</li>
                <li>Melhorar a experiência do usuário</li>
              </ul>
              <p className="mt-3">
                As conversas do chat são armazenadas e associadas à sua conta para histórico e contexto.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                11. Menores de Idade
              </h2>
              <p>
                Nossa plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor, tomaremos medidas para excluir essas informações.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                12. Transferência Internacional de Dados
              </h2>
              <p>
                Seus dados podem ser transferidos e armazenados em servidores localizados fora do Brasil, incluindo serviços de hospedagem e IA. Garantimos que esses fornecedores adotam medidas de segurança adequadas e cumprem as regulamentações de proteção de dados aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                13. Alterações nesta Política
              </h2>
              <p>
                Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre alterações significativas através da plataforma ou por e-mail. Recomendamos que revise esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                14. Encarregado de Dados (DPO)
              </h2>
              <p>
                Para questões relacionadas à proteção de dados, entre em contato com nosso Encarregado de Dados:
              </p>
              <p className="font-medium mt-2">
                Email: <a href="mailto:contato@brutalteam.blog.br" className="text-primary-600 hover:text-primary-500 underline">contato@brutalteam.blog.br</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                15. Autoridade Nacional de Proteção de Dados (ANPD)
              </h2>
              <p>
                Você também pode registrar reclamações junto à Autoridade Nacional de Proteção de Dados (ANPD), órgão responsável pela fiscalização da LGPD no Brasil.
              </p>
              <p className="mt-2">
                Website: <a href="https://www.gov.br/anpd" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:text-primary-500 underline">www.gov.br/anpd</a>
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                16. Contato
              </h2>
              <p>
                Para dúvidas, sugestões ou solicitações relacionadas a esta Política de Privacidade, entre em contato:
              </p>
              <p className="font-medium mt-2">
                Email: <a href="mailto:contato@brutalteam.blog.br" className="text-primary-600 hover:text-primary-500 underline">contato@brutalteam.blog.br</a>
              </p>
            </section>

            <section className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-primary-900 dark:text-primary-300 mb-2">
                Consentimento
              </h3>
              <p className="text-sm text-primary-800 dark:text-primary-200">
                Ao utilizar a plataforma Brutal Team, você declara ter lido, compreendido e concordado com esta Política de Privacidade e com nossos{' '}
                <Link href="/termos-de-uso" className="text-primary-600 hover:text-primary-500 underline font-medium">
                  Termos de Uso
                </Link>
                .
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
