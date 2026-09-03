import { auth, usersCol } from '../config/firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const toggleAuthMode = () => {
    window.isRegistering = !window.isRegistering;
    document.getElementById('auth-title').innerText = window.isRegistering ? "حساب جديد" : "منصة المجتهد";
    document.getElementById('auth-action-btn').innerHTML = window.isRegistering ? '<i class="ph-bold ph-paper-plane-tilt"></i> إرسال الطلب' : '<i class="ph-bold ph-sign-in"></i> تسجيل الدخول';
    document.getElementById('switch-mode-text').innerHTML = window.isRegistering ? 'لديك حساب بالفعل؟ سجل دخولك <i class="ph-bold ph-arrow-left"></i>' : '<i class="ph-fill ph-rocket-launch"></i> إنشاء حساب تلميذ جديد';
    
    const levelSelect = document.getElementById('user-level'); const levelIcon = document.getElementById('level-icon');
    const parentNameCont = document.getElementById('parent-name-container'); const phoneNumCont = document.getElementById('phone-number-container');
    const forgotPassCont = document.getElementById('forgot-password-container');
    
    if(window.isRegistering) {
        levelSelect.classList.remove('hidden'); levelIcon.classList.remove('hidden');
        parentNameCont.classList.remove('hidden'); phoneNumCont.classList.remove('hidden');
        forgotPassCont.classList.add('hidden');
    } else {
        levelSelect.classList.add('hidden'); levelIcon.classList.add('hidden');
        parentNameCont.classList.add('hidden'); phoneNumCont.classList.add('hidden');
        forgotPassCont.classList.remove('hidden');
    }
};

export const handleAuth = async () => {
    const username = document.getElementById('username').value.trim().toLowerCase();
    const password = document.getElementById('password').value.trim();
    const level = document.getElementById('user-level').value;
    const parentName = document.getElementById('parent-name').value.trim();
    const phoneNumber = document.getElementById('phone-number').value.trim();

    if (!username || !password) {
        if(window.showToast) window.showToast("يرجى ملء اسم المستخدم وكلمة المرور", "error");
        return;
    }
    if (window.isRegistering) {
        if (!level || !parentName || !phoneNumber) {
            if(window.showToast) window.showToast("يرجى تعبئة جميع الحقول بدقة", "error");
            return;
        }
    }

    const btn = document.getElementById('auth-action-btn');
    const originalHTML = btn.innerHTML;
    btn.disabled = true; btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-2xl"></i> جاري التحقق...';

    const pseudoEmail = `${username}@almojtahid.com`;
    const userRef = doc(usersCol, username);

    try {
        if (window.isRegistering) {
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                if(window.showToast) window.showToast("اسم المستخدم مستخدم مسبقاً، اختر اسماً آخر", "error");
            } else {
                await createUserWithEmailAndPassword(auth, pseudoEmail, password);
                await setDoc(userRef, { 
                    role: 'student', 
                    approved: false, 
                    clickedLinks: [],
                    level: level, 
                    parentName: parentName, 
                    phoneNumber: phoneNumber,
                    password: password 
                });
                
                if(window.showToast) window.showToast("تم التسجيل بنجاح! حسابك قيد المراجعة.");
                document.getElementById('username').value = ''; document.getElementById('password').value = '';
                await signOut(auth); 
                toggleAuthMode();
            }
        } else {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                if(window.showToast) window.showToast("بيانات الحساب غير مكتملة.", "error");
                await signOut(auth);
            } else {
                window.currentUserRecord = { username, ...userSnap.data() };
                window.dispatchEvent(new CustomEvent('authSuccess'));
            }
        }
    } catch (err) { 
        console.error(err);
        if(window.showToast) window.showToast("بيانات الدخول غير صحيحة أو يوجد خطأ بالاتصال.", "error");
    }
    
    btn.disabled = false; btn.innerHTML = originalHTML;
};

export const logout = async () => {
    if(window.confirmAction && await window.confirmAction("هل أنت متأكد أنك تريد تسجيل الخروج؟")) {
        try { await signOut(auth); } catch(e) { console.error(e); }
        window.currentUserRecord = null; 
        document.getElementById('password').value = '';
        window.studentActiveBranchTab = null;
        window.switchScreen('auth-screen');
    }
};

export const openSettings = () => {
    if(!window.currentUserRecord) return;
    document.getElementById('settings-username').value = window.currentUserRecord.username;
    document.getElementById('settings-new-password').value = '';
    
    const phoneContainer = document.getElementById('settings-phone-container');
    const phoneInput = document.getElementById('settings-new-phone');
    
    if(window.currentUserRecord.role === 'admin') {
        phoneContainer.style.display = 'none';
    } else {
        phoneContainer.style.display = 'block';
        phoneInput.value = window.currentUserRecord.phoneNumber || '';
    }

    const modal = document.getElementById('settings-modal'); const content = document.getElementById('settings-content');
    modal.classList.remove('hidden'); modal.classList.add('flex');
    setTimeout(() => { content.classList.remove('scale-95'); content.classList.add('scale-100'); }, 10);
};

export const closeSettings = () => {
    const modal = document.getElementById('settings-modal'); const content = document.getElementById('settings-content');
    content.classList.remove('scale-100'); content.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
};

export const saveSettingsData = async () => {
    if(!window.currentUserRecord) return;
    const newPass = document.getElementById('settings-new-password').value.trim();
    const phoneInput = document.getElementById('settings-new-phone');
    let updates = {};
    
    if(newPass) {
        try {
            if(auth.currentUser) await updatePassword(auth.currentUser, newPass);
            updates.password = newPass; 
        } catch(e) {
            if(window.showToast) window.showToast("يرجى تسجيل الخروج والدخول مجدداً لتغيير كلمة المرور", "error");
            return;
        }
    }

    if(window.currentUserRecord.role !== 'admin') {
        const newPhone = phoneInput.value.trim();
        if(newPhone) updates.phoneNumber = newPhone;
    }

    try {
        if (Object.keys(updates).length > 0) {
            await updateDoc(doc(usersCol, window.currentUserRecord.username), updates);
        }
        if(updates.password) window.currentUserRecord.password = updates.password;
        if(updates.phoneNumber) window.currentUserRecord.phoneNumber = updates.phoneNumber;
        
        if(window.showToast) window.showToast("تم تحديث الإعدادات بنجاح 💾");
        closeSettings();
    } catch(e) { if(window.showToast) window.showToast("حدث خطأ أثناء الحفظ", "error"); }
};
