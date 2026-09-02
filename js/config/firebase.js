// ملف: js/config/firebase.js

// 1. استدعاء أدوات فايربيس الأساسية فقط (الباقي سنستدعيه في الملفات التي تحتاجه)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 2. مفاتيح الاتصال الخاصة بمشروعك
const firebaseConfig = {
    apiKey: "AIzaSyDuuYHwmSW0UV1TO3gDGyETrvOimE7iGLs",
    authDomain: "physique-58073.firebaseapp.com",
    projectId: "physique-58073",
    storageBucket: "physique-58073.firebasestorage.app",
    messagingSenderId: "744073429659",
    appId: "1:744073429659:web:0859514e70482543d13c3e",
    measurementId: "G-D6BHHHVBX6"
};

// 3. تهيئة التطبيق
const app = initializeApp(firebaseConfig);

// 4. تصدير أدوات الاتصال (كلمة export هي الأهم هنا)
export const auth = getAuth(app);
export const db = getFirestore(app);

// 5. تصدير مسارات قواعد البيانات (Collections) لتجنب الأخطاء الإملائية لاحقاً
export const usersCol = collection(db, 'physics_db', 'public', 'profiles');
export const programCol = collection(db, 'physics_db', 'public', 'curriculum');
export const chatsPath = 'physics_db/public/chats';