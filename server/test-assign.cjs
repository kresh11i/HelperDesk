require('dotenv').config({path: 'server/.env'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testUpdate() {
  // Find a ticket and an agent
  const { data: ticket } = await s.from('tickets').select('*').limit(1).single();
  const { data: agent } = await s.from('users').select('*').eq('role', 2).limit(1).single();

  if (!ticket || !agent) return console.log('no ticket or agent');

  const { data: updatedTicket, error } = await s
    .from("tickets")
    .update({ assigned_to: agent.user_id, status: "Assigned" })
    .eq("ticket_id", ticket.ticket_id)
    .select("*, assigned_user:users!assigned_to(name)")
    .single();

  console.log("Updated Ticket:", updatedTicket);
}
testUpdate();
