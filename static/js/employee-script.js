let currentUser = null;
let currentUserRole = null;
let allApplications = [];
let currentApplicationId = null;
let employeesList = [];
let currentChatEmployeeId = null;
let currentChatEmployeeName = '';
let employeesSectionVisible = false;

// Check Authentication
window.addEventListener('DOMContentLoaded', () => {
    const user = apiGetCurrentUser();
    currentUser = user;
    currentUserRole = user?.role || null;
    
    if (!user || (user.role !== 'employee' && user.role !== 'super_employee')) {
        window.location.href = 'index.html';
        return;
    }
    
    // تثبيت هوية الموظف في localStorage لاستخدامها في نظام المراسلة
    localStorage.setItem('currentUserId', user.fullName);
    localStorage.setItem('currentUserName', user.fullName);
    localStorage.setItem('userRole', user.role || 'employee');
    
    // Display user name
    document.getElementById('employeeName').textContent = user.fullName;
    // Show create employee button for super employee
    const createBtn = document.getElementById('createEmployeeBtn');
    if (createBtn) {
        createBtn.style.display = (user.role === 'super_employee') ? 'inline-flex' : 'none';
    }
    const manageBtn = document.getElementById('manageEmployeesBtn');
    if (manageBtn) {
        manageBtn.style.display = (user.role === 'super_employee') ? 'inline-flex' : 'none';
    }
    const supervisorInboxBtn = document.getElementById('supervisorInboxBtn');
    if (supervisorInboxBtn) {
        supervisorInboxBtn.style.display = (user.role === 'employee') ? 'inline-flex' : 'none';
    }
    
    // Load theme
    let savedTheme = localStorage.getItem('selectedTheme') || 'blue-light';
    if (savedTheme === 'blue') { savedTheme = 'blue-light'; localStorage.setItem('selectedTheme', 'blue-light'); }
    document.body.className = `dashboard-body theme-${savedTheme}`;
    
    // Load statistics
    updateStatistics();
    
    // Load applications
    loadApplications();

    if (user.role === 'super_employee') {
        loadEmployees();
    }
});

// Theme Management
function changeTheme(theme) {
    document.body.className = `dashboard-body theme-${theme}`;
    localStorage.setItem('selectedTheme', theme);
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    const msg = (typeof translations !== 'undefined' && translations[lang] && translations[lang]['تم تغيير الثيم بنجاح'])
        ? translations[lang]['تم تغيير الثيم بنجاح']
        : 'تم تغيير الثيم بنجاح';
    showNotification(msg, 'success');
}

// Logout
function logout() {
    apiLogout();
    window.location.href = 'index.html';
}

// Helper function to get application by ID
function getApplicationById(applicationId) {
    return allApplications.find(app => app.id == applicationId);
}

// Update Statistics
async function updateStatistics() {
    const apiResult = await apiGetStatistics();
    
    if (apiResult.success && apiResult.statistics) {
        const stats = apiResult.statistics;
        document.getElementById('pendingCount').textContent = stats.pending;
        document.getElementById('approvedCount').textContent = stats.approved;
        document.getElementById('rejectedCount').textContent = stats.rejected;
        document.getElementById('totalCount').textContent = stats.total;
    } else {
        document.getElementById('pendingCount').textContent = '0';
        document.getElementById('approvedCount').textContent = '0';
        document.getElementById('rejectedCount').textContent = '0';
        document.getElementById('totalCount').textContent = '0';
    }
}

// Load and Display Applications
async function loadApplications() {
    console.log('Loading applications...');
    const apiResult = await apiGetAllApplications();
    
    if (apiResult.success && apiResult.applications) {
        allApplications = apiResult.applications;
        console.log('Applications loaded:', allApplications.length, allApplications);
    } else {
        allApplications = [];
        console.log('No applications found or error:', apiResult.message);
    }
    
    filterApplications();
}

