import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata = {
  title: 'Termos de Uso | Brutal Team',
  description: 'Termos de uso da plataforma Brutal Team',
};

export default function TermosDeUso() {
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
            Termos de Uso
          </h1>

          <div className="prose prose-sm sm:prose dark:prose-invert max-w-none space-y-6 text-gray-700 dark:text-gray-300">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Última atualização: {new Date().toLocaleDateString('pt-BR')}
            </p>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                1. Aceitação dos Termos
              </h2>
              <p>
                Ao acessar e utilizar a plataforma Brutal Team, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concorda com qualquer parte destes termos, não deve utilizar nossa plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                2. Descrição do Serviço
              </h2>
              <p>
                O Brutal Team é uma plataforma de gestão de treinos, dietas e protocolos hormonais que conecta coaches e alunos, permitindo:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Criação e gerenciamento de treinos personalizados</li>
                <li>Elaboração de dietas individualizadas</li>
                <li>Acompanhamento de protocolos hormonais</li>
                <li>Tracking diário de refeições e treinos</li>
                <li>Chat com IA para suporte nutricional e fitness</li>
                <li>Resumos semanais de progresso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                3. Cadastro e Conta de Usuário
              </h2>
              <p>
                Para utilizar nossos serviços, você deve:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Fornecer informações verdadeiras, precisas e completas durante o cadastro</li>
                <li>Manter a confidencialidade de sua senha</li>
                <li>Ser responsável por todas as atividades realizadas em sua conta</li>
                <li>Notificar imediatamente sobre qualquer uso não autorizado de sua conta</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                4. Responsabilidades do Usuário
              </h2>
              <p>
                Ao utilizar a plataforma, você concorda em:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Não utilizar o serviço para fins ilegais ou não autorizados</li>
                <li>Não violar leis locais, estaduais, nacionais ou internacionais</li>
                <li>Não transmitir conteúdo ofensivo, difamatório ou prejudicial</li>
                <li>Não interferir ou interromper o funcionamento da plataforma</li>
                <li>Respeitar os direitos de propriedade intelectual</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                5. Responsabilidade Médica e de Saúde
              </h2>
              <p className="font-semibold text-yellow-700 dark:text-yellow-400">
                ATENÇÃO: A plataforma Brutal Team NÃO substitui orientação médica profissional.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Consulte sempre um médico antes de iniciar qualquer programa de exercícios ou dieta</li>
                <li>Protocolos hormonais devem ser acompanhados por endocrinologista</li>
                <li>A plataforma serve apenas como ferramenta de organização e acompanhamento</li>
                <li>Não nos responsabilizamos por resultados de saúde individuais</li>
                <li>Em caso de dúvidas médicas, procure um profissional de saúde qualificado</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                6. Relação Coach-Aluno
              </h2>
              <p>
                A plataforma facilita a comunicação entre coaches e alunos, mas:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Não mediamos contratos ou pagamentos entre coaches e alunos</li>
                <li>Cada coach é responsável por sua própria conduta profissional</li>
                <li>Verificamos apenas a aprovação de acesso à plataforma</li>
                <li>Não garantimos resultados específicos de treinos ou dietas</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                7. Propriedade Intelectual
              </h2>
              <p>
                Todo o conteúdo da plataforma (textos, gráficos, logos, ícones, imagens, código-fonte) é propriedade do Brutal Team ou de seus fornecedores de conteúdo e está protegido pelas leis de propriedade intelectual brasileiras e internacionais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                8. Privacidade e Proteção de Dados
              </h2>
              <p>
                O uso de seus dados pessoais é regido por nossa{' '}
                <Link href="/politica-de-privacidade" className="text-primary-600 hover:text-primary-500 underline">
                  Política de Privacidade
                </Link>
                , em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei 13.709/2018).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                9. Modificações dos Termos
              </h2>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. As alterações entrarão em vigor imediatamente após sua publicação na plataforma. O uso continuado da plataforma após as modificações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                10. Suspensão e Cancelamento
              </h2>
              <p>
                Podemos suspender ou encerrar sua conta e acesso à plataforma a qualquer momento, sem aviso prévio, por violação destes termos ou por qualquer outro motivo que consideremos apropriado.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                11. Isenção de Garantias
              </h2>
              <p>
                A plataforma é fornecida &quot;como está&quot; e &quot;conforme disponível&quot;, sem garantias de qualquer tipo, expressas ou implícitas. Não garantimos que o serviço será ininterrupto, seguro ou livre de erros.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                12. Limitação de Responsabilidade
              </h2>
              <p>
                Em nenhuma circunstância o Brutal Team será responsável por danos diretos, indiretos, incidentais, especiais ou consequentes resultantes do uso ou incapacidade de usar a plataforma.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                13. Lei Aplicável e Foro
              </h2>
              <p>
                Estes termos serão regidos e interpretados de acordo com as leis da República Federativa do Brasil. Qualquer disputa será resolvida no foro da comarca de Campinas - SP, com exclusão de qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                14. Contato
              </h2>
              <p>
                Para dúvidas sobre estes termos, entre em contato conosco:
              </p>
              <p className="font-medium">
                Email: <a href="mailto:contato@brutalteam.blog.br" className="text-primary-600 hover:text-primary-500 underline">contato@brutalteam.blog.br</a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
