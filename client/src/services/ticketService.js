import api from './api';

export const fetchTickets = async () => {
  const response = await api.get('/tickets');
  return response.data;
};

export const fetchTicketById = async (id) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data;
};

export const createTicket = async (ticketData) => {
  // ticketData has { title, description, priority }
  const response = await api.post('/tickets', ticketData);
  return response.data;
};

export const updateTicket = async (id, updatedData) => {
  const response = await api.put(`/tickets/${id}`, updatedData);
  return response.data;
};

export const deleteTicket = async (id) => {
  const response = await api.delete(`/tickets/${id}`);
  return response.data;
};

export const assignTicket = async (id, assignedToUserId) => {
  const response = await api.patch(`/tickets/${id}/assign`, { assigned_to: assignedToUserId });
  return response.data;
};

export const updateTicketStatus = async (id, status, currentStatus, userRole) => {
  // Map lowercase to PascalCase expected by backend
  let backendStatus = '';
  const cleanStatus = status?.toLowerCase();
  
  if (cleanStatus === 'open') {
    backendStatus = 'Open';
  } else if (cleanStatus === 'assigned') {
    backendStatus = 'Assigned';
  } else if (cleanStatus === 'in progress') {
    backendStatus = 'In Progress';
  } else if (cleanStatus === 'closed' || cleanStatus === 'resolved') {
    const currentStatusClean = currentStatus?.toLowerCase();
    // If ticket is in Progress (or earlier) and needs to be resolved/closed:
    // Backend transition requires it to go to Resolved first, and then to Closed.
    if (currentStatusClean === 'in progress' || currentStatusClean === 'assigned' || currentStatusClean === 'open') {
      backendStatus = 'Resolved';
    } else {
      backendStatus = 'Closed';
    }
  } else if (cleanStatus === 'reopened') {
    backendStatus = 'Reopened';
  } else {
    backendStatus = status.charAt(0).toUpperCase() + status.slice(1);
  }

  const response = await api.patch(`/tickets/${id}/status`, { status: backendStatus });
  return response.data;
};
