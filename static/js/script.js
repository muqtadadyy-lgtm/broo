// Language Management
const translations = {
    ar: {
        'اللغة': 'اللغة',
        'اختر اللغة المفضلة': 'اختر اللغة المفضلة',
        'العربية': 'العربية',
        'الإنجليزية': 'الإنجليزية',
        'الفرنسية': 'الفرنسية',
        'الثيمات': 'الثيمات',
        'اختر الثيم المفضل': 'اختر الثيم المفضل',
        'أسود': 'أسود',
        'أبيض': 'أبيض',
        'أخضر': 'أخضر',
        'أحمر': 'أحمر',
        'بنفسجي': 'بنفسجي',
        'أزرق': 'أزرق',
        'تسجيل الدخول': 'تسجيل الدخول',
        'اسم المستخدم': 'اسم المستخدم',
        'كلمة المرور': 'كلمة المرور',
        'طالب': 'طالب',
        'موظف': 'موظف',
        'دخول': 'دخول',
        'ليس لديك حساب؟': 'ليس لديك حساب؟',
        'إنشاء حساب جديد': 'إنشاء حساب جديد',
        'الاسم الكامل': 'الاسم الكامل',
        'البريد الإلكتروني': 'البريد الإلكتروني',
        'تأكيد كلمة المرور': 'تأكيد كلمة المرور',
        'إنشاء الحساب': 'إنشاء الحساب',
        'لديك حساب بالفعل؟': 'لديك حساب بالفعل؟',
        'جامعة وطنية': 'جامعة وطنية',
        'العراق - نظام إدارة الأنشطة الطلابية': 'العراق - نظام إدارة الأنشطة الطلابية',
        'تم تغيير الثيم بنجاح': 'تم تغيير الثيم بنجاح',
        'تم تغيير اللغة بنجاح': 'تم تغيير اللغة بنجاح',
    },
    en: {
        'اللغة': 'Language',
        'اختر اللغة المفضلة': 'Choose Your Language',
        'العربية': 'Arabic',
        'الإنجليزية': 'English',
        'الفرنسية': 'French',
        'الثيمات': 'Themes',
        'اختر الثيم المفضل': 'Choose Your Theme',
        'أسود': 'Black',
        'أبيض': 'White',
        'أخضر': 'Green',
        'أحمر': 'Red',
        'بنفسجي': 'Purple',
        'أزرق': 'Blue',
        'تسجيل الدخول': 'Login',
        'اسم المستخدم': 'Username',
        'كلمة المرور': 'Password',
        'طالب': 'Student',
        'موظف': 'Employee',
        'دخول': 'Login',
        'ليس لديك حساب؟': 'Don\'t have an account?',
        'إنشاء حساب جديد': 'Create New Account',
        'الاسم الكامل': 'Full Name',
        'البريد الإلكتروني': 'Email',
        'تأكيد كلمة المرور': 'Confirm Password',
        'إنشاء الحساب': 'Create Account',
        'لديك حساب بالفعل؟': 'Already have an account?',
        'جامعة وطنية': 'Watania University',
        'العراق - نظام إدارة الأنشطة الطلابية': 'Iraq - Student Activities Management System',
        'تم تغيير الثيم بنجاح': 'Theme changed successfully',
        'تم تغيير اللغة بنجاح': 'Language changed successfully',
    },
    fr: {
        'اللغة': 'Langue',
        'اختر اللغة المفضلة': 'Choisissez votre langue',
        'العربية': 'Arabe',
        'الإنجليزية': 'Anglais',
        'الفرنسية': 'Français',
        'الثيمات': 'Thèmes',
        'اختر الثيم المفضل': 'Choisissez votre thème',
        'أسود': 'Noir',
        'أبيض': 'Blanc',
        'أخضر': 'Vert',
        'أحمر': 'Rouge',
        'بنفسجي': 'Violet',
        'أزرق': 'Bleu',
        'تسجيل الدخول': 'Connexion',
        'اسم المستخدم': 'Nom d\'utilisateur',
        'كلمة المرور': 'Mot de passe',
        'طالب': 'Étudiant',
        'موظف': 'Employé',
        'دخول': 'Connexion',
        'ليس لديك حساب؟': 'Vous n\'avez pas de compte?',
        'إنشاء حساب جديد': 'Créer un nouveau compte',
        'الاسم الكامل': 'Nom complet',
        'البريد الإلكتروني': 'Email',
        'تأكيد كلمة المرور': 'Confirmer le mot de passe',
        'إنشاء الحساب': 'Créer un compte',
        'لديك حساب بالفعل؟': 'Vous avez déjà un compte?',
        'جامعة وطنية': 'Université Watania',
        'العراق - نظام إدارة الأنشطة الطلابية': 'Irak - Système de gestion des activités étudiantes',
        'تم تغيير الثيم بنجاح': 'Thème changé avec succès',
        'تم تغيير اللغة بنجاح': 'Langue changée avec succès',
    }
    ,
    ku: {
        'اللغة': 'زمان',
        'اختر اللغة المفضلة': 'زمانی دڵخواز هەڵبژێرە',
        'العربية': 'عەربی',
        'الإنجليزية': 'ئینگلیزی',
        'الفرنسية': 'فەرەنسێ',
        'الثيمات': 'تەیماکان',
        'اختر الثيم المفضل': 'تێمای دڵخواز هەڵبژێرە',
        'أسود': 'ڕەش',
        'أبيض': 'سپی',
        'أخضر': 'سەوز',
        'أحمر': 'سور',
        'بنفسجي': 'مۆر',
        'أزرق': 'شین',
        'تسجيل الدخول': 'چوونەژوورەوە',
        'اسم المستخدم': 'ناوی بەکارهێنەر',
        'كلمة المرور': 'وشەی نهێنی',
        'طالب': 'خوێندکار',
        'موظف': 'کارمەند',
        'دخول': 'چوونەژوورەوە',
        'ليس لديك حساب؟': 'هەژمارێک نییە؟',
        'إنشاء حساب جديد': 'دروستکردنی هەژماری نوێ',
        'الاسم الكامل': 'ناوی تەواو',
        'البريد الإلكتروني': 'ئیمەیڵ',
        'تأكيد كلمة المرور': 'دڵنیابون لە وشەی نهێنی',
        'إنشاء الحساب': 'دروستکردنی هەژمار',
        'لديك حساب بالفعل؟': 'پێشتر هەژمارەکت هەیە؟',
        'جامعة وطنية': 'زانکۆی نیشتمانی',
        'العراق - نظام إدارة الأنشطة الطلابية': 'عیراق - سیستەمی بەڕێوەبردنی چالاکیی خوێندکاران',
        'تم تغيير الثيم بنجاح': 'تێما بەسەردەکەوێت بەسەرکەوتووی',
        'تم تغيير اللغة بنجاح': 'زمان بەسەردەکەوێت بەسەرکەوتووی',
    }
};

