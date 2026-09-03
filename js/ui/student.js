window.renderStudentUI = function(tier) {
    window.renderProgramUI(tier, 'student-content-container');
};

window.renderProgramUI = function(tier, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // تنظيف الحاوية لضمان العزل

    // بناء الواجهة بناءً على الطور المطلوب فقط (عزل تام)
    if (tier === 'middle') {
        container.innerHTML = `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-blue-800 mb-4 border-b-2 border-blue-200 pb-2">التعليم المتوسط</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div class="bg-white border-2 border-blue-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition text-center font-bold text-lg text-blue-900">
                        السنة الأولى متوسط
                    </div>
                    <div class="bg-white border-2 border-blue-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition text-center font-bold text-lg text-blue-900">
                        السنة الثانية متوسط
                    </div>
                    <div class="bg-white border-2 border-blue-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition text-center font-bold text-lg text-blue-900">
                        السنة الثالثة متوسط
                    </div>
                    <div class="bg-white border-2 border-blue-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-blue-50 transition text-center font-bold text-lg text-blue-900">
                        السنة الرابعة متوسط
                    </div>
                </div>
            </div>
        `;
    } else if (tier === 'high') {
        container.innerHTML = `
            <div class="mb-6">
                <h3 class="text-xl font-bold text-green-800 mb-4 border-b-2 border-green-200 pb-2">التعليم الثانوي</h3>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="bg-white border-2 border-green-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-green-50 transition text-center font-bold text-lg text-green-900">
                        السنة الأولى ثانوي
                    </div>
                    <div class="bg-white border-2 border-green-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-green-50 transition text-center font-bold text-lg text-green-900">
                        السنة الثانية ثانوي
                    </div>
                    <div class="bg-white border-2 border-green-400 p-6 rounded-lg shadow-sm cursor-pointer hover:bg-green-50 transition text-center font-bold text-lg text-green-900">
                        السنة الثالثة ثانوي
                    </div>
                </div>
            </div>
        `;
    } else {
        container.innerHTML = `<p class="text-gray-500 text-center mt-8">الرجاء تحديد الطور لعرض المحتوى.</p>`;
    }
};
