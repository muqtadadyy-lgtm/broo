// API Client for University Activities Backend
// This file handles all communication with the Python Flask backend

// Auto-detect backend URL based on current location
function getBackendURL() {
    // Check if we're running on a custom URL (from phone/network)
    const currentHost = window.location.hostname;
    const currentPort = window.location.port;
    
    // If accessing from network (not localhost), use the same host with relative path
    if (currentHost !== 'localhost' && currentHost !== '127.0.0.1') {
        return `/api`;
    }
    
    // Default to localhost with correct port
    return '/api';
}

const API_BASE_URL = getBackendURL();

// Helper function to get auth token
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Helper function to make authenticated requests
async function apiRequest(endpoint, options = {}) {
    const token = getAuthToken();

    const isFormData =
        options.body instanceof FormData ||
        (options.headers && options.headers['Content-Type'] === 'multipart/form-data');

    const defaultHeaders = {};
    // Only set JSON content type when we're not sending FormData
    if (!isFormData) {
        defaultHeaders['Content-Type'] = 'application/json';
    }
    
    if (token) {
        defaultHeaders['Authorization'] = `Bearer ${token}`;
    }
    
    const config = {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers
        }
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            
            // Try to get error message from response
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
            
            try {
                const errorData = await response.json();
                if (errorData.message) {
                    errorMessage = errorData.message;
                }
            } catch (e) {
                // If we can't parse JSON, use the default error message
            }
            
            throw new Error(errorMessage);
        }
        
        // Check if response is JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            throw new Error('الخادم غير متاح. تأكد من تشغيل Backend');
        }
        
        const data = await response.json();
        
        if (!response.ok) {
            // Handle JWT expiration
            if (response.status === 401 && data.message && data.message.includes('token')) {
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                throw new Error('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى');
            }
            throw new Error(data.message || 'حدث خطأ في الاتصال بالخادم');
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        // Check for network errors
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            throw new Error('فشل الاتصال بالخادم. تأكد من أن Backend يعمل بشكل صحيح');
        }
        throw error;
    }
}

// ==================== AUTH API ====================

