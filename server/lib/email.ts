import nodemailer from 'nodemailer'
import { env } from '../env'

const transporte = env.smtp.url ? nodemailer.createTransport(env.smtp.url) : null

function escapar(t: string) {
  return t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}

export async function enviarEmail(para: string, assunto: string, texto: string, link?: string) {
  const url = link ? `${env.urlBase}${link}` : env.urlBase
  if (!transporte) {
    console.log(`[e-mail] para ${para}: ${assunto} — ${texto} (${url})`)
    return
  }
  try {
    await transporte.sendMail({
      from: env.smtp.remetente,
      to: para,
      subject: assunto,
      text: `${texto}\n\n${url}`,
      html: `<div style="font-family:Arial,sans-serif;background:#0b0d09;color:#f2f7ea;padding:32px">
<p style="font-size:28px;font-weight:900;margin:0 0 16px">KRIÔ</p>
<p style="font-size:16px;line-height:1.5;margin:0 0 24px">${escapar(texto)}</p>
<a href="${url}" style="display:inline-block;background:#a8e063;color:#0b0d09;padding:12px 22px;border-radius:999px;font-weight:700;text-decoration:none">Abrir na KRIÔ</a>
</div>`,
    })
  } catch (e) {
    console.error('[e-mail] falhou', e)
  }
}
