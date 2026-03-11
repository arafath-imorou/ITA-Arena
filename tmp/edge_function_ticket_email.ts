// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  // 1. Fetch event name
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  const { data: event } = await supabase
    .from('events')
    .select('title, date')
    .eq('id', record.event_id)
    .single()

  const eventName = event?.title || "l'Évènement ITA ARENA"
  const eventDate = event ? new Date(event.date).toLocaleDateString('fr-FR') : ""

  // 2. Prepare Email Content
  const confirmationUrl = `https://ita-arena.vercel.app/checkout/confirmation?id=${record.id}`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'ITA ARENA <tickets@votre-domaine.com>', // Remplacez par votre domaine vérifié sur Resend
      to: [record.user_email],
      subject: `Votre Ticket pour ${eventName} est prêt !`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FF5A1F;">Merci pour votre achat !</h2>
          <p>Bonjour,</p>
          <p>Votre ticket pour l'évènement <strong>${eventName}</strong> (${eventDate}) a été généré avec succès.</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Détails du ticket :</strong></p>
            <ul style="list-style: none; padding: 0;">
              <li>Catégorie : ${record.category}</li>
              <li>Montant : ${record.amount} F CFA</li>
              <li>N° du Ticket : #${record.ticket_number.toString().padStart(5, '0')}</li>
            </ul>
          </div>

          <p>Vous pouvez télécharger votre ticket officiel au format PDF en cliquant sur le bouton ci-dessous :</p>
          
          <a href="${confirmationUrl}" style="display: inline-block; background-color: #FF5A1F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Télécharger mon Ticket (PDF)</a>
          
          <p style="margin-top: 30px; font-size: 0.8rem; color: #888;">Si le bouton ne fonctionne pas, copiez ce lien : <br> ${confirmationUrl}</p>
          
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="text-align: center; color: #aaa; font-size: 0.8rem;">ITA ARENA - Votre plateforme d'évènements préférée</p>
        </div>
      `,
    }),
  })

  const data = await res.json()

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })
})
