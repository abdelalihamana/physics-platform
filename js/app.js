import { auth, db, usersCol, programCol, chatsPath } from './config/firebase.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, collection, onSnapshot, setDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

import * as AuthUI from './auth/auth.js';
import * as AdminUI from './ui/admin.js';
import * as StudentUI from './ui/student.js';

window.currentUserRecord = null;
window.originalAdminRecord = null;
window.currentSections = [];
window.currentUpdates = [];
window.adminUsersList = [];
window.adminChatsData = {};
window.allStudentsProgress = [];
window.activeChatUser = null;
window.chatUnsubscribe = null;

// المتغيرات الخاصة بتتبع شاشات الأستاذ والتلميذ (مهمة لمنع حلقات التكرار)
window.adminMainTab = null;
window.adminActivePart = null;
window.adminActiveYear = {};
window.adminActiveBranch = {};
window.adminMainFilter = 'all';
window.adminSubFilter = 'all';
window.studentActiveBranchTab = null;
window.isRegistering = false;

// ربط جميع الدوال المعزولة بالنافذة العالمية لتتمكن أزرار الـ HTML من قراءتها
Object.assign(window, AuthUI, AdminUI, StudentUI);

window.escapeHtml = (str) => {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[tag] || tag));
};

window.showToast = (msg, type = 'success') => {
    const container = document.getElementById('toast-container');
    if(!container) return;
    const toast = document.createElement('div');
    toast.className = `p-4 rounded-xl shadow-lg text-white font-bold text-sm transform transition-all duration-300 translate-y-[-100%] opacity-0 flex items-center gap-2 ${type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`;
    toast.innerHTML = type === 'error' ? `<i class="ph-bold ph-warning-circle text-lg"></i> ${msg}` : `<i class="ph-bold ph-check-circle text-lg"></i> ${msg}`;
    container.appendChild(toast);
    setTimeout(() => { toast.classList.remove('translate-y-[-100%]', 'opacity-0'); }, 10);
    setTimeout(() => { toast.classList.add('opacity-0'); setTimeout(() => toast.remove(), 300); }, 3000);
};

window.confirmAction = (message) => {
    return new Promise((resolve) => {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-slate-900/60 flex items-center justify-center z-[100] backdrop-blur-sm p-4';
        modal.innerHTML = `
            <div class="bg-white dark:bg-slate-800 p-8 rounded-[2rem] max-w-sm w-full text-center shadow-2xl border border-slate-100 dark:border-slate-700 animate-[fadeInTab_0.3s_ease]">
                <div class="w-20 h-20 bg-amber-100 dark:bg-amber-900/50 rounded-full mx-auto flex items-center justify-center mb-5 text-amber-500 text-4xl"><i class="ph-fill ph-warning-circle"></i></div>
                <p class="font-black text-slate-800 dark:text-white mb-8 text-lg leading-relaxed">${message}</p>
                <div class="flex gap-3">
                    <button id="confirm-yes" class="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-3 rounded-xl font-black transition">نعم، متأكد</button>
                    <button id="confirm-no" class="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 py-3 rounded-xl font-black transition">إلغاء</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('confirm-yes').onclick = () => { modal.remove(); resolve(true); };
        document.getElementById('confirm-no').onclick = () => { modal.remove(); resolve(false); };
    });
};

window.toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    const isDark = document.documentElement.classList.contains('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    if(window.showToast) window.showToast(isDark ? 'تم تفعيل الوضع الليلي 🌙' : 'تم تفعيل الوضع النهاري ☀️');
};

window.switchScreen = (screenId) => {
    // تم إضافة admin-screen للمصفوفة لضمان التنقل السليم
    ['auth-screen', 'pending-screen', 'app-screen', 'admin-screen'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            if (id === screenId) {
                el.classList.add('active');
            } else {
                el.classList.remove('active');
            }
        }
    });
};

window.logoutAndGoAuth = async () => {
    await signOut(auth);
    window.currentUserRecord = null;
    window.switchScreen('auth-screen');
};

const setupDataListeners = () => {
    onSnapshot(doc(programCol, 'main'), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            window.currentSections = data.sections || [];
            window.currentUpdates = data.latestUpdates || [];
            
            if (window.currentUserRecord) {
                if (window.currentUserRecord.role === 'admin') {
                    if (window.adminActivePart) {
                        window.renderProgramUI(window.currentSections, 'admin-program-view', true);
                    }
                } else {
                    window.renderProgramUI(window.currentSections, 'student-program-view', false);
                    window.updateProgressUI(window.currentSections);
                    
                    let seenUpdates = JSON.parse(localStorage.getItem(`seen_updates_${window.currentUserRecord.username}`)) || [];
                    let myUpdates = window.currentUpdates.filter(u => u.level === window.currentUserRecord.level);
                    window.renderStudentNotifications(myUpdates, seenUpdates);
                }
            }
        }
    }, (error) => {
        console.error("Error listening to program:", error);
    });

    onSnapshot(usersCol, (snapshot) => {
        window.adminUsersList = [];
        window.allStudentsProgress = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.role !== 'admin') {
                window.adminUsersList.push({ id: doc.id, data: data });
                let p = window.calculateProgressXP ? window.calculateProgressXP(data.level, data, window.currentSections) : {xp:0};
                window.allStudentsProgress.push({ id: doc.id, level: data.level, xp: p.xp, approved: data.approved });
            }
        });
        if (window.currentUserRecord && window.currentUserRecord.role === 'admin' && window.adminMainTab === 'accounts') {
            if(window.renderAdminTable) window.renderAdminTable();
            if(window.renderLeaderboard) window.renderLeaderboard();
        }
    }, (error) => {
        console.error("Error listening to users:", error);
    });
};

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const username = user.email.split('@')[0];
        const userDoc = await getDoc(doc(usersCol, username));
        
        if (userDoc.exists()) {
            window.currentUserRecord = { username: username, ...userDoc.data() };
            const uData = window.currentUserRecord;
            
            if (uData.role !== 'admin' && !uData.approved) {
                window.switchScreen('pending-screen');
                return;
            }
            
            const displayUserEl = document.getElementById('display-username');
            if (displayUserEl) displayUserEl.innerText = username;
            
            if (uData.role === 'admin') {
                // فتح شاشة الأستاذ كشاشة رئيسية
                window.switchScreen('admin-screen');
                // فتح تبويبة إدارة الحسابات كخيار افتراضي لمنع بقاء الشاشة فارغة
                if (window.switchAdminMainTab) window.switchAdminMainTab('accounts');
            } else {
                const levelNames = { "m_y1": "الأولى متوسط", "m_y2": "الثانية متوسط", "m_y3": "الثالثة متوسط", "m_y4": "الرابعة متوسط", "h_y1": "أولى ثانوي", "h_y2": "الثانية ثانوي", "h_y3": "الثالثة ثانوي" };
                const badge = document.getElementById('student-level-badge');
                if(badge) badge.innerText = levelNames[uData.level] || 'طالب';
                
                window.switchScreen('app-screen');
            }
            
            setupDataListeners();
        } else {
            window.switchScreen('auth-screen');
        }
    } else {
        window.switchScreen('auth-screen');
    }
});

if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
}

// الترحيب عند نجاح الدخول
window.addEventListener('authSuccess', () => {
    if(window.showToast) window.showToast(`أهلاً بك مجدداً ${window.currentUserRecord.username} 👋`);
});
