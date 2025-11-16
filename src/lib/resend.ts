import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.brutalteam.blog.br'

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount / 100)

const formatBrazilDate = (date: string) =>
  new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo',
  })

export interface WelcomeEmailData {
  studentName: string
  studentEmail: string
  coachName: string
  resetPasswordUrl: string
}

export interface PasswordRecoveryEmailData {
  studentName: string
  studentEmail: string
  recoveryUrl: string
}

export interface PaymentConfirmationEmailData {
  studentName: string
  studentEmail: string
  coachName: string
  amount: number
  interval?: string | null
}

export interface SubscriptionCancellationEmailData {
  studentName: string
  studentEmail: string
  coachName: string
  effectiveDate: string
}

export interface RefundEmailData {
  studentName: string
  studentEmail: string
  coachName: string
  amount: number
  reason?: string | null
}

/**
 * Envia email de boas-vindas com link para definir senha
 */
export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const { studentName, studentEmail, coachName, resetPasswordUrl } = data

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bem-vindo à Brutal Team</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">

          <!-- Header com logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0081A7 0%, #006685 100%); padding: 40px 20px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                Brutal Team
              </h1>
              <p style="margin: 10px 0 0; color: #ffffff; opacity: 0.9; font-size: 16px;">
                Transforme seu corpo, mente e estilo de vida
              </p>
            </td>
          </tr>

          <!-- Conteúdo principal -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 16px; color: #111827; font-size: 24px; font-weight: 600;">
                Bem-vindo, ${studentName}! 🎉
              </h2>

              <p style="margin: 0 0 16px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Parabéns! Sua assinatura foi confirmada e agora você faz parte do time de <strong>${coachName}</strong>.
              </p>

              <p style="margin: 0 0 24px; color: #4b5563; font-size: 16px; line-height: 1.6;">
                Para começar sua jornada, você precisa definir sua senha de acesso à plataforma.
              </p>

              <!-- Botão CTA -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetPasswordUrl}" style="display: inline-block; background: linear-gradient(135deg, #0081A7 0%, #006685 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(0, 129, 167, 0.3);">
                      Definir Minha Senha
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Instruções -->
              <div style="background-color: #f9fafb; border-left: 4px solid #0081A7; padding: 20px; margin: 24px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 12px; color: #111827; font-size: 16px; font-weight: 600;">
                  Próximos Passos:
                </h3>
                <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px; line-height: 1.6;">
                  <li style="margin-bottom: 8px;">Clique no botão acima para criar sua senha</li>
                  <li style="margin-bottom: 8px;">Faça login na plataforma</li>
                  <li style="margin-bottom: 8px;">Complete seu perfil</li>
                  <li>Comece sua transformação! 💪</li>
                </ol>
              </div>

              <p style="margin: 24px 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                <strong>Importante:</strong> Este link expira em 24 horas por questões de segurança. Se precisar de um novo link, entre em contato com seu coach.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; text-align: center;">
                Este email foi enviado porque você se inscreveu na Brutal Team
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} Brutal Team. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `

  const textContent = `
Bem-vindo à Brutal Team, ${studentName}!

Parabéns! Sua assinatura foi confirmada e agora você faz parte do time de ${coachName}.

Para começar sua jornada, você precisa definir sua senha de acesso à plataforma.

Clique no link abaixo para criar sua senha:
${resetPasswordUrl}

Próximos Passos:
1. Clique no link acima para criar sua senha
2. Faça login na plataforma
3. Complete seu perfil
4. Comece sua transformação! 💪

Importante: Este link expira em 24 horas por questões de segurança. Se precisar de um novo link, entre em contato com seu coach.

