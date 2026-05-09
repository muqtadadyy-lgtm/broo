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
    
    // Load statistics
    updateStatistics();
    
    // Load applications
    loadApplications();
    loadEmployees();
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
function openVideoReelModal() {
    showNotification('نشر الفيديوهات القصيرة قيد التطوير', 'info');
    toggleFabMenu();
}

function openImageAnnouncementModal() {
    document.getElementById('imageAnnouncementModal').style.display = 'flex';
    toggleFabMenu();
}

function closeImageAnnouncementModal() {
    document.getElementById('imageAnnouncementModal').style.display = 'none';
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
        
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            showNotification('حجم الصورة يجب أن يكون أقل من 5 ميجابايت', 'error');
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
        // Create FormData for image upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('type', type);
        formData.append('description', description);
        formData.append('priority', priority);
        formData.append('visibility', visibility);
        formData.append('tags', tags);
        formData.append('image', selectedImageFile);
        formData.append('createdBy', currentUser.fullName);
        
        // Here you would normally send to API
        showNotification('جاري نشر الصورة...', 'info');
        
        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const visibilityText = visibility === 'all' ? 'للجميع' : 
                             visibility === 'students' ? 'للطلاب فقط' : 
                             'للموظفين فقط';
        
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
        
    } catch (error) {
        console.error('Error publishing image announcement:', error);
        showNotification('حدث خطأ في نشر الصورة', 'error');
    }
}

function openContestModal() {
    document.getElementById('contestModal').style.display = 'flex';
    toggleFabMenu();
}

function closeContestModal() {
    document.getElementById('contestModal').style.display = 'none';
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
            visibility: visibility,
            createdBy: currentUser.fullName,
            createdAt: new Date().toISOString()
        };
        
        // Here you would normally send to API
        showNotification('جاري إنشاء المسابقة...', 'info');
        
        // Simulate creation
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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
        
    } catch (error) {
        console.error('Error creating contest:', error);
        showNotification('حدث خطأ في إنشاء المسابقة', 'error');
    }
}

