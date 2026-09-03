// إعدادات Firebase الخاصة بك (قم بوضع بياناتك هنا)
const firebaseConfig = {
    // ضع إعداداتك هنا
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// متغيرات عامة
window.currentUser = null;
window.userRole = null;

// دالة التبديل بين الشاشات
window.switchScreen = function(screenId) {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.add('hidden');
    
    if (screenId === 'app-screen') {
        document.getElementById('app-screen').classList.remove('hidden');
    } else {
        document.getElementById('login-screen').classList.remove('hidden');
    }
};

// --- دوال التنقل الخاصة بواجهة الأستاذ (Drill-down) ---

window.openAdminSection = function(section) {
    document.getElementById('admin-home-cards').classList.add('hidden');
    document.getElementById('admin-accounts-section').classList.add('hidden');
    document.getElementById('admin-content-section').classList.add('hidden');

    if(section === 'accounts') {
        document.getElementById('admin-accounts-section').classList.remove('hidden');
        if (typeof window.renderAdminAccounts === 'function') {
            window.renderAdminAccounts();
        }
    } else if(section === 'content') {
        document.getElementById('admin-content-section').classList.remove('hidden');
        document.getElementById('admin-tier-cards').classList.remove('hidden');
        document.getElementById('admin-tier-content').classList.add('hidden');
    }
};

window.returnToAdminHome = function() {
    document.getElementById('admin-accounts-section').classList.add('hidden');
    document.getElementById('admin-content-section').classList.add('hidden');
    document.getElementById('admin-home-cards').classList.remove('hidden');
    document.getElementById('admin-units-container').innerHTML = ''; 
};

window.openAdminPart = function(tier) {
    document.getElementById('admin-tier-cards').classList.add('hidden');
    document.getElementById('admin-tier-content').classList.remove('hidden');
    
    if (typeof window.renderProgramUI === 'function') {
        window.renderProgramUI(tier, 'admin-units-container');
    }
};

window.returnToAdminParts = function() {
    document.getElementById('admin-tier-content').classList.add('hidden');
    document.getElementById('admin-units-container').innerHTML = ''; 
    document.getElementById('admin-tier-cards').classList.remove('hidden');
};

// دالة تسجيل الخروج
window.logout = function() {
    auth.signOut().then(() => {
        window.currentUser = null;
        window.userRole = null;
        window.switchScreen('login-screen');
        
        // إعادة تعيين الواجهات
        document.getElementById('student-screen').classList.add('hidden');
        document.getElementById('admin-screen').classList.add('hidden');
        document.getElementById('student-content-container').innerHTML = '';
        window.returnToAdminHome();
    });
};
