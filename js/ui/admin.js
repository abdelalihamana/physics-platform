// ملف: js/ui/admin.js

import { db, usersCol, programCol, chatsPath } from '../config/firebase.js';
import { doc, updateDoc, deleteDoc, setDoc, collection, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const levelNames = {
    "m_y1": "الأولى متوسط", "m_y2": "الثانية متوسط", "m_y3": "الثالثة متوسط", "m_y4": "الرابعة متوسط",
    "h_y1": "أولى ثانوي", "h_y2": "الثانية ثانوي", "h_y3": "الثالثة ثانوي"
};

export const openAdminSection = (section) => {
    window.adminMainTab = section;
    document.getElementById('admin-main-menu').classList.add('hidden');
    
    if (section === 'accounts') {
        document.getElementById('admin-accounts-wrapper').classList.remove('hidden');
        document.getElementById('admin-accounts-wrapper').classList.add('animate-[fadeInTab_0.3s_ease]');
        if (window.renderAdminTable) window.renderAdminTable();
    } else if (section === 'content') {
        document.getElementById('admin-content-wrapper').classList.remove('hidden');
        document.getElementById('admin-content-wrapper').classList.add('animate-[fadeInTab_0.3s_ease]');
    }
};

export const returnToAdminHome = () => {
    window.adminMainTab = null;
    document.getElementById('admin-accounts-wrapper').classList.add('hidden');
    document.getElementById('admin-content-wrapper').classList.add('hidden');
    
    document.getElementById('admin-main-menu').classList.remove('hidden');
    document.getElementById('admin-main-menu').classList.add('animate-[fadeInTab_0.3s_ease]');
};

export const openAdminPart = (partId) => {
    window.adminActivePart = partId;
    
    // إخفاء بطاقات الأطوار
    const partsMenu = document.getElementById('admin-parts-menu');
    if(partsMenu) partsMenu.classList.add('hidden');
    
    // إظهار حاوية المحتوى (السنوات والوحدات)
    const contentWrapper = document.getElementById('admin-part-content-wrapper');
    if(contentWrapper) {
        contentWrapper.classList.remove('hidden');
        contentWrapper.classList.add('animate-[fadeInTab_0.3s_ease]');
    }
    
    if(window.renderProgramUI) window.renderProgramUI(window.currentSections, 'admin-program-view', true);
};

export const returnToAdminParts = () => {
    window.adminActivePart = null;
    
    const contentWrapper = document.getElementById('admin-part-content-wrapper');
    if(contentWrapper) contentWrapper.classList.add('hidden');
    
    const partsMenu = document.getElementById('admin-parts-menu');
    if(partsMenu) {
        partsMenu.classList.remove('hidden');
        partsMenu.classList.add('animate-[fadeInTab_0.3s_ease]');
    }
};

export const switchAdminYear = (partId, yearId) => {
    window.adminActiveYear[partId] = yearId;
    window.adminActiveBranch[yearId] = null; // الرجوع لوضع البطاقات
    if(window.renderProgramUI) window.renderProgramUI(window.currentSections, 'admin-program-view', true);
};

export const switchAdminBranch = (yearId, branchId) => { 
    window.adminActiveBranch[yearId] = branchId; 
    if(window.renderProgramUI) window.renderProgramUI(window.currentSections, 'admin-program-view', true); 
};

export const returnToAdminGrid = (yearId) => {
    window.adminActiveBranch[yearId] = null;
    if(window.renderProgramUI) window.renderProgramUI(window.currentSections, 'admin-program-view', true);
};

export const executeAdminStudentSearch = () => { if (window.renderAdminTable) window.renderAdminTable(); };

export const filterMainStudents = (mainType) => {
    window.adminMainFilter = mainType;
    window.adminSubFilter = 'all'; 
    
    ['all', 'middle', 'high'].forEach(t => {
        let btn = document.getElementById(`filter-main-${t}`);
        if(btn) {
            if(t === mainType) { btn.classList.add('bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-white', 'shadow-sm'); btn.classList.remove('text-slate-500', 'dark:text-slate-400'); } 
            else { btn.classList.remove('bg-white', 'dark:bg-slate-700', 'text-blue-600', 'dark:text-white', 'shadow-sm'); btn.classList.add('text-slate-500', 'dark:text-slate-400'); }
        }
    });

    const subContainer = document.getElementById('sub-filter-container');
    if (!subContainer) return;
    
    if (mainType === 'all') {
        subContainer.classList.add('hidden'); subContainer.classList.remove('flex');
    } else {
        subContainer.classList.remove('hidden'); subContainer.classList.add('flex');
        let html = `<button onclick="window.filterSubStudents('all')" id="filter-sub-all" class="px-4 py-1.5 rounded-lg font-black text-xs bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1"><i class="ph-fill ph-circles-four"></i> كل السنوات</button>`;
        
        if (mainType === 'middle') {
            const years = [{id: 'm_y1', t: 'الأولى متوسط'}, {id: 'm_y2', t: 'الثانية متوسط'}, {id: 'm_y3', t: 'الثالثة متوسط'}, {id: 'm_y4', t: 'الرابعة متوسط'}];
            years.forEach(y => { html += `<button onclick="window.filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
        } else if (mainType === 'high') {
            const years = [{id: 'h_y1', t: 'أولى ثانوي'}, {id: 'h_y2', t: 'الثانية ثانوي'}, {id: 'h_y3', t: 'الثالثة ثانوي'}];
            years.forEach(y => { html += `<button onclick="window.filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
        }
        subContainer.innerHTML = html;
    }
    if (window.renderAdminTable) window.renderAdminTable();
};

export const filterSubStudents = (subType) => {
    window.adminSubFilter = subType;
    const subContainer = document.getElementById('sub-filter-container');
    if(subContainer) {
        Array.from(subContainer.children).forEach(btn => {
            if (btn.id === `filter-sub-${subType}`) {
                btn.className = "px-4 py-1.5 rounded-lg font-black text-xs bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1";
            } else {
                btn.className = "px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1";
            }
        });
    }
    if (window.renderAdminTable) window.renderAdminTable();
};

export const toggleSelectAll = () => { const state = document.getElementById('select-all-cb').checked; document.querySelectorAll('.student-cb').forEach(cb => cb.checked = state); };

export const toggleUserStatus = async (uid, isApproved, phone) => {
    if (isApproved) {
        if(window.confirmAction && await window.confirmAction("هل أنت متأكد من إلغاء تفعيل هذا الحساب؟")) {
            await updateDoc(doc(usersCol, uid), { approved: false });
            if(window.showToast) window.showToast("تم إلغاء التفعيل");
        }
    } else {
        let waLink = null;
        if (phone) {
            let waMessage = encodeURIComponent("السلام عليكم. معكم منصة المجتهد للعلوم الفيزيائية نعلمكم أنه تم قبول إبنكم على مستوى المنصة نتمنى له النجاح والتوفيق. لأي إستفسار راسلونا عبر المنصة");
            waLink = `https://wa.me/213${phone.substring(1)}?text=${waMessage}`;
        }
        let win = null; if(waLink) win = window.open(waLink, '_blank'); 
        
        try {
            await updateDoc(doc(usersCol, uid), { approved: true });
            if(window.showToast) window.showToast("تم تفعيل الحساب بنجاح ✅");
        } catch(e) {
            if(win) win.close(); if(window.showToast) window.showToast("حدث خطأ أثناء التفعيل", "error");
        }
    }
};

export const bulkAction = async (action) => {
    const checked = Array.from(document.querySelectorAll('.student-cb:checked')).map(cb => cb.value);
    if(checked.length === 0) {
        if(window.showToast) window.showToast("يرجى تحديد تلميذ واحد على الأقل", "error");
        return;
    }
    
    const actionText = action === 'approve' ? 'تفعيل' : (action === 'deactivate' ? 'إلغاء تفعيل' : 'حذف نهائي لـ');
    if(window.confirmAction && !await window.confirmAction(`هل أنت متأكد من ${actionText} ${checked.length} حساب(ات)؟`)) return;

    for(let username of checked) {
        if(action === 'approve') { await updateDoc(doc(usersCol, username), { approved: true }); } 
        else if (action === 'deactivate') { await updateDoc(doc(usersCol, username), { approved: false }); } 
        else if (action === 'delete') { await deleteDoc(doc(usersCol, username)); }
    }
    if(window.showToast) window.showToast(`تم ${actionText} الحسابات المحددة بنجاح 🚀`);
    const cbAll = document.getElementById('select-all-cb');
    if(cbAll) cbAll.checked = false;
};

export const renderAdminTable = () => {
    const tbody = document.getElementById('students-table-body');
    if (!tbody) return;
    tbody.innerHTML = ''; let studentCount = 0; let levelStats = {}; 
    
    const searchInput = document.getElementById('admin-student-search');
    const searchQuery = searchInput ? searchInput.value.trim().toLowerCase() : '';

    window.adminUsersList.forEach(d => {
        const data = d.data;
        if(data.level) levelStats[data.level] = (levelStats[data.level] || 0) + 1;

        let isMiddle = data.level && data.level.startsWith('m_');
        let isHigh = data.level && data.level.startsWith('h_');
        
        if(window.adminMainFilter === 'middle' && !isMiddle) return;
        if(window.adminMainFilter === 'high' && !isHigh) return;
        if(window.adminSubFilter !== 'all' && data.level !== window.adminSubFilter) return;

        if (searchQuery) {
            const studentName = d.id.toLowerCase();
            const parentName = (data.parentName || '').toLowerCase();
            if (!studentName.includes(searchQuery) && !parentName.includes(searchQuery)) {
                return; 
            }
        }

        studentCount++; 

        let levelDisplay = data.level ? (levelNames[data.level] || data.level) : "غير محدد";
        let prog = { xp: 0, percent: 0 };
        if (window.calculateProgressXP) {
            prog = window.calculateProgressXP(data.level, data, window.currentSections);
        }
        
        let waProgMsg = encodeURIComponent(`السلام عليكم ولي أمر التلميذ(ة) ${d.id}. نعلمكم من منصة المجتهد للعلوم الفيزيائية أن نسبة إنجاز ابنكم في الدروس هي ${prog.percent}% بمجموع نقاط ${prog.xp} XP. لأي استفسار يرجى مراسلتنا.`);
        let waProgLink = data.phoneNumber ? `https://wa.me/213${data.phoneNumber.substring(1)}?text=${waProgMsg}` : '#';

        let parentInfo = data.parentName ? 
            `<div class="flex items-center gap-2">
                <span class="font-black text-slate-800 dark:text-slate-200">${data.parentName}</span>
                ${data.phoneNumber ? `<a href="${waProgLink}" target="_blank" class="text-[#25D366] hover:text-[#128C7E] transition hover:scale-110" title="إعلام بالتقدم عبر الواتساب"><i class="ph-fill ph-whatsapp-logo text-2xl drop-shadow-sm"></i></a>` : ''}
            </div>` 
            : '<div class="text-sm text-slate-400 dark:text-slate-500 font-bold">غير متوفر</div>';

        let unreadCount = window.adminChatsData[d.id]?.unreadAdmin || 0;
        let chatBadge = unreadCount > 0 ? `<span class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-bounce shadow-md border border-white">${unreadCount}</span>` : '';

        let statusBtn = data.approved 
            ? `<button onclick="window.toggleUserStatus('${d.id}', true, '${data.phoneNumber||''}')" aria-label="تغيير الحالة" class="px-4 py-1.5 rounded-full text-xs font-black shadow-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:scale-105 transition" title="انقر لإلغاء التفعيل">مفعل ✅</button>`
            : `<button onclick="window.toggleUserStatus('${d.id}', false, '${data.phoneNumber||''}')" aria-label="تغيير الحالة" class="px-4 py-1.5 rounded-full text-xs font-black shadow-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:scale-105 transition" title="اضغط للتفعيل ومراسلة الولي">انتظار ⏳</button>`;

        let passDisplay = data.password ? data.password : "مفقودة ⚠";

        tbody.innerHTML += `
            <tr class="hover:bg-blue-50/40 dark:hover:bg-blue-900/20 transition duration-200 group">
                <td class="p-4 text-center border-b border-slate-100 dark:border-slate-700"><input type="checkbox" aria-label="تحديد التلميذ" class="student-cb custom-cb" value="${d.id}"></td>
                <td class="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl flex-shrink-0 shadow-inner border border-blue-200/50 dark:border-blue-800/50"><i class="ph-fill ph-user"></i></div>
                        <div>
                            <div class="font-black text-slate-800 dark:text-white text-lg group-hover:text-blue-600 transition">${d.id}</div>
                            <div class="text-xs text-slate-500 dark:text-slate-400 font-bold mt-1 flex items-center gap-1.5"><i class="ph-fill ph-key opacity-70"></i> <span class="text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-800/50">${passDisplay}</span></div>
                        </div>
                    </div>
                    <div class="mt-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700">${parentInfo}</div>
                </td>
                <td class="p-4 text-sm font-black text-slate-600 dark:text-slate-300 text-center border-b border-slate-100 dark:border-slate-700">${levelDisplay}</td>
                <td class="p-4 text-center border-b border-slate-100 dark:border-slate-700">
                    <div class="inline-flex bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-lg text-sm font-black shadow-sm mb-1">${prog.xp} XP</div>
                    <div class="text-[10px] font-bold text-slate-400 dark:text-slate-500">إنجاز: ${prog.percent}%</div>
                </td>
                <td class="p-4 text-center border-b border-slate-100 dark:border-slate-700">${statusBtn}</td>
                <td class="p-4 text-left border-b border-slate-100 dark:border-slate-700">
                    <div class="flex gap-2 justify-end">
                        <button onclick="window.loginAsStudent('${d.id}')" aria-label="مراقبة حساب التلميذ" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center gap-1" title="مراقبة حساب التلميذ"><i class="ph-bold ph-sign-in"></i> دخول للحساب</button>
                        <button onclick="window.openChat('${d.id}')" aria-label="مراسلة التلميذ" class="relative bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-9 h-9 rounded-lg flex items-center justify-center text-lg shadow-sm border border-blue-200 dark:border-blue-800 hover:bg-blue-100 transition" title="مراسلة"><i class="ph-bold ph-chat-circle-dots"></i>${chatBadge}</button>
                    </div>
                </td>
            </tr>`;
    });
    
    const countEl = document.getElementById('hover-total-students');
    if(countEl) countEl.innerText = studentCount;
    
    const statsContainer = document.getElementById('header-stats-container');
    if(statsContainer) {
        statsContainer.innerHTML = '';
        const colors = ['bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800', 
                        'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800', 
                        'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800', 
                        'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800'];
        Object.keys(levelStats).sort().forEach((lvl, i) => {
            let c = colors[i % colors.length];
            statsContainer.innerHTML += `
                <div class="p-3 rounded-xl border flex justify-between items-center text-center shadow-sm ${c}">
                    <span class="text-xs font-black">${levelNames[lvl] || lvl}</span>
                    <span class="text-lg font-black">${levelStats[lvl]}</span>
                </div>`;
        });
    }
};

export const adminAddLink = async (pIdx, yIdx, bIdx, cat, branchId) => {
    let title = document.getElementById(`title_${branchId}_${cat}`).value.trim(); 
    let url = document.getElementById(`url_${branchId}_${cat}`).value.trim();
    
    if(!title || !url) {
        if(window.showToast) window.showToast("يرجى إدخال العنوان والرابط", "error");
        return;
    }
    if(!url.startsWith('http')) url = 'https://' + url;
    
    const docRef = doc(programCol, 'main'); 
    let sections = window.currentSections;
    
    if (!sections[pIdx].years[yIdx].branches[bIdx].categories[cat]) {
        sections[pIdx].years[yIdx].branches[bIdx].categories[cat] = [];
    }
    
    sections[pIdx].years[yIdx].branches[bIdx].categories[cat].push({title, url});

    let levelId = sections[pIdx].years[yIdx].id;
    let branchTitle = sections[pIdx].years[yIdx].branches[bIdx].title;
    let updates = window.currentUpdates || [];
    
    updates.push({
        id: Date.now().toString(),
        title: title,
        level: levelId,
        branch: branchTitle,
        timestamp: Date.now()
    });

    if (updates.length > 50) updates = updates.slice(updates.length - 50);

    await updateDoc(docRef, { sections: sections, latestUpdates: updates }); 
    if(window.showToast) window.showToast("تمت الإضافة بنجاح وتنبيه التلاميذ 📚");
};

export const adminDeleteLink = async (pIdx, yIdx, bIdx, cat, lIdx) => {
    if(window.confirmAction && await window.confirmAction("هل أنت متأكد من مسح هذا الرابط نهائياً؟")) {
        const docRef = doc(programCol, 'main'); let sections = window.currentSections;
        sections[pIdx].years[yIdx].branches[bIdx].categories[cat].splice(lIdx, 1);
        await updateDoc(docRef, { sections }); 
        if(window.showToast) window.showToast("تم مسح الرابط");
    }
};

export const adminEditLinkModal = (pIdx, yIdx, bIdx, cat, lIdx) => {
    let currentLink = window.currentSections[pIdx].years[yIdx].branches[bIdx].categories[cat][lIdx];
    document.getElementById('edit-link-title').value = currentLink.title; 
    document.getElementById('edit-link-url').value = currentLink.url;
    window.currentEditParams = { pIdx, yIdx, bIdx, cat, lIdx };
    const modal = document.getElementById('edit-modal'); 
    modal.classList.remove('hidden'); modal.classList.add('flex');
};

export const closeEditModal = () => { 
    const modal = document.getElementById('edit-modal');
    modal.classList.add('hidden'); modal.classList.remove('flex'); 
    window.currentEditParams = null; 
};

export const saveEditedLink = async () => {
    let newTitle = document.getElementById('edit-link-title').value.trim(); 
    let newUrl = document.getElementById('edit-link-url').value.trim();
    if(!newTitle || !newUrl) {
        if(window.showToast) window.showToast("يرجى إدخال العنوان والرابط", "error");
        return;
    }
    if(!newUrl.startsWith('http')) newUrl = 'https://' + newUrl;
    
    if(window.currentEditParams) {
        let { pIdx, yIdx, bIdx, cat, lIdx } = window.currentEditParams; let sections = window.currentSections;
        sections[pIdx].years[yIdx].branches[bIdx].categories[cat][lIdx] = { title: newTitle, url: newUrl };
        await updateDoc(doc(programCol, 'main'), { sections }); 
        if(window.showToast) window.showToast("تم التعديل بنجاح ✏️"); 
        closeEditModal();
    }
};

export const openBulkChatModal = () => {
    const modal = document.getElementById('bulk-chat-modal');
    modal.classList.remove('hidden'); modal.classList.add('flex');
};

export const closeBulkChatModal = () => {
    const modal = document.getElementById('bulk-chat-modal');
    modal.classList.add('hidden'); modal.classList.remove('flex');
    document.getElementById('bulk-chat-level').value = '';
    document.getElementById('bulk-chat-input').value = '';
};

export const sendBulkChatMessage = async () => {
    const level = document.getElementById('bulk-chat-level').value;
    const text = document.getElementById('bulk-chat-input').value.trim();

    if (!level || !text) {
        if(window.showToast) window.showToast("يرجى اختيار المستوى وكتابة نص الرسالة", "error");
        return;
    }

    const btn = document.getElementById('send-bulk-msg-btn');
    const origHtml = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<i class="ph-bold ph-spinner animate-spin text-2xl"></i> جاري التوزيع...';

    try {
        const targetStudents = window.adminUsersList.filter(u => u.data.level === level && u.data.approved === true);

        if (targetStudents.length === 0) {
            btn.disabled = false; btn.innerHTML = origHtml;
            if(window.showToast) window.showToast("عذراً، لا يوجد تلاميذ مفعلين في هذا المستوى حالياً.", "error");
            return;
        }

        const timestamp = Date.now();
        let successCount = 0;

        const promises = targetStudents.map(async (student) => {
            const chatRoomId = student.id;
            const messagesRef = collection(db, chatsPath, chatRoomId, 'messages');
            const chatDocRef = doc(db, chatsPath, chatRoomId);

            const msgPromise = setDoc(doc(messagesRef, (timestamp + Math.floor(Math.random() * 1000)).toString()), {
                sender: 'admin',
                text: text,
                timestamp: timestamp
            });

            const unreadPromise = setDoc(chatDocRef, { unreadStudent: increment(1) }, { merge: true });

            await Promise.all([msgPromise, unreadPromise]);
            successCount++;
        });

        await Promise.all(promises);

        if(window.showToast) window.showToast(`تم إرسال الرسالة إلى ${successCount} تلميذ بنجاح 📣`, "success");
        closeBulkChatModal();

    } catch (error) {
        console.error("Bulk Message Error", error);
        if(window.showToast) window.showToast("حدث خطأ أثناء الإرسال الجماعي.", "error");
    }

    btn.disabled = false; btn.innerHTML = origHtml;
};