function openChatRoomModal() {
    showNotification('غرف الدردشة قيد التطوير', 'info');
    toggleFabMenu();
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
    // Mock data for student requests
    studentRequests = [
        {
            id: 1,
            studentName: 'أحمد محمد',
            username: 'ahmed_student',
            email: 'ahmed@university.edu',
            targetRoom: 'general',
            reason: 'أريد الانضمام لمناقشة المشاريع الدراسية',
            status: 'pending',
            requestedAt: new Date().toISOString(),
            requestedBy: currentUser.fullName
        },
        {
            id: 2,
            studentName: 'فاطمة علي',
            username: 'fatima_student',
            email: 'fatima@university.edu',
            targetRoom: 'study',
            reason: 'أحتاج المساعدة في مواد الرياضيات',
            status: 'approved',
            approvedAt: new Date().toISOString(),
            approvedBy: currentUser.fullName,
            requestedAt: new Date(Date.now() - 86400000).toISOString(),
            requestedBy: currentUser.fullName
        },
        {
            id: 3,
            studentName: 'محمد خالد',
            username: 'mohammed_student',
            email: 'mohammed@university.edu',
            targetRoom: 'contest',
            reason: 'أراد المشاركة في مسابقة البرمجة',
            status: 'rejected',
            rejectedAt: new Date(Date.now() - 172800000).toISOString(),
            rejectedBy: currentUser.fullName,
            rejectionReason: 'الكروب ممتلئ حالياً',
            requestedAt: new Date(Date.now() - 259200000).toISOString(),
            requestedBy: currentUser.fullName
        }
    ];
    
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

// Add event listeners for new features
document.addEventListener('DOMContentLoaded', function() {
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
    initializeChatRoom();
    toggleFabMenu();
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

function sendMessage() {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message) return;
    
    // Add message to chat
    const newMessage = {
        id: Date.now(),
        sender: currentUser,
        content: message,
        timestamp: new Date().toISOString(),
        type: 'user'
    };
    
    chatMessages.push(newMessage);
    displayMessage(newMessage);
    
    // Clear input
    messageInput.value = '';
    
    // Simulate sending to other members
    simulateMessageDelivery(newMessage);
    
    // Update typing status
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

function loadAllUsers() {
    // Start with base users
    allUsers = [
        {
            id: 1,
            name: 'أحمد محمد',
            username: 'ahmed_student',
            email: 'ahmed@university.edu',
            role: 'student',
            status: 'active',
            avatar: '/static/images/user1.jpg',
            createdAt: '2024-01-15T10:30:00Z',
            lastLogin: '2024-05-09T14:20:00Z',
            phone: '+966501234567'
        },
        {
            id: 2,
            name: 'فاطمة علي',
            username: 'fatima_student',
            email: 'fatima@university.edu',
            role: 'student',
            status: 'active',
            avatar: '/static/images/user2.jpg',
            createdAt: '2024-01-20T09:15:00Z',
            lastLogin: '2024-05-09T13:45:00Z',
            phone: '+966502345678'
        },
        {
            id: 3,
            name: 'محمد خالد',
            username: 'mohammed_student',
            email: 'mohammed@university.edu',
            role: 'student',
            status: 'inactive',
            avatar: '/static/images/user3.jpg',
            createdAt: '2024-02-01T11:00:00Z',
            lastLogin: '2024-04-15T16:30:00Z',
            phone: '+966503456789'
        },
        {
            id: 4,
            name: 'المدير العام',
            username: 'admin',
            email: 'admin@university.edu',
            role: 'admin',
            status: 'active',
            avatar: '/static/images/admin.jpg',
            createdAt: '2024-01-01T00:00:00Z',
            lastLogin: '2024-05-09T15:00:00Z',
            phone: '+966500000000'
        },
        {
            id: 5,
            name: 'سارة أحمد',
            username: 'sarah_employee',
            email: 'sarah@university.edu',
            role: 'employee',
            status: 'active',
            avatar: '/static/images/user4.jpg',
            createdAt: '2024-02-10T08:30:00Z',
            lastLogin: '2024-05-09T12:00:00Z',
            phone: '+966504567890'
        },
        {
            id: 6,
            name: 'عمر خالد',
            username: 'omar_moderator',
            email: 'omar@university.edu',
            role: 'moderator',
            status: 'suspended',
            avatar: '/static/images/user5.jpg',
            createdAt: '2024-03-01T14:00:00Z',
            lastLogin: '2024-03-20T10:00:00Z',
            phone: '+966505678901'
        }
    ];
    
    // Add any users created during chat room management
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
    
    // Also sync with any users created through the create new user function
    // This ensures all created accounts are visible
    console.log('Loading all users. Total count:', allUsers.length);
    console.log('All users:', allUsers);
    
    filteredUsers = [...allUsers];
    currentPage = 1;
    displayUsers();
    updateUsersStats();
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
                <button class="action-btn delete-btn" onclick="deleteUser(${user.id})" title="حذف">
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

function getStatusText(status) {
    const statusMap = {
        'active': 'نشط',
        'inactive': 'غير نشط',
        'suspended': 'معلق'
    };
    return statusMap[status] || status;
}

function formatDate(dateString) {
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

function deleteUser(userId) {
    const user = allUsers.find(u => u.id === userId);
    if (user) {
        if (confirm(`هل أنت متأكد من حذف المستخدم: ${user.name}؟`)) {
            allUsers = allUsers.filter(u => u.id !== userId);
            filteredUsers = [...allUsers];
            displayUsers();
            updateUsersStats();
            showNotification(`تم حذف المستخدم: ${user.name}`, 'success');
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

// Mock data for available users (in real app, this would come from API)
function loadAvailableUsers() {
    allAvailableUsers = [
        { id: 1, name: 'أحمد محمد', email: 'ahmed@university.edu', role: 'student', status: 'active' },
        { id: 2, name: 'فاطمة علي', email: 'fatima@university.edu', role: 'student', status: 'active' },
        { id: 3, name: 'محمد خالد', email: 'mohammed@university.edu', role: 'student', status: 'active' },
        { id: 4, name: 'نورا سعيد', email: 'nora@university.edu', role: 'student', status: 'active' },
        { id: 5, name: 'عبدالله إبراهيم', email: 'abdullah@university.edu', role: 'student', status: 'active' },
        { id: 6, name: 'موظف إداري', email: 'admin@university.edu', role: 'employee', status: 'active' }
    ];
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

// Chat Room Management Functions
function openChatRoomModal() {
    document.getElementById('chatRoomModal').style.display = 'flex';
    toggleFabMenu();
}

function closeChatRoomModal() {
    document.getElementById('chatRoomModal').style.display = 'none';
}

let chatRoomMembers = [];
let allAvailableMembers = [];

// Mock data for available members (in real app, this would come from API)
function loadAvailableMembers() {
    allAvailableMembers = [
        { id: 1, name: 'أحمد محمد', email: 'ahmed@university.edu', role: 'student', status: 'active' },
        { id: 2, name: 'فاطمة علي', email: 'fatima@university.edu', role: 'student', status: 'active' },
        { id: 3, name: 'محمد خالد', email: 'mohammed@university.edu', role: 'student', status: 'active' },
        { id: 4, name: 'نورا سعيد', email: 'nora@university.edu', role: 'student', status: 'active' },
        { id: 5, name: 'عبدالله إبراهيم', email: 'abdullah@university.edu', role: 'student', status: 'active' }
    ];
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

function updateMemberList() {
    const memberList = document.getElementById('chatRoomMembers');
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
                <button class="remove-member-btn" onclick="removeMemberFromChatRoom(${member.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');
    }
}

async function createChatRoom() {
    const name = document.getElementById('chatRoomName').value.trim();
    const description = document.getElementById('chatRoomDescription').value.trim();
    const type = document.getElementById('chatRoomType').value;
    const maxMembers = document.getElementById('chatRoomMaxMembers').value;
    const privacy = document.getElementById('chatRoomPrivacy').value;
    const status = document.getElementById('chatRoomStatus').value;
    const rules = document.getElementById('chatRoomRules').value.trim();
    const tags = document.getElementById('chatRoomTags').value.trim();
    const messageRetention = document.getElementById('chatRoomMessageRetention').value;
    const fileSharing = document.getElementById('chatRoomFileSharing').value;
    const maxFileSize = document.getElementById('chatRoomMaxFileSize').value;
    const allowedFileTypes = document.getElementById('chatRoomAllowedFileTypes').value;
    const welcomeMessage = document.getElementById('chatRoomWelcomeMessage').value.trim();
    const notifications = document.getElementById('chatRoomNotifications').checked;
    const encryption = document.getElementById('chatRoomEncryption').checked;
    const autoMod = document.getElementById('chatRoomAutoMod').checked;
    const readOnly = document.getElementById('chatRoomReadOnly').checked;
    const adminRole = document.getElementById('adminRole').value;
    
    if (!name || !description) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (chatRoomMembers.length === 0) {
        showNotification('الرجاء إضافة عضو واحد على الأقل', 'error');
        return;
    }
    
    try {
        // Create enhanced chat room data
        const chatRoomData = {
            name: name,
            description: description,
            type: type,
            maxMembers: maxMembers,
            privacy: privacy,
            status: status,
            rules: rules,
            tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
            messageRetention: messageRetention,
            fileSharing: fileSharing,
            maxFileSize: maxFileSize,
            allowedFileTypes: allowedFileTypes.split(',').map(type => type.trim()).filter(type => type),
            welcomeMessage: welcomeMessage,
            notifications: notifications,
            encryption: encryption,
            autoMod: autoMod,
            readOnly: readOnly,
            members: chatRoomMembers.map(member => ({
                ...member,
                role: member.id === parseInt(adminRole) ? 'admin' : 'member',
                joinedAt: new Date().toISOString()
            })),
            adminId: adminRole || chatRoomMembers[0].id,
            createdBy: currentUser.fullName,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            messageCount: 0,
            fileCount: 0,
            stats: {
                currentMembers: chatRoomMembers.length,
                todayMessages: Math.floor(Math.random() * 50),
                sharedFiles: Math.floor(Math.random() * 20),
                activityRate: 'عالي'
            }
        };
        
        // Here you would normally send to API
        showNotification('جاري إنشاء الكروب المتقدم...', 'info');
        
        // Simulate creation with enhanced features
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const typeText = type === 'general' ? 'عام' : 
                        type === 'contest' ? 'مسابقة' : 
                        type === 'study' ? 'دراسة' : 
                        type === 'announcement' ? 'إعلانات' : 
                        type === 'private' ? 'خاص' : 
                        type === 'support' ? 'دعم فني' : 'مشروع';
        
        const privacyText = privacy === 'public' ? 'عام' : 
                           privacy === 'private' ? 'خاص' : 'دعوة فقط';
        
        showNotification(`تم إنشاء كروب "${name}" (${typeText} - ${privacyText}) بنجاح`, 'success');
        
        // Clear form
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
        
        chatRoomMembers = [];
        updateMemberList();
        updateRoleAssignments();
        
        // Close modal
        closeChatRoomModal();
        
    } catch (error) {
        console.error('Error creating chat room:', error);
        showNotification('حدث خطأ في إنشاء الكروب', 'error');
    }
}

function updateRoleAssignments() {
    const adminSelect = document.getElementById('adminRole');
    const moderatorSelection = document.querySelector('.moderator-selection');
    
    // Update admin options
    adminSelect.innerHTML = '<option value="">اختر مدير الكروب</option>';
    chatRoomMembers.forEach(member => {
        const option = document.createElement('option');
        option.value = member.id;
        option.textContent = member.name;
        adminSelect.appendChild(option);
    });
    
    // Update moderator selection
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
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        formData.append('tags', tags);
        formData.append('video', videoFile);
        if (thumbnailFile) {
            formData.append('thumbnail', thumbnailFile);
        }
        formData.append('createdBy', currentUser.fullName);
        
        // Here you would normally send to API
        // For now, simulate upload and show success
        showNotification('جاري رفع الفيديو...', 'info');
        
        // Simulate upload progress
        await new Promise(resolve => setTimeout(resolve, 2000));
        
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

// Account Creation Functions
function openAccountCreationModal() {
    document.getElementById('accountCreationModal').style.display = 'flex';
    // Reset form
    resetAccountCreationForm();
}

function closeAccountCreationModal() {
    document.getElementById('accountCreationModal').style.display = 'none';
    resetAccountCreationForm();
}

function resetAccountCreationForm() {
    // Clear selected role
    document.getElementById('selectedRole').value = '';
    
    // Hide account details section
    document.getElementById('accountDetails').style.display = 'none';
    document.getElementById('accountActions').style.display = 'none';
    
    // Clear all role-specific fields
    document.querySelectorAll('.role-specific-fields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Clear form inputs
    document.querySelectorAll('#accountCreationModal input').forEach(input => {
        if (input.type !== 'hidden') {
            input.value = '';
        }
    });
    
    document.querySelectorAll('#accountCreationModal select').forEach(select => {
        select.selectedIndex = 0;
    });
    
    // Remove selected class from role options
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
}

function selectRole(role) {
    // Update selected role
    document.getElementById('selectedRole').value = role;
    
    // Update UI
    document.querySelectorAll('.role-option').forEach(option => {
        option.classList.remove('selected');
    });
    
    // Add selected class to clicked role
    event.currentTarget.classList.add('selected');
    
    // Show account details section
    document.getElementById('accountDetails').style.display = 'block';
    document.getElementById('accountActions').style.display = 'flex';
    
    // Hide all role-specific fields first
    document.querySelectorAll('.role-specific-fields').forEach(field => {
        field.style.display = 'none';
    });
    
    // Show role-specific fields based on selected role
    switch(role) {
        case 'student':
            document.getElementById('studentFields').style.display = 'block';
            break;
        case 'staff':
            document.getElementById('staffFields').style.display = 'block';
            break;
        case 'teacher':
            document.getElementById('teacherFields').style.display = 'block';
            break;
        case 'parent':
            document.getElementById('parentFields').style.display = 'block';
            break;
    }
}

function createAccount() {
    const role = document.getElementById('selectedRole').value;
    
    if (!role) {
        showNotification('الرجاء اختيار نوع الحساب', 'error');
        return;
    }
    
    // Get basic account information
    const fullName = document.getElementById('accountFullName').value.trim();
    const username = document.getElementById('accountUsername').value.trim();
    const email = document.getElementById('accountEmail').value.trim();
    const phone = document.getElementById('accountPhone').value.trim();
    const password = document.getElementById('accountPassword').value;
    const confirmPassword = document.getElementById('accountConfirmPassword').value;
    
    // Validation
    if (!fullName || !username || !email || !password) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('كلمة المرور وتأكيد كلمة المرور غير متطابقتين', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    // Get role-specific information
    let roleSpecificData = {};
    
    switch(role) {
        case 'student':
            roleSpecificData.grade = document.getElementById('studentGrade').value;
            roleSpecificData.class = document.getElementById('studentClass').value.trim();
            if (!roleSpecificData.grade) {
                showNotification('الرجاء اختيار الصف الدراسي', 'error');
                return;
            }
            break;
        case 'staff':
            roleSpecificData.department = document.getElementById('staffDepartment').value;
            if (!roleSpecificData.department) {
                showNotification('الرجاء اختيار القسم', 'error');
                return;
            }
            break;
        case 'teacher':
            roleSpecificData.subject = document.getElementById('teacherSubject').value.trim();
            roleSpecificData.department = document.getElementById('teacherDepartment').value;
            if (!roleSpecificData.subject || !roleSpecificData.department) {
                showNotification('الرجاء ملء جميع حقول التدريسي', 'error');
                return;
            }
            break;
        case 'parent':
            roleSpecificData.studentName = document.getElementById('parentStudent').value.trim();
            roleSpecificData.relation = document.getElementById('parentRelation').value;
            if (!roleSpecificData.studentName || !roleSpecificData.relation) {
                showNotification('الرجاء ملء جميع حقول ولي الأمر', 'error');
                return;
            }
            break;
    }
    
    // Create account object
    const newAccount = {
        id: Date.now(), // Temporary ID generation
        name: fullName,
        username: username,
        email: email,
        phone: phone,
        password: password, // In real implementation, this should be hashed
        role: role,
        status: 'active',
        createdAt: new Date().toISOString(),
        ...roleSpecificData
    };
    
    // Add to the users array (in real implementation, this would be sent to backend)
    if (typeof allUsers === 'undefined') {
        window.allUsers = [];
    }
    allUsers.push(newAccount);
    
    // Show success message
    const roleNames = {
        'student': 'طالب',
        'staff': 'موظف',
        'teacher': 'تدريسي',
        'parent': 'ولي الأمر'
    };
    
    showNotification(`تم إنشاء حساب ${roleNames[role]} بنجاح`, 'success');
    
    // Close modal and reset form
    closeAccountCreationModal();
    
    // Refresh user management if it's open
    if (typeof refreshUserManagement === 'function') {
        refreshUserManagement();
    }
    
    // Log the account creation (for debugging)
    console.log('Account created:', newAccount);
}

// Digital Library Functions
// Library Data Storage
let libraryBooks = [];
let libraryVideos = [];
let libraryFiles = [];
let libraryLinks = [];

// Activities Section Functions
function showActivitiesSection() {
    // Hide all sections
    document.querySelectorAll('.applications-management-section, .library-section, .library-books-section, .library-videos-section, .library-files-section, .library-links-section, .activities-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show activities section
    document.getElementById('activitiesSection').style.display = 'block';
    
    // Load activities data
    loadActivitiesData();
    
    // Close FAB menu if open
    closeFabMenu();
}

function loadActivitiesData() {
    updateActivitiesStats();
    loadActivitiesList();
}

function updateActivitiesStats() {
    // Update activities statistics
    const pendingCount = document.getElementById('activitiesPendingCount');
    const approvedCount = document.getElementById('activitiesApprovedCount');
    const rejectedCount = document.getElementById('activitiesRejectedCount');
    const totalCount = document.getElementById('activitiesTotalCount');
    
    // These would normally come from the backend
    pendingCount.textContent = '0';
    approvedCount.textContent = '0';
    rejectedCount.textContent = '0';
    totalCount.textContent = '0';
}

function loadActivitiesList() {
    const activitiesList = document.getElementById('activitiesList');
    
    // Load activities from the existing applications data
    const applications = getApplicationsData();
    
    if (applications.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-activities">
                <div class="empty-icon">
                    <i class="fas fa-calendar-alt"></i>
                </div>
                <h3>لا توجد أنشطة</h3>
                <p>لم يتم إنشاء أي أنشطة بعد. ابدأ بإنشاء نشاط جديد.</p>
            </div>
        `;
        return;
    }
    
    activitiesList.innerHTML = applications.map(app => `
        <div class="activity-card">
            <div class="activity-header">
                <h4>${app.activityType}</h4>
                <span class="activity-status ${app.status}">${app.status}</span>
            </div>
            <div class="activity-content">
                <p><strong>الطالب:</strong> ${app.studentName}</p>
                <p><strong>القسم:</strong> ${app.department}</p>
                <p><strong>التاريخ:</strong> ${app.date}</p>
                <p><strong>الوصف:</strong> ${app.description}</p>
            </div>
            <div class="activity-actions">
                <button class="primary-btn" onclick="viewActivityDetails('${app.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="secondary-btn" onclick="editActivity('${app.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="danger-btn" onclick="deleteActivity('${app.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function filterActivities() {
    const activityFilter = document.getElementById('activitiesActivityFilter').value;
    const statusFilter = document.getElementById('activitiesStatusFilter').value;
    const searchInput = document.getElementById('activitiesSearchInput').value.toLowerCase();
    
    const applications = getApplicationsData();
    
    const filteredActivities = applications.filter(app => {
        const matchesActivity = !activityFilter || app.activityType === activityFilter;
        const matchesStatus = !statusFilter || app.status === statusFilter;
        const matchesSearch = !searchInput || app.studentName.toLowerCase().includes(searchInput);
        
        return matchesActivity && matchesStatus && matchesSearch;
    });
    
    // Update the activities list with filtered results
    const activitiesList = document.getElementById('activitiesList');
    if (filteredActivities.length === 0) {
        activitiesList.innerHTML = `
            <div class="empty-activities">
                <div class="empty-icon">
                    <i class="fas fa-search"></i>
                </div>
                <h3>لا توجد نتائج</h3>
                <p>لم يتم العثور على أنشطة تطابق معايير البحث.</p>
            </div>
        `;
        return;
    }
    
    activitiesList.innerHTML = filteredActivities.map(app => `
        <div class="activity-card">
            <div class="activity-header">
                <h4>${app.activityType}</h4>
                <span class="activity-status ${app.status}">${app.status}</span>
            </div>
            <div class="activity-content">
                <p><strong>الطالب:</strong> ${app.studentName}</p>
                <p><strong>القسم:</strong> ${app.department}</p>
                <p><strong>التاريخ:</strong> ${app.date}</p>
                <p><strong>الوصف:</strong> ${app.description}</p>
            </div>
            <div class="activity-actions">
                <button class="primary-btn" onclick="viewActivityDetails('${app.id}')">
                    <i class="fas fa-eye"></i> عرض
                </button>
                <button class="secondary-btn" onclick="editActivity('${app.id}')">
                    <i class="fas fa-edit"></i> تعديل
                </button>
                <button class="danger-btn" onclick="deleteActivity('${app.id}')">
                    <i class="fas fa-trash"></i> حذف
                </button>
            </div>
        </div>
    `).join('');
}

function searchActivities() {
    filterActivities();
}

function openActivityModal() {
    // This would open a modal for creating new activities
    showNotification('إنشاء نشاط جديد - قيد التطوير', 'info');
}

function exportActivities() {
    // This would export activities data
    showNotification('تصدير البيانات - قيد التطوير', 'info');
}

function viewActivityDetails(activityId) {
    // This would show activity details
    showNotification('عرض تفاصيل النشاط - قيد التطوير', 'info');
}

function editActivity(activityId) {
    // This would open edit modal for the activity
    showNotification('تعديل النشاط - قيد التطوير', 'info');
}

function deleteActivity(activityId) {
    if (confirm('هل أنت متأكد من حذف هذا النشاط؟')) {
        // This would delete the activity
        showNotification('تم حذف النشاط', 'success');
        loadActivitiesData();
    }
}

// Helper function to get applications data
function getApplicationsData() {
    // This would normally fetch from the backend
    // For now, return empty array or mock data
    return [];
}

// Library Navigation
function showSection(sectionName) {
    // Hide all sections
    document.querySelectorAll('.applications-management-section, .library-section, .library-books-section, .library-videos-section, .library-files-section, .library-links-section, .activities-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Remove active class from all nav links
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    
    // Show selected section
    switch(sectionName) {
        case 'library':
            document.getElementById('librarySection').style.display = 'block';
            loadLibraryContent();
            break;
        case 'library-books':
            document.getElementById('libraryBooksSection').style.display = 'block';
            loadLibraryBooks();
            break;
        case 'library-videos':
            document.getElementById('libraryVideosSection').style.display = 'block';
            loadLibraryVideos();
            break;
        case 'library-files':
            document.getElementById('libraryFilesSection').style.display = 'block';
            loadLibraryFiles();
            break;
        case 'library-links':
            document.getElementById('libraryLinksSection').style.display = 'block';
            loadLibraryLinks();
            break;
        case 'activities':
            document.getElementById('activitiesSection').style.display = 'block';
            loadActivitiesData();
            break;
        default:
            document.querySelector('.applications-management-section').style.display = 'block';
    }
    
    // Add active class to clicked nav link
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// FAB Library Functions
function toggleLibraryFAB() {
    const submenu = document.getElementById('libraryFABSubmenu');
    const fabButton = document.querySelector('.library-fab');
    
    if (submenu.style.display === 'none') {
        submenu.style.display = 'flex';
        fabButton.classList.add('active');
    } else {
        submenu.style.display = 'none';
        fabButton.classList.remove('active');
    }
}

// Book Upload Functions
function openBookUploadModal() {
    document.getElementById('bookUploadModal').style.display = 'flex';
    closeLibraryFAB();
}

function closeBookUploadModal() {
    document.getElementById('bookUploadModal').style.display = 'none';
    resetBookUploadForm();
}

function resetBookUploadForm() {
    document.getElementById('bookTitle').value = '';
    document.getElementById('bookAuthor').value = '';
    document.getElementById('bookCollege').value = '';
    document.getElementById('bookStage').value = '';
    document.getElementById('bookDescription').value = '';
    document.getElementById('bookTags').value = '';
    document.getElementById('bookFile').value = '';
    document.getElementById('bookCover').value = '';
    document.getElementById('bookFileInfo').textContent = 'لم يتم اختيار ملف بعد';
    document.getElementById('bookCoverInfo').textContent = 'لم يتم اختيار صورة بعد';
    document.getElementById('bookPreview').style.display = 'none';
}

function handleBookFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('bookFileInfo').textContent = `تم اختيار: ${file.name} (${formatFileSize(file.size)})`;
    }
}

function handleBookCoverSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('bookCoverInfo').textContent = `تم اختيار: ${file.name} (${formatFileSize(file.size)})`;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('bookCoverPreview').src = e.target.result;
            document.getElementById('bookPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function uploadBook() {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const college = document.getElementById('bookCollege').value;
    const stage = document.getElementById('bookStage').value;
    const description = document.getElementById('bookDescription').value.trim();
    const tags = document.getElementById('bookTags').value.trim();
    const fileInput = document.getElementById('bookFile');
    
    // Validation
    if (!title || !author || !college || !stage || !description) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (!fileInput.files[0]) {
        showNotification('الرجاء اختيار ملف الكتاب', 'error');
        return;
    }
    
    // Create book object
    const newBook = {
        id: Date.now(),
        title: title,
        author: author,
        college: college,
        stage: stage,
        description: description,
        tags: tags.split(',').map(tag => tag.trim()),
        fileName: fileInput.files[0].name,
        fileSize: fileInput.files[0].size,
        uploadDate: new Date().toISOString(),
        uploadedBy: getCurrentUser().name,
        downloads: 0,
        rating: 0,
        coverImage: document.getElementById('bookCoverPreview').src || null
    };
    
    // Add to library books
    libraryBooks.push(newBook);
    
    // Show success message
    showNotification('تم رفع الكتاب بنجاح', 'success');
    
    // Close modal and reset form
    closeBookUploadModal();
    
    // Refresh library content
    loadLibraryBooks();
    loadLibraryContent();
}

// Video Upload Functions
function openVideoUploadModal() {
    document.getElementById('videoUploadModal').style.display = 'flex';
    closeLibraryFAB();
}

function closeVideoUploadModal() {
    document.getElementById('videoUploadModal').style.display = 'none';
    resetVideoUploadForm();
}

function resetVideoUploadForm() {
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDuration').value = '';
    document.getElementById('videoCollege').value = '';
    document.getElementById('videoStage').value = '';
    document.getElementById('videoDescription').value = '';
    document.getElementById('videoTags').value = '';
    document.getElementById('videoFile').value = '';
    document.getElementById('videoThumbnail').value = '';
    document.getElementById('videoFileInfo').textContent = 'لم يتم اختيار ملف بعد';
    document.getElementById('videoThumbnailInfo').textContent = 'لم يتم اختيار صورة بعد';
    document.getElementById('videoPreview').style.display = 'none';
}

function handleVideoFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('videoFileInfo').textContent = `تم اختيار: ${file.name} (${formatFileSize(file.size)})`;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            const video = document.getElementById('previewVideo');
            video.src = e.target.result;
            document.getElementById('videoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function handleVideoThumbnailSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('videoThumbnailInfo').textContent = `تم اختيار: ${file.name} (${formatFileSize(file.size)})`;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById('previewThumbnail').src = e.target.result;
            document.getElementById('videoPreview').style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function uploadVideo() {
    const title = document.getElementById('videoTitle').value.trim();
    const duration = document.getElementById('videoDuration').value.trim();
    const college = document.getElementById('videoCollege').value;
    const stage = document.getElementById('videoStage').value;
    const description = document.getElementById('videoDescription').value.trim();
    const tags = document.getElementById('videoTags').value.trim();
    const fileInput = document.getElementById('videoFile');
    
    // Validation
    if (!title || !college || !stage || !description) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (!fileInput.files[0]) {
        showNotification('الرجاء اختيار ملف الفيديو', 'error');
        return;
    }
    
    // Create video object
    const newVideo = {
        id: Date.now(),
        title: title,
        duration: duration,
        college: college,
        stage: stage,
        description: description,
        tags: tags.split(',').map(tag => tag.trim()),
        fileName: fileInput.files[0].name,
        fileSize: fileInput.files[0].size,
        uploadDate: new Date().toISOString(),
        uploadedBy: getCurrentUser().name,
        views: 0,
        rating: 0,
        thumbnail: document.getElementById('previewThumbnail').src || null
    };
    
    // Add to library videos
    libraryVideos.push(newVideo);
    
    // Show success message
    showNotification('تم رفع الفيديو بنجاح', 'success');
    
    // Close modal and reset form
    closeVideoUploadModal();
    
    // Refresh library content
    loadLibraryVideos();
    loadLibraryContent();
}

// File Upload Functions
function openFileUploadModal() {
    document.getElementById('fileUploadModal').style.display = 'flex';
    closeLibraryFAB();
}

function closeFileUploadModal() {
    document.getElementById('fileUploadModal').style.display = 'none';
    resetFileUploadForm();
}

function resetFileUploadForm() {
    document.getElementById('fileTitle').value = '';
    document.getElementById('fileCollege').value = '';
    document.getElementById('fileStage').value = '';
    document.getElementById('fileDescription').value = '';
    document.getElementById('fileFile').value = '';
    document.getElementById('fileFileInfo').textContent = 'لم يتم اختيار ملف بعد';
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('fileFileInfo').textContent = `تم اختيار: ${file.name} (${formatFileSize(file.size)})`;
    }
}

function uploadFile() {
    const title = document.getElementById('fileTitle').value.trim();
    const college = document.getElementById('fileCollege').value;
    const stage = document.getElementById('fileStage').value;
    const description = document.getElementById('fileDescription').value.trim();
    const fileInput = document.getElementById('fileFile');
    
    // Validation
    if (!title || !college || !stage || !description) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    if (!fileInput.files[0]) {
        showNotification('الرجاء اختيار الملف', 'error');
        return;
    }
    
    // Create file object
    const newFile = {
        id: Date.now(),
        title: title,
        college: college,
        stage: stage,
        description: description,
        fileName: fileInput.files[0].name,
        fileSize: fileInput.files[0].size,
        fileType: fileInput.files[0].name.split('.').pop().toLowerCase(),
        uploadDate: new Date().toISOString(),
        uploadedBy: getCurrentUser().name,
        downloads: 0
    };
    
    // Add to library files
    libraryFiles.push(newFile);
    
    // Show success message
    showNotification('تم رفع الملف بنجاح', 'success');
    
    // Close modal and reset form
    closeFileUploadModal();
    
    // Refresh library content
    loadLibraryFiles();
    loadLibraryContent();
}

// Link Add Functions
function openLinkAddModal() {
    document.getElementById('linkAddModal').style.display = 'flex';
    closeLibraryFAB();
}

function closeLinkAddModal() {
    document.getElementById('linkAddModal').style.display = 'none';
    resetLinkAddForm();
}

function resetLinkAddForm() {
    document.getElementById('linkTitle').value = '';
    document.getElementById('linkUrl').value = '';
    document.getElementById('linkCollege').value = '';
    document.getElementById('linkStage').value = '';
    document.getElementById('linkDescription').value = '';
}

function addLink() {
    const title = document.getElementById('linkTitle').value.trim();
    const url = document.getElementById('linkUrl').value.trim();
    const college = document.getElementById('linkCollege').value;
    const stage = document.getElementById('linkStage').value;
    const description = document.getElementById('linkDescription').value.trim();
    
    // Validation
    if (!title || !url || !college || !stage || !description) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // Validate URL
    try {
        new URL(url);
    } catch (e) {
        showNotification('الرجاء إدخال رابط صحيح', 'error');
        return;
    }
    
    // Create link object
    const newLink = {
        id: Date.now(),
        title: title,
        url: url,
        college: college,
        stage: stage,
        description: description,
        addedDate: new Date().toISOString(),
        addedBy: getCurrentUser().name,
        clicks: 0
    };
    
    // Add to library links
    libraryLinks.push(newLink);
    
    // Show success message
    showNotification('تم إضافة الرابط بنجاح', 'success');
    
    // Close modal and reset form
    closeLinkAddModal();
    
    // Refresh library content
    loadLibraryLinks();
    loadLibraryContent();
}

// Library Announcement Functions
function openLibraryAnnouncementModal() {
    document.getElementById('libraryAnnouncementModal').style.display = 'flex';
    closeLibraryFAB();
}

function closeLibraryAnnouncementModal() {
    document.getElementById('libraryAnnouncementModal').style.display = 'none';
    resetLibraryAnnouncementForm();
}

function resetLibraryAnnouncementForm() {
    document.getElementById('libraryAnnouncementTitle').value = '';
    document.getElementById('libraryAnnouncementContent').value = '';
    document.getElementById('libraryAnnouncementType').value = 'general';
}

function publishLibraryAnnouncement() {
    const title = document.getElementById('libraryAnnouncementTitle').value.trim();
    const content = document.getElementById('libraryAnnouncementContent').value.trim();
    const type = document.getElementById('libraryAnnouncementType').value;
    
    // Validation
    if (!title || !content) {
        showNotification('الرجاء ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // Create announcement object
    const newAnnouncement = {
        id: Date.now(),
        title: title,
        content: content,
        type: type,
        targetAudience: 'library',
        publishDate: new Date().toISOString(),
        publishedBy: getCurrentUser().name
    };
    
    // Add to announcements (using existing system)
    if (typeof adminAnnouncements === 'undefined') {
        window.adminAnnouncements = [];
    }
    adminAnnouncements.push(newAnnouncement);
    
    // Show success message
    showNotification('تم نشر الإعلان بنجاح', 'success');
    
    // Close modal and reset form
    closeLibraryAnnouncementModal();
}

// Library Content Loading Functions
function loadLibraryContent() {
    updateLibraryStats();
    displayLibraryContent();
}

function updateLibraryStats() {
    document.getElementById('booksCount').textContent = libraryBooks.length;
    document.getElementById('videosCount').textContent = libraryVideos.length;
    document.getElementById('filesCount').textContent = libraryFiles.length;
    document.getElementById('linksCount').textContent = libraryLinks.length;
}

function displayLibraryContent() {
    const grid = document.getElementById('libraryGrid');
    const allContent = [
        ...libraryBooks.map(book => ({...book, type: 'book'})),
        ...libraryVideos.map(video => ({...video, type: 'video'})),
        ...libraryFiles.map(file => ({...file, type: 'file'})),
        ...libraryLinks.map(link => ({...link, type: 'link'}))
    ];
    
    if (allContent.length === 0) {
        grid.innerHTML = `
            <div class="empty-library">
                <div class="empty-icon">
                    <i class="fas fa-book"></i>
                </div>
                <h3>المكتبة فارغة</h3>
                <p>لم يتم رفع أي محتوى بعد. ابدأ برفع الكتب والفيديوهات والملفات.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = allContent.map(item => {
        const icon = getContentTypeIcon(item.type);
        const title = item.title || item.fileName;
        const description = item.description || item.title;
        
        return `
            <div class="library-item-card" onclick="openLibraryItem('${item.type}', ${item.id})">
                <div class="item-icon">
                    <i class="${icon}"></i>
                </div>
                <div class="item-content">
                    <h4>${title}</h4>
                    <p>${description}</p>
                    <div class="item-meta">
                        <span class="item-type">${getContentTypeName(item.type)}</span>
                        <span class="item-date">${formatDate(item.uploadDate || item.addedDate)}</span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function loadLibraryBooks() {
    const grid = document.getElementById('booksGrid');
    
    if (libraryBooks.length === 0) {
        grid.innerHTML = `
            <div class="empty-section">
                <h3>لا توجد كتب</h3>
                <p>لم يتم رفع أي كتب بعد.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = libraryBooks.map(book => `
        <div class="book-card">
            <div class="book-cover">
                ${book.coverImage ? `<img src="${book.coverImage}" alt="${book.title}">` : `<i class="fas fa-file-pdf"></i>`}
            </div>
            <div class="book-info">
                <h4>${book.title}</h4>
                <p class="book-author">${book.author}</p>
                <p class="book-meta">${getCollegeName(book.college)} - ${getStageName(book.stage)}</p>
                <div class="book-stats">
                    <span><i class="fas fa-download"></i> ${book.downloads}</span>
                    <span><i class="fas fa-star"></i> ${book.rating}</span>
                </div>
            </div>
            <div class="book-actions">
                <button class="primary-btn" onclick="downloadBook(${book.id})">
                    <i class="fas fa-download"></i> تحميل
                </button>
                <button class="secondary-btn" onclick="editBook(${book.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="danger-btn" onclick="deleteBook(${book.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadLibraryVideos() {
    const grid = document.getElementById('videosGrid');
    
    if (libraryVideos.length === 0) {
        grid.innerHTML = `
            <div class="empty-section">
                <h3>لا توجد فيديوهات</h3>
                <p>لم يتم رفع أي فيديوهات بعد.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = libraryVideos.map(video => `
        <div class="video-card">
            <div class="video-thumbnail">
                ${video.thumbnail ? `<img src="${video.thumbnail}" alt="${video.title}">` : `<i class="fas fa-video"></i>`}
            </div>
            <div class="video-info">
                <h4>${video.title}</h4>
                <p class="video-duration">${video.duration || 'غير محدد'}</p>
                <p class="video-meta">${getCollegeName(video.college)} - ${getStageName(video.stage)}</p>
                <div class="video-stats">
                    <span><i class="fas fa-eye"></i> ${video.views}</span>
                    <span><i class="fas fa-star"></i> ${video.rating}</span>
                </div>
            </div>
            <div class="video-actions">
                <button class="primary-btn" onclick="playVideo(${video.id})">
                    <i class="fas fa-play"></i> تشغيل
                </button>
                <button class="secondary-btn" onclick="editVideo(${video.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="danger-btn" onclick="deleteVideo(${video.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadLibraryFiles() {
    const grid = document.getElementById('filesGrid');
    
    if (libraryFiles.length === 0) {
        grid.innerHTML = `
            <div class="empty-section">
                <h3>لا توجد ملفات</h3>
                <p>لم يتم رفع أي ملفات بعد.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = libraryFiles.map(file => `
        <div class="file-card">
            <div class="file-icon">
                <i class="fas ${getFileIcon(file.fileType)}"></i>
            </div>
            <div class="file-info">
                <h4>${file.title}</h4>
                <p class="file-name">${file.fileName}</p>
                <p class="file-meta">${getCollegeName(file.college)} - ${getStageName(file.stage)}</p>
                <div class="file-stats">
                    <span><i class="fas fa-download"></i> ${file.downloads}</span>
                    <span>${formatFileSize(file.fileSize)}</span>
                </div>
            </div>
            <div class="file-actions">
                <button class="primary-btn" onclick="downloadFile(${file.id})">
                    <i class="fas fa-download"></i> تحميل
                </button>
                <button class="secondary-btn" onclick="editFile(${file.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="danger-btn" onclick="deleteFile(${file.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function loadLibraryLinks() {
    const grid = document.getElementById('linksGrid');
    
    if (libraryLinks.length === 0) {
        grid.innerHTML = `
            <div class="empty-section">
                <h3>لا توجد روابط</h3>
                <p>لم يتم إضافة أي روابط بعد.</p>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = libraryLinks.map(link => `
        <div class="link-card">
            <div class="link-icon">
                <i class="fas fa-link"></i>
            </div>
            <div class="link-info">
                <h4>${link.title}</h4>
                <p class="link-url">${link.url}</p>
                <p class="link-meta">${getCollegeName(link.college)} - ${getStageName(link.stage)}</p>
                <div class="link-stats">
                    <span><i class="fas fa-mouse-pointer"></i> ${link.clicks}</span>
                </div>
            </div>
            <div class="link-actions">
                <button class="primary-btn" onclick="openLink('${link.url}', ${link.id})">
                    <i class="fas fa-external-link-alt"></i> فتح
                </button>
                <button class="secondary-btn" onclick="editLink(${link.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="danger-btn" onclick="deleteLink(${link.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Utility Functions
function getContentTypeIcon(type) {
    const icons = {
        'book': 'fas fa-file-pdf',
        'video': 'fas fa-video',
        'file': 'fas fa-file-alt',
        'link': 'fas fa-link'
    };
    return icons[type] || 'fas fa-file';
}

function getContentTypeName(type) {
    const names = {
        'book': 'كتاب',
        'video': 'فيديو',
        'file': 'ملف',
        'link': 'رابط'
    };
    return names[type] || 'محتوى';
}

function getCollegeName(college) {
    const names = {
        'medicine': 'كلية الطب',
        'engineering': 'كلية الهندسة',
        'science': 'كلية العلوم',
        'arts': 'كلية الآداب',
        'law': 'كلية الحقوق'
    };
    return names[college] || college;
}

function getStageName(stage) {
    const names = {
        'first': 'المرحلة الأولى',
        'second': 'المرحلة الثانية',
        'third': 'المرحلة الثالثة',
        'fourth': 'المرحلة الرابعة',
        'fifth': 'المرحلة الخامسة',
        'sixth': 'المرحلة السادسة'
    };
    return names[stage] || stage;
}

function getFileIcon(fileType) {
    const icons = {
        'pdf': 'fa-file-pdf',
        'doc': 'fa-file-word',
        'docx': 'fa-file-word',
        'ppt': 'fa-file-powerpoint',
        'pptx': 'fa-file-powerpoint',
        'txt': 'fa-file-alt'
    };
    return icons[fileType] || 'fa-file';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// Content Actions (placeholders for now)
function openLibraryItem(type, id) {
    showSection(`library-${type}s`);
}

function downloadBook(id) {
    const book = libraryBooks.find(b => b.id === id);
    if (book) {
        book.downloads++;
        showNotification(`تم بدء تحميل: ${book.title}`, 'success');
        loadLibraryBooks();
    }
}

function playVideo(id) {
    const video = libraryVideos.find(v => v.id === id);
    if (video) {
        video.views++;
        showNotification(`تم تشغيل: ${video.title}`, 'success');
        loadLibraryVideos();
    }
}

function downloadFile(id) {
    const file = libraryFiles.find(f => f.id === id);
    if (file) {
        file.downloads++;
        showNotification(`تم بدء تحميل: ${file.title}`, 'success');
        loadLibraryFiles();
    }
}

function openLink(url, id) {
    const link = libraryLinks.find(l => l.id === id);
    if (link) {
        link.clicks++;
        window.open(url, '_blank');
        loadLibraryLinks();
    }
}

// Edit and Delete Functions (placeholders)
function editBook(id) {
    showNotification('تحرير الكتاب - قيد التطوير', 'info');
}

function deleteBook(id) {
    if (confirm('هل أنت متأكد من حذف هذا الكتاب؟')) {
        libraryBooks = libraryBooks.filter(b => b.id !== id);
        showNotification('تم حذف الكتاب', 'success');
        loadLibraryBooks();
        loadLibraryContent();
    }
}

function editVideo(id) {
    showNotification('تحرير الفيديو - قيد التطوير', 'info');
}

function deleteVideo(id) {
    if (confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
        libraryVideos = libraryVideos.filter(v => v.id !== id);
        showNotification('تم حذف الفيديو', 'success');
        loadLibraryVideos();
        loadLibraryContent();
    }
}

function editFile(id) {
    showNotification('تحرير الملف - قيد التطوير', 'info');
}

function deleteFile(id) {
    if (confirm('هل أنت متأكد من حذف هذا الملف؟')) {
        libraryFiles = libraryFiles.filter(f => f.id !== id);
        showNotification('تم حذف الملف', 'success');
        loadLibraryFiles();
        loadLibraryContent();
    }
}

function editLink(id) {
    showNotification('تحرير الرابط - قيد التطوير', 'info');
}

function deleteLink(id) {
    if (confirm('هل أنت متأكد من حذف هذا الرابط؟')) {
        libraryLinks = libraryLinks.filter(l => l.id !== id);
        showNotification('تم حذف الرابط', 'success');
        loadLibraryLinks();
        loadLibraryContent();
    }
}

// Search and Filter Functions
function searchLibrary() {
    const searchTerm = document.getElementById('librarySearchInput').value.toLowerCase();
    const category = document.getElementById('libraryCategoryFilter').value;
    
    // Implementation would filter content based on search term and category
    console.log('Searching for:', searchTerm, 'in category:', category);
}

function filterLibrary() {
    searchLibrary();
}

function filterBooks() {
    const college = document.getElementById('bookCollegeFilter').value;
    const stage = document.getElementById('bookStageFilter').value;
    
    // Implementation would filter books based on college and stage
    console.log('Filtering books by college:', college, 'stage:', stage);
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadPendingRequests();
    loadAnnouncements();
    loadContests();
    loadImages();
    loadVideos();
    
    // Initialize library
    loadLibraryContent();
});
