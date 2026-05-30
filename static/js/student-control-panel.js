// Student Control Panel Functions
let studentAnnouncements = [];
let studentUsers = [];
let studentNotifications = [];
let studentImages = [];
let studentVideos = [];
let studentContests = [];
let studentChatRooms = [];
let studentOnlineMembers = [];
let studentCurrentRoom = null;
let studentMessages = [];

// Initialize control panel data
function initializeStudentControlPanel() {
    loadStudentAnnouncements();
    loadStudentUsers();
    loadStudentNotifications();
    loadStudentImages();
    loadStudentVideos();
    loadStudentContests();
    loadStudentChatRooms();
    updateControlPanelCounts();
}

// Announcements Functions
function openStudentAnnouncements() {
    document.getElementById('studentAnnouncementsModal').style.display = 'flex';
    loadStudentAnnouncements();
}

function closeStudentAnnouncements() {
    document.getElementById('studentAnnouncementsModal').style.display = 'none';
}

function loadStudentAnnouncements() {
    // Get only admin-created announcements from the main system
    studentAnnouncements = [];
    
    // Check if there are any admin announcements in the main system
    if (typeof adminAnnouncements !== 'undefined' && adminAnnouncements.length > 0) {
        studentAnnouncements = adminAnnouncements.filter(announcement => 
            announcement.createdBy === 'admin' || 
            announcement.official === true
        );
    }
    
    // If no admin announcements exist, show empty state
    if (studentAnnouncements.length === 0) {
        showEmptyAnnouncementsState();
    } else {
        displayStudentAnnouncements();
    }
}

function displayStudentAnnouncements() {
    const container = document.getElementById('studentAnnouncementsList');
    const filter = document.getElementById('announcementFilter').value;
    
    let filteredAnnouncements = studentAnnouncements;
    if (filter !== 'all') {
        filteredAnnouncements = studentAnnouncements.filter(a => a.type === filter);
    }
    
    container.innerHTML = filteredAnnouncements.map(announcement => `
        <div class="announcement-item ${announcement.type}">
            <div class="announcement-header">
                <h3>${announcement.title}</h3>
                <span class="announcement-date">${formatDate(announcement.date)}</span>
            </div>
            <div class="announcement-content">
                <p>${announcement.content}</p>
            </div>
            <div class="announcement-footer">
                <span class="announcement-author">${announcement.author}</span>
                <span class="announcement-type ${announcement.type}">${getTypeText(announcement.type)}</span>
            </div>
        </div>
    `).join('');
}

function getTypeText(type) {
    const types = {
        'urgent': 'عاجل',
        'academic': 'أكاديمي',
        'events': 'فعاليات',
        'general': 'عام'
    };
    return types[type] || type;
}

function showEmptyAnnouncementsState() {
    const container = document.getElementById('studentAnnouncementsList');
    container.innerHTML = `
        <div class="empty-announcements">
            <div class="empty-icon">
                <i class="fas fa-bullhorn"></i>
            </div>
            <h3>لا توجد إعلانات رسمية</h3>
            <p>لم يقم المدير بنشر أي إعلانات بعد. سيتم عرض الإعلانات الرسمية هنا عند نشرها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض الإعلانات التي ينشرها المدير فقط</p>
            </div>
        </div>
    `;
}

// Users Functions
function openStudentUsers() {
    document.getElementById('studentUsersModal').style.display = 'flex';
    loadStudentUsers();
}

function closeStudentUsers() {
    document.getElementById('studentUsersModal').style.display = 'none';
}

function loadStudentUsers() {
    // Get only real users from the main system
    studentUsers = [];
    
    // Check if there are any real users in the main system
    if (typeof allUsers !== 'undefined' && allUsers.length > 0) {
        studentUsers = allUsers.map(user => ({
            id: user.id,
            name: user.name,
            role: user.role,
            status: user.status === 'active' ? 'online' : 'offline',
            avatar: user.avatar || '/static/images/default-avatar.jpg',
            department: user.department || user.email.split('@')[0]
        }));
    }
    
    // If no real users exist, show empty state
    if (studentUsers.length === 0) {
        showEmptyUsersState();
    } else {
        displayStudentUsers();
    }
}

