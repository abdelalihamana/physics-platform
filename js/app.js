// ملف: js/app.js

// 1. استيراد إعدادات قاعدة البيانات
import { auth, db, usersCol, programCol, chatsPath } from './config/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, setDoc, getDoc, collection, onSnapshot, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 2. استيراد جميع الوحدات (Modules)
import * as Helpers from './utils/helpers.js';
import * as AuthUI from './auth/auth.js';
import * as AdminUI from './ui/admin.js';
import * as StudentUI from './ui/student.js';

// 3. ربط جميع الدوال بالـ Window لكي تعمل مع أزرار HTML (onclick)
Object.assign(window, Helpers);
Object.assign(window, AuthUI);
Object.assign(window, AdminUI);
Object.assign(window, StudentUI);

// 4. تعريف المتغيرات العالمية (Global State)
window.isAuthReady = false;
window.currentUserRecord = null;
window.originalAdminRecord = null; 
window.activeChatUser = null; 
window.currentSections = [];
window.currentUpdates = []; 
window.currentEditParams = null; 

// متغيرات حالة الأستاذ
window.adminMainTab = 'accounts'; 
window.adminActivePart = 'part_middle';
window.adminActiveYear = {}; 
window.adminActiveBranch = {}; 
window.adminMainFilter = 'all'; 
window.adminSubFilter = 'all'; 
window.adminUsersList = [];
window.adminChatsData = {};

// متغيرات حالة التلميذ
window.studentActiveBranchTab = null;
window.allStudentsProgress = []; 

// متغيرات تنظيف الذاكرة
let unsubscribeProgram = null;
let unsubscribeUsers = null;
let unsubscribeChat = null;
let unsubscribeChatMeta = null;

const levelNames = {
    "m_y1": "الأولى متوسط", "m_y2": "الثانية متوسط", "m_y3": "الثالثة متوسط", "m_y4": "الرابعة متوسط",
    "h_y1": "أولى ثانوي", "h_y2": "الثانية ثانوي", "h_y3": "الثالثة ثانوي"
};

