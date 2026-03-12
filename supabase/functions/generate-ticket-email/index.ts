// Follow this setup guide to deploy: https://supabase.com/docs/guides/functions/deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  const { record } = await req.json()

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 1. Fetch ALL tickets for the same session to group them
  const { data: allTickets } = await supabase
    .from('tickets')
    .select('*')
    .eq('checkout_session_id', record.checkout_session_id)

  if (!allTickets || allTickets.length === 0) {
    return new Response("No tickets found", { status: 404 })
  }

  // 2. Fetch event details
  const { data: event } = await supabase
    .from('events')
    .select('title, date')
    .eq('id', record.event_id)
    .single()

  const eventName = event?.title || "l'Évènement ITA ARENA"
  const eventDate = event ? new Date(event.date).toLocaleDateString('fr-FR') : ""

  // 3. Prepare Email Content
  const confirmationUrl = `https://ita-arena.vercel.app/checkout/confirmation?session=${record.checkout_session_id}&event=${record.event_id}`

  const ticketsHtml = allTickets.map((t, idx) => `
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #FF5A1F;">
      <p style="margin: 0; font-weight: bold; color: #333;">Ticket #${idx + 1} - ${t.category}</p>
      <p style="margin: 5px 0 0; font-size: 0.9rem; color: #666;">Réf: #${t.ticket_number.toString().padStart(5, '0')}</p>
      <p style="margin: 5px 0 0; font-size: 0.8rem;"><a href="https://ita-arena.vercel.app/checkout/confirmation?session=${t.checkout_session_id}" style="color: #FF5A1F; text-decoration: none;">Télécharger ce PDF</a></p>
    </div>
  `).join('')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: 'ITA ARENA <tickets@votre-domaine.com>', // Replace with your verified domain
      to: [record.user_email],
      subject: `Vos Tickets pour ${eventName} sont prêts (${allTickets.length} ticket${allTickets.length > 1 ? 's' : ''})`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #FF5A1F; text-align: center;">Merci pour votre achat !</h2>
          <p>Bonjour,</p>
          <p>Votre commande pour <strong>${eventName}</strong> (${eventDate}) a été traitée avec succès.</p>
          
          <p>Vous avez acheté <strong>${allTickets.length} ticket(s)</strong>. Voici les détails :</p>

          ${ticketsHtml}

          <div style="text-align: center; margin: 30px 0;">
            <p>Retrouvez tous vos billets sur votre page de confirmation sécurisée :</p>
            <a href="${confirmationUrl}" style="display: inline-block; background-color: #FF5A1F; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Voir tous mes Billets (PDF)</a>
          </div>
          
          <p style="font-size: 0.8rem; color: #888; text-align: center;">
            Important : Présentez vos QR codes à l'entrée de l'événement pour validation.
          </p>
          
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
