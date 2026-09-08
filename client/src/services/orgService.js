import api from './api';

export const getTeam = async () => {
    try {
        const response = await api.get('/org/team');
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 500, message: 'Failed to connect to server' };
    }
};

export const inviteUser = async (email, role) => {
    try {
        const response = await api.post('/org/invite', { email, role });
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 500, message: 'Failed to connect to server' };
    }
};

export const acceptInvite = async (token, name, password) => {
    try {
        const response = await api.post('/org/invite/accept', { token, name, password });
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 500, message: 'Failed to connect to server' };
    }
};

export const updateRole = async (userId, newRole) => {
    try {
        const response = await api.patch(`/org/member/${userId}/role`, { role: newRole });
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 500, message: 'Failed to connect to server' };
    }
};

export const removeMember = async (userId) => {
    try {
        const response = await api.delete(`/org/member/${userId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: 500, message: 'Failed to connect to server' };
    }
};

