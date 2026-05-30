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
    
    if (!user || user.role !== 'employee') {
        window.location.href = 'index.html';
        return;
    }
    
    // تثبيت هوية الموظف في localStorage لاستخدامها في نظام المراسلة
    localStorage.setItem('currentUserId', user.fullName);
    localStorage.setItem('currentUserName', user.fullName);
    localStorage.setItem('userRole', user.role || 'employee');
    
    // Display user name
    document.getElementById('employeeName').textContent = user.fullName;
    
    // Check if user is main employee (admin account)
    const isMainEmployee = user.username === 'admin' || user.fullName.includes('الرئيسي') || user.fullName.includes('Main') || user.fullName.includes('Admin');
    
    // Debug logging
    console.log('User info:', user);
    console.log('Is main employee:', isMainEmployee);
    console.log('Username:', user.username);
    console.log('Full name:', user.fullName);
    
    // Show FAB for main employee, but enable video/image publishing for all staff
    const fabContainer = document.getElementById('fabContainer');
    if (fabContainer) {
        fabContainer.style.display = 'block'; // Show FAB for all employees
    }
    
    // Update FAB menu items based on user role
    updateFabMenuItems(isMainEmployee);
    
    // Show create employee button for all employees
    const createBtn = document.getElementById('createEmployeeBtn');
    if (createBtn) {
        createBtn.style.display = 'inline-flex';
    }
    const manageBtn = document.getElementById('manageEmployeesBtn');
    if (manageBtn) {
        manageBtn.style.display = 'inline-flex';
    }
    const supervisorInboxBtn = document.getElementById('supervisorInboxBtn');
    if (supervisorInboxBtn) {
        supervisorInboxBtn.style.display = (user.role === 'employee') ? 'inline-flex' : 'none';
    }
    
    // Load theme
    let savedTheme = localStorage.getItem('selectedTheme') || 'blue-light';
    if (savedTheme === 'blue') { savedTheme = 'blue-light'; localStorage.setItem('selectedTheme', 'blue-light'); }
    document.body.className = `dashboard-body theme-${savedTheme}`;
    updateThemeUI(savedTheme);
    
    // Load statistics
    updateStatistics();
    
    // Load applications
    loadApplications();
    loadEmployees();
    
    // Load student join requests
    refreshStudentRequests();
});

// Theme Management
function changeTheme(theme) {
    document.body.className = `dashboard-body theme-${theme}`;
    localStorage.setItem('selectedTheme', theme);
    updateThemeUI(theme);
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    const msg = (typeof translations !== 'undefined' && translations[lang] && translations[lang]['تم تغيير الثيم بنجاح'])
        ? translations[lang]['تم تغيير الثيم بنجاح']
        : 'تم تغيير الثيم بنجاح';
    showNotification(msg, 'success');
}

function updateThemeUI(theme) {
    document.querySelectorAll('.theme-option, .modal-theme-quick button').forEach(el => {
        el.classList.toggle('active', el.dataset.theme === theme || el.classList.contains(`dot-${theme}`));
    });
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
    try {
        const apiResult = await apiGetAllApplications();
        console.log('API Result:', apiResult);
        
        if (apiResult.success && apiResult.applications) {
            allApplications = apiResult.applications;
            console.log('Applications loaded:', allApplications.length, allApplications);
        } else {
            allApplications = [];
            console.log('No applications found or error:', apiResult.message);
            showNotification(apiResult.message || 'فشل تحميل الطلبات', 'error');
        }
        
        filterApplications();
    } catch (error) {
        console.error('Error loading applications:', error);
        allApplications = [];
        showNotification('حدث خطأ في تحميل الطلبات', 'error');
        filterApplications();
    }
}