function displayStudentUsers() {
    const container = document.getElementById('studentUsersList');
    const search = document.getElementById('studentUserSearch').value.toLowerCase();
    const filter = document.getElementById('studentUserFilter').value;
    
    let filteredUsers = studentUsers;
    
    // Apply search filter
    if (search) {
        filteredUsers = filteredUsers.filter(u => 
            u.name.toLowerCase().includes(search) ||
            u.department.toLowerCase().includes(search)
        );
    }
    
    // Apply role filter
    if (filter !== 'all') {
        filteredUsers = filteredUsers.filter(u => {
            if (filter === 'students') return u.role === 'student';
            if (filter === 'staff') return u.role === 'staff';
            if (filter === 'online') return u.status === 'online';
            return true;
        });
    }
    
    container.innerHTML = filteredUsers.map(user => `
        <div class="user-card">
            <div class="user-avatar-section">
                <img src="${user.avatar}" alt="${user.name}" class="user-avatar">
                <div class="status-indicator ${user.status}"></div>
            </div>
            <div class="user-info">
                <h4>${user.name}</h4>
                <p class="user-role">${user.role === 'student' ? 'طالب' : 'موظف'}</p>
                <p class="user-department">${user.department}</p>
            </div>
            <div class="user-actions">
                <button class="action-btn chat-btn" onclick="startChatWithUser(${user.id})" title="محادثة">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function searchStudentUsers() {
    displayStudentUsers();
}

function filterStudentUsers() {
    displayStudentUsers();
}

function showEmptyUsersState() {
    const container = document.getElementById('studentUsersList');
    container.innerHTML = `
        <div class="empty-users">
            <div class="empty-icon">
                <i class="fas fa-users"></i>
            </div>
            <h3>لا توجد مستخدمين</h3>
            <p>لم يتم تسجيل أي مستخدمين في النظام بعد. سيتم عرض المستخدمين المسجلين هنا عند وجودهم.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض المستخدمين المسجلين في النظام فقط</p>
            </div>
        </div>
    `;
}

// Chat Rooms Functions
function openStudentChatRooms() {
    document.getElementById('studentChatRoomsModal').style.display = 'flex';
    loadStudentChatRooms();
}

function closeStudentChatRooms() {
    document.getElementById('studentChatRoomsModal').style.display = 'none';
}

async function loadStudentChatRooms() {
    // Load chat rooms from the API
    try {
        const result = await apiGetChatRooms();
        
        if (result.success && result.chatRooms) {
            // Filter to show only public/official rooms for students
            studentChatRooms = result.chatRooms
                .filter(room => 
                    room.privacy === 'public' || 
                    room.type === 'general' ||
                    room.type === 'official'
                )
                .map(room => ({
                    id: room.id,
                    name: room.name,
                    type: room.type || 'general',
                    members: room.memberCount || 0,
                    lastActivity: room.lastActivity || new Date().toISOString(),
                    unreadCount: 0,
                    description: room.description || '',
                    isMember: room.isMember || false
                }));
        } else {
            studentChatRooms = [];
        }
        
        // If no rooms exist, show empty state
        if (studentChatRooms.length === 0) {
            showEmptyChatRoomsState();
        } else {
            displayStudentChatRooms();
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error loading chat rooms:', error);
        studentChatRooms = [];
        showEmptyChatRoomsState();
    }
}

function showEmptyChatRoomsState() {
    const container = document.getElementById('studentChatRoomsList');
    container.innerHTML = `
        <div class="empty-chat-rooms">
            <div class="empty-icon">
                <i class="fas fa-comments"></i>
            </div>
            <h3>لا توجد كروبات دردشة رسمية</h3>
            <p>لم يقم المدير بإنشاء أي كروبات دردشة بعد. سيتم عرض الكروبات الرسمية هنا عند إنشائها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض الكروبات التي ينشئها المدير فقط</p>
            </div>
        </div>
    `;
}

function displayStudentChatRooms() {
    const container = document.getElementById('studentChatRoomsList');
    
    if (studentChatRooms.length === 0) {
        container.innerHTML = `
            <div class="empty-chat-rooms">
                <div class="empty-icon">
                    <i class="fas fa-comments"></i>
                </div>
                <h3>لا توجد كروبات دردشة رسمية</h3>
                <p>لم يقم المدير بإنشاء أي كروبات دردشة بعد. سيتم عرض الكروبات الرسمية هنا عند إنشائها.</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = studentChatRooms.map(room => `
        <button type="button" class="chat-room-card ${room.isMember ? 'member' : ''}" onclick="openStudentChatRoom(${room.id})">
            <div class="room-icon">
                <i class="fas fa-comments"></i>
            </div>
            <div class="room-info">
                <h4>${room.name}</h4>
                <p>${room.members} عضو</p>
                <span class="last-activity">${formatTime(room.lastActivity)}</span>
                ${room.description ? `<p class="room-description">${room.description}</p>` : ''}
            </div>
            <div class="room-actions">
                ${room.unreadCount > 0 ? `<span class="unread-badge">${room.unreadCount}</span>` : ''}
                <span class="join-btn ${room.isMember ? 'joined' : ''}">${room.isMember ? 'فتح' : 'انضمام'}</span>
            </div>
        </button>
    `).join('');
}

function openStudentChatRoom(roomId) {
    const room = studentChatRooms.find(r => r.id === roomId);
    if (!room) {
        showNotification('الكروب غير موجود', 'error');
        return;
    }

    if (room.isMember) {
        studentCurrentRoom = room;
        openStudentChatInterface();
        closeStudentChatRooms();
        return;
    }

    joinChatRoom(roomId);
}

async function joinChatRoom(roomId) {
    const room = studentChatRooms.find(r => r.id === roomId);
    if (room) {
        // If already a member, just open the chat
        if (room.isMember) {
            studentCurrentRoom = room;
            openStudentChatInterface();
            closeStudentChatRooms();
        } else {
            // Send join request
            try {
                showNotification('جاري إرسال طلب الانضمام...', 'info');
                const result = await apiJoinChatRoom(roomId);
                
                if (result.success) {
                    showNotification('تم إرسال طلب الانضمام بنجاح', 'success');
                    // Reload chat rooms to update status
                    await loadStudentChatRooms();
                } else {
                    showNotification(result.message || 'فشل إرسال طلب الانضمام', 'error');
                }
            } catch (error) {
                console.error('[STUDENT CHAT] Error joining chat room:', error);
                showNotification('حدث خطأ أثناء الانضمام للكروب', 'error');
            }
        }
    }
}

function openStudentChatInterface() {
    document.getElementById('studentChatInterfaceModal').style.display = 'flex';
    initializeStudentChat();
}

function closeStudentChatInterface() {
    document.getElementById('studentChatInterfaceModal').style.display = 'none';
}

async function initializeStudentChat() {
    if (!studentCurrentRoom) {
        showNotification('لم يتم تحديد الكروب', 'error');
        return;
    }
    
    // Load real messages from API
    try {
        const result = await apiGetChatMessages(studentCurrentRoom.id);
        if (result.success && result.messages) {
            studentMessages = result.messages.map(msg => ({
                id: msg.id,
                sender: msg.sender?.fullName || 'مستخدم',
                senderId: msg.sender?.id,
                content: msg.content,
                timestamp: msg.createdAt,
                isOwn: msg.sender?.id === getCurrentUserId(),
                messageType: msg.messageType,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName
            }));
        } else {
            studentMessages = [];
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error loading messages:', error);
        studentMessages = [];
    }
    
    // Load room members
    try {
        const membersResult = await apiGetChatRoomMembers(studentCurrentRoom.id);
        if (membersResult.success && membersResult.members) {
            studentOnlineMembers = membersResult.members.map(member => ({
                id: member.userId,
                name: member.fullName,
                avatar: member.avatar || '/static/images/default-avatar.png',
                status: member.status === 'نشط' ? 'online' : 'offline',
                role: member.role
            }));
        } else {
            studentOnlineMembers = [];
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error loading members:', error);
        studentOnlineMembers = [];
    }
    
    updateStudentRoomInfo();
    displayStudentOnlineMembers();
    displayStudentMessages();
}

function updateStudentRoomInfo() {
    document.getElementById('studentCurrentRoomName').textContent = studentCurrentRoom.name;
    document.getElementById('studentCurrentRoomMembersCount').textContent = studentCurrentRoom.members;
    document.getElementById('studentOnlineMembersCount').textContent = studentOnlineMembers.length;
}

function displayStudentOnlineMembers() {
    const container = document.getElementById('studentMemberStatusList');
    
    container.innerHTML = studentOnlineMembers.map(member => `
        <div class="member-status-item">
            <div class="member-avatar">
                <img src="${member.avatar}" alt="${member.name}">
                <div class="status-indicator ${member.status}"></div>
            </div>
            <div class="member-info">
                <span class="member-name">${member.name}</span>
                <span class="member-status">${member.status === 'online' ? 'متصل' : 'غير متصل'}</span>
            </div>
        </div>
    `).join('');
}

function displayStudentMessages() {
    const container = document.getElementById('studentChatMessages');
    
    container.innerHTML = studentMessages.map(message => `
        <div class="message ${message.isOwn ? 'user-message' : 'other-message'}">
            <div class="message-header">
                <span class="sender-name">${message.sender}</span>
                <span class="message-time">${formatTime(message.timestamp)}</span>
            </div>
            <div class="message-content">${message.content}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    container.scrollTop = container.scrollHeight;
}

async function sendStudentMessage() {
    const input = document.getElementById('studentMessageInput');
    const content = input.value.trim();
    
    if (!content) {
        showNotification('يرجى كتابة رسالة', 'error');
        return;
    }
    
    if (!studentCurrentRoom) {
        showNotification('لم يتم تحديد الكروب', 'error');
        return;
    }
    
    try {
        const result = await apiSendChatMessage(studentCurrentRoom.id, {
            content: content,
            messageType: 'text'
        });
        
        if (result.success) {
            // Add message to local list
            const user = apiGetCurrentUser();
            const newMessage = {
                id: result.message?.id || studentMessages.length + 1,
                sender: user.fullName,
                senderId: user.id,
                content: content,
                timestamp: new Date().toISOString(),
                isOwn: true,
                messageType: 'text'
            };
            
            studentMessages.push(newMessage);
            displayStudentMessages();
            input.value = '';
        } else {
            showNotification(result.message || 'فشل إرسال الرسالة', 'error');
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error sending message:', error);
        showNotification('حدث خطأ أثناء إرسال الرسالة', 'error');
    }
}

function handleStudentMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendStudentMessage();
    }
}

function handleStudentMessageInput() {
    // Handle typing indicator
    const indicator = document.getElementById('studentTypingIndicator');
    indicator.style.display = 'block';
    
    clearTimeout(window.studentTypingTimeout);
    window.studentTypingTimeout = setTimeout(() => {
        indicator.style.display = 'none';
    }, 1000);
}

// Search messages in chat room
async function searchStudentChatMessages() {
    const query = document.getElementById('studentChatSearchInput')?.value?.trim();
    if (!query || query.length < 2) {
        showNotification('يجب إدخال كلمة بحث بطول حرفين على الأقل', 'error');
        return;
    }
    
    if (!studentCurrentRoom) {
        showNotification('لم يتم تحديد الكروب', 'error');
        return;
    }
    
    try {
        const result = await apiSearchChatMessages(studentCurrentRoom.id, query);
        if (result.success && result.results) {
            displaySearchResults(result.results, query);
        } else {
            showNotification(result.message || 'لم يتم العثور على نتائج', 'info');
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error searching messages:', error);
        showNotification('حدث خطأ أثناء البحث', 'error');
    }
}

function displaySearchResults(results, query) {
    const container = document.getElementById('studentChatMessages');
    
    if (results.length === 0) {
        container.innerHTML = `
            <div class="no-search-results">
                <i class="fas fa-search"></i>
                <p>لم يتم العثور على نتائج لـ "${query}"</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <div class="search-results-header">
            <i class="fas fa-search"></i>
            <span>نتائج البحث عن "${query}" (${results.length})</span>
            <button class="clear-search-btn" onclick="initializeStudentChat()">
                <i class="fas fa-times"></i> مسح
            </button>
        </div>
    ` + results.map(msg => `
        <div class="message search-result ${msg.sender?.id === getCurrentUserId() ? 'user-message' : 'other-message'}">
            <div class="message-header">
                <span class="sender-name">${msg.sender?.name || 'مستخدم'}</span>
                <span class="message-time">${formatTime(msg.createdAt)}</span>
            </div>
            <div class="message-content">${highlightSearchTerm(msg.content, query)}</div>
        </div>
    `).join('');
    
    container.scrollTop = 0;
}

function highlightSearchTerm(text, query) {
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// View room statistics
async function viewStudentRoomStats() {
    if (!studentCurrentRoom) {
        showNotification('لم يتم تحديد الكروب', 'error');
        return;
    }
    
    try {
        const result = await apiGetChatRoomStats(studentCurrentRoom.id);
        if (result.success && result.statistics) {
            displayRoomStats(result.statistics);
        } else {
            showNotification(result.message || 'فشل تحميل الإحصائيات', 'error');
        }
    } catch (error) {
        console.error('[STUDENT CHAT] Error loading stats:', error);
        showNotification('حدث خطأ أثناء تحميل الإحصائيات', 'error');
    }
}

function displayRoomStats(stats) {
    const modal = document.createElement('div');
    modal.className = 'modal stats-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content stats-content">
            <div class="modal-header">
                <h2>إحصائيات الكروب</h2>
                <button class="close-btn" onclick="this.closest('.modal').remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="stats-grid">
                <div class="stat-card">
                    <i class="fas fa-users"></i>
                    <div class="stat-value">${stats.members?.total || 0}</div>
                    <div class="stat-label">إجمالي الأعضاء</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-user-shield"></i>
                    <div class="stat-value">${stats.members?.admins || 0}</div>
                    <div class="stat-label">المديرون</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-comments"></i>
                    <div class="stat-value">${stats.messages?.total || 0}</div>
                    <div class="stat-label">إجمالي الرسائل</div>
                </div>
                <div class="stat-card">
                    <i class="fas fa-calendar-day"></i>
                    <div class="stat-value">${stats.messages?.today || 0}</div>
                    <div class="stat-label">رسائل اليوم</div>
                </div>
            </div>
            <div class="top-contributors">
                <h3>أكثر المساهمين</h3>
                ${stats.top_contributors?.length > 0 ? 
                    stats.top_contributors.map(user => `
                        <div class="contributor-item">
                            <span class="contributor-name">${user.name}</span>
                            <span class="contributor-count">${user.messages} رسالة</span>
                        </div>
                    `).join('') : 
                    '<p class="no-contributors">لا توجد بيانات</p>'
                }
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

// Helper function to get current user ID
function getCurrentUserId() {
    const user = apiGetCurrentUser();
    return user?.id;
}

// Helper function to format time
function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'الآن';
    if (diff < 3600000) return `منذ ${Math.floor(diff / 60000)} دقيقة`;
    if (diff < 86400000) return `منذ ${Math.floor(diff / 3600000)} ساعة`;
    
    return date.toLocaleDateString('ar-IQ', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function addStudentEmoji() {
    const input = document.getElementById('studentMessageInput');
    input.value += '😊';
    input.focus();
}

function attachStudentFile() {
    showNotification('ميزة إرفاق الملفات قيد التطوير', 'info');
}

function startChatWithUser(userId) {
    const user = studentUsers.find(u => u.id === userId);
    if (user) {
        studentCurrentRoom = {
            id: 'private_' + userId,
            name: `محادثة مع ${user.name}`,
            members: 2
        };
        openStudentChatInterface();
        closeStudentUsers();
    }
}

// Notifications Functions
function openStudentNotifications() {
    document.getElementById('studentNotificationsModal').style.display = 'flex';
    loadStudentNotifications();
}

function closeStudentNotifications() {
    document.getElementById('studentNotificationsModal').style.display = 'none';
}

async function loadStudentNotifications() {
    // Load notifications from API
    try {
        const result = await apiGetNotifications();
        
        if (result.success && result.notifications) {
            studentNotifications = result.notifications.map(notification => ({
                id: notification.id,
                title: notification.title,
                content: notification.content,
                type: notification.type || 'general',
                read: notification.read || false,
                timestamp: notification.createdAt
            }));
        } else {
            studentNotifications = [];
        }
        
        // If no notifications exist, show empty state
        if (studentNotifications.length === 0) {
            showEmptyNotificationsState();
        } else {
            displayStudentNotifications();
        }
        updateControlPanelCounts();
    } catch (error) {
        console.error('[STUDENT NOTIFICATIONS] Error loading notifications:', error);
        studentNotifications = [];
        showEmptyNotificationsState();
        updateControlPanelCounts();
    }
}

function displayStudentNotifications() {
    const container = document.getElementById('studentNotificationsList');
    const filter = document.getElementById('notificationFilter').value;
    
    let filteredNotifications = studentNotifications;
    if (filter !== 'all') {
        filteredNotifications = studentNotifications.filter(n => {
            if (filter === 'unread') return !n.read;
            if (filter === 'read') return n.read;
            if (filter === 'important') return n.type === 'message';
            return true;
        });
    }
    
    container.innerHTML = filteredNotifications.map(notification => `
        <div class="notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}">
            <div class="notification-icon">
                <i class="fas ${getNotificationIcon(notification.type)}"></i>
            </div>
            <div class="notification-content">
                <h4>${notification.title}</h4>
                <p>${notification.content}</p>
                <span class="notification-time">${formatTime(notification.timestamp)}</span>
            </div>
            <div class="notification-actions">
                ${!notification.read ? `<button class="mark-read-btn" onclick="markNotificationAsRead(${notification.id})">تعيين كمقروء</button>` : ''}
            </div>
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        'message': 'fa-envelope',
        'reminder': 'fa-bell',
        'success': 'fa-check-circle',
        'warning': 'fa-exclamation-triangle'
    };
    return icons[type] || 'fa-info-circle';
}

function markNotificationAsRead(notificationId) {
    const notification = studentNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        displayStudentNotifications();
        updateControlPanelCounts();
    }
}

function markAllNotificationsAsRead() {
    studentNotifications.forEach(n => n.read = true);
    displayStudentNotifications();
    updateControlPanelCounts();
    showNotification('تم تعيين جميع الإشعارات كمقروءة', 'success');
}

function showEmptyNotificationsState() {
    const container = document.getElementById('studentNotificationsList');
    container.innerHTML = `
        <div class="empty-notifications">
            <div class="empty-icon">
                <i class="fas fa-bell"></i>
            </div>
            <h3>لا توجد إشعارات</h3>
            <p>ليس لديك أي إشعارات حالياً. ستظهر الإشعارات الجديدة هنا عند استلامها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> ستتلقى إشعارات عند وجود تحديثات مهمة</p>
            </div>
        </div>
    `;
}

// Images Functions
function openStudentImages() {
    document.getElementById('studentImagesModal').style.display = 'flex';
    loadStudentImages();
}

function closeStudentImages() {
    document.getElementById('studentImagesModal').style.display = 'none';
}

async function loadStudentImages() {
    // Load images from API
    try {
        const result = await apiGetImages();
        
        if (result.success && result.images) {
            studentImages = result.images.map(image => ({
                id: image.id,
                title: image.title || 'صورة',
                url: image.url || image.image_url,
                date: image.createdAt,
                type: image.type || 'general',
                createdBy: image.createdBy || 'النظام'
            }));
        } else {
            studentImages = [];
        }
        
        // If no images exist, show empty state
        if (studentImages.length === 0) {
            showEmptyImagesState();
        } else {
            displayStudentImages();
        }
    } catch (error) {
        console.error('[STUDENT IMAGES] Error loading images:', error);
        studentImages = [];
        showEmptyImagesState();
    }
}

function displayStudentImages() {
    const container = document.getElementById('studentImagesGallery');
    const filter = document.getElementById('imageFilter').value;
    
    let filteredImages = studentImages;
    if (filter !== 'all') {
        filteredImages = studentImages.filter(i => i.type === filter);
    }
    
    container.innerHTML = filteredImages.map(image => `
        <div class="image-card" onclick="viewImage(${image.id})">
            <div class="image-container">
                <img src="${image.url}" alt="${image.title}" class="gallery-image">
            </div>
            <div class="image-info">
                <h4>${image.title}</h4>
                <span class="image-date">${formatDate(image.date)}</span>
            </div>
        </div>
    `).join('');
}

function viewImage(imageId) {
    const image = studentImages.find(i => i.id === imageId);
    if (image) {
        // Open image viewer
        showNotification(`عرض الصورة: ${image.title}`, 'info');
    }
}

function showEmptyImagesState() {
    const container = document.getElementById('studentImagesGallery');
    container.innerHTML = `
        <div class="empty-images">
            <div class="empty-icon">
                <i class="fas fa-images"></i>
            </div>
            <h3>لا توجد صور</h3>
            <p>لم يقم المدير برفع أي صور بعد. سيتم عرض الصور الرسمية هنا عند رفعها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض الصور التي يرفعها المدير فقط</p>
            </div>
        </div>
    `;
}

// Videos Functions
function openStudentVideos() {
    document.getElementById('studentVideosModal').style.display = 'flex';
    loadStudentVideos();
}

function closeStudentVideos() {
    document.getElementById('studentVideosModal').style.display = 'none';
}

async function loadStudentVideos() {
    // Load videos from API
    try {
        const result = await apiGetVideos();
        
        if (result.success && result.videos) {
            studentVideos = result.videos.map(video => ({
                id: video.id,
                title: video.title,
                description: video.description,
                thumbnail: video.thumbnail_url || 'https://via.placeholder.com/300x200?text=Video',
                videoUrl: video.video_url,
                duration: video.duration || '0:00',
                date: video.createdAt,
                type: video.category,
                createdBy: video.createdBy
            }));
        } else {
            studentVideos = [];
        }
        
        // If no videos exist, show empty state
        if (studentVideos.length === 0) {
            showEmptyVideosState();
        } else {
            displayStudentVideos();
        }
    } catch (error) {
        console.error('[STUDENT VIDEOS] Error loading videos:', error);
        studentVideos = [];
        showEmptyVideosState();
    }
}

function displayStudentVideos() {
    const container = document.getElementById('studentVideosGallery');
    const filter = document.getElementById('videoFilter').value;
    
    let filteredVideos = studentVideos;
    if (filter !== 'all') {
        filteredVideos = studentVideos.filter(v => v.type === filter);
    }
    
    container.innerHTML = filteredVideos.map(video => `
        <div class="video-card" onclick="playVideo(${video.id})">
            <div class="video-thumbnail">
                <img src="${video.thumbnail}" alt="${video.title}">
                <div class="play-button">
                    <i class="fas fa-play"></i>
                </div>
                <span class="video-duration">${video.duration}</span>
            </div>
            <div class="video-info">
                <h4>${video.title}</h4>
                <span class="video-date">${formatDate(video.date)}</span>
            </div>
        </div>
    `).join('');
}

function playVideo(videoId) {
    const video = studentVideos.find(v => v.id === videoId);
    if (video) {
        showNotification(`تشغيل الفيديو: ${video.title}`, 'info');
    }
}

function showEmptyVideosState() {
    const container = document.getElementById('studentVideosGallery');
    container.innerHTML = `
        <div class="empty-videos">
            <div class="empty-icon">
                <i class="fas fa-video"></i>
            </div>
            <h3>لا توجد فيديوهات</h3>
            <p>لم يقم المدير برفع أي فيديوهات بعد. سيتم عرض الفيديوهات الرسمية هنا عند رفعها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض الفيديوهات التي يرفعها المدير فقط</p>
            </div>
        </div>
    `;
}

// Contests Functions
function openStudentContests() {
    document.getElementById('studentContestsModal').style.display = 'flex';
    loadStudentContests();
}

function closeStudentContests() {
    document.getElementById('studentContestsModal').style.display = 'none';
}

async function loadStudentContests() {
    // Load contests from API
    try {
        const result = await apiGetContests();
        
        if (result.success && result.contests) {
            // Filter to show only public/active contests for students
            studentContests = result.contests
                .filter(contest => 
                    contest.visibility === 'public' || 
                    contest.status === 'active' ||
                    contest.status === 'upcoming'
                )
                .map(contest => ({
                    id: contest.id,
                    title: contest.name,
                    type: contest.status === 'active' ? 'active' : contest.status === 'upcoming' ? 'upcoming' : 'completed',
                    description: contest.description,
                    deadline: contest.endDate,
                    prize: contest.prize || 'غير محدد',
                    participants: contest.maxParticipants || 0,
                    startDate: contest.startDate,
                    endDate: contest.endDate,
                    eligibility: contest.eligibility,
                    requirements: contest.rules,
                    createdBy: contest.createdBy
                }));
        } else {
            studentContests = [];
        }
        
        // If no contests exist, show empty state
        if (studentContests.length === 0) {
            showEmptyContestsState();
        } else {
            displayStudentContests();
        }
    } catch (error) {
        console.error('[STUDENT CONTESTS] Error loading contests:', error);
        studentContests = [];
        showEmptyContestsState();
    }
}

function displayStudentContests() {
    const container = document.getElementById('studentContestsList');
    const filter = document.getElementById('contestFilter').value;
    
    let filteredContests = studentContests;
    if (filter !== 'all') {
        filteredContests = studentContests.filter(c => c.type === filter);
    }
    
    container.innerHTML = filteredContests.map(contest => `
        <div class="contest-card ${contest.type}">
            <div class="contest-header">
                <h3>${contest.title}</h3>
                <span class="contest-type ${contest.type}">${getContestTypeText(contest.type)}</span>
            </div>
            <div class="contest-content">
                <p>${contest.description}</p>
                <div class="contest-details">
                    <span class="contest-deadline">الموعد النهائي: ${formatDate(contest.deadline)}</span>
                    <span class="contest-prize">الجائزة: ${contest.prize}</span>
                    <span class="contest-participants">المشاركون: ${contest.participants}</span>
                </div>
            </div>
            <div class="contest-actions">
                ${contest.type === 'active' ? '<button class="participate-btn" onclick="participateInContest(' + contest.id + ')">مشاركة</button>' : ''}
                ${contest.type === 'completed' ? '<button class="view-results-btn" onclick="viewContestResults(' + contest.id + ')">عرض النتائج</button>' : ''}
                ${contest.type === 'upcoming' ? '<button class="notify-btn" onclick="notifyMeForContest(' + contest.id + ')">أعلمني عند البدء</button>' : ''}
            </div>
        </div>
    `).join('');
}

function getContestTypeText(type) {
    const types = {
        'active': 'نشطة',
        'upcoming': 'قادمة',
        'completed': 'منتهية'
    };
    return types[type] || type;
}

function participateInContest(contestId) {
    const contest = studentContests.find(c => c.id === contestId);
    if (contest) {
        showNotification(`تم التسجيل في مسابقة: ${contest.title}`, 'success');
        contest.participants++;
        displayStudentContests();
    }
}

function viewContestResults(contestId) {
    const contest = studentContests.find(c => c.id === contestId);
    if (contest) {
        showNotification(`عرض نتائج مسابقة: ${contest.title}`, 'info');
    }
}

function notifyMeForContest(contestId) {
    const contest = studentContests.find(c => c.id === contestId);
    if (contest) {
        showNotification(`سيتم إعلامك عند بدء مسابقة: ${contest.title}`, 'success');
    }
}

function showEmptyContestsState() {
    const container = document.getElementById('studentContestsList');
    container.innerHTML = `
        <div class="empty-contests">
            <div class="empty-icon">
                <i class="fas fa-trophy"></i>
            </div>
            <h3>لا توجد مسابقات</h3>
            <p>لم يقم المدير بإنشاء أي مسابقات بعد. سيتم عرض المسابقات الرسمية هنا عند إنشائها.</p>
            <div class="empty-info">
                <p><i class="fas fa-info-circle"></i> سيتم عرض المسابقات التي ينشئها المدير فقط</p>
            </div>
        </div>
    `;
}

// Utility Functions
function updateControlPanelCounts() {
    document.getElementById('announcementsCount').textContent = studentAnnouncements.length;
    document.getElementById('usersCount').textContent = studentUsers.filter(u => u.status === 'online').length;
    document.getElementById('chatRoomsCount').textContent = studentChatRooms.length;
    document.getElementById('notificationsCount').textContent = studentNotifications.filter(n => !n.read).length;
    document.getElementById('imagesCount').textContent = studentImages.length;
    document.getElementById('videosCount').textContent = studentVideos.length;
    document.getElementById('contestsCount').textContent = studentContests.filter(c => c.type === 'active').length;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ar-SA', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(message, type = 'info') {
    const notification = document.getElementById('notification');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.display = 'block';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Filter functions
function filterAnnouncements() {
    displayStudentAnnouncements();
}

function filterNotifications() {
    displayStudentNotifications();
}

function filterImages() {
    displayStudentImages();
}

function filterVideos() {
    displayStudentVideos();
}

function filterContests() {
    displayStudentContests();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    initializeStudentControlPanel();
});