async function apiRegister(userData) {
    try {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiLogin(credentials) {
    try {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
        
        if (response.success && response.token) {
            // Store token and user info
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            
            // تثبيت هوية المستخدم لاستخدامها في نظام المراسلة
            const u = response.user || {};
            const id = u.fullName || u.username || u.email || (u.id ? String(u.id) : 'user');
            localStorage.setItem('currentUserId', id);
            localStorage.setItem('currentUserName', u.fullName || u.username || id);
            if (u.role) {
                localStorage.setItem('userRole', u.role);
            }
        }
        
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

function apiLogout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserName');
    localStorage.removeItem('userRole');
}

function apiGetCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    return userStr ? JSON.parse(userStr) : null;
}

async function apiUpdateProfile(userData) {
    try {
        const response = await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== ADMIN/USERS API ====================

async function apiCreateEmployee(employeeData) {
    try {
        const response = await apiRequest('/users/employee', {
            method: 'POST',
            body: JSON.stringify(employeeData)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiListEmployees() {
    try {
        const response = await apiRequest('/users/employees', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, employees: [] };
    }
}

async function apiDeleteEmployee(employeeId) {
    try {
        const response = await apiRequest(`/users/employees/${employeeId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetAllUsers() {
    try {
        const response = await apiRequest('/users/all', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, users: [] };
    }
}

async function apiDeleteUser(userId) {
    try {
        const response = await apiRequest(`/users/${userId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiUploadImage(imageFile) {
    try {
        const formData = new FormData();
        formData.append('image', imageFile);

        const response = await apiRequest('/upload/image', {
            method: 'POST',
            body: formData,
            headers: {} // Let browser set Content-Type for FormData
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetStudentJoinRequests() {
    try {
        const response = await apiRequest('/student-requests', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, requests: [] };
    }
}

async function apiProcessJoinRequest(requestId, action) {
    try {
        const response = await apiRequest(`/student-requests/${requestId}`, {
            method: 'PUT',
            body: JSON.stringify({ action })
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiApproveAllRequests() {
    try {
        const response = await apiRequest('/student-requests/approve-all', {
            method: 'POST'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiCreateChatRoom(chatRoomData) {
    try {
        console.log('[API CLIENT] Creating chat room with data:', chatRoomData);
        console.log('[API CLIENT] Making request to /chat-rooms');
        
        const response = await apiRequest('/chat-rooms', {
            method: 'POST',
            body: JSON.stringify(chatRoomData)
        });
        
        console.log('[API CLIENT] Chat room creation response:', response);
        return response;
    } catch (error) {
        console.error('[API CLIENT] Error creating chat room:', error);
        return { success: false, message: error.message };
    }
}

async function apiGetChatRooms() {
    try {
        const response = await apiRequest('/chat-rooms/list', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, chatRooms: [] };
    }
}

async function apiJoinChatRoom(roomId) {
    try {
        const response = await apiRequest(`/chat-rooms/${roomId}/join`, {
            method: 'POST',
            body: JSON.stringify({})
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiSendChatMessage(roomId, messageData) {
    try {
        const response = await apiRequest(`/chat-rooms/${roomId}/messages`, {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetChatMessages(roomId) {
    try {
        const response = await apiRequest(`/chat-rooms/${roomId}/messages/list`, {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, messages: [] };
    }
}

async function apiRemoveMemberFromChatRoom(roomId, userId) {
    try {
        const response = await apiRequest(`/chat-rooms/${roomId}/members/${userId}`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== SUPERVISOR MESSAGES ====================

async function apiGetSupervisorMessages(employeeId = null) {
    try {
        const query = employeeId ? `?employeeId=${employeeId}` : '';
        const response = await apiRequest(`/super/messages${query}`, {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, messages: [] };
    }
}

async function apiSendSupervisorMessage(payload) {
    try {
        const response = await apiRequest('/super/messages/send', {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== ACTIVITY API ====================

async function apiGetActivities() {
    try {
        const response = await apiRequest('/activities', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, activities: [] };
    }
}

async function apiRegisterForActivity(activityId) {
    try {
        const response = await apiRequest(`/activities/${activityId}/register`, {
            method: 'POST'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetMyActivityRegistrations() {
    try {
        const response = await apiRequest('/activities/my-registrations', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, registrations: [] };
    }
}

// ==================== APPLICATION API ====================

async function apiSubmitApplication(applicationData) {
    try {
        let options;

        // If applicationData is already a FormData instance, send as-is
        if (applicationData instanceof FormData) {
            options = {
                method: 'POST',
                body: applicationData
            };
        } else {
            // Fallback to JSON (old behaviour)
            options = {
                method: 'POST',
                body: JSON.stringify(applicationData)
            };
        }

        const response = await apiRequest('/applications/submit', options);
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetMyApplications() {
    try {
        const response = await apiRequest('/applications/my-applications', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, applications: [] };
    }
}

async function apiGetAllApplications() {
    try {
        const response = await apiRequest('/applications/all', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, applications: [] };
    }
}

async function apiUpdateApplicationStatus(applicationId, status) {
    try {
        const response = await apiRequest(`/applications/${applicationId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status })
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiDeleteApplication(applicationId) {
    try {
        const response = await apiRequest(`/applications/${applicationId}/delete`, {
            method: 'DELETE'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetStatistics() {
    try {
        const response = await apiRequest('/applications/statistics', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, statistics: {} };
    }
}

// ==================== EMPLOYEE API ====================

async function apiGetEmployeeActivities() {
    try {
        const response = await apiRequest('/employee/activities', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, activities: [] };
    }
}

// ==================== EMPLOYEE REQUEST API ====================

async function apiSendEmployeeRequest(requestData) {
    try {
        const response = await apiRequest('/employee/requests/send', {
            method: 'POST',
            body: JSON.stringify(requestData)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetEmployeeSentRequests() {
    try {
        const response = await apiRequest('/employee/requests/my-requests', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, requests: [] };
    }
}

async function apiGetEmployeeRequestStatistics() {
    try {
        const response = await apiRequest('/employee/requests/statistics', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, statistics: {} };
    }
}

async function apiGetStudentRequests() {
    try {
        const response = await apiRequest('/student/requests', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, requests: [] };
    }
}

async function apiRespondToEmployeeRequest(requestId, status, responseMessage = '') {
    try {
        const response = await apiRequest(`/student/requests/${requestId}/respond`, {
            method: 'PUT',
            body: JSON.stringify({ status, responseMessage })
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== MESSAGES (APPLICATION CHAT) ====================

async function apiGetMessageThread(applicationId) {
    try {
        const response = await apiRequest(`/messages/thread?applicationId=${applicationId}`, {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message, messages: [] };
    }
}

async function apiSendMessage(applicationId, receiverId, text, file) {
    try {
        let options;

        if (file) {
            const formData = new FormData();
            formData.append('applicationId', applicationId);
            formData.append('text', text);
            if (receiverId) {
                formData.append('receiverId', receiverId);
            }
            formData.append('file', file);

            options = {
                method: 'POST',
                body: formData
            };
        } else {
            const payload = {
                applicationId,
                text
            };
            if (receiverId) {
                payload.receiverId = receiverId;
            }

            options = {
                method: 'POST',
                body: JSON.stringify(payload)
            };
        }

        const response = await apiRequest('/messages', options);
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiGetActiveAnnouncement() {
    try {
        const response = await apiRequest('/announcements/active', {
            method: 'GET'
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiCreateAnnouncement(announcement) {
    try {
        const response = await apiRequest('/announcements', {
            method: 'POST',
            body: JSON.stringify(announcement)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiUpdateAnnouncement(id, announcement) {
    try {
        const response = await apiRequest(`/announcements/${id}`, {
            method: 'PUT',
            body: JSON.stringify(announcement)
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

async function apiToggleAnnouncement(id, active) {
    try {
        const response = await apiRequest(`/announcements/${id}/toggle`, {
            method: 'PATCH',
            body: JSON.stringify({ active })
        });
        return response;
    } catch (error) {
        return { success: false, message: error.message };
    }
}

// ==================== HEALTH CHECK ====================

async function apiHealthCheck() {
    try {
        const response = await fetch(`${API_BASE_URL}/health`);
        return await response.json();
    } catch (error) {
        console.error('Backend connection failed:', error);
        return { status: 'offline', message: 'لا يمكن الاتصال بالخادم' };
    }
}

// Check backend connectivity on page load
window.addEventListener('DOMContentLoaded', async () => {
    const health = await apiHealthCheck();
    if (health.status === 'healthy') {
        console.log('✅ Backend connected successfully');
        console.log(`📡 Backend URL: ${API_BASE_URL}`);
    } else {
        console.warn('⚠️ Backend is offline. Using fallback mode.');
        console.warn('To start backend: cd backend && python app.py');
        console.warn(`Expected backend at: ${API_BASE_URL}`);
    }
});