function filterApplications() {
    try {
        const activityFilter = document.getElementById('activityFilter')?.value || '';
        const statusFilter = document.getElementById('statusFilter')?.value || '';
        const searchQuery = document.getElementById('searchInput')?.value.toLowerCase() || '';
        
        let filtered = allApplications || [];
        
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
    } catch (error) {
        console.error('Error filtering applications:', error);
        displayApplications([]);
    }
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
        <div class="application-row" data-app-id="${app.id}">
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
            <div class="app-row-actions">
                <button class="action-btn btn-info" onclick="viewApplicationDetails(${app.id})" title="عرض المعلومات">
                    <i class="fas fa-eye"></i>
                    <span>عرض</span>
                </button>
                <button class="action-btn btn-message" onclick="messageStudent(${app.id}, '${app.studentName}')" title="مراسلة الطالب">
                    <i class="fas fa-envelope"></i>
                    <span>مراسلة</span>
                </button>
                ${app.status === 'قيد الانتظار' ? `
                    <button class="action-btn btn-success" onclick="acceptApplication(${app.id})" title="قبول الطلب">
                        <i class="fas fa-check"></i>
                        <span>قبول</span>
                    </button>
                    <button class="action-btn btn-danger" onclick="rejectApplication(${app.id})" title="رفض الطلب">
                        <i class="fas fa-times"></i>
                        <span>رفض</span>
                    </button>
                ` : ''}
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
        deleteBtn.style.display = 'inline-flex';
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

// New functions for action buttons
function viewApplicationDetails(applicationId) {
    const app = getApplicationById(applicationId);
    if (!app) return;
    
    currentApplicationId = applicationId;
    
    // Populate modal with application details
    document.getElementById('modalStudentName').textContent = app.studentName;
    document.getElementById('modalActivityType').textContent = app.activityType;
    document.getElementById('modalActivityNumber').textContent = app.activityNumber;
    document.getElementById('modalCollege').textContent = app.college;
    document.getElementById('modalPhone').textContent = app.phone;
    document.getElementById('modalEmail').textContent = app.email;
    document.getElementById('modalSubmittedAt').textContent = new Date(app.submittedAt).toLocaleDateString('ar-IQ');
    document.getElementById('modalStatus').textContent = app.status;
    
    // Show/hide action buttons based on status
    const approveBtn = document.getElementById('approveBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    
    if (app.status === 'قيد الانتظار') {
        approveBtn.style.display = 'inline-flex';
        rejectBtn.style.display = 'inline-flex';
    } else {
        approveBtn.style.display = 'none';
        rejectBtn.style.display = 'none';
    }
    
    openDetailsModal();
}

function messageStudent(applicationId, studentName) {
    const app = getApplicationById(applicationId);
    if (!app) return;
    
    // Open messaging modal with student info
    currentApplicationId = applicationId;
    
    // Set student info in messaging modal
    document.getElementById('messageStudentName').textContent = studentName;
    document.getElementById('messageStudentId').value = app.userId;
    
    // Clear previous message
    document.getElementById('messageContent').value = '';
    
    // Open messaging modal
    openMessageModal();
}

function openMessageModal() {
    document.getElementById('studentMessageModal').style.display = 'flex';
}

function closeMessageModal() {
    document.getElementById('studentMessageModal').style.display = 'none';
}

async function sendStudentMessage() {
    const studentId = document.getElementById('messageStudentId').value;
    const messageContent = document.getElementById('messageContent').value.trim();
    
    if (!messageContent) {
        showNotification('الرجاء كتابة محتوى الرسالة', 'error');
        return;
    }
    
    try {
        // Use currentApplicationId as applicationId, studentId as receiverId
        const result = await apiSendMessage(currentApplicationId, studentId, messageContent);
        
        if (result.success) {
            showNotification('تم إرسال الرسالة بنجاح', 'success');
            closeMessageModal();
            document.getElementById('messageContent').value = '';
        } else {
            showNotification(result.message || 'فشل إرسال الرسالة', 'error');
        }
    } catch (error) {
        console.error('Error sending message:', error);
        showNotification('حدث خطأ في إرسال الرسالة', 'error');
    }
}

async function acceptApplication(applicationId) {
    const result = await apiUpdateApplicationStatus(applicationId, 'مقبول');
    
    if (result.success) {
        showNotification('تم قبول الطلب بنجاح', 'success');
        updateStatistics();
        loadApplications();
    } else {
        showNotification(result.message || 'حدث خطأ في قبول الطلب', 'error');
    }
}

async function rejectApplication(applicationId) {
    const result = await apiUpdateApplicationStatus(applicationId, 'مرفوض');
    
    if (result.success) {
        showNotification('تم رفض الطلب بنجاح', 'success');
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
        loadEmployees();
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

    if (currentUserRole === 'employee') {
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
    const isEmployee = currentUserRole === 'employee';
    if (isEmployee && !currentChatEmployeeId) {
        listEl.innerHTML = '<p class="no-messages">اختر موظفاً من القائمة لمتابعة الحوار.</p>';
        return;
    }

    listEl.innerHTML = '<p class="no-messages">جاري التحميل...</p>';

    const targetId = isEmployee ? currentChatEmployeeId : null;
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
    if (currentUserRole === 'employee') {
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

// FAB Menu Functions
function toggleFabMenu() {
    const fabMenu = document.getElementById('fabMenu');
    const fabMain = document.querySelector('.fab-main');
    
    if (fabMenu.classList.contains('active')) {
        fabMenu.classList.remove('active');
        fabMain.classList.remove('active');
    } else {
        fabMenu.classList.add('active');
        fabMain.classList.add('active');
    }
}

// Close FAB menu when clicking outside
document.addEventListener('click', function(event) {
    const fabContainer = document.getElementById('fabContainer');
    if (!fabContainer.contains(event.target)) {
        const fabMenu = document.getElementById('fabMenu');
        const fabMain = document.querySelector('.fab-main');
        fabMenu.classList.remove('active');
        fabMain.classList.remove('active');
    }
});

// FAB Modal Functions
function openImageAnnouncementModal() {
    const modal = document.getElementById('imageAnnouncementModal');
    if (modal) {
        modal.style.display = 'flex';
        toggleFabMenu();
    } else {
        console.error('Image announcement modal not found');
    }
}

function closeImageAnnouncementModal() {
    const modal = document.getElementById('imageAnnouncementModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

let selectedImageFile = null;

function handleImageSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
            showNotification('الرجاء اختيار ملف صورة صالح', 'error');
            event.target.value = '';
            return;
        }
        
        // Validate file size (max 10MB to match backend)
        if (file.size > 10 * 1024 * 1024) {
            showNotification('حجم الصورة يجب أن يكون أقل من 10 ميجابايت', 'error');
            event.target.value = '';
            return;
        }
        
        selectedImageFile = file;
        
        // Update file info
        document.getElementById('imageFileInfo').textContent = `تم اختيار: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        
        // Show image preview
        const imagePreview = document.getElementById('imagePreview');
        const previewImage = document.getElementById('previewImage');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            previewImage.src = e.target.result;
            imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function removeImage() {
    selectedImageFile = null;
    document.getElementById('imageFile').value = '';
    document.getElementById('imageFileInfo').textContent = 'لم يتم اختيار صورة بعد';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('previewImage').src = '';
}

async function publishImageAnnouncement() {
    const title = document.getElementById('imageTitle').value.trim();
    const type = document.getElementById('imageType').value;
    const description = document.getElementById('imageDescription').value.trim();
    const priority = document.getElementById('imagePriority').value;
    const visibility = document.getElementById('imageVisibility').value;
    const tags = document.getElementById('imageTags').value.trim();
    
    if (!title || !description || !selectedImageFile) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة واختيار صورة', 'error');
        return;
    }
    
    try {
        console.log('[IMAGE UPLOAD] Starting upload...');
        console.log('[IMAGE UPLOAD] Selected file:', selectedImageFile);
        showNotification('جاري رفع الصورة...', 'info');
        
        // Upload image to server
        const uploadResult = await apiUploadImage(selectedImageFile);
        
        console.log('[IMAGE UPLOAD] Upload result:', uploadResult);
        
        if (!uploadResult.success) {
            console.error('[IMAGE UPLOAD] Upload failed:', uploadResult.message);
            showNotification(uploadResult.message || 'فشل رفع الصورة', 'error');
            return;
        }
        
        // Create announcement with uploaded image
        const announcementData = {
            title: title,
            content: `${description}\n\nالصورة: ${uploadResult.imageUrl}\nالنوع: ${type}\nالأولوية: ${priority}\nالوسوم: ${tags}`,
            created_by: currentUser.fullName
        };
        
        const announcementResult = await apiCreateAnnouncement(announcementData);
        
        if (announcementResult.success) {
            const visibilityText = visibility === 'all' ? 'للجميع' : 
                                visibility === 'students' ? 'للطلاب' : 'للموظفين';
            
            showNotification(`تم نشر الصورة "${title}" ${visibilityText} بنجاح`, 'success');
            
            // Clear form
            document.getElementById('imageTitle').value = '';
            document.getElementById('imageType').value = 'general';
            document.getElementById('imageDescription').value = '';
            document.getElementById('imagePriority').value = 'medium';
            document.getElementById('imageVisibility').value = 'all';
            document.getElementById('imageTags').value = '';
            removeImage();
            
            // Close modal
            closeImageAnnouncementModal();
        } else {
            showNotification(announcementResult.message || 'فشل نشر الإعلان', 'error');
        }
        
    } catch (error) {
        console.error('Error publishing image announcement:', error);
        showNotification('حدث خطأ في نشر الصورة', 'error');
    }
}

function openContestModal() {
    const modal = document.getElementById('contestModal');
    if (modal) {
        modal.style.display = 'flex';
        toggleFabMenu();
    } else {
        console.error('Contest modal not found');
    }
}

function closeContestModal() {
    const modal = document.getElementById('contestModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// ==================== STUDENT JOIN REQUESTS ====================

let studentJoinRequests = [];
let chatRoomJoinRequests = [];

async function refreshChatRoomJoinRequests() {
    try {
        const result = await apiGetChatRoomJoinRequests();
        if (result.success) {
            chatRoomJoinRequests = result.joinRequests || [];
            displayChatRoomJoinRequests();
            showNotification('تم تحديث طلبات انضمام الكروبات', 'success');
        } else {
            showNotification(result.message || 'فشل تحديث طلبات الانضمام', 'error');
        }
    } catch (error) {
        console.error('[CHAT ROOM] Error loading join requests:', error);
        showNotification('حدث خطأ في تحميل طلبات الانضمام', 'error');
    }
}

function displayChatRoomJoinRequests() {
    const container = document.getElementById('chatRoomJoinRequests');
    if (!container) return;

    if (chatRoomJoinRequests.length === 0) {
        container.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-inbox"></i>
                <p>لا توجد طلبات انضمام للكروبات</p>
                <small>سيظهر هنا الطلبات عندما يطلب الطلاب الانضمام للكروبات</small>
            </div>
        `;
        return;
    }

    container.innerHTML = chatRoomJoinRequests.map(request => {
        const statusClass = request.status === 'pending' ? 'pending' : 
                           request.status === 'approved' ? 'approved' : 'rejected';
        const statusText = request.status === 'pending' ? 'قيد الانتظار' :
                           request.status === 'approved' ? 'تمت الموافقة' : 'مرفوض';
        const createdAt = request.createdAt ? new Date(request.createdAt).toLocaleString('ar-SA') : '';

        return `
            <div class="request-item ${statusClass}">
                <div class="request-info">
                    <div class="request-header">
                        <h4>${request.userName}</h4>
                        <span class="request-status ${statusClass}">${statusText}</span>
                    </div>
                    <div class="request-details">
                        <p><strong>الكروب:</strong> ${request.roomName}</p>
                        <p><strong>البريد:</strong> ${request.userEmail}</p>
                        <p><strong>التاريخ:</strong> ${createdAt}</p>
                    </div>
                </div>
                <div class="request-actions">
                    ${request.status === 'pending' ? `
                        <button class="approve-btn" onclick="processChatRoomJoinRequest(${request.id}, 'approve')">
                            <i class="fas fa-check"></i> قبول
                        </button>
                        <button class="reject-btn" onclick="processChatRoomJoinRequest(${request.id}, 'reject')">
                            <i class="fas fa-times"></i> رفض
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');
}

async function processChatRoomJoinRequest(requestId, action) {
    try {
        const actionText = action === 'approve' ? 'قبول' : 'رفض';
        showNotification(`جاري ${actionText} طلب الانضمام...`, 'info');

        const result = await apiProcessChatRoomJoinRequest(requestId, action);
        if (result.success) {
            showNotification(result.message, 'success');
            refreshChatRoomJoinRequests(); // Refresh the list
        } else {
            showNotification(result.message || 'فشل معالجة الطلب', 'error');
        }
    } catch (error) {
        console.error('[CHAT ROOM] Error processing join request:', error);
        showNotification('حدث خطأ في معالجة الطلب', 'error');
    }
}

async function refreshStudentRequests() {
    try {
        const result = await apiGetStudentJoinRequests();
        if (result.success) {
            studentJoinRequests = result.requests || [];
            displayStudentRequests();
            showNotification('تم تحديث قائمة الطلبات', 'success');
        } else {
            showNotification(result.message || 'فشل تحديث الطلبات', 'error');
        }
    } catch (error) {
        showNotification('حدث خطأ أثناء تحديث الطلابات', 'error');
    }
}

function displayStudentRequests() {
    const container = document.getElementById('studentJoinRequests');
    if (!container) return;

    if (studentJoinRequests.length === 0) {
        container.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-inbox"></i>
                <p>لا توجد طلبات انضمام حالية</p>
                <small>سيظهر هنا الطلاب الذين طلبوا الانضمام للأنشطة</small>
            </div>
        `;
        return;
    }

    container.innerHTML = studentJoinRequests.map(request => {
        const statusClass = request.status === 'pending' ? 'pending' : 
                           request.status === 'approved' ? 'approved' : 'rejected';
        const statusText = request.status === 'pending' ? 'قيد الانتظار' :
                          request.status === 'approved' ? 'موافقة' : 'مرفوض';
        const statusIcon = request.status === 'pending' ? 'clock' :
                          request.status === 'approved' ? 'check-circle' : 'times-circle';

        return `
            <div class="request-item ${statusClass}">
                <div class="request-header">
                    <div class="student-info">
                        <h4>${request.student.fullName}</h4>
                        <p><i class="fas fa-user"></i> ${request.student.username}</p>
                        <p><i class="fas fa-envelope"></i> ${request.student.email}</p>
                    </div>
                    <span class="request-status">
                        <i class="fas fa-${statusIcon}"></i> ${statusText}
                    </span>
                </div>
                <div class="request-content">
                    <p><strong>نوع النشاط:</strong> ${request.activityType}</p>
                    <p><strong>رسالة الطالب:</strong> ${request.requestMessage}</p>
                    <p><strong>تاريخ الطلب:</strong> ${new Date(request.createdAt).toLocaleDateString('ar-IQ')}</p>
                    ${request.processedAt ? `<p><strong>تاريخ المعالجة:</strong> ${new Date(request.processedAt).toLocaleDateString('ar-IQ')}</p>` : ''}
                    ${request.processedBy ? `<p><strong>معالج بواسطة:</strong> ${request.processedBy.fullName}</p>` : ''}
                </div>
                ${request.status === 'pending' ? `
                    <div class="request-actions">
                        <button class="approve-btn" onclick="processRequest(${request.id}, 'approve')">
                            <i class="fas fa-check"></i> موافقة
                        </button>
                        <button class="reject-btn" onclick="processRequest(${request.id}, 'reject')">
                            <i class="fas fa-times"></i> رفض
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

async function processRequest(requestId, action) {
    try {
        const actionText = action === 'approve' ? 'الموافقة' : 'الرفض';
        if (!confirm(`هل أنت متأكد من ${actionText} على هذا الطلب؟`)) {
            return;
        }

        const result = await apiProcessJoinRequest(requestId, action);
        if (result.success) {
            showNotification(result.message, 'success');
            refreshStudentRequests(); // Refresh the list
        } else {
            showNotification(result.message || 'فشل معالجة الطلب', 'error');
        }
    } catch (error) {
        showNotification('حدث خطأ أثناء معالجة الطلب', 'error');
    }
}

async function approveAllRequests() {
    try {
        const pendingCount = studentJoinRequests.filter(r => r.status === 'pending').length;
        if (pendingCount === 0) {
            showNotification('لا توجد طلبات معلقة للموافقة', 'info');
            return;
        }

        if (!confirm(`هل أنت متأكد من الموافقة على جميع ${pendingCount} طلب معلق؟`)) {
            return;
        }

        const result = await apiApproveAllRequests();
        if (result.success) {
            showNotification(result.message, 'success');
            refreshStudentRequests(); // Refresh the list
        } else {
            showNotification(result.message || 'فشل الموافقة على الطلبات', 'error');
        }
    } catch (error) {
        showNotification('حدث خطأ أثناء الموافقة على الطلابات', 'error');
    }
}

async function createContest() {
    const name = document.getElementById('contestName').value.trim();
    const type = document.getElementById('contestType').value;
    const description = document.getElementById('contestDescription').value.trim();
    const startDate = document.getElementById('contestStartDate').value;
    const endDate = document.getElementById('contestEndDate').value;
    const requirements = document.getElementById('contestRequirements').value.trim();
    const maxParticipants = document.getElementById('contestMaxParticipants').value;
    const prize = document.getElementById('contestPrize').value.trim();
    const rules = document.getElementById('contestRules').value.trim();
    const judges = document.getElementById('contestJudges').value.trim();
    const status = document.getElementById('contestStatus').value;
    const visibility = document.getElementById('contestVisibility').value;
    
    // Get selected eligibility categories
    const eligibility = [];
    document.querySelectorAll('input[name="eligibility"]:checked').forEach(checkbox => {
        eligibility.push(checkbox.value);
    });
    
    // Validation
    if (!name || !description || !startDate || !endDate || !requirements || !rules) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (new Date(startDate) >= new Date(endDate)) {
        showNotification('تاريخ الانتهاء يجب أن يكون بعد تاريخ البدء', 'error');
        return;
    }
    
    if (eligibility.length === 0) {
        showNotification('الرجاء اختيار فئة واحدة على الأقل للمشاركة', 'error');
        return;
    }
    
    try {
        // Create contest data
        const contestData = {
            name: name,
            type: type,
            description: description,
            startDate: startDate,
            endDate: endDate,
            eligibility: eligibility,
            requirements: requirements,
            maxParticipants: maxParticipants,
            prize: prize,
            rules: rules,
            judges: judges.split(',').map(j => j.trim()).filter(j => j),
            status: status,
            visibility: visibility
        };
        
        showNotification('جاري إنشاء المسابقة...', 'info');
        
        // Send to API
        const result = await apiCreateContest(contestData);
        
        if (result.success) {
            const typeText = type === 'academic' ? 'أكاديمية' : 
                            type === 'sports' ? 'رياضية' : 
                            type === 'art' ? 'فنية' : 
                            type === 'technology' ? 'تقنية' : 
                            type === 'general' ? 'عامة' : 'إبداعية';
            
            showNotification(`تم إنشاء المسابقة "${name}" (${typeText}) بنجاح`, 'success');
            
            // Clear form
            document.getElementById('contestName').value = '';
            document.getElementById('contestType').value = 'academic';
            document.getElementById('contestDescription').value = '';
            document.getElementById('contestStartDate').value = '';
            document.getElementById('contestEndDate').value = '';
            document.getElementById('contestRequirements').value = '';
            document.getElementById('contestMaxParticipants').value = '50';
            document.getElementById('contestPrize').value = '';
            document.getElementById('contestRules').value = '';
            document.getElementById('contestJudges').value = '';
            document.getElementById('contestStatus').value = 'draft';
            document.getElementById('contestVisibility').value = 'public';
            
            // Reset eligibility checkboxes
            document.querySelectorAll('input[name="eligibility"]').forEach(checkbox => {
                checkbox.checked = checkbox.value === 'students';
            });
            
            // Close modal
            closeContestModal();
        } else {
            showNotification(result.message || 'فشل إنشاء المسابقة', 'error');
        }
        
    } catch (error) {
        console.error('Error creating contest:', error);
        showNotification('حدث خطأ في إنشاء المسابقة', 'error');
    }
}


// Student Requests Management Functions
let studentRequests = [];
let currentRequestsTab = 'pending';

function openStudentRequestsModal() {
    document.getElementById('studentRequestsModal').style.display = 'flex';
    loadStudentRequests();
    showRequestsTab('pending');
    toggleFabMenu();
}

function closeStudentRequestsModal() {
    document.getElementById('studentRequestsModal').style.display = 'none';
}

function loadStudentRequests() {
    // Load student requests from API
    studentRequests = [];
    
    updateRequestCounts();
}

function showRequestsTab(tab) {
    currentRequestsTab = tab;
    
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(tab + 'Tab').classList.add('active');
    
    // Display requests based on tab
    const requestsContent = document.getElementById('requestsContent');
    const filteredRequests = studentRequests.filter(req => req.status === tab);
    
    if (filteredRequests.length === 0) {
        requestsContent.innerHTML = `
            <div class="no-requests">
                <i class="fas fa-inbox"></i>
                <p>لا توجد طلبات ${tab === 'pending' ? 'معلقة' : tab === 'approved' ? 'معتمدة' : 'مرفوضة'}</p>
            </div>
        `;
    } else {
        requestsContent.innerHTML = `
            <div class="requests-list">
                ${filteredRequests.map(request => createRequestCard(request)).join('')}
            </div>
        `;
    }
}

function createRequestCard(request) {
    const statusIcon = request.status === 'pending' ? 'fa-clock' : 
                       request.status === 'approved' ? 'fa-check-circle' : 'fa-times-circle';
    
    const statusClass = request.status === 'pending' ? 'status-pending' : 
                        request.status === 'approved' ? 'status-approved' : 'status-rejected';
    
    const roomText = request.targetRoom === 'general' ? 'كروب العام' : 
                    request.targetRoom === 'study' ? 'كروب الدراسة' : 
                    request.targetRoom === 'contest' ? 'كروب المسابقات' : 'كروب الإعلانات';
    
    return `
        <div class="request-card ${statusClass}">
            <div class="request-header">
                <div class="request-info">
                    <h4>${request.studentName}</h4>
                    <p><i class="fas fa-user"></i> ${request.username}</p>
                    <p><i class="fas fa-envelope"></i> ${request.email}</p>
                </div>
                <div class="request-status">
                    <i class="fas ${statusIcon}"></i>
                    <span>${request.status === 'pending' ? 'معلق' : 
                           request.status === 'approved' ? 'معتمد' : 'مرفوض'}</span>
                </div>
            </div>
            <div class="request-details">
                <p><strong>الكروب المستهدف:</strong> ${roomText}</p>
                <p><strong>السبب:</strong> ${request.reason}</p>
                <p><strong>تاريخ الطلب:</strong> ${new Date(request.requestedAt).toLocaleDateString('ar-SA')}</p>
                ${request.status === 'approved' ? `<p><strong>تاريخ الموافقة:</strong> ${new Date(request.approvedAt).toLocaleDateString('ar-SA')}</p>` : ''}
                ${request.status === 'rejected' ? `<p><strong>سبب الرفض:</strong> ${request.rejectionReason}</p>` : ''}
            </div>
            <div class="request-actions">
                ${request.status === 'pending' ? `
                    <button class="approve-btn" onclick="approveRequest(${request.id})">
                        <i class="fas fa-check"></i> موافقة
                    </button>
                    <button class="reject-btn" onclick="rejectRequest(${request.id})">
                        <i class="fas fa-times"></i> رفض
                    </button>
                ` : ''}
                ${request.status === 'approved' ? `
                    <button class="add-to-room-btn" onclick="addApprovedStudentToRoom(${request.id})">
                        <i class="fas fa-user-plus"></i> إضافة للكروب
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function updateRequestCounts() {
    const pendingCount = studentRequests.filter(req => req.status === 'pending').length;
    const approvedCount = studentRequests.filter(req => req.status === 'approved').length;
    const rejectedCount = studentRequests.filter(req => req.status === 'rejected').length;
    
    document.getElementById('pendingCount').textContent = pendingCount;
    document.getElementById('approvedCount').textContent = approvedCount;
    document.getElementById('rejectedCount').textContent = rejectedCount;
}

function checkStudentUsername(event) {
    const username = document.getElementById('studentUsername').value.trim();
    const statusDiv = document.getElementById('studentUsernameStatus');
    
    if (username.length < 3) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 3 أحرف على الأقل</span>';
        return;
    }
    
    if (username.length > 20) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 20 حرف كحد أقصى</span>';
        return;
    }
    
    // Check if username exists in student requests
    const existingRequest = studentRequests.find(req => req.username === username && req.status === 'pending');
    if (existingRequest) {
        statusDiv.innerHTML = '<span class="status-warning">يوجد طلب معلق لهذا المستخدم</span>';
        return;
    }
    
    statusDiv.innerHTML = '<span class="status-success">المستخدم متاح للإضافة</span>';
    
    // Allow adding with Enter key
    if (event.key === 'Enter') {
        addStudentToChatRoom();
    }
}

function addStudentToChatRoom() {
    const username = document.getElementById('studentUsername').value.trim();
    const targetRoom = document.getElementById('targetChatRoom').value;
    const reason = document.getElementById('requestReason').value.trim();
    const statusDiv = document.getElementById('studentUsernameStatus');
    
    if (!username || !targetRoom || !reason) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (username.length < 3) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 3 أحرف على الأقل</span>';
        return;
    }
    
    // Check if username exists in student requests
    const existingRequest = studentRequests.find(req => req.username === username && req.status === 'pending');
    if (existingRequest) {
        showNotification('يوجد طلب معلق لهذا المستخدم', 'error');
        return;
    }
    
    // Create new student request
    const newRequest = {
        id: Date.now(),
        studentName: username,
        username: username,
        email: `${username}@university.edu`,
        targetRoom: targetRoom,
        reason: reason,
        status: 'pending',
        requestedAt: new Date().toISOString(),
        requestedBy: currentUser.fullName
    };
    
    studentRequests.push(newRequest);
    updateRequestCounts();
    showRequestsTab('pending');
    
    // Clear form
    document.getElementById('studentUsername').value = '';
    document.getElementById('targetChatRoom').value = '';
    document.getElementById('requestReason').value = '';
    statusDiv.innerHTML = '';
    
    showNotification(`تم إنشاء طلب لـ ${username} بنجاح`, 'success');
}

function approveRequest(requestId) {
    const request = studentRequests.find(req => req.id === requestId);
    if (request) {
        request.status = 'approved';
        request.approvedAt = new Date().toISOString();
        request.approvedBy = currentUser.fullName;
        
        updateRequestCounts();
        showRequestsTab(currentRequestsTab);
        showNotification(`تمت الموافقة على طلب ${request.studentName}`, 'success');
    }
}

function rejectRequest(requestId) {
    const reason = prompt('أدخل سبب الرفض:');
    if (!reason) return;
    
    const request = studentRequests.find(req => req.id === requestId);
    if (request) {
        request.status = 'rejected';
        request.rejectedAt = new Date().toISOString();
        request.rejectedBy = currentUser.fullName;
        request.rejectionReason = reason;
        
        updateRequestCounts();
        showRequestsTab(currentRequestsTab);
        showNotification(`تم رفض طلب ${request.studentName}`, 'info');
    }
}

function addApprovedStudentToRoom(requestId) {
    const request = studentRequests.find(req => req.id === requestId);
    if (request) {
        // Add to chat room members (simulate)
        const memberData = {
            id: request.id,
            name: request.studentName,
            username: request.username,
            email: request.email,
            role: 'student',
            status: 'active'
        };
        
        // Here you would normally add to the actual chat room
        showNotification(`تمت إضافة ${request.studentName} إلى الكروب بنجاح`, 'success');
    }
}

function clearStudentRequest() {
    document.getElementById('studentUsername').value = '';
    document.getElementById('targetChatRoom').value = '';
    document.getElementById('requestReason').value = '';
    document.getElementById('studentUsernameStatus').innerHTML = '';
}

function openNotificationModal() {
    document.getElementById('notificationModal').style.display = 'flex';
    toggleFabMenu();
}

// Enhanced Chat Room Management Functions
function applyTemplate(templateType) {
    const templates = {
        study: {
            name: 'كروب الدراسة',
            description: 'كروب مخصص لمناقشة المواد الدراسية والواجبات والمشاريع',
            type: 'study',
            maxMembers: 30,
            privacy: 'public',
            rules: '1. احترام جميع الأعضاء\n2. الالتزام بالمواضيع الدراسية\n3. عدم نشر محتوى غير لائق',
            tags: 'دراسة, واجبات, مشاريع',
            messageRetention: '90days',
            fileSharing: 'enabled',
            maxFileSize: 5,
            allowedFileTypes: 'pdf, doc, docx, ppt, pptx',
            welcomeMessage: 'مرحباً بك في كروب الدراسة! لا تتردد في طرح أسئلتك.'
        },
        project: {
            name: 'كروب المشروع',
            description: 'كروب لتنسيق المشاريع الجماعية ومتابعة التقدم',
            type: 'project',
            maxMembers: 20,
            privacy: 'private',
            rules: '1. التركيز على أهداف المشروع\n2. تحديث التقدم بانتظام\n3. احترام مواعيد التسليم',
            tags: 'مشروع, جماعي, تنسيق',
            messageRetention: '1year',
            fileSharing: 'enabled',
            maxFileSize: 50,
            allowedFileTypes: 'pdf, doc, docx, zip, rar, jpg, png',
            welcomeMessage: 'أهلاً بك في فريق المشروع! لنبدأ العمل معاً.'
        },
        announcement: {
            name: 'كروب الإعلانات',
            description: 'كروب رسمي للإعلانات والتواصل الإداري',
            type: 'announcement',
            maxMembers: 100,
            privacy: 'public',
            rules: '1. الإعلانات فقط من المشرفين\n2. عدم الرد على الإعلانات إلا عند الطلب\n3. احترام المحتوى الرسمي',
            tags: 'إعلانات, رسمي, تواصل',
            messageRetention: 'forever',
            fileSharing: 'admin-only',
            maxFileSize: 10,
            allowedFileTypes: 'pdf, jpg, png',
            welcomeMessage: 'مرحباً بك في كروب الإعلانات الرسمي.'
        },
        support: {
            name: 'كروب الدعم الفني',
            description: 'كروب للمساعدة الفنية وحل المشاكل التقنية',
            type: 'support',
            maxMembers: 50,
            privacy: 'public',
            rules: '1. وصف المشكلة بوضوح\n2. الصبر في انتظار المساعدة\n3. احترام فريق الدعم',
            tags: 'دعم, فني, مساعدة',
            messageRetention: '30days',
            fileSharing: 'enabled',
            maxFileSize: 20,
            allowedFileTypes: 'jpg, png, gif, zip, log, txt',
            welcomeMessage: 'مرحباً! كيف يمكننا مساعدتك اليوم؟'
        }
    };
    
    const template = templates[templateType];
    if (template) {
        // Apply template values
        document.getElementById('chatRoomName').value = template.name;
        document.getElementById('chatRoomDescription').value = template.description;
        document.getElementById('chatRoomType').value = template.type;
        document.getElementById('chatRoomMaxMembers').value = template.maxMembers;
        document.getElementById('chatRoomPrivacy').value = template.privacy;
        document.getElementById('chatRoomRules').value = template.rules;
        document.getElementById('chatRoomTags').value = template.tags;
        document.getElementById('chatRoomMessageRetention').value = template.messageRetention;
        document.getElementById('chatRoomFileSharing').value = template.fileSharing;
        document.getElementById('chatRoomMaxFileSize').value = template.maxFileSize;
        document.getElementById('chatRoomAllowedFileTypes').value = template.allowedFileTypes;
        document.getElementById('chatRoomWelcomeMessage').value = template.welcomeMessage;
        
        showNotification(`تم تطبيق قالب ${template.name} بنجاح`, 'success');
    }
}

function updateChatRoomStats() {
    // Simulate real-time stats update
    const stats = {
        currentMembers: chatRoomMembers.length,
        todayMessages: Math.floor(Math.random() * 50),
        sharedFiles: Math.floor(Math.random() * 20),
        activityRate: chatRoomMembers.length > 10 ? 'عالي' : chatRoomMembers.length > 5 ? 'متوسط' : 'منخفض'
    };
    
    document.getElementById('currentMembersCount').textContent = stats.currentMembers;
    document.getElementById('todayMessagesCount').textContent = stats.todayMessages;
    document.getElementById('sharedFilesCount').textContent = stats.sharedFiles;
    document.getElementById('activityRate').textContent = stats.activityRate;
}

// Update stats when member list changes
const originalUpdateMemberList = updateMemberList;
updateMemberList = function() {
    originalUpdateMemberList();
    updateChatRoomStats();
};

// Advanced Chat Room Management Functions
function exportChatData(format) {
    const chatData = {
        roomName: document.getElementById('chatRoomName').value || 'Chat Room',
        members: chatRoomMembers,
        settings: {
            privacy: document.getElementById('chatRoomPrivacy').value,
            maxMembers: document.getElementById('chatRoomMaxMembers').value,
            messageRetention: document.getElementById('chatRoomMessageRetention').value,
            fileSharing: document.getElementById('chatRoomFileSharing').value,
            notifications: document.getElementById('chatRoomNotifications').checked,
            encryption: document.getElementById('chatRoomEncryption').checked,
            autoMod: document.getElementById('chatRoomAutoMod').checked
        },
        stats: {
            currentMembers: chatRoomMembers.length,
            todayMessages: Math.floor(Math.random() * 50),
            sharedFiles: Math.floor(Math.random() * 20),
            activityRate: chatRoomMembers.length > 10 ? 'عالي' : chatRoomMembers.length > 5 ? 'متوسط' : 'منخفض'
        },
        exportDate: new Date().toISOString(),
        exportedBy: currentUser.fullName
    };
    
    try {
        let content, filename, mimeType;
        
        switch(format) {
            case 'json':
                content = JSON.stringify(chatData, null, 2);
                filename = `chat-room-${Date.now()}.json`;
                mimeType = 'application/json';
                break;
            case 'csv':
                content = convertToCSV(chatData);
                filename = `chat-room-${Date.now()}.csv`;
                mimeType = 'text/csv';
                break;
            case 'pdf':
                content = generatePDFContent(chatData);
                filename = `chat-room-${Date.now()}.pdf`;
                mimeType = 'application/pdf';
                break;
        }
        
        // Create download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification(`تم تصدير بيانات الكروب بصيغة ${format.toUpperCase()} بنجاح`, 'success');
    } catch (error) {
        console.error('Export error:', error);
        showNotification('حدث خطأ في تصدير البيانات', 'error');
    }
}

function convertToCSV(data) {
    const headers = ['Room Name', 'Members Count', 'Privacy', 'Max Members', 'File Sharing', 'Export Date'];
    const rows = [
        headers.join(','),
        [
            data.roomName,
            data.members.length,
            data.settings.privacy,
            data.settings.maxMembers,
            data.settings.fileSharing,
            new Date(data.exportDate).toLocaleDateString('ar-SA')
        ].join(',')
    ];
    return rows.join('\n');
}

function generatePDFContent(data) {
    // Simple PDF content generation (in real app, use PDF library)
    return `
        بيانات كروب الدردشة: ${data.roomName}
        
        الأعضاء: ${data.members.length}
        الخصوصية: ${data.settings.privacy}
        الحد الأقصى: ${data.settings.maxMembers}
        
        تاريخ التصدير: ${new Date(data.exportDate).toLocaleDateString('ar-SA')}
        تم التصدير بواسطة: ${data.exportedBy}
    `;
}

function createBackup() {
    const backupData = {
        roomName: document.getElementById('chatRoomName').value || 'Chat Room',
        members: chatRoomMembers,
        settings: {
            privacy: document.getElementById('chatRoomPrivacy').value,
            maxMembers: document.getElementById('chatRoomMaxMembers').value,
            messageRetention: document.getElementById('chatRoomMessageRetention').value,
            fileSharing: document.getElementById('chatRoomFileSharing').value,
            notifications: document.getElementById('chatRoomNotifications').checked,
            encryption: document.getElementById('chatRoomEncryption').checked,
            autoMod: document.getElementById('chatRoomAutoMod').checked,
            maxFileSize: document.getElementById('chatRoomMaxFileSize').value,
            allowedFileTypes: document.getElementById('chatRoomAllowedFileTypes').value,
            welcomeMessage: document.getElementById('chatRoomWelcomeMessage').value,
            wordFilter: document.getElementById('wordFilter').value,
            autoDeleteBadWords: document.getElementById('autoDeleteBadWords').checked,
            messageDelay: document.getElementById('messageDelay').value,
            maxMessageLength: document.getElementById('maxMessageLength').value,
            allowLinks: document.getElementById('allowLinks').checked,
            allowImages: document.getElementById('allowImages').checked,
            memberApproval: document.getElementById('memberApproval').value,
            allowInvites: document.getElementById('allowInvites').checked,
            kickInactive: document.getElementById('kickInactive').checked,
            backupFrequency: document.getElementById('backupFrequency').value,
            backupRetention: document.getElementById('backupRetention').value,
            includeFilesInBackup: document.getElementById('includeFilesInBackup').checked,
            scheduledMessages: document.getElementById('scheduledMessages').value,
            scheduleTime: document.getElementById('scheduleTime').value,
            scheduleRepeat: document.getElementById('scheduleRepeat').value,
            autoWelcome: document.getElementById('autoWelcome').checked,
            autoGoodbye: document.getElementById('autoGoodbye').checked,
            autoModeration: document.getElementById('autoModeration').checked,
            autoCleanup: document.getElementById('autoCleanup').checked
        },
        backupDate: new Date().toISOString(),
        backupBy: currentUser.fullName
    };
    
    // Simulate backup creation
    showNotification('جاري إنشاء نسخة احتياطية...', 'info');
    
    setTimeout(() => {
        // In real app, this would save to server
        const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chat-room-backup-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('تم إنشاء نسخة احتياطية بنجاح', 'success');
    }, 2000);
}

function scheduleMessage() {
    const message = document.getElementById('scheduledMessages').value.trim();
    const time = document.getElementById('scheduleTime').value;
    const repeat = document.getElementById('scheduleRepeat').value;
    
    if (!message || !time) {
        showNotification('الرجاء إدخال الرسالة والوقت', 'error');
        return;
    }
    
    // In real app, this would schedule with backend
    showNotification(`تم جدولة الرسالة للتكرار: ${repeat}`, 'success');
    
    // Clear form
    document.getElementById('scheduledMessages').value = '';
    document.getElementById('scheduleTime').value = '';
    document.getElementById('scheduleRepeat').value = 'once';
}

function validateModerationSettings() {
    const wordFilter = document.getElementById('wordFilter').value.trim();
    const messageDelay = parseInt(document.getElementById('messageDelay').value);
    const maxMessageLength = parseInt(document.getElementById('maxMessageLength').value);
    
    if (wordFilter && wordFilter.split(',').length > 100) {
        showNotification('الحد الأقصى للكلمات المحظورة هو 100 كلمة', 'error');
        return false;
    }
    
    if (messageDelay < 0 || messageDelay > 60) {
        showNotification('تأخير الرسائل يجب أن يكون بين 0 و 60 ثانية', 'error');
        return false;
    }
    
    if (maxMessageLength < 50 || maxMessageLength > 1000) {
        showNotification('الحد الأقصى للرسالة يجب أن يكون بين 50 و 1000 حرف', 'error');
        return false;
    }
    
    return true;
}

function applyModerationSettings() {
    if (!validateModerationSettings()) {
        return;
    }
    
    const settings = {
        wordFilter: document.getElementById('wordFilter').value.trim(),
        autoDeleteBadWords: document.getElementById('autoDeleteBadWords').checked,
        messageDelay: document.getElementById('messageDelay').value,
        maxMessageLength: document.getElementById('maxMessageLength').value,
        allowLinks: document.getElementById('allowLinks').checked,
        allowImages: document.getElementById('allowImages').checked,
        memberApproval: document.getElementById('memberApproval').value,
        allowInvites: document.getElementById('allowInvites').checked,
        kickInactive: document.getElementById('kickInactive').checked,
        backupFrequency: document.getElementById('backupFrequency').value,
        backupRetention: document.getElementById('backupRetention').value,
        includeFilesInBackup: document.getElementById('includeFilesInBackup').checked,
        autoWelcome: document.getElementById('autoWelcome').checked,
        autoGoodbye: document.getElementById('autoGoodbye').checked,
        autoModeration: document.getElementById('autoModeration').checked,
        autoCleanup: document.getElementById('autoCleanup').checked
    };
    showNotification('تم تطبيق إعدادات المراقبة بنجاح', 'success');
}

// Add event listeners for new features
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    loadDashboardData();
    loadUserActivities();
    loadUserApplications();
    loadEmployeeActivities();
    loadUserStatistics();
    loadAnnouncements();
    loadStudentRequests();
    loadAllUsers();
    loadJoinRequests(); // Load chat room join requests
    
    // Add event listeners for moderation tools
    const wordFilter = document.getElementById('wordFilter');
    const messageDelay = document.getElementById('messageDelay');
    const maxMessageLength = document.getElementById('maxMessageLength');
    
    if (wordFilter) {
        wordFilter.addEventListener('input', function() {
            const words = this.value.split(',').filter(w => w.trim());
            if (words.length > 0) {
                showNotification(`تم إضافة ${words.length} كلمة محظورة`, 'info');
            }
        });
    }
    
    if (messageDelay) {
        messageDelay.addEventListener('change', function() {
            showNotification(`تم تعيين تأخير الرسائل إلى ${this.value} ثانية`, 'info');
        });
    }
    
    if (maxMessageLength) {
        maxMessageLength.addEventListener('change', function() {
            showNotification(`تم تعيين الحد الأقصى للرسالة إلى ${this.value} حرف`, 'info');
        });
    }
});

// Real-time Chat Interface Functions
let chatMessages = [];
let onlineMembers = [];
let typingMembers = [];
let currentChatRoom = null;

function openChatInterfaceModal() {
    document.getElementById('chatInterfaceModal').style.display = 'flex';
    toggleFabMenu();
    // Load chat rooms when interface opens
    loadChatRooms();
}

function closeChatInterfaceModal() {
    document.getElementById('chatInterfaceModal').style.display = 'none';
}

function initializeChatRoom() {
    // Simulate chat room initialization
    currentChatRoom = {
        id: 1,
        name: 'كروب العام',
        members: chatRoomMembers,
        createdAt: new Date().toISOString()
    };
    
    // Initialize member status
    onlineMembers = chatRoomMembers.map(member => ({
        ...member,
        status: 'online',
        lastSeen: new Date().toISOString(),
        isTyping: false
    }));
    
    updateMemberStatusList();
    updateRoomInfo();
    
    // Add welcome message
    addSystemMessage('مرحباً بك في كروب الدردشة! يمكنك البدء في المحادثة.');
}

function updateMemberStatusList() {
    const memberStatusList = document.getElementById('memberStatusList');
    
    if (onlineMembers.length === 0) {
        memberStatusList.innerHTML = '<p class="no-members">لا يوجد أعضاء حالياً</p>';
        return;
    }
    
    memberStatusList.innerHTML = onlineMembers.map(member => `
        <div class="member-status-item">
            <div class="member-avatar">
                <i class="fas fa-user-circle"></i>
                <span class="status-indicator ${member.status}"></span>
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.role === 'admin' ? 'مدير' : member.role === 'moderator' ? 'مشرف' : 'عضو'}</div>
                <div class="member-status-text">${member.status === 'online' ? 'متصل' : 'غير متصل'}</div>
            </div>
            <div class="member-actions">
                ${member.isTyping ? '<i class="fas fa-keyboard typing-indicator"></i>' : ''}
                <button class="member-action-btn" onclick="sendPrivateMessage(${member.id})" title="رسالة خاصة">
                    <i class="fas fa-envelope"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateRoomInfo() {
    document.getElementById('currentRoomName').textContent = currentChatRoom?.name || 'كروب العام';
    document.getElementById('currentRoomMembersCount').textContent = chatRoomMembers.length;
    document.getElementById('onlineMembersCount').textContent = onlineMembers.filter(m => m.status === 'online').length;
}

async function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) return;
    const message = messageInput.value.trim();
    if (!message) return;

    const room = selectedRoomId ? chatRooms.find(r => r.id === selectedRoomId) : null;
    if (selectedRoomId && room && room.isMember) {
        try {
            const result = await apiSendChatMessage(selectedRoomId, { content: message });
            if (result.success) {
                messageInput.value = '';
                stopTyping();
                await loadRoomMessages(selectedRoomId);
                return;
            }
            showNotification(result.message || 'فشل إرسال الرسالة', 'error');
            return;
        } catch (err) {
            console.error('[CHAT]', err);
            showNotification(err.message || 'فشل إرسال الرسالة', 'error');
            return;
        }
    }

    const newMessage = {
        id: Date.now(),
        sender: currentUser,
        content: message,
        timestamp: new Date().toISOString(),
        type: 'user'
    };
    chatMessages.push(newMessage);
    displayMessage(newMessage);
    messageInput.value = '';
    simulateMessageDelivery(newMessage);
    stopTyping();
}

function displayMessage(message) {
    const chatMessagesDiv = document.getElementById('chatMessages');
    
    const messageElement = document.createElement('div');
    messageElement.className = `message ${message.type}`;
    
    if (message.type === 'system') {
        messageElement.innerHTML = `
            <div class="system-message">
                <i class="fas fa-info-circle"></i>
                <span>${message.content}</span>
                <div class="message-time">${new Date(message.timestamp).toLocaleTimeString('ar-SA')}</div>
            </div>
        `;
    } else {
        messageElement.innerHTML = `
            <div class="user-message">
                <div class="message-header">
                    <div class="sender-info">
                        <img src="${message.sender.avatar || '/static/images/default-avatar.png'}" alt="${message.sender.name}" class="sender-avatar">
                        <span class="sender-name">${message.sender.name}</span>
                        <span class="sender-role">${message.sender.role === 'admin' ? 'مدير' : 'عضو'}</span>
                    </div>
                    <div class="message-time">${new Date(message.timestamp).toLocaleTimeString('ar-SA')}</div>
                </div>
                <div class="message-content">${message.content}</div>
            </div>
        `;
    }
    
    chatMessagesDiv.appendChild(messageElement);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}

function addSystemMessage(content) {
    const systemMessage = {
        id: Date.now(),
        content: content,
        timestamp: new Date().toISOString(),
        type: 'system'
    };
    
    chatMessages.push(systemMessage);
    displayMessage(systemMessage);
}

function simulateMessageDelivery(message) {
    // Simulate other members receiving the message
    onlineMembers.forEach(member => {
        if (member.id !== message.sender.id) {
            // In real app, this would send via WebSocket
            console.log(`Message delivered to ${member.name}:`, message);
        }
    });
}

function handleMessageKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

function handleMessageInput() {
    const messageInput = document.getElementById('messageInput');
    
    if (messageInput.value.trim()) {
        startTyping();
    } else {
        stopTyping();
    }
}

function startTyping() {
    if (!currentUser.isTyping) {
        currentUser.isTyping = true;
        // In real app, send typing indicator via WebSocket
        broadcastTypingStatus(true);
    }
}

function stopTyping() {
    if (currentUser.isTyping) {
        currentUser.isTyping = false;
        // In real app, send stop typing via WebSocket
        broadcastTypingStatus(false);
    }
}

function broadcastTypingStatus(isTyping) {
    // Simulate broadcasting typing status
    const typingIndicator = document.getElementById('typingIndicator');
    
    if (isTyping) {
        // Show typing indicator to others
        console.log(`${currentUser.name} is typing...`);
    } else {
        // Hide typing indicator
        console.log(`${currentUser.name} stopped typing`);
    }
}

function sendPrivateMessage(memberId) {
    const member = onlineMembers.find(m => m.id === memberId);
    if (member) {
        showNotification(`فتح نافذة الرسالة الخاصة لـ ${member.name}`, 'info');
        // In real app, open private message modal
    }
}

function addEmoji() {
    const messageInput = document.getElementById('messageInput');
    const emojis = ['😀', '😂', '❤️', '👍', '🎉', '🤔', '😎', '🔥', '💯'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    messageInput.value += randomEmoji;
    messageInput.focus();
}

function attachFile() {
    showNotification('فتح نافذة اختيار الملف', 'info');
    // In real app, open file picker
}

function formatText() {
    showNotification('فتح خيارات التنسيق', 'info');
    // In real app, show formatting options
}

function simulateMemberActivity() {
    // Simulate random member activities
    if (Math.random() > 0.7 && onlineMembers.length > 0) {
        const randomMember = onlineMembers[Math.floor(Math.random() * onlineMembers.length)];
        const activities = [
            'دخل الكروب',
            'غادر الكروب',
            'غير حالته إلى متصل',
            'غير حالته إلى غير متصل'
        ];
        const activity = activities[Math.floor(Math.random() * activities.length)];
        addSystemMessage(`${randomMember.name} ${activity}`);
    }
}

// User Management Functions
let allUsers = [];
let filteredUsers = [];
let currentPage = 1;
let usersPerPage = 10;

function openUserManagementModal() {
    document.getElementById('userManagementModal').style.display = 'flex';
    loadAllUsers();
    toggleFabMenu();
}

function closeUserManagementModal() {
    document.getElementById('userManagementModal').style.display = 'none';
}

async function loadAllUsers() {
    try {
        // Load real users from database
        const result = await apiGetAllUsers();
        
        if (result.success && result.users) {
            // Convert API response to frontend format
            allUsers = result.users.map(user => ({
                id: user.id,
                name: user.fullName,
                username: user.username,
                email: user.email,
                role: user.role === 'student' ? 'student' : 'employee',
                status: user.status === 'نشط' ? 'active' : 'inactive',
                avatar: `/static/images/user${user.id}.jpg`,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin || null,
                phone: ''
            }));
            
            // Add any users created during chat room management that aren't in the database
            allAvailableMembers.forEach(member => {
                if (!allUsers.find(u => u.id === member.id)) {
                    allUsers.push({
                        ...member,
                        status: 'active',
                        createdAt: member.createdAt || new Date().toISOString(),
                        lastLogin: new Date().toISOString(),
                        phone: member.phone || ''
                    });
                }
            });
            
            console.log('Loaded real users from database. Total count:', allUsers.length);
            console.log('All users:', allUsers);
            
            filteredUsers = [...allUsers];
            currentPage = 1;
            displayUsers();
            updateUsersStats();
        } else {
            console.error('Failed to load users:', result.message || 'Unknown error');
            // Fallback to empty list if API fails
            allUsers = [];
            filteredUsers = [];
            displayUsers();
            updateUsersStats();
        }
    } catch (error) {
        console.error('Error loading users:', error);
        // Fallback to empty list if API fails
        allUsers = [];
        filteredUsers = [];
        displayUsers();
        updateUsersStats();
    }
}

function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    const startIndex = (currentPage - 1) * usersPerPage;
    const endIndex = startIndex + usersPerPage;
    const usersToDisplay = filteredUsers.slice(startIndex, endIndex);
    
    if (usersToDisplay.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="no-users">لا يوجد مستخدمون لعرضهم</td></tr>';
        return;
    }
    
    tbody.innerHTML = usersToDisplay.map(user => `
        <tr class="user-row">
            <td class="user-cell">
                <img src="${user.avatar || '/static/images/default-avatar.png'}" alt="${user.name}" class="user-avatar">
                <div class="user-info">
                    <span class="user-name">${user.name}</span>
                </div>
            </td>
            <td class="username-cell">${user.username}</td>
            <td class="email-cell">${user.email}</td>
            <td class="role-cell">
                <span class="role-badge ${user.role}">${getRoleText(user.role)}</span>
            </td>
            <td class="status-cell">
                <span class="status-badge ${user.status}">${getStatusText(user.status)}</span>
            </td>
            <td class="date-cell">${formatDate(user.createdAt)}</td>
            <td class="date-cell">${formatDate(user.lastLogin)}</td>
            <td class="actions-cell">
                <button class="action-btn chat-btn" onclick="openChatRoomForUser(${user.id})" title="فتح محادثة">
                    <i class="fas fa-comment"></i>
                </button>
                <button class="action-btn add-chat-btn" onclick="addUserToChatRoom(${user.id})" title="إضافة لكروب الدردشة">
                    <i class="fas fa-user-plus"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editUser(${user.id})" title="تعديل">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn suspend-btn" onclick="toggleUserStatus(${user.id})" title="${user.status === 'active' ? 'تعليق' : 'تفعيل'}">
                    <i class="fas ${user.status === 'active' ? 'fa-ban' : 'fa-check'}"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})" title="حذف المستخدم" style="display: flex !important; opacity: 1 !important; visibility: visible !important;">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        </tr>
    `).join('');
    
    updatePagination();
}

function getRoleText(role) {
    const roleMap = {
        'admin': 'مدير',
        'moderator': 'مشرف',
        'employee': 'موظف',
        'student': 'طالب'
    };
    return roleMap[role] || role;
}

function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateUsersStats() {
    const totalUsers = allUsers.length;
    const activeUsers = allUsers.filter(u => u.status === 'active').length;
    const inactiveUsers = allUsers.filter(u => u.status === 'inactive').length;
    const suspendedUsers = allUsers.filter(u => u.status === 'suspended').length;
    
    document.getElementById('totalUsers').textContent = totalUsers;
    document.getElementById('activeUsers').textContent = activeUsers;
    document.getElementById('inactiveUsers').textContent = inactiveUsers;
    document.getElementById('suspendedUsers').textContent = suspendedUsers;
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearchInput').value.toLowerCase();
    
    if (searchTerm === '') {
        filteredUsers = [...allUsers];
    } else {
        filteredUsers = allUsers.filter(user => 
            user.name.toLowerCase().includes(searchTerm) ||
            user.username.toLowerCase().includes(searchTerm) ||
            user.email.toLowerCase().includes(searchTerm)
        );
    }
    
    currentPage = 1;
    displayUsers();
}

function filterUsers() {
    const roleFilter = document.getElementById('roleFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    
    filteredUsers = allUsers.filter(user => {
        const roleMatch = roleFilter === 'all' || user.role === roleFilter;
        const statusMatch = statusFilter === 'all' || user.status === statusFilter;
        return roleMatch && statusMatch;
    });
    
    currentPage = 1;
    displayUsers();
}

function updatePagination() {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const paginationDiv = document.getElementById('usersPagination');
    
    if (totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let paginationHTML = '<div class="pagination-controls">';
    
    // Previous button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === 1 ? 'disabled' : ''}" 
                onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''}>
            <i class="fas fa-chevron-right"></i>
        </button>
    `;
    
    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}" 
                        onclick="changePage(${i})">${i}</button>
            `;
        } else if (i === currentPage - 2 || i === currentPage + 2) {
            paginationHTML += '<span class="pagination-dots">...</span>';
        }
    }
    
    // Next button
    paginationHTML += `
        <button class="pagination-btn ${currentPage === totalPages ? 'disabled' : ''}" 
                onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''}>
            <i class="fas fa-chevron-left"></i>
        </button>
    `;
    
    paginationHTML += '</div>';
    paginationDiv.innerHTML = paginationHTML;
}

function changePage(page) {
    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    if (page >= 1 && page <= totalPages) {
        currentPage = page;
        displayUsers();
    }
}

function openCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'flex';
    clearCreateUserForm();
}

function closeCreateUserModal() {
    document.getElementById('createUserModal').style.display = 'none';
}

function clearCreateUserForm() {
    document.getElementById('newUserName').value = '';
    document.getElementById('newUserUsername').value = '';
    document.getElementById('newUserEmail').value = '';
    document.getElementById('newUserRole').value = 'student';
    document.getElementById('newUserPassword').value = '';
    document.getElementById('newUserConfirmPassword').value = '';
    document.getElementById('newUserPhone').value = '';
}

function createNewUserAccount() {
    const name = document.getElementById('newUserName').value.trim();
    const username = document.getElementById('newUserUsername').value.trim();
    const email = document.getElementById('newUserEmail').value.trim();
    const role = document.getElementById('newUserRole').value;
    const password = document.getElementById('newUserPassword').value;
    const confirmPassword = document.getElementById('newUserConfirmPassword').value;
    const phone = document.getElementById('newUserPhone').value.trim();
    
    // Validation
    if (!name || !username || !email || !password || !confirmPassword) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمة المرور وتأكيدها غير متطابقين', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // Check if username already exists
    if (allUsers.some(u => u.username === username)) {
        showNotification('اسم المستخدم موجود بالفعل', 'error');
        return;
    }
    
    // Check if email already exists
    if (allUsers.some(u => u.email === email)) {
        showNotification('البريد الإلكتروني موجود بالفعل', 'error');
        return;
    }
    
    // Create new user
    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        email: email,
        role: role,
        password: password, // In real app, this would be hashed
        phone: phone,
        status: 'active',
        avatar: '/static/images/default-avatar.png',
        createdAt: new Date().toISOString(),
        lastLogin: null
    };
    
    allUsers.push(newUser);
    allAvailableMembers.push(newUser);
    
    // Update display
    filteredUsers = [...allUsers];
    displayUsers();
    updateUsersStats();
    
    closeCreateUserModal();
    showNotification(`تم إنشاء المستخدم ${name} بنجاح`, 'success');
}

function editUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        showNotification(`فتح تعديل المستخدم: ${user.name}`, 'info');
        // In real app, open edit modal
    }
}

function addUserToChatRoom(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        // Check if user is already in a chat room
        if (chatRoomMembers.some(member => member.id === userId)) {
            showNotification('هذا المستخدم موجود بالفعل في كروب الدردشة', 'warning');
            return;
        }
        
        // Add user to current chat room
        chatRoomMembers.push({
            ...user,
            joinedAt: new Date().toISOString(),
            role: 'member'
        });
        
        // Update member list
        updateMemberList();
        
        // If chat interface is open, update online members
        if (document.getElementById('chatInterfaceModal').style.display === 'flex') {
            onlineMembers.push({
                ...user,
                status: 'online',
                lastSeen: new Date().toISOString(),
                isTyping: false
            });
            updateMemberStatusList();
            updateRoomInfo();
        }
        
        showNotification(`تم إضافة ${user.name} إلى كروب الدردشة بنجاح`, 'success');
    }
}

function openChatRoomForUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        // Set current room info for this user
        currentRoom = {
            id: 'user_' + userId,
            name: `محادثة مع ${user.name}`,
            type: 'private',
            members: [user],
            createdAt: new Date().toISOString()
        };
        
        // Initialize chat with this user
        initializeChatRoom();
        
        // Open chat interface
        openChatInterfaceModal();
        
        // Add user to online members
        onlineMembers = [{
            ...user,
            status: 'online',
            lastSeen: new Date().toISOString(),
            isTyping: false
        }];
        
        updateMemberStatusList();
        updateRoomInfo();
        
        showNotification(`تم فتح محادثة مع ${user.name}`, 'success');
    }
}

