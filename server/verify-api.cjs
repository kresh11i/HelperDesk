require('dotenv').config({path: '.env'});
const { createClient } = require('@supabase/supabase-js');
const { removeMember } = require('./src/services/orgServices.js');

const s = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function verifyPhase2_Bug28() {
    console.log("=== Verifying BUG #28 (Remove Member) ===");
    
    // 1. Get an org with an Admin and an Agent
    const admin = await s.from('users').select('*').eq('role', 1).not('org_id', 'is', null).limit(1).single();
    if(admin.data) {
        const agent = await s.from('users').select('*').eq('role', 2).eq('org_id', admin.data.org_id).limit(1).single();
        if(agent.data) {
            console.log(`Testing removal of Agent (${agent.data.name}) by Admin (${admin.data.name})`);
            
            // Assign a ticket to the agent to verify unassignment
            const ticket = await s.from('tickets').select('*').eq('org_id', admin.data.org_id).limit(1).single();
            if (ticket.data) {
                await s.from('tickets').update({ assigned_to: agent.data.user_id }).eq('ticket_id', ticket.data.ticket_id);
            }

            // Call the service
            const res = await removeMember(agent.data.user_id, admin.data.user_id, admin.data.org_id, admin.data.role);
            console.log("Remove member status:", res.status, res.message);
            
            if (res.status === 200) {
                // Verify user role and org are null
                const updatedAgent = await s.from('users').select('*').eq('user_id', agent.data.user_id).single();
                console.log("Updated Agent org_id:", updatedAgent.data.org_id, "| role:", updatedAgent.data.role);
                
                if (ticket.data) {
                    const updatedTicket = await s.from('tickets').select('*').eq('ticket_id', ticket.data.ticket_id).single();
                    console.log("Updated Ticket assigned_to:", updatedTicket.data.assigned_to);
                }
            }
        }
    }
}
verifyPhase2_Bug28().catch(console.error);
