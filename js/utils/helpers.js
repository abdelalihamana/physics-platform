// ملف: js/utils/helpers.js

// 1. دالة إظهار الإشعارات المنبثقة (Toast)
export const showToast = (msg, type = 'success') => {
    const toast = document.createElement('div');
    const icon = type === 'error' ? '<i class="ph-fill ph-warning-circle text-2xl"></i>' : '<i class="ph-fill ph-check-circle text-2xl"></i>';
    const bgClass = type === 'error' ? 'bg-red-500/95 dark:bg-red-600/95' : 'bg-slate-800/95 dark:bg-emerald-600/95';
    toast.className = `px-6 py-4 rounded-2xl shadow-2xl text-white font-black text-base text-center transform transition-all duration-300 translate-y-[-20px] opacity-0 border border-white/10 flex items-center justify-center gap-3 backdrop-blur-md z-[100] ${bgClass}`;
    toast.innerHTML = `${icon} <span>${msg}</span>`;
    document.getElementById('toast-container').appendChild(toast);
    setTimeout(() => toast.classList.remove('translate-y-[-20px]', 'opacity-0'), 10);
    setTimeout(() => { 
        toast.classList.add('translate-y-[-20px]', 'opacity-0'); 
        setTimeout(() => toast.remove(), 400);
    }, 4000);
};

// 2. دالة إطلاق الزينة عند إكمال الدروس (Confetti)
export const fireConfetti = () => {
    var duration = 3 * 1000; var end = Date.now() + duration;
    (function frame() {
        // تأكد أن مكتبة confetti مستدعاة في index.html
        if (typeof confetti === 'function') {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#22c55e', '#3b82f6', '#f59e0b'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#22c55e', '#3b82f6', '#f59e0b'] });
        }
        if (Date.now() < end) requestAnimationFrame(frame);
    }());
};

// 3. دالة حماية النصوص من أكواد الهاكرز (XSS Protection)
export const escapeHtml = (unsafeText) => {
    if (typeof unsafeText !== 'string') return '';
    return unsafeText
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};

// 4. دالة النوافذ المنبثقة لتأكيد الإجراءات (مثل الحذف)
export const confirmAction = (msg) => {
    return new Promise((resolve) => {
        document.getElementById('confirm-message').innerText = msg;
        const modal = document.getElementById('confirm-modal');
        modal.classList.remove('hidden'); 
        modal.classList.add('flex');
        
        // ربط دالة الإغلاق بالـ Window لكي يراها HTML
        window.closeConfirm = (isConfirmed) => {
            modal.classList.add('hidden'); 
            modal.classList.remove('flex');
            resolve(isConfirmed);
        };
    });
};