function toggleUserStatus(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        if (user.status === 'active') {
            user.status = 'suspended';
            showNotification(`تم تعليق المستخدم: ${user.name}`, 'warning');
        } else {
            user.status = 'active';
            showNotification(`تم تفعيل المستخدم: ${user.name}`, 'success');
        }
        
        filteredUsers = [...allUsers];
        displayUsers();
        updateUsersStats();
    }
}

async function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        if (confirm(`هل أنت متأكد من حذف المستخدم: ${user.name}؟`)) {
            try {
                const result = await apiDeleteUser(userId);
                if (result.success) {
                    allUsers = allUsers.filter(u => u.id !== userId);
                    filteredUsers = [...allUsers];
                    displayUsers();
                    updateUsersStats();
                    showNotification(`تم حذف المستخدم: ${user.name}`, 'success');
                } else {
                    showNotification(result.message || 'فشل حذف المستخدم', 'error');
                }
            } catch (error) {
                showNotification('حدث خطأ أثناء حذف المستخدم', 'error');
            }
        }
    }
}

function exportUsers() {
    const csvContent = [
        ['الاسم', 'اسم المستخدم', 'البريد الإلكتروني', 'الدور', 'الحالة', 'تاريخ الإنشاء', 'آخر تسجيل دخول'],
        ...allUsers.map(user => [
            user.name,
            user.username,
            user.email,
            getRoleText(user.role),
            getStatusText(user.status),
            formatDate(user.createdAt),
            formatDate(user.lastLogin)
        ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showNotification('تم تصدير قائمة المستخدمين بنجاح', 'success');
}

function closeNotificationModal() {
    document.getElementById('notificationModal').style.display = 'none';
}

let targetUsers = [];
let allAvailableUsers = [];

// Load available users from API
function loadAvailableUsers() {
    allAvailableUsers = [];
}

function searchUsers() {
    const searchTerm = document.getElementById('userSearch').value.toLowerCase().trim();
    const searchResults = document.getElementById('userSearchResults');
    
    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const filteredUsers = allAvailableUsers.filter(user => 
        user.name.toLowerCase().includes(searchTerm) || 
        user.email.toLowerCase().includes(searchTerm)
    );
    
    if (filteredUsers.length > 0) {
        searchResults.innerHTML = `
            <h4>نتائج البحث:</h4>
            <div class="search-result-list">
                ${filteredUsers.map(user => `
                    <div class="member-item" onclick="addUserToNotification(${user.id})">
                        <div class="member-info">
                            <i class="fas fa-user"></i>
                            <div class="member-details">
                                <div class="member-name">${user.name}</div>
                                <div class="member-email">${user.email}</div>
                                <div class="member-role">${user.role === 'student' ? 'طالب' : 'موظف'}</div>
                            </div>
                        </div>
                        <button class="add-member-btn" onclick="addUserToNotification(${user.id})">
                            <i class="fas fa-plus"></i> إضافة
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<p class="no-results">لم يتم العثور على مستخدمين</p>';
        searchResults.style.display = 'block';
    }
}

function addUserToNotification(userId) {
    const user = allAvailableUsers.find(u => u.id === userId);
    if (user && !targetUsers.find(u => u.id === userId)) {
        targetUsers.push(user);
        updateTargetUsersList();
        showNotification(`تم إضافة ${user.name} إلى قائمة التنبيهات`, 'success');
        
        // Clear search
        document.getElementById('userSearch').value = '';
        document.getElementById('userSearchResults').style.display = 'none';
    }
}

function removeUserFromNotification(userId) {
    targetUsers = targetUsers.filter(u => u.id !== userId);
    updateTargetUsersList();
    showNotification('تم حذف المستخدم من قائمة التنبيهات', 'info');
}

function updateTargetUsersList() {
    const userList = document.getElementById('targetUsersList');
    if (targetUsers.length === 0) {
        userList.innerHTML = '<p class="no-members">لم يتم إضافة مستخدمين بعد</p>';
    } else {
        userList.innerHTML = targetUsers.map(user => `
            <div class="member-item added">
                <div class="member-info">
                    <i class="fas fa-user"></i>
                    <div class="member-details">
                        <div class="member-name">${user.name}</div>
                        <div class="member-email">${user.email}</div>
                        <div class="member-role">${user.role === 'student' ? 'طالب' : 'موظف'}</div>
                    </div>
                </div>
                <button class="remove-member-btn" onclick="removeUserFromNotification(${user.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

// Handle notification target change
function handleNotificationTargetChange() {
    const targetSelect = document.getElementById('notificationTarget');
    const targetUsersSection = document.getElementById('targetUsersSection');
    
    if (targetSelect.value === 'specific') {
        targetUsersSection.style.display = 'block';
    } else {
        targetUsersSection.style.display = 'none';
        targetUsers = []; // Clear specific targets when not using specific targeting
        updateTargetUsersList();
    }
}

// Handle message character count
function handleMessageInput() {
    const messageTextarea = document.getElementById('notificationMessage');
    const charCount = document.getElementById('notificationCharCount');
    const currentLength = messageTextarea.value.length;
    const maxLength = 500;
    
    charCount.textContent = `${currentLength} / ${maxLength}`;
    
    if (currentLength > maxLength) {
        charCount.style.color = '#dc3545';
    } else {
        charCount.style.color = '#6c757d';
    }
}

async function sendNotification() {
    const title = document.getElementById('notificationTitle').value.trim();
    const type = document.getElementById('notificationType').value;
    const priority = document.getElementById('notificationPriority').value;
    const target = document.getElementById('notificationTarget').value;
    const message = document.getElementById('notificationMessage').value.trim();
    
    if (!title || !message) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (target === 'specific' && targetUsers.length === 0) {
        showNotification('الرجاء إضافة مستخدم واحد على الأقل', 'error');
        return;
    }
    
    try {
        // Create notification data
        const notificationData = {
            title: title,
            type: type,
            priority: priority,
            target: target,
            message: message,
            targetUsers: target === 'specific' ? targetUsers : [],
            createdBy: currentUser.fullName,
            createdAt: new Date().toISOString()
        };
        
        // Here you would normally send to API
        showNotification('جاري إرسال التنبيه...', 'info');
        
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const targetText = target === 'all' ? 'جميع المستخدمين' : 
                          target === 'students' ? 'الطلاب فقط' : 
                          target === 'employees' ? 'الموظفين فقط' : 
                          `${targetUsers.length} مستخدمين محددين`;
        
        showNotification(`تم إرسال التنبيه "${title}" إلى ${targetText} بنجاح`, 'success');
        
        // Clear form
        document.getElementById('notificationTitle').value = '';
        document.getElementById('notificationType').value = 'general';
        document.getElementById('notificationPriority').value = 'medium';
        document.getElementById('notificationTarget').value = 'all';
        document.getElementById('notificationMessage').value = '';
        document.getElementById('notificationCharCount').textContent = '0 / 500';
        targetUsers = [];
        updateTargetUsersList();
        
        // Close modal
        closeNotificationModal();
        
    } catch (error) {
        console.error('Error sending notification:', error);
        showNotification('حدث خطأ في إرسال التنبيه', 'error');
    }
}

function openChatRoomModal() {
    const modal = document.getElementById('chatRoomModal');
    if (!modal) return;
    modal.style.display = 'flex';
    modal.classList.add('active');
    toggleFabMenu();
    loadChatRooms();
    refreshChatRoomJoinRequests();
    displayExistingChatRooms();
}
function displayExistingChatRooms() {
    const roomsList = document.getElementById('existingChatRoomsList');
    
    if (!roomsList) {
        console.error('[CHAT ROOMS] Existing rooms list element not found');
        return;
    }
    
    if (chatRooms.length === 0) {
        roomsList.innerHTML = `
            <div class="no-rooms">
                <i class="fas fa-comments"></i>
                <p>لا توجد كروبات منشأة بعد</p>
                <small>قم بإنشاء كروب جديد للبدء</small>
            </div>
        `;
        return;
    }
    
    roomsList.innerHTML = chatRooms.map(room => `
        <div class="room-item">
            <button type="button" class="room-button" onclick="viewChatRoom(${room.id})" title="عرض الكروب">
                <div class="room-info">
                    <h4>${room.name}</h4>
                    <p class="room-description">${room.description}</p>
                    <div class="room-meta">
                        <span class="room-type">${getRoomTypeText(room.type)}</span>
                        <span class="room-members">${room.memberCount || 0} عضو</span>
                        <span class="room-status">${room.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                    </div>
                </div>
            </button>
            <div class="room-actions">
                <button class="action-btn view-btn" onclick="viewChatRoom(${room.id})" title="عرض">
                    <i class="fas fa-eye"></i> <span>عرض</span>
                </button>
                <button class="action-btn edit-btn" onclick="editChatRoom(${room.id})" title="تعديل">
                    <i class="fas fa-edit"></i> <span>تعديل</span>
                </button>
                <button class="action-btn delete-btn" onclick="deleteChatRoom(${room.id})" title="حذف">
                    <i class="fas fa-trash"></i> <span>حذف</span>
                </button>
            </div>
        </div>
    `).join('');
}

function viewChatRoom(roomId) {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
        // Open chat interface with this room
        closeChatRoomModal();
        openChatInterfaceModal();
        selectRoom(roomId);
    }
}

function editChatRoom(roomId) {
    const room = chatRooms.find(r => r.id === roomId);
    if (room) {
        // Fill form with room data for editing
        document.getElementById('chatRoomName').value = room.name;
        document.getElementById('chatRoomDescription').value = room.description;
        document.getElementById('chatRoomType').value = room.type;
        document.getElementById('chatRoomMaxMembers').value = room.maxMembers;
        document.getElementById('chatRoomPrivacy').value = room.privacy;
        document.getElementById('chatRoomStatus').value = room.status;
        showNotification('جاري تحميل بيانات الكروب للتعديل', 'info');
    }
}

async function deleteChatRoom(roomId) {
    if (!confirm('هل أنت متأكد من حذف هذا الكروب؟')) {
        return;
    }
    
    try {
        // Note: Delete endpoint not implemented yet, showing notification
        showNotification('ميزة حذف الكروبات قيد التطوير', 'info');
    } catch (error) {
        console.error('[CHAT ROOMS] Error deleting chat room:', error);
        showNotification('حدث خطأ أثناء حذف الكروب', 'error');
    }
}

function closeChatRoomModal() {
    const modal = document.getElementById('chatRoomModal');
    if (!modal) return;
    modal.style.display = 'none';
    modal.classList.remove('active');
}

// Chat rooms functionality
let selectedRoomId = null;
let chatRooms = [];

async function loadChatRooms() {
    console.log('[CHAT ROOMS] Loading chat rooms...');
    try {
        const result = await apiGetChatRooms();
        console.log('[CHAT ROOMS] API result:', result);
        
        if (result.success) {
            chatRooms = result.chatRooms || [];
            console.log('[CHAT ROOMS] Loaded rooms:', chatRooms.length, 'for user:', currentUser.role);
            displayChatRooms();
            displayExistingChatRooms();
        } else {
            console.error('[CHAT ROOMS] Failed to load chat rooms:', result.message);
            // Fallback: show empty state
            const roomsList = document.getElementById('chatRoomsList');
            if (roomsList) {
                roomsList.innerHTML = '<p class="no-rooms">لا توجد كروبات متاحة</p>';
            }
        }
    } catch (error) {
        console.error('[CHAT ROOMS] Error loading chat rooms:', error);
        // Fallback: show empty state
        const roomsList = document.getElementById('chatRoomsList');
        if (roomsList) {
            roomsList.innerHTML = '<p class="no-rooms">خطأ في تحميل الكروبات</p>';
        }
    }
}

function displayChatRooms() {
    const roomsList = document.getElementById('chatRoomsList');
    
    if (!roomsList) {
        console.error('[CHAT ROOMS] Rooms list element not found');
        return;
    }
    
    if (chatRooms.length === 0) {
        roomsList.innerHTML = '<p class="no-rooms">لا توجد كروبات متاحة</p>';
        return;
    }
    
    roomsList.innerHTML = chatRooms.map(room => `
        <div class="room-card ${selectedRoomId === room.id ? 'selected' : ''}" onclick="selectRoom(${room.id})">
            <div class="room-info">
                <h5>${room.name}</h5>
                <p class="room-description">${room.description}</p>
                <div class="room-meta">
                    <span class="room-type">${getRoomTypeText(room.type)}</span>
                    <span class="room-members">${room.memberCount || 0} عضو</span>
                </div>
            </div>
            <div class="room-status">
                ${room.isMember ? 
                    '<span class="member-badge">عضو</span>' : 
                    '<span class="join-badge">انضم</span>'
                }
            </div>
        </div>
    `).join('');
}

function getRoomTypeText(type) {
    const types = {
        'general': 'عام',
        'study': 'دراسة',
        'project': 'مشروع',
        'contest': 'مسابقة',
        'announcement': 'إعلانات',
        'support': 'دعم فني',
        'private': 'خاص'
    };
    return types[type] || 'عام';
}

function selectRoom(roomId) {
    selectedRoomId = roomId;
    const room = chatRooms.find(r => r.id === roomId);
    
    if (room) {
        // Update current room info
        document.getElementById('currentRoomName').textContent = room.name;
        document.getElementById('currentRoomMembersCount').textContent = room.memberCount || 0;
        document.getElementById('onlineMembersCount').textContent = Math.floor((room.memberCount || 0) * 0.3); // Estimate online
        
        // Show/hide join button
        const joinBtn = document.getElementById('joinRoomBtn');
        if (joinBtn) {
            joinBtn.style.display = room.isMember ? 'none' : 'block';
        }
        
        // Refresh display
        displayChatRooms();
        
        // Load room messages if member
        if (room.isMember) {
            loadRoomMessages(roomId);
        } else {
            // Show join prompt
            const messagesDiv = document.getElementById('chatMessages');
            if (messagesDiv) {
                messagesDiv.innerHTML = `
                    <div class="join-prompt">
                        <i class="fas fa-user-plus"></i>
                        <h4>انضم إلى "${room.name}"</h4>
                        <p>${room.description}</p>
                        <p>اضغط على "طلب الانضمام" للانضمام إلى هذا الكروب</p>
                    </div>
                `;
            }
        }
    }
}

async function requestToJoinRoom() {
    if (!selectedRoomId) {
        showNotification('الرجاء اختيار كروب أولاً', 'error');
        return;
    }
    
    try {
        console.log('[CHAT ROOMS] Requesting to join room:', selectedRoomId);
        const result = await apiJoinChatRoom(selectedRoomId);
        
        if (result.success) {
            showNotification('تم إرسال طلب الانضمام بنجاح', 'success');
            // Refresh rooms list
            await loadChatRooms();
            // Select the room again to update UI
            selectRoom(selectedRoomId);
        } else {
            showNotification(result.message || 'فشل إرسال طلب الانضمام', 'error');
        }
    } catch (error) {
        console.error('[CHAT ROOMS] Error requesting to join room:', error);
        showNotification('حدث خطأ في إرسال طلب الانضمام', 'error');
    }
}

async function loadRoomMessages(roomId) {
    try {
        const result = await apiGetChatMessages(roomId);
        
        if (result.success) {
            displayMessages(result.messages || []);
        } else {
            console.error('[CHAT ROOMS] Failed to load messages:', result.message);
        }
    } catch (error) {
        console.error('[CHAT ROOMS] Error loading messages:', error);
    }
}

function displayMessages(messages) {
    const messagesDiv = document.getElementById('chatMessages');
    if (!messagesDiv) return;
    
    if (messages.length === 0) {
        messagesDiv.innerHTML = `
            <div class="welcome-message">
                <i class="fas fa-info-circle"></i>
                <span>لا توجد رسائل بعد. كن أول من يرسل رسالة!</span>
            </div>
        `;
        return;
    }
    
    messagesDiv.innerHTML = messages.map(msg => `
        <div class="message ${Number(msg.sender.id) === Number(currentUser.id) ? 'sent' : 'received'}">
            <div class="message-header">
                <strong>${msg.sender.fullName}</strong>
                <span class="message-time">${formatMessageTime(msg.createdAt)}</span>
            </div>
            <div class="message-content">${escapeHtml(msg.content)}</div>
        </div>
    `).join('');
    
    // Scroll to bottom
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatMessageTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
}

function escapeHtml(text) {
    if (text == null || text === '') return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Join Requests Management
let joinRequests = [];

async function loadJoinRequests() {
    console.log('[JOIN REQUESTS] Loading join requests...');
    try {
        const response = await fetch('/api/chat-rooms/join-requests', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        console.log('[JOIN REQUESTS] API result:', result);
        
        if (result.success) {
            joinRequests = result.joinRequests || [];
            displayJoinRequests();
            updateJoinRequestsCount();
        } else {
            console.error('[JOIN REQUESTS] Failed to load join requests:', result.message);
        }
    } catch (error) {
        console.error('[JOIN REQUESTS] Error loading join requests:', error);
    }
}

function displayJoinRequests() {
    // Show join requests section only for managers
    const joinRequestsSection = document.getElementById('joinRequestsSection');
    if (joinRequestsSection) {
        joinRequestsSection.style.display = currentUser.role === 'employee' ? 'block' : 'none';
    }
    
    const requestsList = document.getElementById('chatJoinRequestsList');
    
    if (!requestsList) {
        console.error('[JOIN REQUESTS] Chat requests list element not found');
        return;
    }
    
    if (joinRequests.length === 0) {
        requestsList.innerHTML = '<p class="no-requests">لا توجد طلبات انضمام معلقة</p>';
        updateChatJoinRequestsCount();
        return;
    }
    
    requestsList.innerHTML = joinRequests.map(request => `
        <div class="join-request-item">
            <div class="request-info">
                <div class="request-header">
                    <strong>${request.userName}</strong>
                    <span class="request-time">${formatRequestTime(request.createdAt)}</span>
                </div>
                <div class="request-details">
                    <p><strong>البريد:</strong> ${request.userEmail}</p>
                    <p><strong>الكروب:</strong> ${request.roomName}</p>
                </div>
            </div>
            <div class="request-actions">
                <button class="approve-btn" onclick="processJoinRequest(${request.id}, 'approve')">
                    <i class="fas fa-check"></i> قبول
                </button>
                <button class="reject-btn" onclick="processJoinRequest(${request.id}, 'reject')">
                    <i class="fas fa-times"></i> رفض
                </button>
            </div>
        </div>
    `).join('');
    
    updateChatJoinRequestsCount();
}

function updateJoinRequestsCount() {
    const countElement = document.getElementById('pendingJoinRequests');
    if (countElement) {
        countElement.textContent = joinRequests.length;
    }
}

function updateChatJoinRequestsCount() {
    const countElement = document.getElementById('chatPendingRequests');
    if (countElement) {
        countElement.textContent = joinRequests.length;
    }
}

function formatRequestTime(timestamp) {
    if (!timestamp) return 'غير محدد';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'الآن';
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    return date.toLocaleDateString('ar-SA');
}

async function processJoinRequest(requestId, action) {
    try {
        console.log(`[JOIN REQUESTS] Processing request ${requestId} with action: ${action}`);
        
        const response = await fetch(`/api/chat-rooms/join-requests/${requestId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken') || localStorage.getItem('token')}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: action })
        });
        
        const result = await response.json();
        console.log('[JOIN REQUESTS] Process result:', result);
        
        if (result.success) {
            showNotification(result.message, 'success');
            // Remove processed request from list
            joinRequests = joinRequests.filter(req => req.id !== requestId);
            displayJoinRequests();
            updateJoinRequestsCount();
            
            // Refresh chat rooms list if approved
            if (action === 'approve') {
                loadChatRooms();
            }
        } else {
            showNotification(result.message || 'فشل معالجة الطلب', 'error');
        }
    } catch (error) {
        console.error('[JOIN REQUESTS] Error processing request:', error);
        showNotification('حدث خطأ في معالجة الطلب', 'error');
    }
}

let chatRoomMembers = [];
let allAvailableMembers = [];

// Groups Management
let groupsData = [];
let currentGroupsTab = 'all';

function openGroupsManagementModal() {
    console.log('[GROUPS MGMT] Opening groups management modal...');
    const modal = document.getElementById('groupsManagementModal');
    console.log('[GROUPS MGMT] Modal element:', modal);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        console.log('[GROUPS MGMT] Modal display set to flex, active class added');
        loadGroupsData();
    } else {
        console.error('[GROUPS MGMT] Modal not found!');
        showNotification('خطأ: واجهة إدارة الكروبات غير موجودة', 'error');
    }
}

function closeGroupsManagementModal() {
    console.log('[GROUPS MGMT] Closing groups management modal');
    try {
        const modal = document.getElementById('groupsManagementModal');
        if (modal) {
            console.log('[GROUPS MGMT] Modal found, closing...');
            modal.style.display = 'none';
            modal.classList.remove('active');
            console.log('[GROUPS MGMT] Modal closed');
        } else {
            console.error('[GROUPS MGMT] Modal not found for closing');
        }
    } catch (error) {
        console.error('[GROUPS MGMT] Error closing modal:', error);
    }
}

// Test function for debugging
function testGroupsModal() {
    console.log('[TEST] Testing groups modal functionality...');
    console.log('[TEST] Modal element:', document.getElementById('groupsManagementModal'));
    console.log('[TEST] Function exists:', typeof openGroupsManagementModal);
    console.log('[TEST] All modals:', document.querySelectorAll('.modal'));
    
    // Try to open the modal
    try {
        openGroupsManagementModal();
    } catch (error) {
        console.error('[TEST] Error opening modal:', error);
    }
}

// Make test function available globally
window.testGroupsModal = testGroupsModal;

async function loadGroupsData() {
    console.log('[GROUPS MGMT] Loading groups data...');
    try {
        // Load chat rooms
        const roomsResult = await apiGetChatRooms();
        console.log('[GROUPS MGMT] Chat rooms API result:', roomsResult);
        
        if (roomsResult.success) {
            groupsData = roomsResult.chatRooms || [];
            console.log('[GROUPS MGMT] Loaded groups:', groupsData.length);
        } else {
            console.log('[GROUPS MGMT] API returned error, using empty data');
            groupsData = [];
            // Show error message but continue with empty data
            showNotification('لم يتم تحميل بيانات الكروبات: ' + (roomsResult.message || 'خطأ غير معروف'), 'warning');
        }

        // Load join requests
        try {
            await loadJoinRequests();
        } catch (joinError) {
            console.log('[GROUPS MGMT] Error loading join requests, continuing...');
            joinRequests = [];
        }

        // Update statistics
        updateGroupsStatistics();

        // Display current tab
        showGroupsTab(currentGroupsTab);

    } catch (error) {
        console.error('[GROUPS MGMT] Error loading groups data:', error);
        groupsData = [];
        joinRequests = [];
        
        // Show error in content area
        const content = document.getElementById('groupsContent');
        if (content) {
            content.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>حدث خطأ في تحميل البيانات</p>
                    <button class="primary-btn" onclick="loadGroupsData()">
                        <i class="fas fa-sync-alt"></i> إعادة المحاولة
                    </button>
                </div>
            `;
        }
        
        showNotification('خطأ في تحميل بيانات الكروبات', 'error');
    }
}

function updateGroupsStatistics() {
    // Update overview statistics
    document.getElementById('mgmtTotalGroups').textContent = groupsData.length;
    
    let totalMembers = 0;
    groupsData.forEach(group => {
        totalMembers += group.memberCount || 0;
    });
    document.getElementById('mgmtTotalMembers').textContent = totalMembers;
    document.getElementById('mgmtPendingRequests').textContent = joinRequests.length;

    // Update tab badges
    document.getElementById('allGroupsCount').textContent = groupsData.length;
    document.getElementById('activeGroupsCount').textContent = groupsData.filter(g => g.status === 'active').length;
    document.getElementById('totalMembersCount').textContent = totalMembers;
    document.getElementById('requestsCount').textContent = joinRequests.length;

    // Update dashboard counter
    document.getElementById('totalGroupsCount').textContent = groupsData.length;
}

function showGroupsTab(tab) {
    currentGroupsTab = tab;

    const tabBtnIds = {
        all: 'allGroupsTab',
        active: 'activeGroupsTab',
        members: 'membersTab',
        requests: 'requestsTab'
    };
    const activeBtnId = tabBtnIds[tab];
    document.querySelectorAll('.groups-tabs .tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    const activeBtn = activeBtnId ? document.getElementById(activeBtnId) : null;
    if (activeBtn) {
        activeBtn.classList.add('active');
    }

    const content = document.getElementById('groupsContent');
    
    switch(tab) {
        case 'all':
            displayAllGroups(content);
            break;
        case 'active':
            displayActiveGroups(content);
            break;
        case 'members':
            displayAllMembers(content);
            break;
        case 'requests':
            displayJoinRequests(content);
            break;
    }
}

function displayAllGroups(container) {
    if (groupsData.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>لا توجد كروبات بعد</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="groups-grid">
            ${groupsData.map(group => `
                <div class="group-card" onclick="openChatRoomById(${group.id})">
                    <div class="group-header">
                        <h4>${group.name}</h4>
                        <span class="group-status ${group.status}">${getStatusText(group.status)}</span>
                    </div>
                    <div class="group-details">
                        <p class="group-description">${group.description || 'لا يوجد وصف'}</p>
                        <div class="group-meta">
                            <span class="group-type">${getTypeText(group.type)}</span>
                            <span class="group-privacy">${getPrivacyText(group.privacy)}</span>
                        </div>
                        <div class="group-stats">
                            <div class="stat">
                                <i class="fas fa-users"></i>
                                <span>${group.memberCount || 0} عضو</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-comments"></i>
                                <span>${group.messageCount || 0} رسالة</span>
                            </div>
                        </div>
                        <div class="group-info">
                            <p><strong>المنشئ:</strong> ${group.createdBy || 'غير معروف'}</p>
                            <p><strong>إنشاء:</strong> ${formatDate(group.createdAt)}</p>
                        </div>
                    </div>
                    <div class="group-actions">
                        <button class="primary-btn" onclick="event.stopPropagation(); openChatRoomById(${group.id})">
                            <i class="fas fa-comments"></i> فتح الكروب
                        </button>
                        <button class="secondary-btn" onclick="event.stopPropagation(); manageGroupModerators(${group.id})">
                            <i class="fas fa-user-shield"></i> تعيين مشرفين
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function openChatRoomById(roomId) {
    const room = groupsData.find(r => r.id === roomId);
    if (!room) return;
    closeGroupsManagementModal();
    await loadChatRooms();
    openChatInterfaceModal();
    selectRoom(roomId);
}

function manageGroupModerators(roomId) {
    const room = groupsData.find(r => r.id === roomId);
    if (room) {
        showNotification('جاري فتح واجهة تعيين المشرفين للكروب: ' + room.name, 'info');
        // TODO: Implement moderator assignment interface
    }
}

function displayActiveGroups(container) {
    const activeGroups = groupsData.filter(g => g.status === 'active');
    displayAllGroups(container);
    // Filter to show only active groups
    if (activeGroups.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>لا توجد كروبات نشطة</p></div>';
        return;
    }
    
    container.innerHTML = `
        <div class="groups-grid">
            ${activeGroups.map(group => `
                <div class="group-card active">
                    <div class="group-header">
                        <h4>${group.name}</h4>
                        <span class="group-status active">نشط</span>
                    </div>
                    <div class="group-details">
                        <p class="group-description">${group.description || 'لا يوجد وصف'}</p>
                        <div class="group-stats">
                            <div class="stat">
                                <i class="fas fa-users"></i>
                                <span>${group.memberCount || 0} عضو</span>
                            </div>
                            <div class="stat">
                                <i class="fas fa-comments"></i>
                                <span>${group.messageCount || 0} رسالة</span>
                            </div>
                        </div>
                    </div>
                    <div class="group-actions">
                        <button class="primary-btn" onclick="viewGroupDetails(${group.id})">
                            <i class="fas fa-eye"></i> عرض التفاصيل
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function displayAllMembers(container) {
    let allMembers = [];
    
    groupsData.forEach(group => {
        if (group.members) {
            group.members.forEach(member => {
                allMembers.push({
                    ...member,
                    groupName: group.name,
                    groupId: group.id
                });
            });
        }
    });

    if (allMembers.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-users"></i><p>لا يوجد أعضاء في الكروبات</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="members-management-header">
            <h3>إدارة أعضاء الكروبات</h3>
            <p>يمكنك إزالة الأعضاء من الكروبات من هنا</p>
        </div>
        <div class="members-table">
            <table>
                <thead>
                    <tr>
                        <th>العضو</th>
                        <th>الكروب</th>
                        <th>الدور</th>
                        <th>تاريخ الانضمام</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${allMembers.map(member => `
                        <tr>
                            <td>
                                <div class="member-info">
                                    <div class="member-avatar">
                                        <i class="fas fa-user"></i>
                                    </div>
                                    <div class="member-details">
                                        <strong>${member.fullName || member.username}</strong>
                                        <small>${member.email}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${member.groupName}</td>
                            <td><span class="role-badge">${getRoleText(member.role)}</span></td>
                            <td>${formatDate(member.joinedAt)}</td>
                            <td>
                                <button class="delete-member-btn" onclick="removeMemberFromGroup(${member.groupId}, '${member.userId}')" title="حذف من إدارة كروب الدردشة">
                                    <i class="fas fa-trash-alt"></i> حذف من إدارة كروب الدردشة
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

function displayJoinRequests(container) {
    if (joinRequests.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fas fa-user-plus"></i><p>لا توجد طلبات انضمام معلقة</p></div>';
        return;
    }

    container.innerHTML = `
        <div class="requests-table">
            <table>
                <thead>
                    <tr>
                        <th>الطالب</th>
                        <th>الكروب</th>
                        <th>تاريخ الطلب</th>
                        <th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${joinRequests.map(request => `
                        <tr>
                            <td>
                                <div class="member-info">
                                    <div class="member-avatar">
                                        <i class="fas fa-user-graduate"></i>
                                    </div>
                                    <div class="member-details">
                                        <strong>${request.userName}</strong>
                                        <small>${request.userEmail}</small>
                                    </div>
                                </div>
                            </td>
                            <td>${request.roomName}</td>
                            <td>${formatRequestTime(request.createdAt)}</td>
                            <td>
                                <div class="request-actions">
                                    <button class="approve-btn" onclick="processJoinRequest(${request.id}, 'approve')">
                                        <i class="fas fa-check"></i> قبول
                                    </button>
                                    <button class="reject-btn" onclick="processJoinRequest(${request.id}, 'reject')">
                                        <i class="fas fa-times"></i> رفض
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function refreshGroupsData() {
    await loadGroupsData();
    showNotification('تم تحديث البيانات', 'success');
}

function exportGroupsData() {
    if (!groupsData.length) {
        showNotification('لا توجد بيانات للتصدير', 'warning');
        return;
    }
    let csv = 'اسم الكروب,الوصف,نوع الكروب,الخصوصية,الحالة,عدد الأعضاء,عدد الرسائل,المنشئ,تاريخ الإنشاء\n';

    groupsData.forEach(group => {
        csv += `"${group.name}","${group.description || ''}","${getTypeText(group.type)}","${getPrivacyText(group.privacy)}","${getStatusText(group.status)}","${group.memberCount || 0}","${group.messageCount || 0}","${group.createdBy || ''}","${formatDate(group.createdAt)}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `groups_data_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('تم تصدير بيانات الكروبات بنجاح', 'success');
}

// Helper functions
function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'archived': 'مؤرشف',
        'readonly': 'للقراءة فقط',
        'suspended': 'معلق',
        'pending': 'قيد الانتظار',
        'approved': 'موافق',
        'rejected': 'مرفوض'
    };
    return statusMap[status] || status;
}

function getTypeText(type) {
    const typeMap = {
        'general': 'عام',
        'contest': 'مسابقة',
        'study': 'دراسة',
        'announcement': 'إعلانات',
        'private': 'خاص',
        'support': 'دعم فني',
        'project': 'مشروع'
    };
    return typeMap[type] || type;
}

function getPrivacyText(privacy) {
    const privacyMap = {
        'public': 'عام',
        'private': 'خاص',
        'invite-only': 'دعوة فقط'
    };
    return privacyMap[privacy] || privacy;
}

function getRoleText(role) {
    const roleMap = {
        'admin': 'مدير',
        'moderator': 'مشرف',
        'member': 'عضو'
    };
    return roleMap[role] || role;
}

function viewGroupDetails(groupId) {
    // Open chat interface and select the group
    openChatInterfaceModal();
    setTimeout(() => {
        selectChatRoom(groupId);
    }, 500);
}

function manageGroupMembers(groupId) {
    openChatInterfaceModal();
    setTimeout(() => {
        if (typeof selectChatRoom === 'function') {
            selectChatRoom(groupId);
        } else {
            selectRoom(groupId);
        }
    }, 400);
}

async function removeMemberFromGroup(groupId, userId) {
    if (confirm('هل أنت متأكد من إزالة هذا العضو من الكروب؟')) {
        try {
            console.log('[GROUPS MGMT] Removing member from group:', groupId, userId);
            
            const result = await apiRemoveMemberFromChatRoom(groupId, userId);
            
            if (result.success) {
                showNotification('تم إزالة العضو من الكروب بنجاح', 'success');
                refreshGroupsData();
                
                // Also refresh chat rooms data
                if (typeof loadChatRooms === 'function') {
                    await loadChatRooms();
                }
            } else {
                showNotification(result.message || 'فشل في إزالة العضو', 'error');
            }
        } catch (error) {
            console.error('[GROUPS MGMT] Error removing member:', error);
            showNotification('حدث خطأ في إزالة العضو', 'error');
        }
    }
}

// Load available members from API
function loadAvailableMembers() {
    allAvailableMembers = [];
}

function searchMembers() {
    const searchTerm = document.getElementById('memberSearch').value.toLowerCase().trim();
    const searchResults = document.getElementById('memberSearchResults');
    
    if (searchTerm.length < 2) {
        searchResults.style.display = 'none';
        return;
    }
    
    const filteredMembers = allAvailableMembers.filter(member => 
        member.name.toLowerCase().includes(searchTerm) || 
        member.email.toLowerCase().includes(searchTerm)
    );
    
    if (filteredMembers.length > 0) {
        searchResults.innerHTML = `
            <h4>نتائج البحث:</h4>
            <div class="search-result-list">
                ${filteredMembers.map(member => `
                    <div class="member-item" onclick="addMemberToChatRoom(${member.id})">
                        <div class="member-info">
                            <i class="fas fa-user"></i>
                            <div class="member-details">
                                <div class="member-name">${member.name}</div>
                                <div class="member-email">${member.email}</div>
                            </div>
                        </div>
                        <button class="add-member-btn" onclick="addMemberToChatRoom(${member.id})">
                            <i class="fas fa-plus"></i> إضافة
                        </button>
                    </div>
                `).join('')}
            </div>
        `;
        searchResults.style.display = 'block';
    } else {
        searchResults.innerHTML = '<p class="no-results">لم يتم العثور على أعضاء</p>';
        searchResults.style.display = 'block';
    }
}

function addMemberToChatRoom(memberId) {
    const member = allAvailableMembers.find(m => m.id === memberId);
    if (member && !chatRoomMembers.find(m => m.id === memberId)) {
        chatRoomMembers.push(member);
        updateMemberList();
        showNotification(`تم إضافة ${member.name} إلى الكروب`, 'success');
        
        // Clear search
        document.getElementById('memberSearch').value = '';
        document.getElementById('memberSearchResults').style.display = 'none';
    }
}

function removeMemberFromChatRoom(memberId) {
    chatRoomMembers = chatRoomMembers.filter(m => m.id !== memberId);
    updateMemberList();
    showNotification('تم حذف العضو من الكروب', 'info');
}

async function createChatRoom() {
    console.log('[CHAT ROOM] createChatRoom function called');
    console.log('[CHAT ROOM] Current user:', currentUser);
    console.log('[CHAT ROOM] User authenticated:', !!currentUser);
    
    if (!currentUser) {
        console.error('[CHAT ROOM] No current user found');
        showNotification('يجب تسجيل الدخول لإنشاء الكروبات', 'error');
        return;
    }
    
    try {
        // Check if elements exist
        const nameElement = document.getElementById('chatRoomName');
        const descElement = document.getElementById('chatRoomDescription');
        
        console.log('[CHAT ROOM] Form elements:', {
            nameElement: !!nameElement,
            descElement: !!descElement,
            nameValue: nameElement?.value,
            descValue: descElement?.value
        });
        
        if (!nameElement || !descElement) {
            console.error('[CHAT ROOM] Required elements not found');
            showNotification('عناصر النموذج غير موجودة', 'error');
            return;
        }
        
        const name = nameElement.value.trim();
        const description = descElement.value.trim();
        const type = document.getElementById('chatRoomType')?.value || 'general';
        const maxMembers = document.getElementById('chatRoomMaxMembers')?.value || '50';
        const privacy = document.getElementById('chatRoomPrivacy')?.value || 'public';
        const status = document.getElementById('chatRoomStatus')?.value || 'active';
        const rules = document.getElementById('chatRoomRules')?.value?.trim() || '';
        const tags = document.getElementById('chatRoomTags')?.value?.trim() || '';
        const messageRetention = document.getElementById('chatRoomMessageRetention')?.value || 'forever';
        const fileSharing = document.getElementById('chatRoomFileSharing')?.value || 'enabled';
        const maxFileSize = document.getElementById('chatRoomMaxFileSize')?.value || '10';
        const allowedFileTypes = document.getElementById('chatRoomAllowedFileTypes')?.value || 'pdf, doc, docx, jpg, png, zip';
        const welcomeMessage = document.getElementById('chatRoomWelcomeMessage')?.value?.trim() || '';
        const notifications = document.getElementById('chatRoomNotifications')?.checked || false;
        const encryption = document.getElementById('chatRoomEncryption')?.checked || false;
        const autoMod = document.getElementById('chatRoomAutoMod')?.checked || false;
        const readOnly = document.getElementById('chatRoomReadOnly')?.checked || false;
        const adminRoleElement = document.getElementById('adminRole');
        const adminRole = adminRoleElement ? adminRoleElement.value : '';
        console.log('[CHAT ROOM] Admin role element:', adminRoleElement, 'value:', adminRole);
        
        console.log('[CHAT ROOM] Form data collected:', {
            name, description, type, maxMembers, privacy, status,
            chatRoomMembersLength: chatRoomMembers?.length || 0
        });
        
        if (!name || !description) {
            showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
            return;
        }
        
        // If no members added, automatically add the creator as a member
        if (!chatRoomMembers || chatRoomMembers.length === 0) {
            console.log('[CHAT ROOM] No members found, adding creator as member');
            chatRoomMembers = [{
                id: currentUser.id,
                name: currentUser.fullName,
                username: currentUser.username,
                email: currentUser.email,
                role: currentUser.role === 'employee' ? 'admin' : 'member'
            }];
            console.log('[CHAT ROOM] Added creator as member:', chatRoomMembers);
        }
        
        console.log('[CHAT ROOM] All validations passed, proceeding with creation...');
        
        // Simplified chat room data - only send essential fields
        const chatRoomData = {
            name: name,
            description: description,
            type: type || 'general',
            maxMembers: parseInt(maxMembers) || 50,
            privacy: privacy || 'public',
            members: chatRoomMembers || []
        };
        
        console.log('[CHAT ROOM] Sending simplified data:', chatRoomData);
        showNotification('جاري إنشاء الكروب...', 'info');
        
        // Send to real API
        console.log('[CHAT ROOM] Calling apiCreateChatRoom...');
        const result = await apiCreateChatRoom(chatRoomData);
        
        console.log('[CHAT ROOM] API result:', result);
        console.log('[CHAT ROOM] API result success:', result.success);
        console.log('[CHAT ROOM] API result message:', result.message);
        
        if (result.success) {
            showNotification(`تم إنشاء كروب "${name}" بنجاح`, 'success');
            
            // Clear form and reset data
            document.getElementById('chatRoomName').value = '';
            document.getElementById('chatRoomDescription').value = '';
            document.getElementById('chatRoomType').value = 'general';
            document.getElementById('chatRoomMaxMembers').value = '50';
            document.getElementById('chatRoomPrivacy').value = 'public';
            document.getElementById('chatRoomStatus').value = 'active';
            document.getElementById('chatRoomRules').value = '';
            document.getElementById('chatRoomTags').value = '';
            document.getElementById('chatRoomMessageRetention').value = 'forever';
            document.getElementById('chatRoomFileSharing').value = 'enabled';
            document.getElementById('chatRoomMaxFileSize').value = '10';
            document.getElementById('chatRoomAllowedFileTypes').value = 'pdf, doc, docx, jpg, png, zip';
            document.getElementById('chatRoomWelcomeMessage').value = '';
            document.getElementById('chatRoomNotifications').checked = true;
            document.getElementById('chatRoomEncryption').checked = false;
            document.getElementById('chatRoomAutoMod').checked = true;
            document.getElementById('chatRoomReadOnly').checked = false;
            document.getElementById('adminRole').value = '';
            
            // Clear the chat room members array after successful creation
            chatRoomMembers = [];
            updateChatRoomStats();
            updateMemberList();
            if (typeof updateRoleAssignments === 'function') {
                updateRoleAssignments();
            }

            await loadChatRooms();
            displayExistingChatRooms();
            const totalEl = document.getElementById('totalGroupsCount');
            if (totalEl && Array.isArray(chatRooms)) {
                totalEl.textContent = String(chatRooms.length);
            }

            closeChatRoomModal();
        } else {
            console.error('[CHAT ROOM] Creation failed:', result.message);
            showNotification(result.message || 'فشل إنشاء الكروب', 'error');
            return;
        }
    } catch (error) {
        console.error('Error creating chat room:', error);
        showNotification('حدث خطأ في إنشاء الكروب', 'error');
    }
}

function updateRoleAssignments() {
    const adminSelect = document.getElementById('adminRole');
    const moderatorSelection = document.querySelector('.moderator-selection');
    if (!adminSelect) return;

    adminSelect.innerHTML = '<option value="">اختر مدير الكروب</option>';
    chatRoomMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        adminSelect.appendChild(option);
    });

    if (!moderatorSelection) return;

    moderatorSelection.innerHTML = '';
    if (chatRoomMembers.length > 0) {
        moderatorSelection.innerHTML = `
            <div class="moderator-checkboxes">
                ${chatRoomMembers.map(member => `
                    <label class="checkbox-label">
                        <input type="checkbox" name="moderators" value="${member.id}">
                        <span>${member.name}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }
}

function updateMemberList() {
    const memberList = document.getElementById('chatRoomMembers');
    if (!memberList) return;
    if (chatRoomMembers.length === 0) {
        memberList.innerHTML = '<p class="no-members">لم يتم إضافة أعضاء بعد</p>';
    } else {
        memberList.innerHTML = chatRoomMembers.map(member => `
            <div class="member-item added">
                <div class="member-info">
                    <i class="fas fa-user"></i>
                    <div class="member-details">
                        <div class="member-name">${member.name}</div>
                        <div class="member-email">${member.email}</div>
                        <div class="member-role">${member.role === 'student' ? 'طالب' : 'موظف'}</div>
                    </div>
                </div>
                <div class="member-actions">
                    <button class="role-btn" onclick="assignRole(${member.id})" title="تعيين دور">
                        <i class="fas fa-user-tag"></i>
                    </button>
                    <button class="remove-member-btn" onclick="removeMemberFromChatRoom(${member.id})">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    // Update role assignments when member list changes
    updateRoleAssignments();
}

function assignRole(memberId) {
    const member = chatRoomMembers.find(m => m.id === memberId);
    if (member) {
        // Toggle between member and moderator role
        member.isModerator = !member.isModerator;
        updateMemberList();
        showNotification(`تم تغيير دور ${member.name} إلى ${member.isModerator ? 'مشرف' : 'عضو'}`, 'info');
    }
}

function checkUsernameAvailability(event) {
    const username = document.getElementById('usernameInput').value.trim();
    const statusDiv = document.getElementById('usernameStatus');
    
    if (username.length < 3) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 3 أحرف على الأقل</span>';
        return;
    }
    
    if (username.length > 20) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 20 حرف كحد أقصى</span>';
        return;
    }
    
    // Check if username is already added to the room
    if (chatRoomMembers.some(member => member.username === username)) {
        statusDiv.innerHTML = '<span class="status-error">هذا المستخدم موجود بالفعل في الكروب</span>';
        return;
    }
    
    // Simulate real-time user existence check
    statusDiv.innerHTML = '<span class="status-info">جاري التحقق من وجود المستخدم...</span>';
    
    // Simulate API call to check user existence
    setTimeout(() => {
        const userExists = checkUserExistsInSystem(username);
        
        if (userExists.exists) {
            statusDiv.innerHTML = `
                <div class="user-found">
                    <span class="status-success">المستخدم موجود في النظام</span>
                    <div class="user-preview">
                        <img src="${userExists.avatar || '/static/images/default-avatar.png'}" alt="${userExists.name}" class="preview-avatar">
                        <div class="preview-info">
                            <strong>${userExists.name}</strong>
                            <small>${userExists.email}</small>
                            <span class="user-status ${userExists.status}">${userExists.status === 'active' ? 'نشط' : 'غير نشط'}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            statusDiv.innerHTML = `
                <div class="user-not-found">
                    <span class="status-warning">المستخدم غير موجود في النظام</span>
                    <div class="create-user-option">
                        <p>هل تريد إنشاء حساب جديد لهذا المستخدم؟</p>
                        <button class="create-user-btn" onclick="createNewUser('${username}')">
                            <i class="fas fa-user-plus"></i> إنشاء مستخدم جديد
                        </button>
                    </div>
                </div>
            `;
        }
    }, 1000); // Simulate network delay
    
    // Allow adding with Enter key
    if (event.key === 'Enter') {
        addMemberByUsername();
    }
}

function checkUserExistsInSystem(username) {
    // Combine all available users from different sources
    const allSystemUsers = [
        // Mock users from initial setup
        {
            id: 1,
            username: 'ahmed_student',
            name: 'أحمد محمد',
            email: 'ahmed@university.edu',
            avatar: '/static/images/user1.jpg',
            status: 'active',
            role: 'student'
        },
        {
            id: 2,
            username: 'fatima_student',
            name: 'فاطمة علي',
            email: 'fatima@university.edu',
            avatar: '/static/images/user2.jpg',
            status: 'active',
            role: 'student'
        },
        {
            id: 3,
            username: 'mohammed_student',
            name: 'محمد خالد',
            email: 'mohammed@university.edu',
            avatar: '/static/images/user3.jpg',
            status: 'inactive',
            role: 'student'
        },
        {
            id: 4,
            username: 'admin',
            name: 'المدير العام',
            email: 'admin@university.edu',
            avatar: '/static/images/admin.jpg',
            status: 'active',
            role: 'admin'
        }
    ];
    
    // Add users from allAvailableMembers (created during chat room management)
    allAvailableMembers.forEach(member => {
        if (!allSystemUsers.find(u => u.id === member.id)) {
            allSystemUsers.push({
                ...member,
                status: member.status || 'active'
            });
        }
    });
    
    // Add users from allUsers (created through user management)
    allUsers.forEach(user => {
        if (!allSystemUsers.find(u => u.id === user.id)) {
            allSystemUsers.push({
                ...user,
                status: user.status || 'active'
            });
        }
    });
    
    // Enhanced search with multiple matching strategies
    const user = allSystemUsers.find(u => {
        const usernameLower = username.toLowerCase();
        const storedUsernameLower = u.username.toLowerCase();
        const storedNameLower = u.name.toLowerCase();
        
        // Exact username match
        if (storedUsernameLower === usernameLower) {
            return true;
        }
        
        // Partial username match
        if (storedUsernameLower.includes(usernameLower) || usernameLower.includes(storedUsernameLower)) {
            return true;
        }
        
        // Name match
        if (storedNameLower.includes(usernameLower) || usernameLower.includes(storedNameLower)) {
            return true;
        }
        
        // Email match
        if (u.email && u.email.toLowerCase().includes(usernameLower)) {
            return true;
        }
        
        return false;
    });
    
    console.log('Searching for user:', username);
    console.log('Available users:', allSystemUsers);
    console.log('Found user:', user);
    
    return {
        exists: !!user,
        ...user
    };
}

function createNewUser(username) {
    const statusDiv = document.getElementById('usernameStatus');
    
    // Show loading state
    statusDiv.innerHTML = '<span class="status-info">جاري إنشاء مستخدم جديد...</span>';
    
    // Simulate user creation
    setTimeout(() => {
        const newUser = {
            id: Date.now(),
            username: username,
            name: username,
            email: `${username}@university.edu`,
            avatar: '/static/images/default-avatar.png',
            role: 'student',
            status: 'active',
            createdAt: new Date().toISOString()
        };
        
        // Add to available users list
        allAvailableMembers.push(newUser);
        
        // Show success message
        statusDiv.innerHTML = `
            <div class="user-created">
                <span class="status-success">تم إنشاء المستخدم بنجاح</span>
                <div class="user-preview">
                    <img src="${newUser.avatar}" alt="${newUser.name}" class="preview-avatar">
                    <div class="preview-info">
                        <strong>${newUser.name}</strong>
                        <small>${newUser.email}</small>
                        <span class="user-status active">نشط</span>
                    </div>
                </div>
                <button class="add-to-room-btn" onclick="addCreatedUserToRoom(${newUser.id})">
                    <i class="fas fa-user-plus"></i> إضافة للكروب
                </button>
            </div>
        `;
        
        showNotification(`تم إنشاء مستخدم جديد: ${username}`, 'success');
    }, 1500);
}

function addCreatedUserToRoom(userId) {
    const user = allAvailableMembers.find(u => u.id === userId);
    if (user) {
        // Check if already in room
        if (chatRoomMembers.some(member => member.username === user.username)) {
            showNotification('هذا المستخدم موجود بالفعل في الكروب', 'error');
            return;
        }
        
        // Add to chat room members
        chatRoomMembers.push(user);
        updateMemberList();
        
        // Clear input and status
        document.getElementById('usernameInput').value = '';
        document.getElementById('usernameStatus').innerHTML = '';
        
        showNotification(`تم إضافة ${user.name} إلى الكروب بنجاح`, 'success');
        
        // Update member status list if chat is open
        if (document.getElementById('chatInterfaceModal').style.display === 'flex') {
            onlineMembers.push({
                ...user,
                status: 'online',
                lastSeen: new Date().toISOString(),
                isTyping: false
            });
            updateMemberStatusList();
            updateRoomInfo();
        }
    }
}

function addMemberByUsername() {
    const username = document.getElementById('usernameInput').value.trim();
    const statusDiv = document.getElementById('usernameStatus');
    
    if (!username) {
        statusDiv.innerHTML = '<span class="status-error">الرجاء إدخال اسم المستخدم</span>';
        return;
    }
    
    if (username.length < 3) {
        statusDiv.innerHTML = '<span class="status-error">اسم المستخدم يجب أن يكون 3 أحرف على الأقل</span>';
        return;
    }
    
    // Check if already added
    if (chatRoomMembers.some(member => member.username === username)) {
        showNotification('هذا المستخدم موجود بالفعل في الكروب', 'error');
        return;
    }
    
    // Check if user exists in system
    const userCheck = checkUserExistsInSystem(username);
    
    if (userCheck.exists) {
        // Add existing user to room
        chatRoomMembers.push(userCheck);
        updateMemberList();
        
        // Clear input and status
        document.getElementById('usernameInput').value = '';
        statusDiv.innerHTML = '';
        
        showNotification(`تم إضافة ${userCheck.name} إلى الكروب بنجاح`, 'success');
        
        // Update member status list if chat is open
        if (document.getElementById('chatInterfaceModal').style.display === 'flex') {
            onlineMembers.push({
                ...userCheck,
                status: 'online',
                lastSeen: new Date().toISOString(),
                isTyping: false
            });
            updateMemberStatusList();
            updateRoomInfo();
        }
    } else {
        // Show option to create new user
        statusDiv.innerHTML = `
            <div class="user-not-found">
                <span class="status-warning">المستخدم غير موجود في النظام</span>
                <div class="create-user-option">
                    <p>هل تريد إنشاء حساب جديد لهذا المستخدم؟</p>
                    <button class="create-user-btn" onclick="createNewUser('${username}')">
                        <i class="fas fa-user-plus"></i> إنشاء مستخدم جديد
                    </button>
                </div>
            </div>
        `;
    }
}

// Video Reels Modal Functions
function openVideoReelModal() {
    document.getElementById('videoReelModal').style.display = 'flex';
    toggleFabMenu();
}

function closeVideoReelModal() {
    document.getElementById('videoReelModal').style.display = 'none';
    // Clear preview
    document.getElementById('videoPreview').style.display = 'none';
    document.getElementById('previewVideo').src = '';
    document.getElementById('previewThumbnail').src = '';
}

function handleVideoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Update file info
        document.getElementById('videoFileInfo').textContent = `تم اختيار: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        
        // Show video preview
        const videoPreview = document.getElementById('videoPreview');
        const previewVideo = document.getElementById('previewVideo');
        
        videoPreview.style.display = 'block';
        previewVideo.src = URL.createObjectURL(file);
    }
}

function handleThumbnailSelect(event) {
    const file = event.target.files[0];
    if (file) {
        // Update file info
        document.getElementById('thumbnailFileInfo').textContent = `تم اختيار: ${file.name}`;
        
        // Show thumbnail preview
        const previewThumbnail = document.getElementById('previewThumbnail');
        previewThumbnail.src = URL.createObjectURL(file);
    }
}

async function submitVideoReel() {
    const title = document.getElementById('videoTitle').value.trim();
    const description = document.getElementById('videoDescription').value.trim();
    const category = document.getElementById('videoCategory').value;
    const tags = document.getElementById('videoTags').value.trim();
    const videoFile = document.getElementById('videoFile').files[0];
    const thumbnailFile = document.getElementById('videoThumbnail').files[0];
    
    if (!title || !description || !videoFile) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        showNotification('جاري نشر الفيديو...', 'info');
        
        // For now, use a placeholder URL since we don't have file upload functionality
        // In a real implementation, you would upload the file to a server and get the URL
        const videoUrl = URL.createObjectURL(videoFile);
        const thumbnailUrl = thumbnailFile ? URL.createObjectURL(thumbnailFile) : '';
        
        const videoData = {
            title: title,
            description: description,
            category: category,
            tags: tags.split(',').map(t => t.trim()).filter(t => t),
            video_url: videoUrl,
            thumbnail_url: thumbnailUrl,
            status: 'published',
            visibility: 'public'
        };
        
        const result = await apiCreateVideo(videoData);
        
        if (result.success) {
            showNotification('تم نشر الفيديو بنجاح', 'success');
            
            // Clear form
            document.getElementById('videoTitle').value = '';
            document.getElementById('videoDescription').value = '';
            document.getElementById('videoCategory').value = 'general';
            document.getElementById('videoTags').value = '';
            document.getElementById('videoFile').value = '';
            document.getElementById('videoThumbnail').value = '';
            document.getElementById('videoFileInfo').textContent = 'لم يتم اختيار ملف بعد';
            document.getElementById('thumbnailFileInfo').textContent = 'لم يتم اختيار صورة بعد';
            
            // Close modal
            closeVideoReelModal();
        } else {
            showNotification(result.message || 'فشل نشر الفيديو', 'error');
        }
        
    } catch (error) {
        console.error('Error submitting video reel:', error);
        showNotification('حدث خطأ في نشر الفيديو', 'error');
    }
}

// Update FAB menu items based on user role
function updateFabMenuItems(isMainEmployee) {
    // Video and Image publishing - available for all staff
    const videoBtn = document.querySelector('[onclick="openVideoReelModal()"]');
    const imageBtn = document.querySelector('[onclick="openImageAnnouncementModal()"]');
    
    if (videoBtn) videoBtn.style.display = 'flex';
    if (imageBtn) imageBtn.style.display = 'flex';
    
    // Advanced features - only for main employee
    const contestBtn = document.querySelector('[onclick="openContestModal()"]');
    const chatBtn = document.querySelector('[onclick="openChatRoomModal()"]');
    const notificationBtn = document.querySelector('[onclick="openNotificationModal()"]');
    const announcementBtn = document.querySelector('[onclick="openAnnouncementModal()"]');
    
    if (contestBtn) contestBtn.style.display = isMainEmployee ? 'flex' : 'none';
    if (chatBtn) chatBtn.style.display = isMainEmployee ? 'flex' : 'none';
    if (notificationBtn) notificationBtn.style.display = isMainEmployee ? 'flex' : 'none';
    if (announcementBtn) announcementBtn.style.display = isMainEmployee ? 'flex' : 'none';
}

// Announcement Modal Functions
function openAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'flex';
    toggleFabMenu();
}

function closeAnnouncementModal() {
    document.getElementById('announcementModal').style.display = 'none';
}

async function submitAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const content = document.getElementById('announcementContent').value.trim();
    const type = document.getElementById('announcementType').value;
    
    if (!title || !content) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    try {
        // Create announcement data
        const announcementData = {
            title: title,
            content: content,
            type: type,
            createdBy: currentUser.fullName,
            createdAt: new Date().toISOString()
        };
        
        // Here you would normally send to API
        // For now, show success message
        showNotification('تم نشر الإعلان بنجاح', 'success');
        
        // Clear form
        document.getElementById('announcementTitle').value = '';
        document.getElementById('announcementContent').value = '';
        document.getElementById('announcementType').value = 'general';
        
        // Close modal
        closeAnnouncementModal();
        
        // Reload announcements if they exist in the system
        if (typeof loadAnnouncements === 'function') {
            loadAnnouncements();
        }
        
    } catch (error) {
        console.error('Error submitting announcement:', error);
        showNotification('حدث خطأ في نشر الإعلان', 'error');
    }
}

// Make groups management functions globally available
window.openGroupsManagementModal = openGroupsManagementModal;
window.closeGroupsManagementModal = closeGroupsManagementModal;
window.showGroupsTab = showGroupsTab;
window.refreshGroupsData = refreshGroupsData;
window.exportGroupsData = exportGroupsData;

// Test function to verify groups modal works
window.testGroupsModal = function() {
    console.log('[TEST] Testing groups modal...');
    console.log('[TEST] Function exists:', typeof window.openGroupsManagementModal);
    const modal = document.getElementById('groupsManagementModal');
    console.log('[TEST] Modal exists:', !!modal);
    if (modal) {
        console.log('[TEST] Current display:', modal.style.display);
        console.log('[TEST] Current classes:', modal.className);
    }
    try {
        window.openGroupsManagementModal();
        console.log('[TEST] Function called successfully');
    } catch (error) {
        console.error('[TEST] Error calling function:', error);
    }
};

// Make contest functions globally available
window.openContestModal = openContestModal;
window.closeContestModal = closeContestModal;
window.createContest = createContest;

// Make other modal functions globally available
window.openEditProfileModal = openEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.openCreateEmployeeModal = openCreateEmployeeModal;
window.closeCreateEmployeeModal = closeCreateEmployeeModal;
window.openEmployeesModal = openEmployeesModal;
window.closeEmployeesModal = closeEmployeesModal;
window.openAnnouncementAdminModal = openAnnouncementAdminModal;
window.openMessageModal = openMessageModal;
window.closeMessageModal = closeMessageModal;
window.closeDetailsModal = closeDetailsModal;
window.openImageAnnouncementModal = openImageAnnouncementModal;
window.closeImageAnnouncementModal = closeImageAnnouncementModal;
window.openStudentRequestsModal = openStudentRequestsModal;
window.closeStudentRequestsModal = closeStudentRequestsModal;
window.openNotificationModal = openNotificationModal;
window.closeNotificationModal = closeNotificationModal;
window.openChatInterfaceModal = openChatInterfaceModal;
window.closeChatInterfaceModal = closeChatInterfaceModal;
window.openUserManagementModal = openUserManagementModal;
window.closeUserManagementModal = closeUserManagementModal;
window.openCreateUserModal = openCreateUserModal;
window.closeCreateUserModal = closeCreateUserModal;
window.openChatRoomModal = openChatRoomModal;
window.closeChatRoomModal = closeChatRoomModal;
window.openVideoReelModal = openVideoReelModal;
window.closeVideoReelModal = closeVideoReelModal;
window.openAnnouncementModal = openAnnouncementModal;
window.closeAnnouncementModal = closeAnnouncementModal;
