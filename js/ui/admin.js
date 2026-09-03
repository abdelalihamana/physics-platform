// ملف: js/ui/admin.js

import { db, usersCol, programCol, chatsPath } from '../config/firebase.js';
import { showToast, confirmAction } from '../utils/helpers.js';
import { calculateProgressXP } from './student.js';
import { doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

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

    const makeActive = (el) => {
        el.classList.add('border-blue-500', 'ring-4', 'ring-blue-500/20', 'scale-[1.02]');
        el.classList.remove('border-slate-100', 'dark:border-slate-700', 'opacity-70');
        el.querySelector('.icon-bg').classList.add('bg-blue-100', 'dark:bg-blue-900/50', 'text-blue-600', 'dark:text-blue-400');
        el.querySelector('.icon-bg').classList.remove('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
    };

    const makeInactive = (el) => {
        el.classList.remove('border-blue-500', 'ring-4', 'ring-blue-500/20', 'scale-[1.02]');
        el.classList.add('border-slate-100', 'dark:border-slate-700', 'opacity-70');
        el.querySelector('.icon-bg').classList.remove('bg-blue-100', 'dark:bg-blue-900/50', 'text-blue-600', 'dark:text-blue-400');
        el.querySelector('.icon-bg').classList.add('bg-slate-100', 'dark:bg-slate-700', 'text-slate-500', 'dark:text-slate-400');
    };

    if (tab === 'accounts') {
        secAccounts.classList.remove('hidden'); secAccounts.classList.add('flex');
        secContent.classList.add('hidden');
        makeActive(btnAccounts); makeInactive(btnContent);
    } else {
        secAccounts.classList.remove('flex'); secAccounts.classList.add('hidden');
        secContent.classList.remove('hidden');
        makeActive(btnContent); makeInactive(btnAccounts);
    }
};

export const switchAdminPart = (partId) => {
    window.adminActivePart = partId;
    document.querySelectorAll(`.admin-part-content`).forEach(el => el.classList.remove('active'));
    document.getElementById(`content-${partId}`).classList.add('active');

    const btnMiddle = document.getElementById('tab-btn-part_middle');
    const btnHigh = document.getElementById('tab-btn-part_high');

    if(partId === 'part_middle') {
        btnMiddle.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'shadow-md');
        btnMiddle.classList.remove('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-800', 'opacity-70');
        
        btnHigh.classList.remove('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20', 'shadow-md');
        btnHigh.classList.add('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-800', 'opacity-70');
    } else {
        btnHigh.classList.add('border-indigo-500', 'bg-indigo-50', 'dark:bg-indigo-900/20', 'shadow-md');
        btnHigh.classList.remove('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-800', 'opacity-70');
        
        btnMiddle.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20', 'shadow-md');
        btnMiddle.classList.add('border-slate-200', 'dark:border-slate-700', 'bg-white', 'dark:bg-slate-800', 'opacity-70');
    }
};