© ${new Date().getFullYear()} Brutal Team. Todos os direitos reservados.
  `

  try {
    const { data: emailData, error } = await resend.emails.send({
      from: 'Brutal Team <noreply@brutalteam.blog.br>',
      to: [studentEmail],
      subject: `Bem-vindo à Brutal Team! Defina sua senha`,
      html: htmlContent,
      text: textContent,
    })

    if (error) {
      console.error('[Resend] Error sending welcome email:', error)
      throw error
    }

    console.log('[Resend] Welcome email sent successfully:', emailData?.id)
    return { success: true, emailId: emailData?.id }
  } catch (error: any) {
    console.error('[Resend] Failed to send welcome email:', error)
    throw error
  }
}

export async function sendPasswordRecoveryEmail(data: PasswordRecoveryEmailData) {
  const { studentName, studentEmail, recoveryUrl } = data

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Recuperar senha</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:32px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:24px;color:#111827;">Recuperação de Senha</h1>
                <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Olá, ${studentName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
                <p>Recebemos uma solicitação para redefinir a sua senha. Clique no botão abaixo para escolher uma nova senha de acesso.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center">
                      <a href="${recoveryUrl}" style="display:inline-block;padding:14px 32px;background:#0081A7;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;">
                        Redefinir senha
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0 0 12px;">Se você não fez esta solicitação, ignore este email. O link expira em 24 horas por segurança.</p>
                <p style="margin:0;color:#9ca3af;font-size:13px;">Equipe Brutal Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  await resend.emails.send({
    from: 'Brutal Team <noreply@brutalteam.blog.br>',
    to: [studentEmail],
    subject: 'Recupere sua senha - Brutal Team',
    html: htmlContent,
    text: `Olá, ${studentName}. Recebemos uma solicitação para redefinir sua senha. Acesse: ${recoveryUrl}`,
  })
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationEmailData) {
  const { studentName, studentEmail, coachName, amount, interval } = data
  const amountFormatted = formatCurrency(amount)
  const intervalLabel =
    interval === 'year' ? 'ano' : interval === 'week' ? 'semana' : 'mês'

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Pagamento confirmado</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:32px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:24px;color:#111827;">Pagamento confirmado ✅</h1>
                <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Olá, ${studentName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
                <p>Recebemos seu pagamento e a assinatura com o coach <strong>${coachName}</strong> está ativa.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
                  <tr>
                    <td style="padding:16px;font-size:15px;color:#111827;">
                      <strong>Valor:</strong> ${amountFormatted} / ${intervalLabel}
                    </td>
                  </tr>
                </table>
                <p>Acesse a plataforma para atualizar seus dados, receber treinos e falar com seu coach.</p>
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                  <tr>
                    <td align="center">
                      <a href="${APP_URL}/aluno/dashboard" style="display:inline-block;padding:14px 32px;background:#0081A7;color:#fff;text-decoration:none;font-weight:600;border-radius:8px;">Ir para a plataforma</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:0;color:#9ca3af;font-size:13px;">Equipe Brutal Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  await resend.emails.send({
    from: 'Brutal Team <noreply@brutalteam.blog.br>',
    to: [studentEmail],
    subject: 'Pagamento confirmado - Brutal Team',
    html: htmlContent,
    text: `Olá, ${studentName}. Seu pagamento de ${amountFormatted} foi confirmado. Acesse ${APP_URL}/aluno/dashboard para continuar.`,
  })
}

export async function sendSubscriptionCanceledEmail(data: SubscriptionCancellationEmailData) {
  const { studentName, studentEmail, coachName, effectiveDate } = data
  const endDate = formatBrazilDate(effectiveDate)

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Assinatura cancelada</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:32px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:24px;color:#111827;">Assinatura cancelada</h1>
                <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Olá, ${studentName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
                <p>A assinatura com o coach <strong>${coachName}</strong> foi cancelada. Seu acesso permanecerá disponível até <strong>${endDate}</strong>.</p>
                <p>Se isso foi um engano, entre em contato com seu coach para reativar o plano.</p>
                <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Equipe Brutal Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  await resend.emails.send({
    from: 'Brutal Team <noreply@brutalteam.blog.br>',
    to: [studentEmail],
    subject: 'Sua assinatura foi cancelada',
    html: htmlContent,
    text: `Olá, ${studentName}. Sua assinatura com ${coachName} foi cancelada e expira em ${endDate}.`,
  })
}

export async function sendRefundEmail(data: RefundEmailData) {
  const { studentName, studentEmail, coachName, amount, reason } = data
  const amountFormatted = formatCurrency(amount)

  const htmlContent = `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <title>Reembolso processado</title>
  </head>
  <body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#f3f4f6;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;background:#f3f4f6;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.08);overflow:hidden;">
            <tr>
              <td style="padding:32px;border-bottom:1px solid #e5e7eb;">
                <h1 style="margin:0;font-size:24px;color:#111827;">Reembolso confirmado</h1>
                <p style="margin:8px 0 0;color:#6b7280;font-size:14px;">Olá, ${studentName}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#374151;font-size:15px;line-height:1.6;">
                <p>Processamos o reembolso de <strong>${amountFormatted}</strong> referente à sua assinatura com <strong>${coachName}</strong>.</p>
                ${
                  reason
                    ? `<p><strong>Motivo informado:</strong> ${reason}</p>`
                    : ''
                }
                <p>O valor pode levar alguns dias úteis para aparecer em sua fatura dependendo do cartão/banco.</p>
                <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">Equipe Brutal Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `

  await resend.emails.send({
    from: 'Brutal Team <noreply@brutalteam.blog.br>',
    to: [studentEmail],
    subject: 'Reembolso processado - Brutal Team',
    html: htmlContent,
    text: `Olá, ${studentName}. O reembolso de ${amountFormatted} referente ao seu plano com ${coachName} foi processado.`,
  })
}

export default resend
