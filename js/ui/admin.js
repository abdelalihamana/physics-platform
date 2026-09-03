import { db, usersCol, programCol, chatsPath } from '../config/firebase.js';
import { doc, updateDoc, deleteDoc, setDoc, collection, increment } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const levelNames = {
    "m_y1": "الأولى متوسط", "m_y2": "الثانية متوسط", "m_y3": "الثالثة متوسط", "m_y4": "الرابعة متوسط",
    "h_y1": "أولى ثانوي", "h_y2": "الثانية ثانوي", "h_y3": "الثالثة ثانوي"
};

export const switchAdminMainTab = (tab) => {
    window.adminMainTab = tab;
    const btnAccounts = document.getElementById('main-tab-accounts');
    const btnContent = document.getElementById('main-tab-content');
    const secAccounts = document.getElementById('admin-accounts-section');
    const secContent = document.getElementById('admin-content-section');

    if (tab === 'accounts') {
        if(secAccounts) { secAccounts.classList.remove('hidden'); secAccounts.classList.add('flex'); }
        if(secContent) secContent.classList.add('hidden');
        
        if(btnAccounts) btnAccounts.className = "flex-1 min-w-[200px] py-4 rounded-2xl font-black text-lg transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2";
        if(btnContent) btnContent.className = "flex-1 min-w-[200px] py-4 rounded-2xl font-black text-lg transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-center items-center gap-2";
        
        if (window.renderAdminTable) window.renderAdminTable();
    } else if (tab === 'content') {
        if(secAccounts) { secAccounts.classList.remove('flex'); secAccounts.classList.add('hidden'); }
        if(secContent) secContent.classList.remove('hidden');
        
        if(btnContent) btnContent.className = "flex-1 min-w-[200px] py-4 rounded-2xl font-black text-lg transition-all bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex justify-center items-center gap-2";
        if(btnAccounts) btnAccounts.className = "flex-1 min-w-[200px] py-4 rounded-2xl font-black text-lg transition-all bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-sm flex justify-center items-center gap-2";
        
        // عند دخول المحتوى، نفتح المتوسط كخيار افتراضي
        if (!window.adminActivePart) window.switchAdminPart('part_middle');
    }
};

export const switchAdminPart = (partId) => {
    window.adminActivePart = partId;
    
    document.querySelectorAll(`[id^="tab-btn-part_"]`).forEach(el => { 
        el.classList.remove('bg-white', 'text-blue-600', 'shadow-md', 'dark:bg-slate-700', 'dark:text-white'); 
        el.classList.add('text-slate-500', 'dark:text-slate-400'); 
    });
    
    const activeBtn = document.getElementById(`tab-btn-${partId}`);
    if(activeBtn) {
        activeBtn.classList.add('bg-white', 'text-blue-600', 'shadow-md', 'dark:bg-slate-700', 'dark:text-white');
        activeBtn.classList.remove('text-slate-500', 'dark:text-slate-400');
    }

    if(window.renderProgramUI) window.renderProgramUI(window.currentSections, 'admin-program-view', true);
};

