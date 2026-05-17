// Guide/Tutorial System - Professional Edition
const guideSteps = {
    ar: [
        {
            title: '🎓 مرحباً بك في نظام الأنشطة الجامعية',
            description: 'نظام متكامل لإدارة الأنشطة والفعاليات الجامعية. سنرشدك عبر الميزات الرئيسية خطوة بخطوة.',
            target: '.auth-card',
            position: 'center',
            icon: 'fas fa-graduation-cap'
        },
        {
            title: '🎨 تخصيص المظهر',
            description: 'غيّر مظهر الموقع حسب ذوقك! الثيمات المتاحة: (أسود، أبيض، أزرق، أخضر).',
            target: '.theme-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-palette'
        },
        {
            title: '🌍 اختر لغتك المفضلة',
            description: 'الموقع يدعم 4 لغات: العربية، الإنجليزية، الفرنسية، والكردية. عند التبديل، تتحدث الواجهات والحقول والدليل تلقائياً.',
            target: '.language-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-globe'
        },
        {
            title: '📣 إعلان قبل التسجيل',
            description: 'اطّلع على الإعلان عبر زر "إعلان". إذا كان إلزامياً، يجب الضغط على "أفهم" قبل إنشاء الحساب.',
            target: 'button[title="إعلان"]',
            position: 'bottom',
            icon: 'fas fa-bullhorn'
        },
        {
            title: '👤 اختر دورك',
            description: 'اختر ما إذا كنت طالباً أو موظفاً. كل دور له واجهة خاصة به مع ميزات مختلفة.',
            target: '.role-selector',
            position: 'top',
            icon: 'fas fa-user-check'
        },
        {
            title: '🔐 تسجيل الدخول الآمن',
            description: 'أدخل بيانات المستخدم بأمان. النظام محمي بتشفير قوي والبيانات آمنة تماماً.',
            target: '.submit-btn',
            position: 'top',
            icon: 'fas fa-lock'
        }
    ],
    en: [
        {
            title: '🎓 Welcome to University Activities System',
            description: 'A comprehensive system for managing university activities and events. We\'ll guide you through the main features step by step.',
            target: '.auth-card',
            position: 'center',
            icon: 'fas fa-graduation-cap'
        },
        {
            title: '🎨 Customize Your Experience',
            description: 'Available themes: Black, White, Blue, Green.',
            target: '.theme-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-palette'
        },
        {
            title: '🌍 Choose Your Language',
            description: 'Supports 4 languages: Arabic, English, French, and Kurdish. UI, fields and guide switch instantly.',
            target: '.language-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-globe'
        },
        {
            title: '📣 Pre‑Registration Announcement',
            description: 'Open with the "Announcement" button. If mandatory, press "I Understand" before creating an account.',
            target: 'button[title="إعلان"]',
            position: 'bottom',
            icon: 'fas fa-bullhorn'
        },
        {
            title: '👤 Select Your Role',
            description: 'Choose whether you are a Student or Employee. Each role has its own interface with different features.',
            target: '.role-selector',
            position: 'top',
            icon: 'fas fa-user-check'
        },
        {
            title: '🔐 Secure Login',
            description: 'Enter your credentials securely. The system is protected with strong encryption and your data is completely safe.',
            target: '.submit-btn',
            position: 'top',
            icon: 'fas fa-lock'
        }
    ],
    fr: [
        {
            title: '🎓 Bienvenue dans le Système d\'Activités Universitaires',
            description: 'Un système complet de gestion des activités et événements universitaires. Nous vous guiderons à travers les fonctionnalités principales étape par étape.',
            target: '.auth-card',
            position: 'center',
            icon: 'fas fa-graduation-cap'
        },
        {
            title: '🎨 Personnalisez Votre Expérience',
            description: 'Thèmes disponibles : Noir, Blanc, Bleu, Vert.',
            target: '.theme-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-palette'
        },
        {
            title: '🌍 Choisissez Votre Langue',
            description: 'Prend en charge 4 langues: arabe, anglais, français et kurde. L’UI, les champs et le guide basculent instantanément.',
            target: '.language-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-globe'
        },
        {
            title: '📣 Annonce avant inscription',
            description: 'Ouvrez via le bouton "Annonce". Si elle est obligatoire, cliquez sur "Je comprends" avant de créer un compte.',
            target: 'button[title="إعلان"]',
            position: 'bottom',
            icon: 'fas fa-bullhorn'
        },
        {
            title: '👤 Sélectionnez Votre Rôle',
            description: 'Choisissez si vous êtes un Étudiant ou un Employé. Chaque rôle a sa propre interface avec des fonctionnalités différentes.',
            target: '.role-selector',
            position: 'top',
            icon: 'fas fa-user-check'
        },
        {
            title: '🔐 Connexion Sécurisée',
            description: 'Entrez vos identifiants en toute sécurité. Le système est protégé par un chiffrement fort et vos données sont complètement sûres.',
            target: '.submit-btn',
            position: 'top',
            icon: 'fas fa-lock'
        }
    ]
    ,
    ku: [
        {
            title: '🎓 بەخێربێیت بۆ سیستەمی چالاکیی زانکۆ',
            description: 'سیستەمێکی تەواوە لەبەرێوەبردنی چالاکییەکان و ئامادەکارییەکان. پێ بە پێ ڕێنمایی دەکرێیت.',
            target: '.auth-card',
            position: 'center',
            icon: 'fas fa-graduation-cap'
        },
        {
            title: '🎨 تەیما بگۆڕە',
            description: 'تەیماکانى بەردەست: (ڕەش، سپی، شین، سەوز).',
            target: '.theme-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-palette'
        },
        {
            title: '🌍 زمانی دڵخواز هەڵبژێرە',
            description: 'پشتیوانی لە ٤ زمان: عەربی، ئینگلیزی، فەرەنسێ و کوردی. بە گۆڕینی زمان، هەموو پێکهاتەکان و ڕێنمایی دەگۆڕن.',
            target: '.language-toggle-btn',
            position: 'bottom',
            icon: 'fas fa-globe'
        },
        {
            title: '📣 ئەگەری ئاگانامەی پێش خۆتۆمارکردن',
            description: 'لە دوگمەی "ئاگانامە" دەکرێت بکردرێت. ئەگەر لازم بێت، پێویستە "تێگەیشتم" بکۆیت پێش دروستکردنی هەژمار.',
            target: 'button[title="إعلان"]',
            position: 'bottom',
            icon: 'fas fa-bullhorn'
        },
        {
            title: '👤 ڕۆڵەکەت هەڵبژێرە',
            description: 'دیار بکە خوێندکاریت یان کارمەند. هەر ڕۆڵێک یەکەی تایبەتی هەیە و تایبەتمەندییە جیاوازەکان.',
            target: '.role-selector',
            position: 'top',
            icon: 'fas fa-user-check'
        },
        {
            title: '🔐 چوونەژوورەوەی پارێزراو',
            description: 'زانیارییەکان بە شێوەیەکی پارێزراو داخل بکە. سیستەمەکە بە تێپەڕبوونی بەهێز پارێزراوە.',
            target: '.submit-btn',
            position: 'top',
            icon: 'fas fa-lock'
        }
    ]
};

