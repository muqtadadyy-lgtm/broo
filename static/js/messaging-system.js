// نظام مراسلة جديد: محادثة مرتبطة بطلب (Application) فقط عبر الـ Backend

let currentChatApplicationId = null;
let currentChatPartnerId = null; // الطرف المقابل في المحادثة (عادةً الموظف أو الطالب)

function buildMessageBubble(msg, currentUserId) {
    const isOwn = msg.sender.id === currentUserId;
    const senderName = isOwn ? 'أنت' : msg.sender.fullName;
    const messageClass = isOwn ? 'own-message' : 'other-message';

    const attachmentHtml = msg.attachmentUrl
        ? `
        <div class="message-files">
            <div class="file-item">
                <i class="fas fa-paperclip"></i>
                <button class="link-btn" onclick="openPdfViewer('${msg.attachmentUrl}','ملف المرفق')">عرض الملف</button>
            </div>
        </div>`
        : '';

    return `
        <div class="message ${messageClass}">
            <div class="message-header">
                <span class="sender-name">${senderName}</span>
                <span class="message-time">${new Date(msg.createdAt).toLocaleString('ar-IQ')}</span>
            </div>
            <div class="message-content">${msg.text}</div>
            ${attachmentHtml}
        </div>
    `;
}

async function openApplicationChatModal(applicationId, applicationTitle, initialPartnerId = null) {
    const user = apiGetCurrentUser();
    if (!user) {
        alert('يجب تسجيل الدخول أولاً.');
        return;
    }

    currentChatApplicationId = applicationId;
    currentChatPartnerId = initialPartnerId || null;

    const modal = document.createElement('div');
    modal.className = 'modal messaging-modal';
    modal.id = 'messagingModal';
    modal.style.display = 'flex';

    modal.innerHTML = `
        <div class="modal-content messaging-content">
            <div class="modal-header">
                <div class="header-info">
                    <h2>💬 محادثة الطلب</h2>
                    <p class="activity-name">${applicationTitle}</p>
                </div>
                <button class="close-btn" onclick="closeMessagingModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="messages-container" id="messagesContainer">
                <p class="no-messages">جاري تحميل الرسائل...</p>
            </div>
            
            <div class="message-input-area">
                <textarea id="messageText" placeholder="اكتب رسالتك هنا..." class="message-input"></textarea>
                <div class="attachment-row">
                    <input type="file" id="chatAttachment" accept=".pdf">
                </div>
                <div class="input-actions">
                    <button id="sendMessageBtn" class="send-btn">
                        <i class="fas fa-paper-plane"></i> إرسال
                    </button>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // تحميل الرسائل من الـ Backend
    try {
        const thread = await apiGetMessageThread(applicationId);
        const container = document.getElementById('messagesContainer');
        const currentUserId = user.id;

        if (!thread.success) {
            container.innerHTML = `<p class="no-messages">${thread.message || 'تعذر تحميل الرسائل'}</p>`;
        } else if (!thread.messages || thread.messages.length === 0) {
            container.innerHTML = `<p class="no-messages">لا توجد رسائل بعد لهذا الطلب.</p>`;
        } else {
            // تحديد الطرف المقابل تلقائياً من آخر رسالة إن لم يكن محدداً
            if (!currentChatPartnerId) {
                const last = thread.messages[thread.messages.length - 1];
                if (last.sender.id === currentUserId) {
                    currentChatPartnerId = last.receiver && last.receiver.id ? last.receiver.id : null;
                } else {
                    currentChatPartnerId = last.sender.id;
                }
            }

            container.innerHTML = thread.messages
                .map((m) => buildMessageBubble(m, currentUserId))
                .join('');
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) {
        const container = document.getElementById('messagesContainer');
        container.innerHTML = `<p class="no-messages">حدث خطأ أثناء تحميل الرسائل.</p>`;
    }

    // زر الإرسال
    document.getElementById('sendMessageBtn').addEventListener('click', async () => {
        await sendMessageFromModal();
    });

    document.getElementById('messageText').addEventListener('keypress', async (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            e.preventDefault();
            await sendMessageFromModal();
        }
    });

    setTimeout(() => {
        document.getElementById('messageText')?.focus();
    }, 100);
}

function closeMessagingModal() {
    const modal = document.getElementById('messagingModal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => modal.remove(), 300);
    }
    currentChatApplicationId = null;
    currentChatPartnerId = null;
}

async function sendMessageFromModal() {
    const user = apiGetCurrentUser();
    if (!user) {
        alert('يجب تسجيل الدخول أولاً.');
        return;
    }

    const messageInput = document.getElementById('messageText');
    const attachmentInput = document.getElementById('chatAttachment');
    if (!messageInput) return;

    const text = messageInput.value.trim();
    if (!text) {
        alert('يرجى كتابة رسالة.');
        return;
    }

    if (!currentChatApplicationId) {
        alert('لا يوجد طلب مرتبط بالمحادثة.');
        return;
    }

    // إذا كان المستخدم طالباً ولا يوجد موظف محدد بعد، لا نسمح ببدء المحادثة
    if (user.role === 'student' && !currentChatPartnerId) {
        alert('لا يمكنك بدء المحادثة حتى يقوم موظف بالتواصل معك في هذا الطلب.');
        return;
    }

    const file = attachmentInput && attachmentInput.files && attachmentInput.files[0]
        ? attachmentInput.files[0]
        : null;

    const result = await apiSendMessage(currentChatApplicationId, currentChatPartnerId, text, file);
    if (!result.success) {
        alert(result.message || 'فشل إرسال الرسالة.');
        return;
    }

    // إضافة الرسالة محلياً في واجهة الدردشة
    const msg = result.message;
    const container = document.getElementById('messagesContainer');
    const currentUserId = user.id;

    const noMsg = container.querySelector('.no-messages');
    if (noMsg) noMsg.remove();

    container.innerHTML += buildMessageBubble(msg, currentUserId);
    container.scrollTop = container.scrollHeight;

    messageInput.value = '';
    if (attachmentInput) {
        attachmentInput.value = '';
    }
}

// ====== نقاط تكامل بسيطة مع لوحات الطالب والموظف ======

// استدعاء من لوحة الطالب داخل "طلباتي المرسلة"
function openStudentApplicationChat(applicationId, activityType, activityNumber) {
    const title = `${activityType} - ${activityNumber}`;
    openApplicationChatModal(applicationId, title);
}

// استدعاء من لوحة الموظف من داخل تفاصيل الطلب
function openMessageWithStudent() {
    if (typeof currentApplicationId === 'undefined' || !currentApplicationId) {
        alert('لم يتم تحديد الطلب الحالي.');
        return;
    }

    const app = (typeof getApplicationById === 'function')
        ? getApplicationById(currentApplicationId)
        : null;

    if (!app) {
        alert('لم يتم العثور على بيانات الطلب.');
        return;
    }

    // الموظف يراسل الطالب صاحب الطلب مباشرة
    const title = `${app.activityType} - ${app.activityNumber}`;
    // نمرر userId للطالب ليكون المستقبل الافتراضي
    openApplicationChatModal(app.id, title, app.userId);
}

// استدعاء من نافذة طلب الموظف للطالب (النظام القديم) – نعرض تنبيه فقط
function openMessageWithEmployee() {
    alert('تم نقل نظام المراسلة ليكون داخل كل طلب نشاط فقط. يرجى فتح الطلب من \"طلباتي المرسلة\" واستخدام زر المراسلة هناك.');
}