export const switchAdminYear = (partId, yearId) => {
    window.adminActiveYear[partId] = yearId;
    window.adminActiveBranch[yearId] = null; 
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
            years.forEach(y => { html += `<button onclick="window.filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
        } else if (mainType === 'high') {
            const years = [{id: 'h_y1', t: 'أولى ثانوي'}, {id: 'h_y2', t: 'الثانية ثانوي'}, {id: 'h_y3', t: 'الثالثة ثانوي'}];
            years.forEach(y => { html += `<button onclick="window.filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
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
                btn.className = "px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 transition-all flex items-center gap-1";
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
            let waMessage = encodeURIComponent("السلام عليكم. تم قبول ابنكم على مستوى منصة المجتهد للعلوم الفيزيائية.");
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
            if (!studentName.includes(searchQuery) && !parentName.includes(searchQuery)) return; 
        }

        studentCount++; 

        let levelDisplay = data.level ? (levelNames[data.level] || data.level) : "غير محدد";
        let prog = { xp: 0, percent: 0 };
        if (window.calculateProgressXP && window.currentSections) {
            prog = window.calculateProgressXP(data.level, data, window.currentSections);
        }
        
        let parentInfo = data.parentName ? 
            `<div class="flex items-center gap-2"><span class="font-black">${data.parentName}</span></div>` 
            : '<div class="text-sm font-bold opacity-50">غير متوفر</div>';

        let statusBtn = data.approved 
            ? `<button onclick="window.toggleUserStatus('${d.id}', true, '${data.phoneNumber||''}')" class="px-4 py-1.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">مفعل ✅</button>`
            : `<button onclick="window.toggleUserStatus('${d.id}', false, '${data.phoneNumber||''}')" class="px-4 py-1.5 rounded-full text-xs font-black bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">انتظار ⏳</button>`;

        let passDisplay = data.password ? data.password : "مفقودة ⚠";

        tbody.innerHTML += `
            <tr class="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition border-b border-slate-100 dark:border-slate-700">
                <td class="p-4 text-center"><input type="checkbox" class="student-cb custom-cb" value="${d.id}"></td>
                <td class="p-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-2xl dark:bg-blue-900/50 dark:text-blue-400"><i class="ph-fill ph-user"></i></div>
                        <div>
                            <div class="font-black text-lg">${d.id}</div>
                            <div class="text-xs font-bold text-slate-500 flex items-center gap-1"><i class="ph-fill ph-key"></i> <span class="bg-slate-100 px-2 py-0.5 rounded dark:bg-slate-800">${passDisplay}</span></div>
                        </div>
                    </div>
                    <div class="mt-2 text-sm">${parentInfo}</div>
                </td>
                <td class="p-4 text-sm font-black text-center">${levelDisplay}</td>
                <td class="p-4 text-center">
                    <div class="inline-flex bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-lg text-sm font-black">${prog.xp} XP</div>
                </td>
                <td class="p-4 text-center">${statusBtn}</td>
                <td class="p-4 text-left">
                    <button onclick="window.loginAsStudent('${d.id}')" aria-label="مراقبة حساب التلميذ" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center gap-1" title="مراقبة حساب التلميذ"><i class="ph-bold ph-sign-in"></i> دخول للحساب</button>
                </td>
            </tr>`;
    });
    
    const statsContainer = document.getElementById('header-stats-container');
    if(statsContainer) {
        statsContainer.innerHTML = '';
        Object.keys(levelStats).sort().forEach((lvl) => {
            statsContainer.innerHTML += `
                <div class="p-3 rounded-xl border bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700 flex justify-between items-center text-center">
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
    if(window.showToast) window.showToast("تمت الإضافة بنجاح 📚");
};

export const adminDeleteLink = async (pIdx, yIdx, bIdx, cat, lIdx) => {
    if(window.confirmAction && await window.confirmAction("هل أنت متأكد من المسح؟")) {
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
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
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
    if(modal) { modal.classList.remove('hidden'); modal.classList.add('flex'); }
};

export const closeBulkChatModal = () => {
    const modal = document.getElementById('bulk-chat-modal');
    if(modal) { modal.classList.add('hidden'); modal.classList.remove('flex'); }
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
    btn.innerHTML = 'جاري الإرسال...';

    try {
        const targetStudents = window.adminUsersList.filter(u => u.data.level === level && u.data.approved === true);
        if (targetStudents.length === 0) {
            btn.disabled = false; btn.innerHTML = origHtml;
            if(window.showToast) window.showToast("لا يوجد تلاميذ مفعلين في هذا المستوى.", "error");
            return;
        }

        const timestamp = Date.now();
        const promises = targetStudents.map(async (student) => {
            const chatRoomId = student.id;
            const messagesRef = collection(db, chatsPath, chatRoomId, 'messages');
            const chatDocRef = doc(db, chatsPath, chatRoomId);

            const msgPromise = setDoc(doc(messagesRef, (timestamp + Math.floor(Math.random() * 1000)).toString()), {
                sender: 'admin', text: text, timestamp: timestamp
            });
            const unreadPromise = setDoc(chatDocRef, { unreadStudent: increment(1) }, { merge: true });
            return Promise.all([msgPromise, unreadPromise]);
        });

        await Promise.all(promises);
        if(window.showToast) window.showToast(`تم إرسال الرسالة بنجاح 📣`);
        closeBulkChatModal();
    } catch (error) {
        console.error("Bulk Message Error", error);
        if(window.showToast) window.showToast("حدث خطأ أثناء الإرسال الجماعي.", "error");
    }

    btn.disabled = false; btn.innerHTML = origHtml;
};