let currentGuideStep = 0;
let isGuideActive = false;

function startGuide() {
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    currentGuideStep = 0;
    isGuideActive = true;
    showGuideStep(lang);
}

function showGuideStep(lang) {
    const steps = guideSteps[lang] || guideSteps['ar'];
    
    if (currentGuideStep >= steps.length) {
        endGuide();
        return;
    }
    
    const step = steps[currentGuideStep];
    const targetElement = document.querySelector(step.target);
    
    if (!targetElement) {
        currentGuideStep++;
        showGuideStep(lang);
        return;
    }
    
    // Remove old guide overlay
    const oldOverlay = document.getElementById('guideOverlay');
    if (oldOverlay) oldOverlay.remove();
    
    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'guideOverlay';
    overlay.className = 'guide-overlay';
    
    // Create highlight
    const highlight = document.createElement('div');
    highlight.className = 'guide-highlight';
    const rect = targetElement.getBoundingClientRect();
    highlight.style.top = (rect.top + window.scrollY - 10) + 'px';
    highlight.style.left = (rect.left + window.scrollX - 10) + 'px';
    highlight.style.width = (rect.width + 20) + 'px';
    highlight.style.height = (rect.height + 20) + 'px';
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = `guide-tooltip guide-tooltip-${step.position}`;
    const prevLabel = lang === 'ar' ? 'السابق' : lang === 'en' ? 'Previous' : 'Précédent';
    const nextLabel = lang === 'ar' ? 'التالي' : lang === 'en' ? 'Next' : 'Suivant';
    const skipLabel = lang === 'ar' ? 'تخطي' : lang === 'en' ? 'Skip' : 'Ignorer';
    
    tooltip.innerHTML = `
        <div class="guide-tooltip-header">
            <div class="guide-icon">
                <i class="${step.icon}"></i>
            </div>
            <div class="guide-title-section">
                <h3>${step.title}</h3>
                <span class="guide-progress">${currentGuideStep + 1}/${steps.length}</span>
            </div>
            <button class="guide-close" onclick="endGuide()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="guide-divider"></div>
        <p class="guide-description">${step.description}</p>
        <div class="guide-buttons">
            <button class="guide-btn-prev" onclick="prevGuideStep()" ${currentGuideStep === 0 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i> ${prevLabel}
            </button>
            <button class="guide-btn-skip" onclick="endGuide()">
                ${skipLabel}
            </button>
            <button class="guide-btn-next" onclick="nextGuideStep()">
                ${nextLabel} <i class="fas fa-chevron-right"></i>
            </button>
        </div>
    `;
    
    // Position tooltip
    const maxWidth = Math.min(420, window.innerWidth - 40);
    tooltip.style.maxWidth = maxWidth + 'px';
    const centerX = rect.left + window.scrollX + (rect.width / 2);
    let tooltipTop = step.position === 'bottom'
        ? rect.bottom + window.scrollY + 20
        : rect.top + window.scrollY - 180;
    let tooltipLeft = centerX - (maxWidth / 2);
    const viewportPadding = 10;
    tooltipTop = Math.max(viewportPadding, Math.min(window.scrollY + window.innerHeight - viewportPadding - 140, tooltipTop));
    tooltipLeft = Math.max(viewportPadding, Math.min(window.innerWidth - maxWidth - viewportPadding, tooltipLeft));
    
    tooltip.style.top = tooltipTop + 'px';
    tooltip.style.left = tooltipLeft + 'px';
    
    overlay.appendChild(highlight);
    overlay.appendChild(tooltip);
    document.body.appendChild(overlay);
}

function nextGuideStep() {
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    currentGuideStep++;
    showGuideStep(lang);
}

function prevGuideStep() {
    const lang = localStorage.getItem('selectedLanguage') || 'ar';
    currentGuideStep--;
    showGuideStep(lang);
}

function endGuide() {
    const overlay = document.getElementById('guideOverlay');
    if (overlay) {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    }
    isGuideActive = false;
}

function refreshGuideLanguage(lang) {
    if (!isGuideActive) return;
    showGuideStep(lang);
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (!isGuideActive) return;
    if (e.key === 'ArrowRight') prevGuideStep();
    if (e.key === 'ArrowLeft') nextGuideStep();
    if (e.key === 'Escape') endGuide();
});
