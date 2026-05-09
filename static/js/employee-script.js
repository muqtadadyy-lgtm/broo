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

function openNotificationModal() {
    document.getElementById('notificationModal').style.display = 'flex';
    toggleFabMenu();
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
    const notifications = document.getElementById('chatRoomNotifications').checked;
    const encryption = document.getElementById('chatRoomEncryption').checked;
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
            notifications: notifications,
            encryption: encryption,
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
            fileCount: 0
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
        document.getElementById('chatRoomNotifications').checked = true;
        document.getElementById('chatRoomEncryption').checked = false;
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
    
    // Check if username exists in available users
    const userExists = allAvailableMembers.some(member => 
        member.username === username || member.name.toLowerCase().includes(username.toLowerCase())
    );
    
    if (userExists) {
        statusDiv.innerHTML = '<span class="status-success">المستخدم متاح للإضافة</span>';
    } else {
        statusDiv.innerHTML = '<span class="status-warning">المستخدم غير موجود في النظام</span>';
    }
    
    // Allow adding with Enter key
    if (event.key === 'Enter') {
        addMemberByUsername();
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
    
    // Find user in available members
    let userToAdd = allAvailableMembers.find(member => 
        member.username === username || member.name.toLowerCase().includes(username.toLowerCase())
    );
    
    // If not found, create a new user entry
    if (!userToAdd) {
        userToAdd = {
            id: Date.now(), // Temporary ID
            username: username,
            name: username, // Use username as name if not found
            email: `${username}@university.edu`, // Generate email
            role: 'student', // Default role
            status: 'active'
        };
    }
    
    // Add to chat room members
    chatRoomMembers.push(userToAdd);
    updateMemberList();
    
    // Clear input and status
    document.getElementById('usernameInput').value = '';
    statusDiv.innerHTML = '';
    
    showNotification(`تم إضافة ${userToAdd.name} إلى الكروب بنجاح`, 'success');
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
