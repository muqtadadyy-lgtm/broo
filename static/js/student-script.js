// Check Authentication
window.addEventListener('DOMContentLoaded', () => {
    const user = apiGetCurrentUser();
    
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }
    
    // تثبيت هوية الطالب في localStorage لاستخدامها في نظام المراسلة
    localStorage.setItem('currentUserId', user.fullName);
    localStorage.setItem('currentUserName', user.fullName);
    localStorage.setItem('userRole', user.role || 'student');
    
    // Display user name
    document.getElementById('studentName').textContent = user.fullName;
    
    // Load theme
    let savedTheme = localStorage.getItem('selectedTheme') || 'blue-light';
    if (savedTheme === 'blue') { savedTheme = 'blue-light'; localStorage.setItem('selectedTheme', 'blue-light'); }
    document.body.className = `dashboard-body theme-${savedTheme}`;
    
    // Load applications
    loadMyApplications();
    
    // Load employee requests (إشعارات الموظفين للنشاطات)
    loadEmployeeRequests();
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

// Activity Form Management
let currentActivityType = '';

function openActivityForm(activityType) {
    currentActivityType = activityType;
    document.getElementById('modalTitle').textContent = `تقديم طلب - ${activityType}`;
    document.getElementById('activityType').value = activityType;
    document.getElementById('activityModal').classList.add('active');
    
    // Pre-fill student name
    const user = apiGetCurrentUser();
    document.getElementById('appName').value = user.fullName;
}

function closeActivityForm() {
    document.getElementById('activityModal').classList.remove('active');
    document.getElementById('applicationForm').reset();
}

// Submit Application
async function submitApplicationForm(event) {
    event.preventDefault();
    
    const formData = new FormData();
    formData.append('name', document.getElementById('appName').value);
    formData.append('activityType', document.getElementById('activityType').value);
    formData.append('activityNumber', document.getElementById('appActivityNumber').value);
    formData.append('college', document.getElementById('appCollege').value);
    formData.append('department', document.getElementById('appDepartment').value);
    formData.append('specialization', document.getElementById('appSpecialization').value);
    formData.append('phone', document.getElementById('appPhone').value);
    formData.append('details', document.getElementById('appDetails').value || '');

    const projectFileInput = document.getElementById('appProjectFile');
    if (projectFileInput && projectFileInput.files && projectFileInput.files[0]) {
        formData.append('projectFile', projectFileInput.files[0]);
    }
    
    // Send to backend API with support for file upload
    const result = await apiSubmitApplication(formData);
    
    if (result.success) {
        showNotification(result.message, 'success');
        closeActivityForm();
        loadMyApplications();
    } else {
        showNotification(result.message || 'حدث خطأ في إرسال الطلب', 'error');
    }
}

// Load My Applications
async function loadMyApplications() {
    const apiResult = await apiGetMyApplications();
    let applications = [];
    
    if (apiResult.success && apiResult.applications) {
        applications = apiResult.applications;
    } else {
        applications = [];
    }
    
    const container = document.getElementById('myApplicationsList');
    
    if (applications.length === 0) {
        container.innerHTML = `
            <div class="application-item">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-inbox"></i> لا توجد طلبات حالياً
                </p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = applications.map(app => `
        <div class="application-item">
            <h4><i class="fas fa-file-alt"></i> ${app.activityType}</h4>
            <p><strong>رقم النشاط:</strong> ${app.activityNumber}</p>
            <p><strong>الكلية:</strong> ${app.college}</p>
            <p><strong>القسم:</strong> ${app.department}</p>
            <p><strong>التخصص:</strong> ${app.specialization}</p>
            <p><strong>تاريخ التقديم:</strong> ${new Date(app.submittedAt).toLocaleDateString('ar-IQ')}</p>
            ${app.projectFile ? `
            <p>
                <strong>الملف المرفق:</strong>
                <button class="link-btn" onclick="openPdfViewer('${app.projectFile}','ملف الطلب')">
                    <i class="fas fa-file-pdf"></i> عرض الملف
                </button>
            </p>
            ` : ''}
            <button class="message-btn" style="margin-top: 8px;" onclick="openStudentApplicationChat(${app.id}, '${app.activityType}', '${app.activityNumber}')">
                <i class="fas fa-comments"></i>
                <span>مراسلة حول هذا الطلب</span>
            </button>
            <span class="status-badge status-${app.status === 'قيد الانتظار' ? 'pending' : app.status === 'مقبول' ? 'approved' : 'rejected'}">
                ${app.status}
            </span>
        </div>
    `).join('');
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
document.getElementById('activityModal').addEventListener('click', (e) => {
    if (e.target.id === 'activityModal') {
        closeActivityForm();
    }
});

// ==================== EMPLOYEE REQUEST FUNCTIONS ====================

let employeeRequests = [];
let currentRequestId = null;

// Load Employee Requests
async function loadEmployeeRequests() {
    console.log('Loading employee requests...');
    const result = await apiGetStudentRequests();
    
    if (result.success && result.requests) {
        employeeRequests = result.requests;
        console.log('Employee requests loaded:', employeeRequests.length);
        displayEmployeeRequests(employeeRequests);
    } else {
        console.log('No employee requests or error:', result.message);
        document.getElementById('employeeRequestsList').innerHTML = `
            <div class="application-item">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-inbox"></i> لا توجد طلبات من الموظفين
                </p>
            </div>
        `;
    }
}

// Display Employee Requests
function displayEmployeeRequests(requests) {
    console.log('Displaying employee requests:', requests);
    const container = document.getElementById('employeeRequestsList');
    
    if (requests.length === 0) {
        container.innerHTML = `
            <div class="application-item">
                <p style="text-align: center; color: var(--text-secondary);">
                    <i class="fas fa-inbox"></i> لا توجد طلبات من الموظفين
                </p>
            </div>
        `;
        return;
    }
    
    // Filter to show only pending requests prominently
    const pendingRequests = requests.filter(req => req.status === 'قيد الانتظار');
    const respondedRequests = requests.filter(req => req.status !== 'قيد الانتظار');
    
    let html = '';
    
    if (pendingRequests.length > 0) {
        html += pendingRequests.map(req => `
            <div class="application-item clickable-request" data-request-id="${req.id}" role="button" tabindex="0" style="cursor: pointer; border: 2px solid var(--primary-color);">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h4 style="color: var(--primary-color);"><i class="fas fa-exclamation-circle"></i> ${req.title}</h4>
                        <p><strong>من:</strong> ${req.employeeName}</p>
                        <p><strong>نوع الطلب:</strong> ${req.requestType}</p>
                        ${req.activityName ? `<p><strong>النشاط:</strong> ${req.activityName}</p>` : ''}
                        ${req.deadline ? `<p><strong>الموعد النهائي:</strong> ${new Date(req.deadline).toLocaleString('ar-IQ')}</p>` : ''}
                        <p><strong>تاريخ الإرسال:</strong> ${new Date(req.createdAt).toLocaleString('ar-IQ')}</p>
                    </div>
                    <span class="status-badge status-pending">
                        ${req.status}
                    </span>
                </div>
                <p style="margin-top: 10px; color: var(--text-secondary);">${req.description}</p>
            </div>
        `).join('');
    }
    
    if (respondedRequests.length > 0) {
        html += respondedRequests.map(req => `
            <div class="application-item" style="opacity: 0.7;">
                <div style="display: flex; justify-content: space-between; align-items: start;">
                    <div>
                        <h4><i class="fas fa-envelope"></i> ${req.title}</h4>
                        <p><strong>من:</strong> ${req.employeeName}</p>
                        <p><strong>نوع الطلب:</strong> ${req.requestType}</p>
                        ${req.activityName ? `<p><strong>النشاط:</strong> ${req.activityName}</p>` : ''}
                        <p><strong>تاريخ الإرسال:</strong> ${new Date(req.createdAt).toLocaleString('ar-IQ')}</p>
                    </div>
                    <span class="status-badge status-${req.status === 'مقبول' ? 'approved' : 'rejected'}">
                        ${req.status}
                    </span>
                </div>
            </div>
        `).join('');
    }
    
    container.innerHTML = html;
    
    // Add event listeners for mobile compatibility
    let touchHandled = false;
    
    console.log('Adding event listeners to', container.querySelectorAll('.clickable-request').length, 'requests');
    
    container.querySelectorAll('.clickable-request').forEach((requestItem, index) => {
        const handleClick = (e) => {
            console.log('Click event on request', index);
            if (touchHandled) {
                touchHandled = false;
                return;
            }
            const requestId = requestItem.getAttribute('data-request-id');
            console.log('Request clicked, ID:', requestId);
            showEmployeeRequestDetails(parseInt(requestId));
        };
        
        requestItem.addEventListener('touchstart', () => {
            console.log('Touch start on request', index);
            touchHandled = false;
        });
        
        requestItem.addEventListener('touchend', (e) => {
            console.log('Touch end on request', index);
            e.preventDefault();
            touchHandled = true;
            const requestId = requestItem.getAttribute('data-request-id');
            console.log('Request touched, ID:', requestId);
            showEmployeeRequestDetails(parseInt(requestId));
        });
        
        requestItem.addEventListener('click', handleClick);
    });
}

// Show Employee Request Details
function showEmployeeRequestDetails(requestId) {
    console.log('showEmployeeRequestDetails called with ID:', requestId);
    currentRequestId = requestId;
    const req = employeeRequests.find(r => r.id == requestId);
    
    if (!req) {
        console.log('Request not found for ID:', requestId);
        return;
    }
    
    console.log('Request found:', req);
    
    // Only show details modal for pending requests
    if (req.status !== 'قيد الانتظار') {
        console.log('Request already responded:', req.status);
        showNotification('هذا الطلب تمت الإجابة عليه بالفعل', 'info');
        return;
    }
    
    const detailsContent = document.getElementById('employeeRequestDetails');
    detailsContent.innerHTML = `
        <div class="detail-row">
            <div class="detail-label">العنوان:</div>
            <div class="detail-value">${req.title}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">من الموظف:</div>
            <div class="detail-value">${req.employeeName}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">نوع الطلب:</div>
            <div class="detail-value">${req.requestType}</div>
        </div>
        <div class="detail-row">
            <div class="detail-label">الوصف:</div>
            <div class="detail-value">${req.description}</div>
        </div>
        ${req.activityName ? `
        <div class="detail-row">
            <div class="detail-label">اسم النشاط:</div>
            <div class="detail-value">${req.activityName}</div>
        </div>
        ` : ''}
        ${req.activityCode ? `
        <div class="detail-row">
            <div class="detail-label">رمز النشاط:</div>
            <div class="detail-value">${req.activityCode}</div>
        </div>
        ` : ''}
        ${req.deadline ? `
        <div class="detail-row">
            <div class="detail-label">الموعد النهائي للرد:</div>
            <div class="detail-value">${new Date(req.deadline).toLocaleString('ar-IQ')}</div>
        </div>
        ` : ''}
        <div class="detail-row">
            <div class="detail-label">تاريخ الإرسال:</div>
            <div class="detail-value">${new Date(req.createdAt).toLocaleString('ar-IQ')}</div>
        </div>
    `;
    
    document.getElementById('employeeRequestModal').classList.add('active');
}

// Close Employee Request Modal
function closeEmployeeRequestModal() {
    document.getElementById('employeeRequestModal').classList.remove('active');
    currentRequestId = null;
}

// Approve Employee Request
async function approveEmployeeRequest() {
    if (!currentRequestId) return;
    
    const result = await apiRespondToEmployeeRequest(currentRequestId, 'مقبول', '');
    
    if (result.success) {
        showNotification('تم قبول الطلب بنجاح', 'success');
        closeEmployeeRequestModal();
        loadEmployeeRequests();
    } else {
        showNotification(result.message || 'حدث خطأ في قبول الطلب', 'error');
    }
}

// Reject Employee Request
async function rejectEmployeeRequest() {
    if (!currentRequestId) return;
    
    const result = await apiRespondToEmployeeRequest(currentRequestId, 'مرفوض', '');
    
    if (result.success) {
        showNotification('تم رفض الطلب', 'success');
        closeEmployeeRequestModal();
        loadEmployeeRequests();
    } else {
        showNotification(result.message || 'حدث خطأ في رفض الطلب', 'error');
    }
}

// Close modal on outside click
document.getElementById('employeeRequestModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'employeeRequestModal') {
        closeEmployeeRequestModal();
    }
});
