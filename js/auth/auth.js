window.login = function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const errorDiv = document.getElementById('login-error');

    errorDiv.classList.add('hidden');

    auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            // سيتم التعامل مع التوجيه في onAuthStateChanged
        })
        .catch((error) => {
            console.error("Login Error:", error);
            errorDiv.classList.remove('hidden');
        });
};

auth.onAuthStateChanged((user) => {
    if (user) {
        window.currentUser = user;
        
        // جلب صلاحية المستخدم من قاعدة البيانات
        db.ref('users/' + user.uid).once('value').then((snapshot) => {
            const userData = snapshot.val();
            if (userData) {
                window.userRole = userData.role || 'student';
                window.switchScreen('app-screen');
                
                if (window.userRole === 'admin') {
                    document.getElementById('admin-screen').classList.remove('hidden');
                    document.getElementById('student-screen').classList.add('hidden');
                    window.returnToAdminHome(); // تصفير الشاشة للرئيسية
                } else {
                    document.getElementById('student-screen').classList.remove('hidden');
                    document.getElementById('admin-screen').classList.add('hidden');
                    if (typeof window.renderStudentUI === 'function') {
                        window.renderStudentUI(userData.tier);
                    }
                }
            } else {
                // إذا لم توجد بيانات للمستخدم
                if (user.email === 'admin@physics.com') { // حساب مدير افتراضي للاحتياط
                     window.userRole = 'admin';
                     window.switchScreen('app-screen');
                     document.getElementById('admin-screen').classList.remove('hidden');
                }
            }
        });
    } else {
        window.switchScreen('login-screen');
    }
});