function filterApplications() {
    const activityFilter = document.getElementById('activityFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const searchQuery = document.getElementById('searchInput').value.toLowerCase();
    
    let filtered = allApplications;
    
    // Filter by activity type
    if (activityFilter) {
        filtered = filtered.filter(app => app.activityType === activityFilter);
    }
    
    // Filter by status
    if (statusFilter) {
        filtered = filtered.filter(app => app.status === statusFilter);
    }
    
    // Filter by search query
    if (searchQuery) {
        filtered = filtered.filter(app => 
            app.studentName.toLowerCase().includes(searchQuery)
        );
    }
    console.log('Filtered applications:', filtered.length, filtered);
    displayApplications(filtered);
}

function displayApplications(applications) {
    const container = document.getElementById('applicationsList');
    console.log('Displaying applications:', applications.length);
    
    if (applications.length === 0) {
        container.innerHTML = `
            <div class="application-item">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-inbox"></i> لا توجد طلبات
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="application-row clickable-row" data-app-id="${app.id}" role="button" tabindex="0" style="cursor: pointer;">
            <div class="app-row-header">
                <h4><i class="fas fa-user"></i> ${app.studentName}</h4>
                <span class="status-badge status-${app.status === 'قيد الانتظار' ? 'pending' : app.status === 'مقبول' ? 'approved' : 'rejected'}">
                    ${app.status}
                </span>
            </div>
            <div class="app-row-content">
                <div class="app-detail-item">
                    <strong><i class="fas fa-clipboard"></i> نوع النشاط:</strong>
                    ${app.activityType}
                </div>
                <div class="app-detail-item">
                    <strong><i class="fas fa-hashtag"></i> رقم النشاط:</strong>
                    ${app.activityNumber}
                </div>
                <div class="app-detail-item">
                    <strong><i class="fas fa-university"></i> الكلية:</strong>
                    ${app.college}
                </div>
                <div class="app-detail-item">
                    <strong><i class="fas fa-phone"></i> الهاتف:</strong>
                    ${app.phone}
                </div>
                <div class="app-detail-item">
                    <strong><i class="fas fa-calendar"></i> تاريخ التقديم:</strong>
                    ${new Date(app.submittedAt).toLocaleDateString('ar-IQ')}
                </div>
            </div>
        </div>
    `).join('');
    
    // Add event listeners for mobile compatibility
    let touchHandled = false;
    
    console.log('Adding event listeners to', container.querySelectorAll('.clickable-row').length, 'rows');
    
    container.querySelectorAll('.clickable-row').forEach((row, index) => {
        const handleClick = (e) => {
            console.log('Click event on row', index);
            if (touchHandled) {
                touchHandled = false;
                return;
            }
            const appId = row.getAttribute('data-app-id');
            console.log('Row clicked, app ID:', appId);
            showApplicationDetails(appId);
        };
        
        row.addEventListener('touchstart', () => {
            console.log('Touch start on row', index);
            touchHandled = false;
        });
        
        row.addEventListener('touchend', (e) => {
            console.log('Touch end on row', index);
            e.preventDefault();
            touchHandled = true;
            const appId = row.getAttribute('data-app-id');
            console.log('Row touched, app ID:', appId);
            showApplicationDetails(appId);
        });
        
        row.addEventListener('click', handleClick);
    });
}

// Show Application Details
function showApplicationDetails(applicationId) {
    console.log('showApplicationDetails called with ID:', applicationId);
    currentApplicationId = applicationId;
    const app = getApplicationById(applicationId);
    
    if (!app) {
        console.log('Application not found for ID:', applicationId);
        return;
    }
    
    console.log('Application found:', app);
    
    const detailsContent = document.getElementById('applicationDetails');
    detailsContent.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">اسم الطالب:</div>
            <div class="detail-value">${app.studentName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">نوع النشاط:</div>
            <div class="detail-value">${app.activityType}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">رقم النشاط:</div>
            <div class="detail-value">${app.activityNumber}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">الكلية:</div>
            <div class="detail-value">${app.college}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">القسم:</div>
            <div class="detail-value">${app.department}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">التخصص:</div>
            <div class="detail-value">${app.specialization}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">رقم الهاتف:</div>
            <div class="detail-value">${app.phone}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">تفاصيل إضافية:</div>
            <div class="detail-value">${app.details || 'لا توجد تفاصيل إضافية'}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">الحالة:</div>
            <div class="detail-value">
                <span class="status-badge status-${app.status === 'قيد الانتظار' ? 'pending' : app.status === 'مقبول' ? 'approved' : 'rejected'}">
                    ${app.status}
                </span>
            </div>
        </div>
        <div class="detail-row">
            <div class="detail-label">تاريخ التقديم:</div>
            <div class="detail-value">${new Date(app.submittedAt).toLocaleString('ar-IQ')}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">آخر تحديث:</div>
            <div class="detail-value">${new Date(app.updatedAt).toLocaleString('ar-IQ')}</div>
        </div>
        ${app.projectFile ? `
        <div class="detail-row">
            <div class="detail-label">الملف المرفق:</div>
            <div class="detail-value">
                <button class="link-btn" onclick="openPdfViewer('${app.projectFile}','ملف الطلب')">
                    <i class="fas fa-file-pdf"></i> عرض الملف
                </button>
            </div>
        </div>
        ` : ''}
    `;

    const deleteBtn = document.getElementById('deleteApplicationBtn');
    if (deleteBtn) {
        deleteBtn.style.display = (currentUserRole === 'super_employee') ? 'inline-flex' : 'none';
    }

    document.getElementById('detailsModal').classList.add('active');
}

function closeDetailsModal() {
    document.getElementById('detailsModal').classList.remove('active');
    currentApplicationId = null;
}

// Approve Application
async function approveApplication() {
    if (!currentApplicationId) return;
    
    const result = await apiUpdateApplicationStatus(currentApplicationId, 'مقبول');
    
    if (result.success) {
        showNotification(result.message, 'success');
        closeDetailsModal();
        updateStatistics();
        loadApplications();
    } else {
        showNotification(result.message || 'حدث خطأ في قبول الطلب', 'error');
    }
}

// Reject Application
async function rejectApplication() {
    if (!currentApplicationId) return;
    
    const result = await apiUpdateApplicationStatus(currentApplicationId, 'مرفوض');
    
    if (result.success) {
        showNotification(result.message, 'success');
        closeDetailsModal();
        updateStatistics();
        loadApplications();
    } else {
        showNotification(result.message || 'حدث خطأ في رفض الطلب', 'error');
    }
}

// Delete Application (Super Employee)
async function deleteApplicationAction() {
    if (!currentApplicationId) return;
    const confirmed = confirm('هل أنت متأكد من حذف هذا الطلب نهائياً؟');
    if (!confirmed) return;

    const result = await apiDeleteApplication(currentApplicationId);
    if (result.success) {
        showNotification(result.message || 'تم حذف الطلب', 'success');
        closeDetailsModal();
        updateStatistics();
        loadApplications();
    } else {
        showNotification(result.message || 'فشل حذف الطلب', 'error');
    }
}

// Notification System
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Close modal on outside click
document.getElementById('detailsModal').addEventListener('click', (e) => {
    if (e.target.id === 'detailsModal') {
        closeDetailsModal();
    }
});

// (تمت إزالة وظائف طلبات الموظفين للطلاب)

 

// ==================== PROFILE MANAGEMENT FUNCTIONS ====================

async function openEditProfileModal() {
    const user = apiGetCurrentUser();
    if (user) {
        document.getElementById('editFullName').value = user.fullName || '';
        document.getElementById('editUsername').value = user.username || '';
        document.getElementById('editEmail').value = user.email || '';
        document.getElementById('editNewPassword').value = '';
        document.getElementById('editConfirmNewPassword').value = '';
    }
    document.getElementById('editProfileModal').classList.add('active');
}

function closeEditProfileModal() {
    document.getElementById('editProfileModal').classList.remove('active');
    document.getElementById('editProfileForm').reset();
}

async function handleProfileUpdate(event) {
    event.preventDefault();
    
    const user = apiGetCurrentUser();
    if (!user) {
        showNotification('لم يتم العثور على معلومات المستخدم.', 'error');
        return;
    }

    const fullName = document.getElementById('editFullName').value;
    const email = document.getElementById('editEmail').value;
    const newPassword = document.getElementById('editNewPassword').value;
    const confirmNewPassword = document.getElementById('editConfirmNewPassword').value;

    if (newPassword && newPassword !== confirmNewPassword) {
        showNotification('كلمتا المرور الجديدتان غير متطابقتين.', 'error');
        return;
    }

    if (newPassword && newPassword.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'error');
        return;
    }

    const updateData = {
        fullName: fullName,
        email: email
    };

    if (newPassword) {
        updateData.password = newPassword;
    }

    const result = await apiUpdateProfile(updateData);

    if (result.success) {
        showNotification('تم تحديث الملف الشخصي بنجاح.', 'success');
        // Update local storage user data
        const updatedUser = { ...user, fullName: fullName, email: email };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        document.getElementById('employeeName').textContent = fullName; // Update displayed name
        closeEditProfileModal();
    } else {
        showNotification(result.message || 'فشل تحديث الملف الشخصي.', 'error');
    }
}

document.getElementById('editProfileModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'editProfileModal') {
        closeEditProfileModal();
    }
});

async function openAnnouncementAdminModal() {
    const existing = document.getElementById('announcementAdminModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'announcementAdminModal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>إدارة الإعلان</h2>
                <button class="close-btn" onclick="(function(){const m=document.getElementById('announcementAdminModal'); if(m) m.remove();})()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <form id="announcementAdminForm">
                <div class="input-group">
                    <label>العنوان</label>
                    <input type="text" id="annTitle" required>
                </div>
                <div class="input-group">
                    <label>المحتوى</label>
                    <textarea id="annContent" rows="4" required></textarea>
                </div>
                <div class="input-group">
                    <label>الأشياء المطلوبة (سطر لكل بند)</label>
                    <textarea id="annItems" rows="4"></textarea>
                </div>
                <div class="input-group" style="display:flex; gap:12px; align-items:center;">
                    <label>إلزام تأكيد "أفهم" قبل التسجيل</label>
                    <input type="checkbox" id="annRequireAck">
                </div>
                <div class="input-group" style="display:flex; gap:12px; align-items:center;">
                    <label>تفعيل الإعلان</label>
                    <input type="checkbox" id="annActive">
                </div>
                <div class="modal-actions">
                    <button type="submit" class="submit-btn"><i class="fas fa-save"></i> حفظ</button>
                    <button type="button" class="cancel-btn" onclick="(function(){const m=document.getElementById('announcementAdminModal'); if(m) m.remove();})()">إلغاء</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    const form = document.getElementById('announcementAdminForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveAnnouncementFromAdmin();
    });
    await loadAnnouncementForAdmin();
}

async function loadAnnouncementForAdmin() {
    let data = null;
    try {
        const res = await apiGetActiveAnnouncement();
        if (res && res.success && res.announcement) data = res.announcement;
    } catch {}
    if (!data) {
        const local = localStorage.getItem('announcementActive');
        if (local) {
            try { data = JSON.parse(local); } catch {}
        }
    }
    if (!data) {
        data = { title: '', contentHtml: '', requiredItems: [], requireAck: false, active: false, version: 1 };
    }
    document.getElementById('annTitle').value = data.title || '';
    document.getElementById('annContent').value = data.contentHtml || '';
    document.getElementById('annItems').value = (data.requiredItems || []).join('\n');
    document.getElementById('annRequireAck').checked = !!data.requireAck;
    document.getElementById('annActive').checked = !!data.active;
    document.getElementById('announcementAdminForm').dataset.annVersion = data.version || 1;
    if (data.id) document.getElementById('announcementAdminForm').dataset.annId = String(data.id);
}

async function saveAnnouncementFromAdmin() {
    const title = document.getElementById('annTitle').value.trim();
    const contentHtml = document.getElementById('annContent').value.trim();
    const itemsText = document.getElementById('annItems').value;
    const requiredItems = itemsText.split('\n').map(s => s.trim()).filter(Boolean);
    const requireAck = document.getElementById('annRequireAck').checked;
    const active = document.getElementById('annActive').checked;
    const form = document.getElementById('announcementAdminForm');
    const currentVersion = parseInt(form.dataset.annVersion || '1', 10);
    const id = form.dataset.annId ? parseInt(form.dataset.annId, 10) : null;
    const payload = { title, contentHtml, requiredItems, requireAck, active, version: currentVersion + 1 };
    let saved = false;
    if (id) {
        const res = await apiUpdateAnnouncement(id, payload);
        if (res && res.success) { saved = true; }
    } else {
        const res = await apiCreateAnnouncement(payload);
        if (res && res.success) { saved = true; }
    }
    if (!saved) {
        localStorage.setItem('announcementActive', JSON.stringify(payload));
        showNotification('تم حفظ الإعلان محلياً', 'success');
    } else {
        showNotification('تم حفظ الإعلان بنجاح', 'success');
    }
    const m = document.getElementById('announcementAdminModal');
    if (m) m.remove();
}
// Create Employee Modal control
function openCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').classList.add('active');
}
function closeCreateEmployeeModal() {
    document.getElementById('createEmployeeModal').classList.remove('active');
    const form = document.getElementById('createEmployeeForm');
    if (form) form.reset();
}

async function handleCreateEmployee(event) {
    event.preventDefault();
    const fullName = document.getElementById('newEmpFullName').value.trim();
    const username = document.getElementById('newEmpUsername').value.trim();
    const email = document.getElementById('newEmpEmail').value.trim();
    const password = document.getElementById('newEmpPassword').value;
    const result = await apiCreateEmployee({ fullName, username, email, password });
    if (result.success) {
        showNotification('تم إنشاء حساب الموظف بنجاح', 'success');
        closeCreateEmployeeModal();
        if (currentUserRole === 'super_employee') {
            loadEmployees();
        }
    } else {
        showNotification(result.message || 'فشل إنشاء حساب الموظف', 'error');
    }
}

function openEmployeesModal() {
    employeesSectionVisible = true;
    const modal = document.getElementById('employeesManagementModal');
    if (modal) {
        modal.classList.add('active');
        loadEmployees();
    }
}

function closeEmployeesModal() {
    employeesSectionVisible = false;
    const modal = document.getElementById('employeesManagementModal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// ==================== EMPLOYEE MANAGEMENT (SUPER EMPLOYEE) ====================

async function loadEmployees() {
    const listContainer = document.getElementById('employeesList');
    if (!listContainer) return;
    listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align:center;">جاري التحميل...</p>';
    const result = await apiListEmployees();
    if (result.success) {
        employeesList = result.employees || [];
        renderEmployees();
    } else {
        listContainer.innerHTML = `<p style="color: var(--error-color); text-align:center;">${result.message || 'تعذر جلب الموظفين'}</p>`;
    }
}

function renderEmployees() {
    const listContainer = document.getElementById('employeesList');
    if (!listContainer) return;
    if (!employeesList.length) {
        listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align:center;">لا يوجد موظفون حالياً.</p>';
        return;
    }

    listContainer.innerHTML = employeesList.map(emp => {
        const safeName = (emp.fullName || '').replace(/'/g, "\\'");
        return `
        <div class="employee-card">
            <div class="employee-card-header">
                <div>
                    <h4><i class="fas fa-id-badge"></i> ${emp.fullName}</h4>
                    <p class="employee-meta"><i class="fas fa-user"></i> ${emp.username}</p>
                    <p class="employee-meta"><i class="fas fa-envelope"></i> ${emp.email}</p>
                </div>
                <span class="employee-chip">موظف</span>
            </div>
            <div class="employee-card-footer">
                <p class="employee-meta"><i class="fas fa-calendar"></i> ${emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('ar-IQ') : 'غير متوفر'}</p>
                <div class="card-actions">
                    <button class="message-btn ghost" onclick="openSupervisorChat(${emp.id}, '${safeName}')" title="مراسلة الموظف">
                        <i class="fas fa-comments"></i> مراسلة
                    </button>
                    <button class="danger-btn ghost" onclick="handleDeleteEmployee(${emp.id})" title="حذف الحساب">
                        <i class="fas fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        </div>
    `;
    }).join('');
}

async function handleDeleteEmployee(employeeId) {
    const confirmed = confirm('سيتم حذف حساب الموظف وجميع البيانات المرتبطة به. هل أنت متأكد؟');
    if (!confirmed) return;
    const result = await apiDeleteEmployee(employeeId);
    if (result.success) {
        showNotification(result.message || 'تم حذف الموظف', 'success');
        loadEmployees();
    } else {
        showNotification(result.message || 'تعذر حذف الموظف', 'error');
    }
}

// ==================== SUPERVISOR CHAT (BIDIRECTIONAL) ====================

function openSupervisorChat(employeeId = null, employeeName = '') {
    currentChatEmployeeId = employeeId;
    currentChatEmployeeName = employeeName;
    const title = document.getElementById('supervisorChatTitle');
    const subtitle = document.getElementById('supervisorChatSubtitle');

    if (currentUserRole === 'super_employee') {
        title.textContent = employeeName ? `مراسلة: ${employeeName}` : 'مدير الموظفين';
        subtitle.textContent = employeeName ? 'تواصل مباشر مع الموظف' : 'اختر موظفاً من القائمة لمتابعة الحوار';
    } else {
        title.textContent = 'مدير الموظفين';
        subtitle.textContent = 'تواصل مع الموظف الرئيسي';
    }

    document.getElementById('supervisorChatModal').classList.add('active');
    loadSupervisorMessages();
}

function closeSupervisorChat() {
    document.getElementById('supervisorChatModal').classList.remove('active');
    document.getElementById('supervisorMessageInput').value = '';
}

async function loadSupervisorMessages() {
    const listEl = document.getElementById('supervisorMessagesList');
    if (!listEl) return;
    const isSuper = currentUserRole === 'super_employee';
    if (isSuper && !currentChatEmployeeId) {
        listEl.innerHTML = '<p class="no-messages">اختر موظفاً من القائمة لمتابعة الحوار.</p>';
        return;
    }

    listEl.innerHTML = '<p class="no-messages">جاري التحميل...</p>';

    const targetId = isSuper ? currentChatEmployeeId : null;
    const res = await apiGetSupervisorMessages(targetId);
    if (!res.success) {
        listEl.innerHTML = `<p class="no-messages">${res.message || 'تعذر جلب الرسائل'}</p>`;
        return;
    }

    const messages = res.messages || [];
    if (!messages.length) {
        listEl.innerHTML = '<p class="no-messages">لا توجد رسائل بعد.</p>';
        return;
    }

    listEl.innerHTML = messages.map(msg => {
        const own = msg.sender && msg.sender.id && currentUser && msg.sender.id === currentUser.id;
        return `
            <div class="message ${own ? 'own-message' : 'other-message'}">
                <div class="message-header">
                    <span class="sender-name">${msg.sender.fullName || ''}</span>
                    <span class="message-time">${new Date(msg.createdAt).toLocaleString('ar-IQ')}</span>
                </div>
                <div class="message-content">${msg.text}</div>
            </div>
        `;
    }).join('');

    listEl.scrollTop = listEl.scrollHeight;
}

async function sendSupervisorMessage() {
    const input = document.getElementById('supervisorMessageInput');
    if (!input) return;
    const text = input.value.trim();
    if (!text) return;

    let receiverId = null;
    if (currentUserRole === 'super_employee') {
        if (!currentChatEmployeeId) {
            alert('يرجى اختيار موظف للمراسلة من قسم حسابات الموظفين.');
            return;
        }
        receiverId = currentChatEmployeeId;
    } else {
        // الموظف يرسل للموظف الرئيسي (نفترض موظف رئيسي واحد)
        receiverId = null; // سيُحدد في backend بقواعد الدور
    }

    const payload = { receiverId, text };
    const res = await apiSendSupervisorMessage(payload);
    if (res.success) {
        input.value = '';
        await loadSupervisorMessages();
    } else {
        showNotification(res.message || 'تعذر إرسال الرسالة', 'error');
    }
}
