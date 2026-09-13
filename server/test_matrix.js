import fs from 'fs';

const API_URL = 'http://localhost:3000';
let passCount = 0;
let failCount = 0;
let blockedCount = 0;

function report(testName, status, error, responseStr) {
    if (status === 'PASS') {
        console.log(`✅ PASS: ${testName}`);
        passCount++;
    } else if (status === 'FAIL') {
        console.log(`❌ FAIL: ${testName}`);
        if (error) console.log(`   Expected: ${error.expected || 'Success'}, Received: ${error.received}`);
        if (responseStr) console.log(`   Response: ${responseStr}`);
        failCount++;
    } else if (status === 'BLOCKED') {
        console.log(`⚠️  BLOCKED: ${testName}`);
        if (error) console.log(`   Reason: ${error}`);
        blockedCount++;
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
    adminA: { email: `admina_${randomId}@test.com`, name: 'Admin A', password: 'password123', org: `OrgA_${randomId}` },
    agentA: { email: `agenta_${randomId}@test.com`, name: 'Agent A', password: 'password123', role: 2 },
    userA: { email: `usera_${randomId}@test.com`, name: 'User A', password: 'password123', role: 3 },
    adminB: { email: `adminb_${randomId}@test.com`, name: 'Admin B', password: 'password123', org: `OrgB_${randomId}` },
    userB: { email: `userb_${randomId}@test.com`, name: 'User B', password: 'password123', role: 3 },
};
let tokens = {};
let state = {
    invitationsWorking: true,
    orgACreated: false,
    orgBCreated: false,
    agentAJoined: false,
    userAJoined: false,
    userBJoined: false,
    ticketACreated: false,
};

async function runMatrix() {
    console.log("=== V1 Security & RLS Matrix Test ===");
    console.log(`Test ID: ${randomId}\n`);

    // ==========================================
    // AUTH
    // ==========================================
    console.log("--- AUTH ---");
    // 1. User registration
    let res = await api('/auth/register', 'POST', {
        name: users.adminA.name,
        email: users.adminA.email,
        password: users.adminA.password
    });
    let pass = res.status === 201;
    report("1. User registration", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));

    // 2. Login
    res = await api('/auth/login', 'POST', { email: users.adminA.email, password: users.adminA.password });
    tokens.adminA = res.data?.token;
    pass = res.status === 200 && tokens.adminA;
    report("2. Login", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status }, JSON.stringify(res.data));

    // 3. Invalid authentication rejection
    res = await api('/auth/login', 'POST', { email: users.adminA.email, password: 'wrongpassword' });
    pass = res.status === 400 || res.status === 401;
    report("3. Invalid authentication rejection", pass ? 'PASS' : 'FAIL', { expected: '400/401', received: res.status }, JSON.stringify(res.data));

    // Setup Admin B
    await api('/auth/register', 'POST', { name: users.adminB.name, email: users.adminB.email, password: users.adminB.password });
    tokens.adminB = (await api('/auth/login', 'POST', { email: users.adminB.email, password: users.adminB.password })).data?.token;

    // ==========================================
    // ORGANIZATION
    // ==========================================
    console.log("\n--- ORGANIZATION ---");
    // 4. Organization creation
    if (tokens.adminA) {
        res = await api('/org/create', 'POST', { organizationName: users.adminA.org }, tokens.adminA);
        pass = res.status === 201 && res.data?.token;
        if (pass) {
            tokens.adminA = res.data.token; // Update token with new org_id and role
            state.orgACreated = true;
        }
        report("4. Organization creation", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));
    } else {
        report("4. Organization creation", 'BLOCKED', "Admin A not logged in");
    }

    if (tokens.adminB) {
        res = await api('/org/create', 'POST', { organizationName: users.adminB.org }, tokens.adminB);
        if (res.status === 201 && res.data?.token) {
            tokens.adminB = res.data.token;
            state.orgBCreated = true;
        }
    }

    // 5. Existing organization membership (already created, trying again)
    if (state.orgACreated) {
        res = await api('/org/create', 'POST', { organizationName: `NewOrg_${randomId}` }, tokens.adminA);
        pass = res.status === 403 || res.status === 409;
        report("5. Existing organization membership rejection", pass ? 'PASS' : 'FAIL', { expected: '403/409', received: res.status }, JSON.stringify(res.data));
    } else {
        report("5. Existing organization membership rejection", 'BLOCKED', "Org A not created");
    }

    // 6. Organization isolation
    if (state.orgACreated) {
        res = await api('/org/create', 'POST', { organizationName: users.adminA.org }, tokens.adminB);
        pass = res.status === 400 || res.status === 403 || res.status === 409; // name collision or already in org
        report("6. Organization isolation", pass ? 'PASS' : 'FAIL', { expected: '400/409', received: res.status }, JSON.stringify(res.data));
    } else {
        report("6. Organization isolation", 'BLOCKED', "Org A not created");
    }

    // ==========================================
    // INVITATION
    // ==========================================
    console.log("\n--- INVITATION ---");
    let inviteTokenAgentA, inviteTokenUserA, inviteTokenUserB;
    
    // 7. Admin creates invitation
    if (state.orgACreated) {
        res = await api('/org/invite', 'POST', { email: users.agentA.email, role: 2 }, tokens.adminA);
        pass = res.status === 201;
        inviteTokenAgentA = res.data?.token;
        if (!pass) state.invitationsWorking = false;
        report("7. Admin creates invitation", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));
    } else {
        report("7. Admin creates invitation", 'BLOCKED', "Org A not created");
        state.invitationsWorking = false;
    }

    // 8. Invitation token is returned
    if (state.orgACreated && state.invitationsWorking) {
        pass = !!inviteTokenAgentA;
        report("8. Invitation token is returned", pass ? 'PASS' : 'FAIL', { expected: 'token string', received: inviteTokenAgentA ? 'string' : 'undefined' });
    } else {
        report("8. Invitation token is returned", 'BLOCKED', "Admin invitation failed");
    }

    // 9. Recipient accepts invitation
    if (state.invitationsWorking && inviteTokenAgentA) {
        await api('/auth/register', 'POST', { name: users.agentA.name, email: users.agentA.email, password: users.agentA.password });
        tokens.agentA = (await api('/auth/login', 'POST', { email: users.agentA.email, password: users.agentA.password })).data?.token;
        
        if (tokens.agentA) {
            res = await api('/org/invite/accept', 'POST', { token: inviteTokenAgentA }, tokens.agentA);
            pass = res.status === 201;
            if (pass) {
                tokens.agentA = res.data?.token; // new token with org_id and role
                state.agentAJoined = true;
            }
            report("9. Recipient accepts invitation", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));
        } else {
            report("9. Recipient accepts invitation", 'BLOCKED', "Recipient login failed");
        }
    } else {
        report("9. Recipient accepts invitation", 'BLOCKED', "Invitation creation failed or token missing");
    }

    // 10. Recipient gets correct org_id & 11. Recipient gets intended role
    if (state.agentAJoined) {
        res = await api('/org/team', 'GET', null, tokens.agentA);
        if (res.status === 200) {
            const me = res.data?.data?.find(u => u.email === users.agentA.email);
            report("10. Recipient gets correct org_id (implied by team access)", me ? 'PASS' : 'FAIL', { expected: 'In team list', received: me ? 'Found' : 'Not found' });
            report("11. Recipient gets intended role", me?.role === 2 ? 'PASS' : 'FAIL', { expected: 2, received: me?.role });
        } else {
            report("10. Recipient gets correct org_id", 'FAIL', { expected: 200, received: res.status });
            report("11. Recipient gets intended role", 'FAIL', { expected: 200, received: res.status });
        }
    } else {
        report("10. Recipient gets correct org_id", 'BLOCKED', "Recipient acceptance failed");
        report("11. Recipient gets intended role", 'BLOCKED', "Recipient acceptance failed");
    }

    // 12. Invalid/expired/incorrect invitation is rejected
    if (state.agentAJoined) {
        res = await api('/org/invite/accept', 'POST', { token: inviteTokenAgentA }, tokens.agentA);
        pass = res.status === 404 || res.status === 400 || res.status === 409;
        report("12. Invalid/expired/incorrect invitation is rejected", pass ? 'PASS' : 'FAIL', { expected: '400/404/409', received: res.status }, JSON.stringify(res.data));
    } else {
        report("12. Invalid/expired/incorrect invitation is rejected", 'BLOCKED', "Recipient acceptance failed");
    }

    // Setup remaining users if possible
    if (state.invitationsWorking && state.orgACreated && state.orgBCreated) {
        inviteTokenUserA = (await api('/org/invite', 'POST', { email: users.userA.email, role: 3 }, tokens.adminA)).data?.token;
        await api('/auth/register', 'POST', { name: users.userA.name, email: users.userA.email, password: users.userA.password });
        tokens.userA = (await api('/auth/login', 'POST', { email: users.userA.email, password: users.userA.password })).data?.token;
        if (tokens.userA && inviteTokenUserA) {
            let acRes = await api('/org/invite/accept', 'POST', { token: inviteTokenUserA }, tokens.userA);
            if (acRes.status === 201) {
                tokens.userA = acRes.data.token;
                state.userAJoined = true;
            }
        }

        inviteTokenUserB = (await api('/org/invite', 'POST', { email: users.userB.email, role: 3 }, tokens.adminB)).data?.token;
        await api('/auth/register', 'POST', { name: users.userB.name, email: users.userB.email, password: users.userB.password });
        tokens.userB = (await api('/auth/login', 'POST', { email: users.userB.email, password: users.userB.password })).data?.token;
        if (tokens.userB && inviteTokenUserB) {
            let acRes = await api('/org/invite/accept', 'POST', { token: inviteTokenUserB }, tokens.userB);
            if (acRes.status === 201) {
                tokens.userB = acRes.data.token;
                state.userBJoined = true;
            }
        }
    }

    // ==========================================
    // TICKETS
    // ==========================================
    console.log("\n--- TICKETS ---");
    let ticketA;
    // 13. User creates ticket
    if (state.userAJoined) {
        res = await api('/tickets', 'POST', { title: "User A Issue", description: "Need help", priority: "High" }, tokens.userA);
        pass = res.status === 201;
        if (pass) {
            ticketA = res.data?.ticket;
            state.ticketACreated = true;
        }
        report("13. User creates ticket", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));
    } else {
        report("13. User creates ticket", 'BLOCKED', "User A org membership failed");
    }

    // 14. User can see own permitted tickets
    if (state.ticketACreated) {
        res = await api('/tickets', 'GET', null, tokens.userA);
        pass = res.status === 200 && res.data?.tickets?.some(t => t.ticket_id === ticketA.ticket_id);
        report("14. User can see own permitted tickets", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status });
    } else {
        report("14. User can see own permitted tickets", 'BLOCKED', "Ticket A not created");
    }

    // 15. Agent can see organization tickets
    if (state.ticketACreated && state.agentAJoined) {
        res = await api('/tickets', 'GET', null, tokens.agentA);
        pass = res.status === 200 && res.data?.tickets?.some(t => t.ticket_id === ticketA.ticket_id);
        report("15. Agent can see organization tickets", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status });
    } else {
        report("15. Agent can see organization tickets", 'BLOCKED', "Ticket A not created or Agent A membership failed");
    }

    // 16. Cross-org ticket access is rejected
    if (state.ticketACreated && state.userBJoined) {
        res = await api(`/tickets/${ticketA.ticket_id}`, 'GET', null, tokens.userB);
        pass = res.status === 403 || res.status === 404;
        report("16. Cross-org ticket access is rejected", pass ? 'PASS' : 'FAIL', { expected: '403/404', received: res.status }, JSON.stringify(res.data));
    } else {
        report("16. Cross-org ticket access is rejected", 'BLOCKED', "Ticket A not created or User B membership failed");
    }

    // 17. Admin can reassign
    if (state.ticketACreated && state.agentAJoined) {
        let agentA_Id;
        const teamRes = await api('/org/team', 'GET', null, tokens.adminA);
        if (teamRes.status === 200) {
            agentA_Id = teamRes.data?.data?.find(u => u.email === users.agentA.email)?.user_id;
        }
        
        if (agentA_Id) {
            res = await api(`/tickets/${ticketA.ticket_id}/assign`, 'PATCH', { assigned_to: agentA_Id }, tokens.adminA);
            pass = res.status === 200;
            report("17. Admin can reassign", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status }, JSON.stringify(res.data));
        } else {
            report("17. Admin can reassign", 'FAIL', { expected: 'Agent A user_id', received: 'Not found in team' });
        }
    } else {
        report("17. Admin can reassign", 'BLOCKED', "Ticket A not created or Agent A membership failed");
    }

    // 18. Agent can claim eligible ticket
    if (state.userAJoined && state.agentAJoined) {
        // Create a fresh, unassigned ticket for the claim test
        res = await api('/tickets', 'POST', { title: "User A Issue 2", description: "Need more help", priority: "High" }, tokens.userA);
        if (res.status === 201) {
            const ticketC = res.data?.ticket;
            let agentA_Id;
            const teamRes = await api('/org/team', 'GET', null, tokens.adminA);
            if (teamRes.status === 200) {
                agentA_Id = teamRes.data?.data?.find(u => u.email === users.agentA.email)?.user_id;
            }
            
            if (agentA_Id) {
                res = await api(`/tickets/${ticketC.ticket_id}/assign`, 'PATCH', { assigned_to: agentA_Id }, tokens.agentA);
                pass = res.status === 200;
                report("18. Agent can claim eligible ticket", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status }, JSON.stringify(res.data));
            } else {
                report("18. Agent can claim eligible ticket", 'FAIL', { expected: 'Agent A user_id', received: 'Not found in team' });
            }
        } else {
            report("18. Agent can claim eligible ticket", 'FAIL', { expected: 'Ticket creation 201', received: res.status });
        }
    } else {
        report("18. Agent can claim eligible ticket", 'BLOCKED', "User A or Agent A membership failed");
    }

    // 19. Comments work
    if (state.ticketACreated && state.userAJoined) {
        res = await api(`/tickets/${ticketA.ticket_id}/comments`, 'POST', { comment: "Testing comment" }, tokens.userA);
        pass = res.status === 201;
        report("19. Comments work", pass ? 'PASS' : 'FAIL', { expected: 201, received: res.status }, JSON.stringify(res.data));
    } else {
        report("19. Comments work", 'BLOCKED', "Ticket A not created or User A membership failed");
    }

    // 20. Unauthorized actions are rejected
    if (state.ticketACreated && state.userAJoined) {
        res = await api(`/tickets/${ticketA.ticket_id}`, 'DELETE', null, tokens.userA);
        pass = res.status === 403 || res.status === 401;
        report("20. Unauthorized actions are rejected", pass ? 'PASS' : 'FAIL', { expected: '401/403', received: res.status }, JSON.stringify(res.data));
    } else {
        report("20. Unauthorized actions are rejected", 'BLOCKED', "Ticket A not created or User A membership failed");
    }

    // ==========================================
    // MEMBERS
    // ==========================================
    console.log("\n--- MEMBERS ---");
    let targetUserId;
    if (state.agentAJoined) {
        const teamRes = await api('/org/team', 'GET', null, tokens.adminA);
        targetUserId = teamRes.data?.data?.find(u => u.email === users.agentA.email)?.user_id;
    }
    let adminUserId;
    if (state.orgACreated) {
        const teamRes = await api('/org/team', 'GET', null, tokens.adminA);
        adminUserId = teamRes.data?.data?.find(u => u.email === users.adminA.email)?.user_id;
    }

    // 22. Admin cannot remove themselves
    if (adminUserId) {
        res = await api(`/org/member/${adminUserId}`, 'DELETE', null, tokens.adminA);
        pass = res.status === 400 || res.status === 403;
        report("22. Admin cannot remove themselves", pass ? 'PASS' : 'FAIL', { expected: '400/403', received: res.status }, JSON.stringify(res.data));
    } else {
        report("22. Admin cannot remove themselves", 'BLOCKED', "Admin A user_id not found");
    }

    // 23. Admin cannot remove another Admin
    if (state.orgACreated && state.agentAJoined && targetUserId) {
        await api(`/org/member/${targetUserId}/role`, 'PATCH', { role: 1 }, tokens.adminA);
        res = await api(`/org/member/${targetUserId}`, 'DELETE', null, tokens.adminA);
        pass = res.status === 403;
        report("23. Admin cannot remove another Admin", pass ? 'PASS' : 'FAIL', { expected: 403, received: res.status }, JSON.stringify(res.data));
        await api(`/org/member/${targetUserId}/role`, 'PATCH', { role: 2 }, tokens.adminA);
    } else {
        report("23. Admin cannot remove another Admin", 'BLOCKED', "Agent A not joined or user_id not found");
    }

    // 21. Admin can remove eligible member
    if (state.orgACreated && state.agentAJoined && targetUserId) {
        res = await api(`/org/member/${targetUserId}`, 'DELETE', null, tokens.adminA);
        pass = res.status === 200;
        report("21. Admin can remove eligible member", pass ? 'PASS' : 'FAIL', { expected: 200, received: res.status }, JSON.stringify(res.data));
    } else {
        report("21. Admin can remove eligible member", 'BLOCKED', "Agent A not joined or user_id not found");
    }

    // 24. Removed member loses organization access
    if (state.orgACreated && state.agentAJoined && targetUserId) {
        res = await api('/org/team', 'GET', null, tokens.agentA);
        pass = res.status === 403 || res.status === 401;
        report("24. Removed member loses organization access", pass ? 'PASS' : 'FAIL', { expected: '401/403', received: res.status }, JSON.stringify(res.data));
    } else {
        report("24. Removed member loses organization access", 'BLOCKED', "Agent A not removed");
    }

    // 25. Assigned tickets are safely unassigned according to V1 behavior
    if (state.ticketACreated && targetUserId) {
        res = await api(`/tickets/${ticketA.ticket_id}`, 'GET', null, tokens.adminA);
        const ticketAssignedTo = res.data?.ticket?.assigned_to;
        pass = res.status === 200 && ticketAssignedTo === null;
        report("25. Assigned tickets are safely unassigned", pass ? 'PASS' : 'FAIL', { expected: 'assigned_to: null', received: `assigned_to: ${ticketAssignedTo}` });
    } else {
        report("25. Assigned tickets are safely unassigned", 'BLOCKED', "Ticket A not created or Agent A not found");
    }

    console.log(`\nResults: ${passCount} Passed, ${failCount} Failed, ${blockedCount} Blocked`);
}

runMatrix();
