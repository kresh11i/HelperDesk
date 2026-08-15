// import api from './api'; // MOCKED OUT FOR UI TESTING

const mockTickets = [
  { ticket_id: '1024', title: 'VPN connection unavailable', status: 'open', priority: 'high', assigned_to: 'Alex', created_at: new Date().toISOString() },
  { ticket_id: '1023', title: 'Email sync issue on mobile', status: 'assigned', priority: 'medium', assigned_to: 'Alex', created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
  { ticket_id: '1022', title: 'Request for software access', status: 'open', priority: 'low', assigned_to: null, created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { ticket_id: '1021', title: 'Monitor replacement', status: 'closed', priority: 'medium', assigned_to: 'Sarah', created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
  { ticket_id: '1020', title: 'Password reset request', status: 'closed', priority: 'high', assigned_to: 'System', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
];

const delay = (ms) => new Promise(res => setTimeout(res, ms));

export const fetchTickets = async () => {
  await delay(800);
  return { status: 200, tickets: mockTickets };
};

export const fetchTicketById = async (id) => {
  await delay(500);
  const ticket = mockTickets.find(t => t.ticket_id === id);
  return { status: 200, ticket };
};

export const createTicket = async (ticketData) => {
  await delay(800);
  return { status: 201, ticket: { ticket_id: Math.floor(Math.random() * 10000).toString(), ...ticketData, status: 'open' } };
};

export const updateTicket = async (id, updatedData) => {
  await delay(500);
  return { status: 200, ticket: { ticket_id: id, ...updatedData } };
};

export const deleteTicket = async (id) => {
  await delay(500);
  return { status: 200, message: "Deleted" };
};

export const assignTicket = async (id, assignedTo) => {
  await delay(500);
  return { status: 200, ticket: { ticket_id: id, assigned_to: assignedTo, status: 'assigned' } };
};

export const updateTicketStatus = async (id, status) => {
  await delay(500);
  return { status: 200, ticket: { ticket_id: id, status } };
};
