require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testPayloads() {
  console.log("=== Raw Supabase Payloads ===");
  
  const { data: ticket } = await s.from('tickets').select('*').limit(1).single();
  console.log("Ticket created_at:", JSON.stringify(ticket.created_at));
  console.log("Ticket updated_at:", JSON.stringify(ticket.updated_at));

  const { data: comment } = await s.from('comments').select('*').limit(1).single();
  if (comment) {
    console.log("Comment created_at:", JSON.stringify(comment.created_at));
  } else {
    console.log("No comments found.");
  }
}
testPayloads();
