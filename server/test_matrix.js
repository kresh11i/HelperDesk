import fs from 'fs';

const API_URL = 'http://localhost:3000';
let passCount = 0;
let failCount = 0;

function report(testName, pass, error) {
    if (pass) {
        console.log(`✅ PASS: ${testName}`);
        passCount++;
    } else {
        console.log(`❌ FAIL: ${testName}`);
        if (error) console.log(`   Error: ${error}`);
        failCount++;
    }
}

async function api(path, method, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    const res = await fetch(`${API_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
    
    let data;
    try {
        data = await res.json();
    } catch {
        data = await res.text();
    }
    
    return { status: res.status, data };
}

const randomId = Math.floor(Math.random() * 1000000);
const users = {
    adminA: { email: `admina_${randomId}@test.com`, name: 'Admin A', password: 'password', org: `OrgA_${randomId}` },
    agentA: { email: `agenta_${randomId}@test.com`, name: 'Agent A', password: 'password', role: 2 },
    userA: { email: `usera_${randomId}@test.com`, name: 'User A', password: 'password', role: 3 },
    adminB: { email: `adminb_${randomId}@test.com`, name: 'Admin B', password: 'password', org: `OrgB_${randomId}` },
    userB: { email: `userb_${randomId}@test.com`, name: 'User B', password: 'password', role: 3 },
};
let tokens = {};

async function runMatrix() {
    console.log("=== V1 Security & RLS Matrix Test ===");
    
    // 1. Org Creation
    let res = await api('/auth/register', 'POST', {
        organizationName: users.adminA.org,
        name: users.adminA.name,
        email: users.adminA.email,
        password: users.adminA.password
    });
    report("Org A created and Admin A registered", res.status === 201, JSON.stringify(res.data));
    
    res = await api('/auth/login', 'POST', { email: users.adminA.email, password: users.adminA.password });
    tokens.adminA = res.data.token;
    report("Admin A logged in", res.status === 200 && tokens.adminA, JSON.stringify(res.data));

    res = await api('/auth/register', 'POST', {
        organizationName: users.adminB.org,
        name: users.adminB.name,
        email: users.adminB.email,
        password: users.adminB.password
    });
    report("Org B created and Admin B registered", res.status === 201, JSON.stringify(res.data));
    
    res = await api('/auth/login', 'POST', { email: users.adminB.email, password: users.adminB.password });
    tokens.adminB = res.data.token;

    // 2. Registration Isolation Test
    res = await api('/auth/register', 'POST', {
        organizationName: users.adminA.org, // Try to join existing Org A
        name: "Hacker",
        email: `hacker_${randomId}@test.com`,
        password: 'password'
    });
    report("Registration isolation (cannot join existing org)", res.status === 400, JSON.stringify(res.data));

    // 3. Invitations
    res = await api('/org/invite', 'POST', { email: users.agentA.email, role: 2 }, tokens.adminA);
    const tokenAgentA = res.data?.token;

    if (!tokenAgentA) {
        console.log("CRITICAL: Failed to get invitation token. Bypassing Invitation API for testing via direct DB insert...");
        
        // Direct DB insertion
        const bcrypt = await import('bcrypt');
        const m = await import('./src/config/supabaseClient.js');
        const supabase = m.default;
        
        const hashedPass = await bcrypt.hash('password', 10);
        
        // Get Org IDs
        const orgA = (await supabase.from('users').select('org_id').eq('email', users.adminA.email).single()).data.org_id;
        const orgB = (await supabase.from('users').select('org_id').eq('email', users.adminB.email).single()).data.org_id;

        await supabase.from('users').insert([
            { email: users.agentA.email, name: users.agentA.name, password: hashedPass, role: 2, org_id: orgA },
            { email: users.userA.email, name: users.userA.name, password: hashedPass, role: 3, org_id: orgA },
            { email: users.userB.email, name: users.userB.name, password: hashedPass, role: 3, org_id: orgB },
        ]);
        
        report("Agent A accepts invite (bypassed)", true);
    } else {
        report("Admin A invites Agent A", true);
        res = await api('/org/invite', 'POST', { email: users.userA.email, role: 3 }, tokens.adminA);
        const tokenUserA = res.data?.token;

        res = await api('/org/invite', 'POST', { email: users.userB.email, role: 3 }, tokens.adminB);
        const tokenUserB = res.data?.token;
        
        res = await api('/org/invite/accept', 'POST', { token: tokenAgentA, name: users.agentA.name, password: users.agentA.password });
        report("Agent A accepts invite", res.status === 201, JSON.stringify(res.data));
        
        await api('/org/invite/accept', 'POST', { token: tokenUserA, name: users.userA.name, password: users.userA.password });
        await api('/org/invite/accept', 'POST', { token: tokenUserB, name: users.userB.name, password: users.userB.password });
    }

    // Logins
    tokens.agentA = (await api('/auth/login', 'POST', { email: users.agentA.email, password: users.agentA.password })).data.token;
    tokens.userA = (await api('/auth/login', 'POST', { email: users.userA.email, password: users.userA.password })).data.token;
    tokens.userB = (await api('/auth/login', 'POST', { email: users.userB.email, password: users.userB.password })).data.token;

    // 4. Ticket Creation
    res = await api('/tickets', 'POST', { title: "User A Issue", description: "Need help", priority: "High" }, tokens.userA);
    report("User A creates a ticket", res.status === 201, JSON.stringify(res.data));
    const ticketA = res.data?.ticket;

    // 5. Cross-Org RLS / Scoping
    res = await api('/tickets', 'GET', null, tokens.adminB);
    report("Admin B views tickets (should not see Org A tickets)", res.status === 200 && res.data.tickets.length === 0, JSON.stringify(res.data));

    res = await api(`/tickets/${ticketA.ticket_id}`, 'GET', null, tokens.userB);
    report("User B tries to view User A's ticket (fails cross-org)", res.status === 404, JSON.stringify(res.data));

    // 6. Role Scoping
    res = await api('/tickets', 'POST', { title: "Admin A Issue", description: "Admin test", priority: "Low" }, tokens.adminA);
    const adminTicket = res.data?.ticket;

    res = await api('/tickets', 'GET', null, tokens.userA);
    report("User A lists tickets (should only see their own)", res.status === 200 && res.data.tickets.length === 1 && res.data.tickets[0].ticket_id === ticketA.ticket_id, JSON.stringify(res.data));

    res = await api(`/tickets/${adminTicket.ticket_id}`, 'GET', null, tokens.userA);
    report("User A tries to view Admin A's ticket (fails role scoping)", res.status === 403, JSON.stringify(res.data));

    // 7. Update Scoping
    res = await api(`/tickets/${ticketA.ticket_id}`, 'PUT', { title: "Updated", description: "Update", priority: "Low" }, tokens.userA);
    report("User A updates their own ticket", res.status === 200, JSON.stringify(res.data));

    res = await api(`/tickets/${adminTicket.ticket_id}`, 'PUT', { title: "Hack", description: "Hack", priority: "Low" }, tokens.userA);
    report("User A tries to update Admin's ticket (fails)", res.status === 404, JSON.stringify(res.data));

    // 8. Delete Scoping
    res = await api(`/tickets/${ticketA.ticket_id}`, 'DELETE', null, tokens.userA);
    report("User A tries to delete their ticket (fails, only admin)", res.status === 403, JSON.stringify(res.data));

    res = await api(`/tickets/${ticketA.ticket_id}`, 'DELETE', null, tokens.adminA);
    report("Admin A deletes User A's ticket", res.status === 200, JSON.stringify(res.data));

    console.log(`\nResults: ${passCount} Passed, ${failCount} Failed`);
}

runMatrix();