function changeLanguage(lang) {
    localStorage.setItem('selectedLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = (lang === 'ar' || lang === 'ku') ? 'rtl' : 'ltr';
    
    // Update all elements with data attributes
    updatePageLanguage(lang);
    updateLanguageMenuUI(lang);
    closeLanguageMenu();
    
    showNotification(translations[lang]['تم تغيير اللغة بنجاح'], 'success');
    try {
        if (typeof refreshGuideLanguage === 'function' && typeof isGuideActive !== 'undefined' && isGuideActive) {
            refreshGuideLanguage(lang);
        }
    } catch {}
}

function updatePageLanguage(lang) {
    // Update all elements with data-ar, data-en, data-fr attributes
    document.querySelectorAll('[data-ar]').forEach(element => {
        const text = element.getAttribute(`data-${lang}`);
        if (text) {
            element.textContent = text;
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-placeholder-ar]').forEach(element => {
        const placeholder = element.getAttribute(`data-placeholder-${lang}`);
        if (placeholder) {
            element.placeholder = placeholder;
        }
    });

    // Update titles
    document.querySelectorAll('[data-title-ar]').forEach(element => {
        const title = element.getAttribute(`data-title-${lang}`);
        if (title) {
            element.title = title;
        }
    });
}

function toggleLanguageMenu() {
    const languageMenu = document.getElementById('languageMenu');
    languageMenu.classList.toggle('active');
}

function closeLanguageMenu() {
    const languageMenu = document.getElementById('languageMenu');
    languageMenu.classList.remove('active');
}

function updateLanguageMenuUI(currentLang) {
    const options = document.querySelectorAll('.language-option');
    options.forEach(option => {
        const lang = option.getAttribute('data-lang');
        if (lang === currentLang) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Load saved language and handle Auto-Login redirect
window.addEventListener('DOMContentLoaded', () => {
    const savedLanguage = localStorage.getItem('selectedLanguage') || 'ar';
    document.documentElement.lang = savedLanguage;
    document.documentElement.dir = (savedLanguage === 'ar' || savedLanguage === 'ku') ? 'rtl' : 'ltr';
    updatePageLanguage(savedLanguage);
    updateLanguageMenuUI(savedLanguage);
    
    // Auto-Login persistence
    const userStr = localStorage.getItem('currentUser');
    if (userStr && window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        try {
            const user = JSON.parse(userStr);
            if (user && user.role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (user && (user.role === 'employee' || user.role === 'super_employee')) {
                window.location.href = 'employee-dashboard.html';
            }
        } catch(e) {}
    }
});

// Close language menu when clicking outside
document.addEventListener('click', (e) => {
    const languageSelector = document.querySelector('.language-selector-dropdown');
    if (languageSelector && !languageSelector.contains(e.target)) {
        closeLanguageMenu();
    }
});

// Theme Management
function changeTheme(theme) {
    document.body.className = `theme-${theme}`;
    localStorage.setItem('selectedTheme', theme);
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    const msg = (translations[lang] && translations[lang]['تم تغيير الثيم بنجاح'])
        ? translations[lang]['تم تغيير الثيم بنجاح']
        : 'تم تغيير الثيم بنجاح';
    showNotification(msg, 'success');
    updateThemeMenuUI(theme);
    closeThemeMenu();
}

// Toggle Theme Menu
function toggleThemeMenu() {
    const themeMenu = document.getElementById('themeMenu');
    themeMenu.classList.toggle('active');
}

// Close Theme Menu
function closeThemeMenu() {
    const themeMenu = document.getElementById('themeMenu');
    themeMenu.classList.remove('active');
}

// Update Theme Menu UI
function updateThemeMenuUI(currentTheme) {
    const options = document.querySelectorAll('.theme-option');
    options.forEach(option => {
        const theme = option.getAttribute('data-theme');
        if (theme === currentTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
}

// Load saved theme
window.addEventListener('DOMContentLoaded', () => {
    let savedTheme = localStorage.getItem('selectedTheme') || 'blue-light';
    if (savedTheme === 'blue') { savedTheme = 'blue-light'; localStorage.setItem('selectedTheme', 'blue-light'); }
    document.body.className = `theme-${savedTheme}`;
    updateThemeMenuUI(savedTheme);
});

// Close theme menu when clicking outside
document.addEventListener('click', (e) => {
    const themeSelector = document.querySelector('.theme-selector-dropdown');
    if (themeSelector && !themeSelector.contains(e.target)) {
        closeThemeMenu();
    }
});

// Form Switching
function showRegisterForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('registerForm').classList.remove('hidden');
}

function showLoginForm() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const role = document.querySelector('input[name="loginRole"]:checked').value;
    
    // Try backend API first
    const result = await apiLogin({ username, password, role });
    
    if (result.success) {
        showNotification('تم تسجيل الدخول بنجاح', 'success');
        setTimeout(() => {
            if (role === 'student') {
                window.location.href = 'student-dashboard.html';
            } else if (role === 'employee') {
                window.location.href = 'employee-dashboard.html';
            } else if (role === 'super_employee') {
                // للموظف الرئيسي، نضيف معلمة للمميزة في الـ URL
                window.location.href = 'employee-dashboard.html?role=super_employee';
            }
        }, 1000);
    } else {
        showNotification(result.message || 'فشل تسجيل الدخول', 'error');
    }
}

// Handle Registration
async function handleRegister(event) {
    event.preventDefault();
    
    const fullName = document.getElementById('registerFullName').value;
    const username = document.getElementById('registerUsername').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    const role = document.querySelector('input[name="registerRole"]:checked').value;
    
    // Validation
    if (password !== confirmPassword) {
        showNotification('كلمات المرور غير متطابقة', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('كلمة المرور يجب أن تكون 6 أحرف على الأقل', 'error');
        return;
    }
    
    const userData = {
        fullName,
        username,
        email,
        password,
        role
    };
    if (typeof activeAnnouncement !== 'undefined' && activeAnnouncement && activeAnnouncement.requireAck) {
        if (!hasAnnouncementAck(activeAnnouncement.version || '1')) {
            showNotification('يرجى الاطلاع على الإعلان والضغط على "أفهم" قبل إنشاء الحساب', 'error');
            openAnnouncementModal();
            return;
        }
    }
    
    // Try backend API first
    const result = await apiRegister(userData);
    
    if (result.success) {
        showNotification(result.message, 'success');
        setTimeout(() => {
            showLoginForm();
            document.getElementById('registerForm').querySelector('form').reset();
        }, 1500);
    } else {
        showNotification(result.message || 'فشل إنشاء الحساب', 'error');
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

let activeAnnouncement = null;

function getAnnouncementAckKey(version) {
    return `announcementAck:${version}`;
}

function hasAnnouncementAck(version) {
    return !!localStorage.getItem(getAnnouncementAckKey(version));
}

function setAnnouncementAck(version) {
    localStorage.setItem(getAnnouncementAckKey(version), '1');
}

async function fetchActiveAnnouncement() {
    try {
        const res = await apiGetActiveAnnouncement();
        if (res && res.success && res.announcement && res.announcement.active) {
            activeAnnouncement = res.announcement;
            return;
        }
    } catch (e) {}
    const local = localStorage.getItem('announcementActive');
    if (local) {
        try {
            activeAnnouncement = JSON.parse(local);
            return;
        } catch {}
    }
    activeAnnouncement = {
        version: 1,
        title: 'إعلان مهم',
        contentHtml: 'يرجى قراءة المتطلبات التالية قبل إنشاء الحساب.',
        requiredItems: ['الهوية الجامعية', 'البريد الجامعي', 'الالتزام بسياسة الاستخدام'],
        requireAck: true,
        active: true
    };
}

function openAnnouncementModal() {
    if (!activeAnnouncement) return;
    const existing = document.getElementById('announcementModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'announcementModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    const items = (activeAnnouncement.requiredItems || []).map(i => `<li>${i}</li>`).join('');
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${activeAnnouncement.title || 'إعلان'}</h2>
                <button class="close-btn" onclick="(function(){const m=document.getElementById('announcementModal'); if(m) m.remove();})()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="details-content">
                <p>${activeAnnouncement.contentHtml || ''}</p>
                ${items ? `<ul>${items}</ul>` : ''}
            </div>
            <div class="modal-actions">
                <button class="approve-btn" id="announcementAckBtn"><i class="fas fa-check"></i> أفهم</button>
                <button class="cancel-btn" onclick="(function(){const m=document.getElementById('announcementModal'); if(m) m.remove();})()">إغلاق</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    const ackBtn = document.getElementById('announcementAckBtn');
    if (ackBtn) {
        ackBtn.addEventListener('click', () => {
            setAnnouncementAck(activeAnnouncement.version || '1');
            showNotification('تم تأكيد القراءة', 'success');
            const m = document.getElementById('announcementModal');
            if (m) m.remove();
        });
    }
}

window.addEventListener('DOMContentLoaded', async () => {
    const onIndex = !!document.getElementById('loginForm');
    if (!onIndex) return;
    await fetchActiveAnnouncement();
});

function openPdfViewer(url, title = 'عرض الملف') {
    const existing = document.getElementById('pdfViewerModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'pdfViewerModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 90vw; width: 900px; height: 80vh; display: flex; flex-direction: column;">
            <div class="modal-header" style="display:flex; justify-content: space-between; align-items:center;">
                <h2 style="margin:0;">${title}</h2>
                <button class="close-btn" onclick="(function(){const m=document.getElementById('pdfViewerModal'); if(m) m.remove();})()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div style="flex:1; border:1px solid var(--border-color);">
                <iframe src="${url}" style="width:100%; height:100%; border:0;" allowfullscreen></iframe>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Developers Modal
function openDevelopersModal() {
    const existing = document.getElementById('developersModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'developersModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const titles = {
        ar: 'المطورون',
        en: 'Developers',
        fr: 'Développeurs',
        ku: 'بەرنامەسازان'
    };
    
    const developers = {
        ar: [
            { name: 'عبد الرحمن حيدر', role: 'مطور' },
            { name: 'مقتدى حسن', role: 'مطور' }
        ],
        en: [
            { name: 'Abdul Rahman Haider', role: 'Developer' },
            { name: 'Muqtada Hassan', role: 'Developer' }
        ],
        fr: [
            { name: 'Abdul Rahman Haider', role: 'Développeur' },
            { name: 'Muqtada Hassan', role: 'Développeur' }
        ],
        ku: [
            { name: 'Abdul Rahman Haider', role: 'بەرنامەساز' },
            { name: 'Muqtada Hassan', role: 'بەرنامەساز' }
        ]
    };
    
    const devList = developers[currentLang] || developers['ar'];
    const textAlign = (currentLang === 'ar' || currentLang === 'ku') ? 'right' : 'left';
    
    let developersHTML = '';
    devList.forEach(dev => {
        developersHTML += `
            <div style="margin-bottom: 20px; text-align: ${textAlign};">
                <i class="fas fa-user-circle" style="font-size: 60px; color: var(--accent-color); margin-bottom: 10px;"></i>
                <h3 style="margin: 10px 0; color: var(--text-primary);">${dev.name}</h3>
                <p style="color: var(--text-secondary); margin: 5px 0;">${dev.role}</p>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${titles[currentLang]}</h2>
                <button class="close-btn" onclick="(function(){const m=document.getElementById('developersModal'); if(m) m.remove();})()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="details-content">
                <div style="text-align: center; padding: 20px;">
                    ${developersHTML}
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Developers' Rights Modal
function openDevelopersRightsModal() {
    const existing = document.getElementById('developersRightsModal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'developersRightsModal';
    modal.className = 'modal';
    modal.style.display = 'flex';
    
    const currentLang = localStorage.getItem('selectedLanguage') || 'ar';
    const titles = {
        ar: 'حقوق المطورين',
        en: 'Developers\' Rights',
        fr: 'Droits des développeurs',
        ku: 'مافی بەرنامەسازان'
    };
    
    const content = {
        ar: `
            <h4>حقوق المطورين</h4>
            <ul style="text-align: right; padding-right: 20px;">
                <li>الحق في الملكية الفكرية للكود والتصاميم</li>
                <li>الحق في الحصول على الإشادة والتقدير</li>
                <li>الحق في حماية البيانات الشخصية</li>
                <li>الحق في بيئة عمل آمنة وصحية</li>
                <li>الحق في التطوير المهني والتدريب</li>
            </ul>
        `,
        en: `
            <h4>Developers' Rights</h4>
            <ul style="text-align: left; padding-left: 20px;">
                <li>Right to intellectual property of code and designs</li>
                <li>Right to recognition and appreciation</li>
                <li>Right to data privacy protection</li>
                <li>Right to a safe and healthy work environment</li>
                <li>Right to professional development and training</li>
            </ul>
        `,
        fr: `
            <h4>Droits des développeurs</h4>
            <ul style="text-align: left; padding-left: 20px;">
                <li>Droit à la propriété intellectuelle du code et des conceptions</li>
                <li>Droit à la reconnaissance et à l'appréciation</li>
                <li>Droit à la protection des données personnelles</li>
                <li>Droit à un environnement de travail sûr et sain</li>
                <li>Droit au développement professionnel et à la formation</li>
            </ul>
        `,
        ku: `
            <h4>مافی بەرنامەسازان</h4>
            <ul style="text-align: right; padding-right: 20px;">
                <li>مافی مالکیتی هوشیاری کۆد و دیزاین</li>
                <li>مافی ناسناسی و ستایش</li>
                <li>مافی پاراستنی زانیاری تایبەت</li>
                <li>مافی ژینگەی کاری ایمن و تندروست</li>
                <li>مافی پێشکەوتنی حیرفەیی و فێرکاری</li>
            </ul>
        `
    };
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>${titles[currentLang]}</h2>
                <button class="close-btn" onclick="(function(){const m=document.getElementById('developersRightsModal'); if(m) m.remove();})()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="details-content">
                ${content[currentLang]}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}