const defaultProgramData = [
    { id: "part_middle", title: "التعليم المتوسط", color: "blue", years: [
        { id: "m_y1", title: "السنة الأولى متوسط", branches: [
            { id: "m1_b1", title: "الظواهر الكهربائية", categories: { lessons: [], exercises: [] } },
            { id: "m1_b2", title: "المادة وتحولاتها", categories: { lessons: [], exercises: [] } },
            { id: "m1_b3", title: "الظواهر الضوئية", categories: { lessons: [], exercises: [] } },
            { id: "m1_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "m1_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "m1_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]},
        { id: "m_y2", title: "السنة الثانية متوسط", branches: [
            { id: "m2_b1", title: "المادة وتحولاتها", categories: { lessons: [], exercises: [] } },
            { id: "m2_b2", title: "الظواهر الميكانيكية", categories: { lessons: [], exercises: [] } },
            { id: "m2_b3", title: "الظواهر الكهرومغناطيسية", categories: { lessons: [], exercises: [] } },
            { id: "m2_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "m2_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "m2_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]},
        { id: "m_y3", title: "السنة الثالثة متوسط", branches: [
            { id: "m3_b1", title: "المادة وتحولاتها", categories: { lessons: [], exercises: [] } },
            { id: "m3_b2", title: "الطاقة", categories: { lessons: [], exercises: [] } },
            { id: "m3_b3", title: "الظواهر الكهربائية", categories: { lessons: [], exercises: [] } },
            { id: "m3_b4", title: "الظواهر الضوئية", categories: { lessons: [], exercises: [] } },
            { id: "m3_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "m3_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "m3_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]},
        { id: "m_y4", title: "السنة الرابعة متوسط", branches: [
            { id: "m4_b1", title: "الظواهر الكهربائية", categories: { lessons: [], exercises: [] } },
            { id: "m4_b2", title: "المادة وتحولاتها", categories: { lessons: [], exercises: [] } },
            { id: "m4_b3", title: "الظواهر الميكانيكية", categories: { lessons: [], exercises: [] } },
            { id: "m4_b4", title: "الظواهر الضوئية", categories: { lessons: [], exercises: [] } },
            { id: "m4_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "m4_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "m4_s3", title: "الفصل 3", categories: { terms: [], exams: [] } },
            { id: "m4_b5", title: "شهادتك 🎓", categories: { past_exams: [], mock_exams: [] } }
        ]}
    ]},
    { id: "part_high", title: "التعليم الثانوي", color: "indigo", years: [
        { id: "h_y1", title: "السنة أولى ثانوي", branches: [
            { id: "h1_b1", title: "بنية وهندسة أفراد بعض الأنواع الكيميائية", categories: { lessons: [], exercises: [] } },
            { id: "h1_b2", title: "القوة والحركات المستقيمة", categories: { lessons: [], exercises: [] } },
            { id: "h1_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "h1_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "h1_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]},
        { id: "h_y2", title: "السنة الثانية ثانوي", branches: [
            { id: "h2_b1", title: "المقاربة الكيفية لطاقة جملة وانحفاظها", categories: { lessons: [], exercises: [] } },
            { id: "h2_b2", title: "العمل والطاقة الحركية", categories: { lessons: [], exercises: [] } },
            { id: "h2_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "h2_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "h2_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]},
        { id: "h_y3", title: "السنة الثالثة ثانوي", branches: [
            { id: "h3_b1", title: "تطور جملة كيميائية نحو حالة التوازن", categories: { lessons: [], exercises: [] } },
            { id: "h3_b2", title: "التحولات النووية", categories: { lessons: [], exercises: [] } },
            { id: "h3_b3", title: "الظواهر الكهربائية", categories: { lessons: [], exercises: [] } },
            { id: "h3_s1", title: "الفصل 1", categories: { terms: [], exams: [] } },
            { id: "h3_s2", title: "الفصل 2", categories: { terms: [], exams: [] } },
            { id: "h3_s3", title: "الفصل 3", categories: { terms: [], exams: [] } }
        ]}
    ]}
];

// 5. دوال التنقل والمظهر الأساسية
window.switchScreen = (screenId) => {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
};

window.closeRegModal = () => {
    document.getElementById('registration-success-modal').classList.add('hidden');
    document.getElementById('registration-success-modal').classList.remove('flex');
    window.toggleAuthMode();
};

window.toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
};

window.closeWelcomeScreen = () => {
    const screen = document.getElementById('welcome-quote-screen');
    screen.classList.remove('welcome-visible');
    screen.classList.add('welcome-hidden');
};

// 6. دوال المحادثة (الدردشة)
window.openChat = async (targetUser) => {
    window.activeChatUser = targetUser; 
    let displayTarget = window.currentUserRecord.role === 'admin' ? targetUser : "الأستاذ";
    document.getElementById('chat-target-name').innerText = displayTarget;
    
    const modal = document.getElementById('chat-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    
    let chatRoomId = window.currentUserRecord.role === 'admin' ? targetUser : window.currentUserRecord.username;
    let messagesRef = collection(db, chatsPath, chatRoomId, 'messages');
    
    const chatDocRef = doc(db, chatsPath, chatRoomId);
    await setDoc(chatDocRef, { [window.currentUserRecord.role === 'admin' ? 'unreadAdmin' : 'unreadStudent']: 0 }, { merge: true });

    if(unsubscribeChat) unsubscribeChat();
    unsubscribeChat = onSnapshot(messagesRef, (snapshot) => {
        let msgs = []; snapshot.forEach(d => msgs.push({ id: d.id, ...d.data() }));
        msgs.sort((a, b) => a.timestamp - b.timestamp); 
        
        let chatHtml = '';
        msgs.forEach(m => {
            let isMine = m.sender === window.currentUserRecord.role; let isAdminMsg = m.sender === 'admin';
            let bubbleClass = isMine ? 'chat-mine dark:bg-blue-900/30 dark:border-blue-800' : 'chat-other dark:bg-slate-800 dark:border-slate-700';
            let alignment = isMine ? 'self-end' : 'self-start';
            let textColor = isAdminMsg && !isMine ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200';
            
            if (m.isSystemMessage) {
                bubbleClass = 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 border-2 w-full max-w-[95%] text-center mx-auto shadow-md';
                alignment = 'self-center';
                textColor = 'text-amber-900 dark:text-amber-400 font-black';
            }

            chatHtml += `<div class="chat-bubble ${bubbleClass} ${alignment} shadow-sm transition hover:shadow-md"><p class="text-[14px] whitespace-pre-wrap break-words ${textColor}" dir="auto">${window.escapeHtml(m.text)}</p></div>`;
        });
        
        const msgBox = document.getElementById('chat-messages');
        msgBox.innerHTML = chatHtml || `<div class="h-full flex flex-col items-center justify-center opacity-50"><i class="ph-fill ph-hand-waving text-6xl text-slate-400 mb-3"></i><div class="text-center text-slate-500 font-bold bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-sm">أهلاً بك! يمكنك المراسلة هنا.</div></div>`;
        msgBox.scrollTop = msgBox.scrollHeight;
        if (window.activeChatUser) setDoc(doc(db, chatsPath, chatRoomId), { [window.currentUserRecord.role === 'admin' ? 'unreadAdmin' : 'unreadStudent']: 0 }, { merge: true });
    }, e => { console.error("Chat Error", e); });
};

window.closeChat = () => { 
    document.getElementById('chat-modal').classList.add('hidden'); 
    document.getElementById('chat-modal').classList.remove('flex'); 
    if(unsubscribeChat) unsubscribeChat(); 
    window.activeChatUser = null; 
};

window.sendChatMessage = async () => {
    let inputEl = document.getElementById('chat-input'); let text = inputEl.value.trim();
    if(!text) return; 
    
    let btn = document.getElementById('send-msg-btn'); const origHtml = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin"></i>';

    try {
        let chatRoomId = window.currentUserRecord.role === 'admin' ? window.activeChatUser : window.currentUserRecord.username;
        let chatDocRef = doc(db, chatsPath, chatRoomId); let messagesRef = collection(db, chatsPath, chatRoomId, 'messages');
        await setDoc(doc(messagesRef, Date.now().toString()), { sender: window.currentUserRecord.role, text: text, timestamp: Date.now() });
        await setDoc(chatDocRef, { [window.currentUserRecord.role === 'admin' ? 'unreadStudent' : 'unreadAdmin']: increment(1) }, { merge: true });
        inputEl.value = ''; setTimeout(() => { const msgBox = document.getElementById('chat-messages'); msgBox.scrollTop = msgBox.scrollHeight; }, 100);
    } catch(e) { console.error(e); window.showToast("فشل الإرسال. تأكد من اتصالك بالإنترنت", "error"); }
    btn.disabled = false; btn.innerHTML = origHtml;
};

// 7. دوال الإدارة وصلاحيات الأستاذ (المراقبة)
window.loginAsStudent = (studentUsername) => {
    const studentObj = window.adminUsersList.find(u => u.id === studentUsername);
    if(!studentObj) return;

    window.originalAdminRecord = { ...window.currentUserRecord };
    window.currentUserRecord = { username: studentObj.id, ...studentObj.data };
    
    document.getElementById('display-username').innerText = window.currentUserRecord.username;
    document.getElementById('student-level-badge').innerText = levelNames[window.currentUserRecord.level];
    
    document.getElementById('return-admin-btn').classList.remove('hidden');
    document.getElementById('student-settings-btn').classList.add('hidden'); 
    document.getElementById('student-chat-btn').classList.add('hidden'); 
    document.getElementById('student-dark-btn').classList.add('hidden'); 
    document.getElementById('student-logout-btn').classList.add('hidden'); 
    document.getElementById('student-notif-btn').classList.add('hidden');

    if(unsubscribeUsers) unsubscribeUsers();
    if(unsubscribeChatMeta) unsubscribeChatMeta();

    window.studentActiveBranchTab = null;
    window.switchScreen('app-screen');
    startStudentListeners();
    window.showToast(`أنت الآن داخل حساب التلميذ في وضع المراقبة`);
};

window.returnToAdmin = () => {
    if(!window.originalAdminRecord) return;
    window.currentUserRecord = { ...window.originalAdminRecord };
    window.originalAdminRecord = null;
    
    document.getElementById('return-admin-btn').classList.add('hidden');
    document.getElementById('student-settings-btn').classList.remove('hidden');
    document.getElementById('student-chat-btn').classList.remove('hidden');
    document.getElementById('student-dark-btn').classList.remove('hidden');
    document.getElementById('student-logout-btn').classList.remove('hidden');
    document.getElementById('student-notif-btn').classList.remove('hidden');

    if(unsubscribeUsers) unsubscribeUsers();
    if(unsubscribeChatMeta) unsubscribeChatMeta();

    window.switchScreen('admin-screen');
    startAdminListeners();
    window.showToast("تمت العودة للوحة الإدارة بنجاح");
};

// 8. مستمعو البيانات (Listeners)
const startAdminListeners = () => {
    unsubscribeProgram = onSnapshot(doc(programCol, 'main'), (docSnap) => {
        if(docSnap.exists()) { 
            let data = docSnap.data();
            window.currentSections = data.sections; 
            window.currentUpdates = data.latestUpdates || []; 
            window.renderProgramUI(window.currentSections, 'admin-program-view', true); 
            window.renderAdminTable(); 
        }
    });

    if(unsubscribeUsers) unsubscribeUsers();
    unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
        window.adminUsersList = []; window.allStudentsProgress = []; 
        snapshot.forEach(d => { 
            if(d.data().role !== 'admin') {
                let data = d.data(); window.adminUsersList.push({id: d.id, data: data}); 
                let prog = window.calculateProgressXP(data.level, data, window.currentSections);
                window.allStudentsProgress.push({ id: d.id, level: data.level, xp: prog.xp, approved: data.approved });
            }
        });
        window.renderAdminTable();
    });

    if(unsubscribeChatMeta) unsubscribeChatMeta();
    unsubscribeChatMeta = onSnapshot(collection(db, chatsPath), (snapshot) => {
        window.adminChatsData = {}; 
        let totalUnread = 0;
        let notifHtml = '';

        snapshot.forEach(d => { 
            let data = d.data();
            window.adminChatsData[d.id] = data; 
            if(data.unreadAdmin > 0) {
                totalUnread += data.unreadAdmin;
                notifHtml += `
                    <button onclick="openChat('${d.id}')" class="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900/40 transition border border-amber-100 dark:border-amber-800/50 group text-right w-full">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-amber-200 dark:bg-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center text-xl shadow-inner"><i class="ph-fill ph-user"></i></div>
                            <div>
                                <div class="font-black text-slate-800 dark:text-white text-sm group-hover:text-amber-600 transition">${d.id}</div>
                                <div class="text-xs text-slate-500 dark:text-slate-400 font-bold mt-0.5">لديك ${data.unreadAdmin} رسالة/إشعار</div>
                            </div>
                        </div>
                        <i class="ph-bold ph-chat-circle-dots text-amber-500 text-xl group-hover:scale-110 transition"></i>
                    </button>
                `;
            }
        }); 
        window.renderAdminTable();
        
        const globalBadge = document.getElementById('admin-global-badge');
        const notifContainer = document.getElementById('admin-notifications-container');
        if (globalBadge) {
            if (totalUnread > 0) {
                globalBadge.innerText = totalUnread > 99 ? '99+' : totalUnread;
                globalBadge.classList.remove('hidden');
                if(notifContainer) notifContainer.innerHTML = notifHtml;
            } else {
                globalBadge.classList.add('hidden');
                if(notifContainer) notifContainer.innerHTML = '<div class="text-center text-slate-500 dark:text-slate-400 text-sm font-bold p-4">لا توجد إشعارات جديدة</div>';
            }
        }
    });
};

const startStudentListeners = () => {
    let isInitialProgramLoad = true;

    unsubscribeProgram = onSnapshot(doc(programCol, 'main'), (docSnap) => {
        if(docSnap.exists()) { 
            let data = docSnap.data();
            window.currentSections = data.sections; 
            window.currentUpdates = data.latestUpdates || [];

            if(document.getElementById('lesson-search').value.trim() === '') { 
                window.renderProgramUI(window.currentSections, 'student-program-view', false); 
            }
            window.updateProgressUI(window.currentSections); 
            window.renderLeaderboard(); 

            if (window.currentUserRecord && window.currentUserRecord.role === 'student') {
                let myUpdates = window.currentUpdates.filter(u => u.level === window.currentUserRecord.level);
                let seenUpdates = JSON.parse(localStorage.getItem(`seen_updates_${window.currentUserRecord.username}`)) || [];

                if (!isInitialProgramLoad) {
                    myUpdates.forEach(u => {
                        if (!seenUpdates.includes(u.id) && (Date.now() - u.timestamp < 15000)) {
                            window.showToast(`محتوى جديد متاح: ${u.title}`, 'success');
                        }
                    });
                }
                
                window.renderStudentNotifications(myUpdates, seenUpdates);
            }
            
            isInitialProgramLoad = false;
        }
    });
    
    if(unsubscribeUsers) unsubscribeUsers();
    unsubscribeUsers = onSnapshot(usersCol, (snapshot) => {
        window.allStudentsProgress = [];
        snapshot.forEach(d => {
            let data = d.data();
            if(data.role !== 'admin') {
                let prog = window.calculateProgressXP(data.level, data, window.currentSections);
                window.allStudentsProgress.push({ id: d.id, level: data.level, xp: prog.xp, approved: data.approved });
            }
            if(d.id === window.currentUserRecord.username) {
                window.currentUserRecord.clickedLinks = data.clickedLinks || [];
                window.currentUserRecord.phoneNumber = data.phoneNumber || ''; 
                window.updateProgressUI(window.currentSections || []); 
                
                if(document.getElementById('lesson-search').value.trim() === '') { 
                    window.renderProgramUI(window.currentSections || [], 'student-program-view', false); 
                } else { 
                    window.executeStudentSearch(); 
                }
            }
        });
        window.renderLeaderboard(); 
    });

    if(unsubscribeChatMeta) unsubscribeChatMeta();
    unsubscribeChatMeta = onSnapshot(doc(db, chatsPath, window.currentUserRecord.username), (docSnap) => {
        const badge = document.getElementById('student-chat-badge');
        if(docSnap.exists() && docSnap.data().unreadStudent > 0) { 
            badge.innerText = docSnap.data().unreadStudent; 
            badge.classList.remove('hidden'); 
        } else { 
            badge.classList.add('hidden'); 
        }
    });
};

// 9. المستمع الرئيسي للمصادقة (نقطة الدخول)
onAuthStateChanged(auth, async (user) => {
    window.isAuthReady = true;
    if (user) {
        try {
            const progDoc = await getDoc(doc(programCol, 'main'));
            if (!progDoc.exists()) {
                await setDoc(doc(programCol, 'main'), { sections: defaultProgramData, latestUpdates: [] });
            } else {
                let data = progDoc.data();
                let needsUpdate = false;
                data.sections.forEach(part => {
                    part.years.forEach(year => {
                        ['s1', 's2', 's3'].forEach((sem, idx) => {
                            let semId = `${year.id}_${sem}`; let semTitle = `الفصل ${idx + 1}`;
                            let existingSem = year.branches.find(b => b.id === semId);
                            if (!existingSem) { year.branches.push({ id: semId, title: semTitle, categories: { terms: [], exams: [] } }); needsUpdate = true; }
                        });
                        if (year.id === 'm_y4') {
                            let existingB5 = year.branches.find(b => b.id === 'm4_b5');
                            if (!existingB5) { year.branches.push({ id: "m4_b5", title: "شهادتك 🎓", categories: { 'past_exams': [], 'mock_exams': [] } }); needsUpdate = true; }
                        }
                    });
                });
                if (needsUpdate) await updateDoc(doc(programCol, 'main'), { sections: data.sections });
            }

            const adminDoc = await getDoc(doc(usersCol, 'admin'));
            if (!adminDoc.exists()) await setDoc(doc(usersCol, 'admin'), { role: 'admin', approved: true, clickedLinks: [] });

            if (user.email && !window.currentUserRecord && !window.isRegistering) {
                const username = user.email.split('@')[0];
                const userRef = doc(usersCol, username);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    window.currentUserRecord = { username, ...userSnap.data() };
                    
                    if (window.currentUserRecord.role === 'admin') {
                        window.switchScreen('admin-screen');
                        startAdminListeners();
                    } else if (!window.currentUserRecord.approved) {
                        window.switchScreen('pending-screen');
                        await signOut(auth);
                    } else {
                        document.getElementById('display-username').innerText = username;
                        document.getElementById('student-level-badge').innerText = levelNames[window.currentUserRecord.level] || "تلميذ";
                        window.switchScreen('app-screen');
                        startStudentListeners();
                    }
                }
            }
        } catch(e) { console.error(e); }
    } else {
        window.switchScreen('auth-screen');
    }
});

// 10. مستمع مخصص لتنظيف الذاكرة بعد تسجيل الخروج
window.addEventListener('userLoggedOut', () => {
    if(unsubscribeProgram) unsubscribeProgram();
    if(unsubscribeUsers) unsubscribeUsers();
    if(unsubscribeChat) unsubscribeChat();
    if(unsubscribeChatMeta) unsubscribeChatMeta();
    if (typeof window.closeChat === 'function') window.closeChat();
    window.switchScreen('auth-screen');
});