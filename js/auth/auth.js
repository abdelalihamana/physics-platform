// ملف: js/auth/auth.js

import { auth, db, usersCol, chatsPath } from '../config/firebase.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updatePassword } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc, collection, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

window.isRegistering = false;

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
    if (typeof window.isAuthReady !== 'undefined' && !window.isAuthReady) {
        if(window.showToast) window.showToast("يتم الاتصال بالسحابة... يرجى الانتظار", "error");
        return;
    }
    
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
        const phoneRegex = /^(05|06|07)\d{8}$/;
        if(!phoneRegex.test(phoneNumber)) {
            if(window.showToast) window.showToast("رقم الهاتف غير صحيح! يجب أن يتكون من 10 أرقام ويبدأ بـ 05، 06، أو 07", "error");
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
                
                document.getElementById('registration-success-modal').classList.remove('hidden');
                document.getElementById('registration-success-modal').classList.add('flex');
                document.getElementById('username').value = ''; document.getElementById('password').value = '';
                await signOut(auth); 
            }
        } else {
            await signInWithEmailAndPassword(auth, pseudoEmail, password);
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
                if(window.showToast) window.showToast("حدث خطأ: الحساب موجود لكن البيانات مفقودة.", "error");
                await signOut(auth);
                btn.disabled = false; btn.innerHTML = originalHTML;
                return;
            }

            window.currentUserRecord = { username, ...userSnap.data() };
            
            if (!window.currentUserRecord.password && window.currentUserRecord.role !== 'admin') {
                 await updateDoc(userRef, { password: password });
                 window.currentUserRecord.password = password;
            }
            
            window.dispatchEvent(new CustomEvent('authSuccess', { detail: window.currentUserRecord }));
        }
    } catch (err) { 
        console.error(err);
        if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            if(window.showToast) window.showToast("بيانات الدخول غير صحيحة", "error");
        } else if (err.code === 'auth/email-already-in-use') {
            if(window.showToast) window.showToast("اسم المستخدم مستخدم مسبقاً.", "error");
        } else if (err.code === 'auth/network-request-failed') {
            if(window.showToast) window.showToast("لا يوجد اتصال بالإنترنت! يرجى التحقق من الشبكة.", "error");
        } else {
            if(window.showToast) window.showToast("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.", "error");
        }
    }
    
    btn.disabled = false; btn.innerHTML = originalHTML;
};

export const logout = async () => {
    if(window.confirmAction && await window.confirmAction("هل أنت متأكد أنك تريد تسجيل الخروج من حسابك؟")) {
        try {
            await signOut(auth);
        } catch(e) { console.error("Logout error", e); }
        
        window.currentUserRecord = null; 
        window.originalAdminRecord = null;
        document.getElementById('password').value = '';
        window.studentActiveBranchTab = null;
        
        document.getElementById('return-admin-btn').classList.add('hidden');
        document.getElementById('student-settings-btn').classList.remove('hidden');
        document.getElementById('student-chat-btn').classList.remove('hidden');
        document.getElementById('student-dark-btn').classList.remove('hidden');
        document.getElementById('student-logout-btn').classList.remove('hidden');
        document.getElementById('student-notif-btn').classList.remove('hidden');

        window.dispatchEvent(new Event('userLoggedOut'));
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
            if(auth.currentUser) {
                await updatePassword(auth.currentUser, newPass);
            }
            updates.password = newPass; 
        } catch(e) {
            console.error("Password update error", e);
            if (e.code === 'auth/requires-recent-login') {
                if(window.showToast) window.showToast("يرجى تسجيل الخروج والدخول مجدداً لتغيير كلمة المرور", "error");
                return;
            }
            if(window.showToast) window.showToast("حدث خطأ أثناء تغيير كلمة المرور في نظام الحماية", "error");
            return;
        }
    }

    if(window.currentUserRecord.role !== 'admin') {
        const newPhone = phoneInput.value.trim();
        const phoneRegex = /^(05|06|07)\d{8}$/;
        if(newPhone && !phoneRegex.test(newPhone)) {
            if(window.showToast) window.showToast("رقم الهاتف غير صحيح! يجب أن يبدأ بـ 05، 06، أو 07", "error");
            return;
        }
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

export const requestPasswordReset = async () => {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        if(window.showToast) window.showToast("يرجى إدخال اسم المستخدم أولاً لطلب استرجاع كلمة المرور", "error");
        return;
    }

    if(window.confirmAction && await window.confirmAction(`هل أنت متأكد من إرسال طلب استرجاع كلمة المرور للحساب "${username}" للأستاذ؟`)) {
        try {
            const userRef = doc(usersCol, username);
            const userSnap = await getDoc(userRef);

            if (!userSnap.exists()) {
                if(window.showToast) window.showToast("حساب المستخدم غير موجود.", "error");
                return;
            }

            const userData = userSnap.data();
            if (userData.role === 'admin') {
                if(window.showToast) window.showToast("لا يمكن استخدام هذه الميزة لحساب الإدارة.", "error");
                return;
            }

            const levelNames = { "m_y1": "الأولى متوسط", "m_y2": "الثانية متوسط", "m_y3": "الثالثة متوسط", "m_y4": "الرابعة متوسط", "h_y1": "أولى ثانوي", "h_y2": "الثانية ثانوي", "h_y3": "الثالثة ثانوي" };
            const levelDisplay = levelNames[userData.level] || "مستوى غير محدد";
            
            const chatRoomId = username; 
            const messagesRef = collection(db, chatsPath, chatRoomId, 'messages');
            const chatDocRef = doc(db, chatsPath, chatRoomId);
            
            const resetMessage = `🔴 إشعار استرجاع كلمة مرور 🔴\n\nالتلميذ: ${username}\nالمستوى: ${levelDisplay}\nالهاتف: ${userData.phoneNumber || 'غير متوفر'}\n\n(يرجى من الأستاذ التواصل مع التلميذ وتزويده بكلمة المرور الجديدة بعد تغييرها من الإعدادات)`;

            await setDoc(doc(messagesRef, Date.now().toString()), { sender: 'student', text: resetMessage, timestamp: Date.now(), isSystemMessage: true });
            await setDoc(chatDocRef, { unreadAdmin: increment(1) }, { merge: true });

            if(window.showToast) window.showToast("تم إرسال طلب استرجاع كلمة المرور للأستاذ بنجاح. سيتم التواصل معك.", "success");

        } catch (err) {
            console.error(err);
            if(window.showToast) window.showToast("حدث خطأ أثناء إرسال الطلب، يرجى المحاولة لاحقاً.", "error");
        }
    }
};
