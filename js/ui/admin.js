window.renderAdminAccounts = function() {
    const container = document.getElementById('accounts-list-container');
    if (!container) return;

    container.innerHTML = '<p class="text-gray-500 text-center py-4">جاري جلب البيانات من القاعدة...</p>';

    // محاكاة جلب البيانات لتجربة الواجهة بسلام (قم بربطها بقاعدة بياناتك لاحقاً)
    setTimeout(() => {
        container.innerHTML = `
            <div class="flex justify-between items-center bg-gray-50 p-4 border rounded shadow-sm">
                <div>
                    <p class="font-bold">أحمد محمود (تلميذ)</p>
                    <p class="text-sm text-gray-500">ahmed@test.com - السنة الرابعة متوسط</p>
                </div>
                <div class="space-x-2 space-x-reverse">
                    <button class="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition">تفعيل</button>
                    <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">مراسلة</button>
                </div>
            </div>
            <div class="flex justify-between items-center bg-gray-50 p-4 border rounded shadow-sm">
                <div>
                    <p class="font-bold">سارة علي (تلميذة)</p>
                    <p class="text-sm text-gray-500">sara@test.com - السنة الثانية ثانوي</p>
                </div>
                <div class="space-x-2 space-x-reverse">
                    <button class="bg-gray-400 text-white px-3 py-1 rounded text-sm cursor-not-allowed">مفعل</button>
                    <button class="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition">مراسلة</button>
                </div>
            </div>
        `;
    }, 500);
};