export const switchAdminYear = (partId, yearId) => {
    window.adminActiveYear[partId] = yearId;
    window.adminActiveBranch[yearId] = null; 
    
    document.querySelectorAll(`.admin-year-content-${partId}`).forEach(el => el.classList.add('hidden'));
    document.querySelectorAll(`.admin-year-btn-${partId}`).forEach(el => { el.classList.remove('border-blue-500', 'text-blue-600', 'dark:text-blue-400'); el.classList.add('border-transparent', 'text-slate-500', 'dark:text-slate-400'); });
    
    document.getElementById(`content-${partId}-${yearId}`).classList.remove('hidden');
    document.getElementById(`btn-${partId}-${yearId}`).classList.add('border-blue-500', 'text-blue-600', 'dark:text-blue-400');
    document.getElementById(`btn-${partId}-${yearId}`).classList.remove('border-transparent', 'text-slate-500', 'dark:text-slate-400');
    
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

export const executeAdminStudentSearch = () => { renderAdminTable(); };

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
    if (mainType === 'all') {
        subContainer.classList.add('hidden'); subContainer.classList.remove('flex');
    } else {
        subContainer.classList.remove('hidden'); subContainer.classList.add('flex');
        let html = `<button onclick="filterSubStudents('all')" id="filter-sub-all" class="px-4 py-1.5 rounded-lg font-black text-xs bg-indigo-600 text-white shadow-sm transition-all flex items-center gap-1"><i class="ph-fill ph-circles-four"></i> كل السنوات</button>`;
        
        if (mainType === 'middle') {
            const years = [{id: 'm_y1', t: 'الأولى متوسط'}, {id: 'm_y2', t: 'الثانية متوسط'}, {id: 'm_y3', t: 'الثالثة متوسط'}, {id: 'm_y4', t: 'الرابعة متوسط'}];
            years.forEach(y => { html += `<button onclick="filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
        } else if (mainType === 'high') {
            const years = [{id: 'h_y1', t: 'أولى ثانوي'}, {id: 'h_y2', t: 'الثانية ثانوي'}, {id: 'h_y3', t: 'الثالثة ثانوي'}];
            years.forEach(y => { html += `<button onclick="filterSubStudents('${y.id}')" id="filter-sub-${y.id}" class="px-4 py-1.5 rounded-lg font-black text-xs bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all flex items-center gap-1"><i class="ph-fill ph-door"></i> ${y.t}</button>`; });
        }
        subContainer.innerHTML = html;
    }
    renderAdminTable();
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
    renderAdminTable();
};

export const toggleSelectAll = () => { const state = document.getElementById('select-all-cb').checked; document.querySelectorAll('.student-cb').forEach(cb => cb.checked = state); };

export const toggleUserStatus = async (uid, isApproved, phone) => {
    if (isApproved) {
        if(await confirmAction("هل أنت متأكد من إلغاء تفعيل هذا الحساب؟")) {
            await updateDoc(doc(usersCol, uid), { approved: false });
            showToast("تم إلغاء التفعيل");
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
            showToast("تم تفعيل الحساب بنجاح ✅");
        } catch(e) {
            if(win) win.close(); showToast("حدث خطأ أثناء التفعيل", "error");
        }
    }
};

export const bulkAction = async (action) => {
    const checked = Array.from(document.querySelectorAll('.student-cb:checked')).map(cb => cb.value);
    if(checked.length === 0) return showToast("يرجى تحديد تلميذ واحد على الأقل", "error");
    
    const actionText = action === 'approve' ? 'تفعيل' : (action === 'deactivate' ? 'إلغاء تفعيل' : 'حذف نهائي لـ');
    if(!await confirmAction(`هل أنت متأكد من ${actionText} ${checked.length} حساب(ات)؟`)) return;

    for(let username of checked) {
        if(action === 'approve') { await updateDoc(doc(usersCol, username), { approved: true }); } 
        else if (action === 'deactivate') { await updateDoc(doc(usersCol, username), { approved: false }); } 
        else if (action === 'delete') { await deleteDoc(doc(usersCol, username)); }
    }
    showToast(`تم ${actionText} الحسابات المحددة بنجاح 🚀`);
    document.getElementById('select-all-cb').checked = false;
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
        let prog = calculateProgressXP(data.level, data, window.currentSections);
        
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
            ? `<button onclick="toggleUserStatus('${d.id}', true, '${data.phoneNumber||''}')" aria-label="تغيير الحالة" class="px-4 py-1.5 rounded-full text-xs font-black shadow-sm bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 hover:scale-105 transition" title="انقر لإلغاء التفعيل">مفعل ✅</button>`
            : `<button onclick="toggleUserStatus('${d.id}', false, '${data.phoneNumber||''}')" aria-label="تغيير الحالة" class="px-4 py-1.5 rounded-full text-xs font-black shadow-sm bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800 hover:scale-105 transition" title="اضغط للتفعيل ومراسلة الولي">انتظار ⏳</button>`;

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
                        <button onclick="loginAsStudent('${d.id}')" aria-label="مراقبة حساب التلميذ" class="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-black hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition border border-indigo-200 dark:border-indigo-800 shadow-sm flex items-center gap-1" title="مراقبة حساب التلميذ"><i class="ph-bold ph-sign-in"></i> دخول للحساب</button>
                        <button onclick="openChat('${d.id}')" aria-label="مراسلة التلميذ" class="relative icon-btn w-9 h-9 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-lg shadow-sm border border-blue-200 dark:border-blue-800" title="مراسلة"><i class="ph-bold ph-chat-circle-dots"></i>${chatBadge}</button>
                    </div>
                </td>
            </tr>`;
    });
    
    document.getElementById('hover-total-students').innerText = studentCount;
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
    
    if(!title || !url) return showToast("يرجى إدخال العنوان والرابط", "error");
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
    showToast("تمت الإضافة بنجاح وتنبيه التلاميذ 📚");
};

export const adminDeleteLink = async (pIdx, yIdx, bIdx, cat, lIdx) => {
    if(await confirmAction("هل أنت متأكد من مسح هذا الرابط نهائياً؟")) {
        const docRef = doc(programCol, 'main'); let sections = window.currentSections;
        sections[pIdx].years[yIdx].branches[bIdx].categories[cat].splice(lIdx, 1);
        await updateDoc(docRef, { sections }); showToast("تم مسح الرابط");
    }
};

export const adminEditLinkModal = (pIdx, yIdx, bIdx, cat, lIdx) => {
    let currentLink = window.currentSections[pIdx].years[yIdx].branches[bIdx].categories[cat][lIdx];
    document.getElementById('edit-link-title').value = currentLink.title; document.getElementById('edit-link-url').value = currentLink.url;
    window.currentEditParams = { pIdx, yIdx, bIdx, cat, lIdx };
    const modal = document.getElementById('edit-modal'); modal.classList.remove('hidden'); modal.classList.add('flex');
};

export const closeEditModal = () => { document.getElementById('edit-modal').classList.add('hidden'); document.getElementById('edit-modal').classList.remove('flex'); window.currentEditParams = null; };

export const saveEditedLink = async () => {
    let newTitle = document.getElementById('edit-link-title').value.trim(); let newUrl = document.getElementById('edit-link-url').value.trim();
    if(!newTitle || !newUrl) return showToast("يرجى إدخال العنوان والرابط", "error"); if(!newUrl.startsWith('http')) newUrl = 'https://' + newUrl;
    if(window.currentEditParams) {
        let { pIdx, yIdx, bIdx, cat, lIdx } = window.currentEditParams; let sections = window.currentSections;
        sections[pIdx].years[yIdx].branches[bIdx].categories[cat][lIdx] = { title: newTitle, url: newUrl };
        await updateDoc(doc(programCol, 'main'), { sections }); showToast("تم التعديل بنجاح ✏️"); closeEditModal();
    }
};
