// ملف: js/ui/student.js

import { showToast, fireConfetti, escapeHtml } from '../utils/helpers.js';
import { db, usersCol } from '../config/firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const XP_PER_ITEM = 10;

export const catConfig = {
    'lessons': { title: 'الدروس', icon: '<i class="ph-fill ph-books"></i>', bg: 'bg-blue-50/50 dark:bg-blue-900/10', text: 'text-blue-700 dark:text-blue-400', border: 'border-blue-100 dark:border-blue-900/30' },
    'exercises': { title: 'التمارين', icon: '<i class="ph-fill ph-pencil-simple"></i>', bg: 'bg-orange-50/50 dark:bg-orange-900/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-100 dark:border-orange-900/30' },
    'terms': { title: 'الفروض', icon: '<i class="ph-fill ph-exam"></i>', bg: 'bg-emerald-50/50 dark:bg-emerald-900/10', text: 'text-emerald-700 dark:text-emerald-400', border: 'border-emerald-100 dark:border-emerald-900/30' },
    'exams': { title: 'الاختبارات', icon: '<i class="ph-fill ph-files"></i>', bg: 'bg-purple-50/50 dark:bg-purple-900/10', text: 'text-purple-700 dark:text-purple-400', border: 'border-purple-100 dark:border-purple-900/30' },
    'past_exams': { title: 'مواضيع سابقة', icon: '<i class="ph-fill ph-certificate"></i>', bg: 'bg-indigo-50/50 dark:bg-indigo-900/10', text: 'text-indigo-700 dark:text-indigo-400', border: 'border-indigo-100 dark:border-indigo-900/30' },
    'mock_exams': { title: 'مواضيع مقترحة', icon: '<i class="ph-fill ph-file-text"></i>', bg: 'bg-amber-50/50 dark:bg-amber-900/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-100 dark:border-amber-900/30' }
};

export const getBranchIcon = (title) => {
    if(title.includes('شهادتك') || title.includes('شهادات') || title.includes('تجريبية')) return '<i class="ph-fill ph-certificate"></i>';
    if(title.includes('الكهرباء') || title.includes('كهربائية')) return '<i class="ph-fill ph-lightning"></i>';
    if(title.includes('المادة') || title.includes('كيمياء') || title.includes('تحولات')) return '<i class="ph-fill ph-flask"></i>';
    if(title.includes('ميكانيك') || title.includes('حركة')) return '<i class="ph-fill ph-gear-six"></i>';
    if(title.includes('ضوء') || title.includes('بصريات') || title.includes('الضوئية')) return '<i class="ph-fill ph-lightbulb"></i>';
    if(title.includes('طاقة') || title.includes('عمل')) return '<i class="ph-fill ph-battery-full"></i>';
    if(title.includes('مغناطيس') || title.includes('كهرومغناطيسية')) return '<i class="ph-fill ph-magnet"></i>';
    if(title.includes('الفصل')) return '<i class="ph-fill ph-folder-open"></i>';
    return '<i class="ph-fill ph-book-bookmark"></i>'; 
};

const getEmptyStateHTML = (title) => `<div class="flex flex-col items-center justify-center p-6 text-center bg-white/50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700"><i class="ph-fill ph-folder-open text-5xl text-slate-300 dark:text-slate-600 mb-2"></i><h3 class="text-sm font-black text-slate-500 dark:text-slate-400">لا يوجد ${title} حالياً</h3></div>`;

export const markStudentNotificationsAsRead = () => {
    if (!window.currentUpdates || !window.currentUserRecord || window.currentUserRecord.role === 'admin') return;
    let myUpdates = window.currentUpdates.filter(u => u.level === window.currentUserRecord.level);
    let seenUpdates = myUpdates.map(u => u.id);
    localStorage.setItem(`seen_updates_${window.currentUserRecord.username}`, JSON.stringify(seenUpdates));

    const badge = document.getElementById('student-global-badge');
    if (badge) badge.classList.add('hidden');

    document.querySelectorAll('#student-notifications-container .bg-blue-50').forEach(el => {
        el.classList.remove('bg-blue-50', 'dark:bg-blue-900/20', 'border-blue-200', 'dark:border-blue-800');
        el.classList.add('bg-slate-50', 'dark:bg-slate-800/50', 'border-slate-100', 'dark:border-slate-700');
    });
    document.querySelectorAll('#student-notifications-container .text-blue-600').forEach(el => {
        el.classList.remove('text-blue-600', 'dark:text-blue-400');
        el.classList.add('text-slate-400', 'dark:text-slate-500');
    });
};

export const renderStudentNotifications = (myUpdates, seenUpdates) => {
    let unreadCount = 0;
    let notifHtml = '';
    
    let sortedUpdates = [...myUpdates].sort((a, b) => b.timestamp - a.timestamp);

    sortedUpdates.forEach(update => {
        let isNew = !seenUpdates.includes(update.id);
        if (isNew) unreadCount++;

        let bgClass = isNew ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700';
        let iconColor = isNew ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500';

        notifHtml += `
            <div class="flex items-start gap-3 p-3 rounded-xl border ${bgClass} transition shadow-sm">
                <div class="w-8 h-8 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center flex-shrink-0 shadow-sm ${iconColor}">
                    <i class="ph-bold ph-bell-ringing"></i>
                </div>
                <div class="flex-1">
                    <div class="font-black text-sm text-slate-800 dark:text-white leading-tight mb-1">${update.title}</div>
                    <div class="text-[11px] font-bold text-slate-500 dark:text-slate-400">في وحدة: ${update.branch}</div>
                </div>
            </div>`;
    });

    const badge = document.getElementById('student-global-badge');
    const container = document.getElementById('student-notifications-container');

    if (badge) {
        if (unreadCount > 0) {
            badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }

    if (container) {
        if (sortedUpdates.length > 0) {
            container.innerHTML = notifHtml;
        } else {
            container.innerHTML = '<div class="text-center text-slate-500 dark:text-slate-400 text-sm font-bold p-4 opacity-70"><i class="ph-fill ph-bell-slash text-4xl mb-2"></i><br>لا توجد إشعارات جديدة</div>';
        }
    }
};

export const calculateProgressXP = (levelId, data, sections) => {
    if(!sections || !levelId) return { xp: 0, percent: 0 };
    let xp = 0; let totalLinks = 0; let clickedLinks = data.clickedLinks || [];
    sections.forEach(p => p.years.forEach(y => {
        if(y.id === levelId) {
            y.branches.forEach(b => {
                let cats = b.id === 'm4_b5' ? ['past_exams', 'mock_exams'] : (b.id.includes('_s') ? ['terms', 'exams'] : ['lessons', 'exercises']);
                cats.forEach(cat => {
                    let links = b.categories[cat] || [];
                    totalLinks += links.length;
                    links.forEach((_, lIdx) => { if(clickedLinks.includes(`${b.id}_${cat}_${lIdx}`)) xp += XP_PER_ITEM; });
                });
            });
        }
    }));
    let percent = totalLinks === 0 ? 0 : Math.round(( (xp / XP_PER_ITEM) / totalLinks) * 100);
    return { xp, percent };
};

export const updateProgressUI = (sections) => {
    if(!window.currentUserRecord || window.currentUserRecord.role === 'admin') return;
    let result = calculateProgressXP(window.currentUserRecord.level, window.currentUserRecord, sections);
    const bar = document.getElementById('progress-bar-fill'); const txt = document.getElementById('progress-text-xp');
    if(bar) bar.style.width = `${result.percent}%`; 
    if(txt) txt.innerText = `${result.xp}`;
};

export const trackLinkClick = async (branchId, cat, lIdx, url) => {
    window.open(url, '_blank');
    if (window.currentUserRecord && window.currentUserRecord.role !== 'admin') {
        if (window.originalAdminRecord) {
            showToast("أنت في وضع المراقبة، لن يتم تسجيل هذا الدرس كمقروء ولن تحسب النقاط للتلميذ.", "error");
            return;
        }

        let clickedLinks = [...(window.currentUserRecord.clickedLinks || [])];
        let linkId = `${branchId}_${cat}_${lIdx}`;
        if (!clickedLinks.includes(linkId)) {
            clickedLinks.push(linkId);
            window.currentUserRecord.clickedLinks = clickedLinks;
            fireConfetti();
            showToast(`+${XP_PER_ITEM} XP ! أحسنت 🌟`);
            updateProgressUI(window.currentSections);
            if(document.getElementById('lesson-search').value.trim() === '') {
                window.renderProgramUI(window.currentSections, 'student-program-view', false);
            } else { executeStudentSearch(); }
            await updateDoc(doc(usersCol, window.currentUserRecord.username), { clickedLinks: clickedLinks });
        }
    }
};

export const executeStudentSearch = () => {
    const searchInput = document.getElementById('lesson-search').value.trim();
    const query = searchInput.toLowerCase(); 
    const safeQuery = escapeHtml(searchInput); 
    const container = document.getElementById('student-program-view');
    
    if (query === '') { window.renderProgramUI(window.currentSections, 'student-program-view', false); return; }

    let html = `<div class="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2rem] border border-blue-200 dark:border-blue-800 p-6 shadow-lg animate-[fadeInTab_0.3s_ease]">
                    <h3 class="text-xl font-black text-blue-600 dark:text-blue-400 mb-6 flex items-center gap-2"><i class="ph-bold ph-magnifying-glass"></i> نتائج البحث عن: "${safeQuery}"</h3>
                    <div class="space-y-4">`;
    let found = false; let userLevel = window.currentUserRecord.level; let clickedLinks = window.currentUserRecord.clickedLinks || [];

    window.currentSections.forEach(p => p.years.forEach(y => {
        if(y.id === userLevel) {
            y.branches.forEach(branch => {
                let cats = branch.id === 'm4_b5' ? ['past_exams', 'mock_exams'] : (branch.id.includes('_s') ? ['terms', 'exams'] : ['lessons', 'exercises']);
                cats.forEach(cat => {
                    let links = branch.categories[cat] || []; let conf = catConfig[cat];
                    links.forEach((lnk, lIdx) => {
                        if(lnk.title.toLowerCase().includes(query) || branch.title.toLowerCase().includes(query)) {
                            found = true; let linkId = `${branch.id}_${cat}_${lIdx}`; let isRead = clickedLinks.includes(linkId);
                            html += `
                            <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:shadow-md">
                                <div>
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-xs font-black bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400 px-2 py-1 rounded">${branch.title}</span>
                                        <span class="text-xs font-black bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 px-2 py-1 rounded flex items-center gap-1">${conf.icon} ${conf.title}</span>
                                    </div>
                                    <h4 class="font-bold text-slate-800 dark:text-white text-lg">${lnk.title}</h4>
                                </div>
                                <div class="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                    ${isRead ? `<span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-black px-3 py-1.5 rounded-lg flex items-center gap-1"><i class="ph-bold ph-check"></i> مكتمل</span>` : ''}
                                    <button onclick="trackLinkClick('${branch.id}', '${cat}', ${lIdx}, '${lnk.url}')" aria-label="مشاهدة المحتوى" class="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-black shadow-sm transition flex items-center gap-2 text-sm whitespace-nowrap">مشاهدة <i class="ph-bold ph-arrow-left"></i></button>
                                </div>
                            </div>`;
                        }
                    });
                });
            });
        }
    }));
    if (!found) { html += `<div class="text-center p-8 opacity-60"><i class="ph-fill ph-magnifying-glass text-6xl text-slate-400 mb-3"></i><h4 class="text-lg font-bold text-slate-500">لا توجد نتائج مطابقة لبحثك في مستواك.</h4></div>`; }
    html += `</div></div>`; container.innerHTML = html;
};

export const switchStudentTab = (branchId) => { 
    window.studentActiveBranchTab = branchId; 
    document.getElementById('lesson-search').value = ''; 
    window.renderProgramUI(window.currentSections, 'student-program-view', false); 
};

export const returnToStudentGrid = () => {
    window.studentActiveBranchTab = null;
    document.getElementById('lesson-search').value = ''; 
    window.renderProgramUI(window.currentSections, 'student-program-view', false);
};

export const renderLeaderboard = () => {
    if(!window.currentUserRecord || window.currentUserRecord.role === 'admin') return;
    const container = document.getElementById('leaderboard-container');
    container.innerHTML = '';
    
    let levelMates = window.allStudentsProgress.filter(s => s.level === window.currentUserRecord.level && s.approved).sort((a, b) => b.xp - a.xp);
    if(levelMates.length === 0) { container.innerHTML = `<div class="flex flex-col items-center justify-center p-6 opacity-50"><i class="ph-fill ph-ghost text-5xl mb-2"></i><div class="text-slate-500 dark:text-slate-400 font-bold text-center">لا يوجد منافسون بعد.. كن أنت المتصدر!</div></div>`; return; }

    let html = '<div class="flex flex-col gap-2">';
    levelMates.forEach((student, index) => {
        let rank = index + 1; let rankClass = ''; let medal = '';
        if(rank === 1) { rankClass = 'rank-1 shadow-sm'; medal = '<i class="ph-fill ph-medal text-amber-400"></i>'; }
        else if(rank === 2) { rankClass = 'rank-2 shadow-sm'; medal = '<i class="ph-fill ph-medal text-slate-400"></i>'; }
        else if(rank === 3) { rankClass = 'rank-3 shadow-sm'; medal = '<i class="ph-fill ph-medal text-orange-400"></i>'; }
        else { rankClass = 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700'; medal = `<span class="text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-black">${rank}</span>`; }
        let isMe = student.id === window.currentUserRecord.username;
        html += `
            <div class="leaderboard-row flex items-center justify-between p-3 rounded-2xl ${rankClass} ${isMe ? 'ring-2 ring-blue-500 shadow-md scale-[1.02] z-10' : ''}">
                <div class="flex items-center gap-3">
                    <div class="text-2xl w-6 flex justify-center">${medal}</div>
                    <div class="text-slate-700 dark:text-slate-200 font-bold text-sm ${isMe ? 'text-blue-700 dark:text-blue-400 font-black' : ''}">${isMe ? 'أنت (بطل المنصة)' : student.id}</div>
                </div>
                <div class="bg-gradient-to-r from-emerald-400 to-teal-500 text-white px-3 py-1 rounded-lg text-xs font-black shadow-inner flex items-center gap-1">${student.xp} XP</div>
            </div>`;
    });
    html += '</div>'; container.innerHTML = html;
};

export const renderProgramUI = (sections, containerId, isAdmin) => {
    if(!sections) return; window.currentSections = sections; let html = '';
    let clickedLinks = (!isAdmin && window.currentUserRecord) ? (window.currentUserRecord.clickedLinks || []) : [];
    let userLevel = (!isAdmin && window.currentUserRecord) ? window.currentUserRecord.level : null;

    if (!isAdmin && userLevel) {
        let userYearData = null; sections.forEach(p => p.years.forEach(y => { if (y.id === userLevel) userYearData = y; }));
        if (userYearData && userYearData.branches && userYearData.branches.length > 0) {
            
            // الحالة الأولى للتلميذ: عرض البطاقات الشبكية
            if (!window.studentActiveBranchTab) {
                html += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeInTab_0.3s_ease]">`;
                
                userYearData.branches.forEach(branch => {
                    let branchLinksTotal = 0; let branchLinksClicked = 0;
                    let cats = branch.id === 'm4_b5' ? ['past_exams', 'mock_exams'] : (branch.id.includes('_s') ? ['terms', 'exams'] : ['lessons', 'exercises']);
                    
                    cats.forEach(cat => {
                        let links = branch.categories[cat] || []; branchLinksTotal += links.length;
                        links.forEach((_, lIdx) => { if(clickedLinks.includes(`${branch.id}_${cat}_${lIdx}`)) branchLinksClicked++; });
                    });
                    let unitProg = branchLinksTotal === 0 ? 0 : Math.round((branchLinksClicked / branchLinksTotal) * 100);
                    let isComp = branchLinksTotal > 0 && unitProg === 100;
                    
                    html += `
                        <div onclick="switchStudentTab('${branch.id}')" class="group cursor-pointer bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full relative overflow-hidden interactive-card ${isComp ? 'ring-2 ring-emerald-400' : ''}">
                            <div class="flex items-center gap-4 mb-6">
                                <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-blue-100 dark:border-blue-800">
                                    ${getBranchIcon(branch.title)}
                                </div>
                                <h3 class="font-black text-xl text-slate-800 dark:text-white leading-tight flex-1">${branch.title}</h3>
                                ${isComp ? `<div class="absolute top-4 left-4 bg-emerald-100 text-emerald-600 p-1.5 rounded-full"><i class="ph-bold ph-check text-lg"></i></div>` : ''}
                            </div>
                            <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div class="flex justify-between items-center mb-2">
                                    <span class="text-xs font-bold text-slate-500 dark:text-slate-400">نسبة الإنجاز</span>
                                    <span class="text-sm font-black ${isComp ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">${unitProg}%</span>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden shadow-inner">
                                    <div class="bg-gradient-to-r ${isComp ? 'from-emerald-400 to-teal-500' : 'from-blue-500 to-indigo-500'} h-full transition-all duration-700" style="width: ${unitProg}%"></div>
                                </div>
                            </div>
                        </div>
                    `;
                });
                html += `</div>`;
            } 
            // الحالة الثانية للتلميذ: عرض محتوى الوحدة المختارة
            else {
                let branch = userYearData.branches.find(b => b.id === window.studentActiveBranchTab);
                if (branch) {
                    html += `
                        <div class="mb-6 flex justify-start animate-[fadeInTab_0.3s_ease]">
                            <button onclick="returnToStudentGrid()" class="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 font-black text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-x-1">
                                <i class="ph-bold ph-arrow-right text-lg"></i> العودة للوحدات
                            </button>
                        </div>
                    `;

                    let branchLinksTotal = 0; let branchLinksClicked = 0;
                    let cats = branch.id === 'm4_b5' ? ['past_exams', 'mock_exams'] : (branch.id.includes('_s') ? ['terms', 'exams'] : ['lessons', 'exercises']);
                    
                    cats.forEach(cat => {
                        let links = branch.categories[cat] || []; branchLinksTotal += links.length;
                        links.forEach((_, lIdx) => { if(clickedLinks.includes(`${branch.id}_${cat}_${lIdx}`)) branchLinksClicked++; });
                    });
                    let unitProg = branchLinksTotal === 0 ? 0 : Math.round((branchLinksClicked / branchLinksTotal) * 100);
                    let isComp = branchLinksTotal > 0 && unitProg === 100;
                    let cardCls = isComp ? 'border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90';
                    let gridCols = 'grid-cols-1 md:grid-cols-2';

                    html += `
                    <div class="student-branch-wrapper rounded-[2.5rem] shadow-xl border-2 overflow-hidden interactive-card backdrop-blur-xl ${cardCls} animate-[fadeInTab_0.3s_ease]">
                        <div class="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                            <div class="flex items-center gap-5">
                                <div class="w-20 h-20 rounded-3xl bg-white dark:bg-slate-700 shadow-inner border border-slate-100 dark:border-slate-600 flex items-center justify-center text-5xl relative text-blue-600 dark:text-amber-400">
                                    ${getBranchIcon(branch.title)}
                                    ${isComp ? `<div class="absolute -top-2 -right-2 bg-emerald-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shadow-md border-2 border-white dark:border-slate-800"><i class="ph-bold ph-check"></i></div>` : ''}
                                </div>
                                <div>
                                    <h3 class="branch-title text-3xl font-black text-slate-800 dark:text-white">${branch.title}</h3>
                                    <p class="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">تفاصيل ومحتوى هذه الوحدة</p>
                                </div>
                            </div>
                            <div class="w-full md:w-72 bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                <div class="flex items-center justify-between mb-2">
                                    <span class="text-xs font-black text-slate-500 dark:text-slate-400">إنجازك هنا</span>
                                    <span class="text-sm font-black ${isComp ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}">${unitProg}%</span>
                                </div>
                                <div class="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-inner">
                                    <div class="${isComp ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'} h-full transition-all duration-700" style="width: ${unitProg}%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-900/80">
                            <div class="grid ${gridCols} gap-6">`;

                    cats.forEach(cat => {
                        let links = branch.categories[cat] || []; let conf = catConfig[cat];
                        let linksList = links.length ? links.map((lnk, lIdx) => {
                            let linkId = `${branch.id}_${cat}_${lIdx}`; let isRead = clickedLinks.includes(linkId);
                            return `<button onclick="trackLinkClick('${branch.id}', '${cat}', ${lIdx}, '${lnk.url}')" aria-label="مشاهدة المحتوى" class="lesson-item w-full flex items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl border ${isRead ? 'border-emerald-200 dark:border-emerald-800 shadow-sm' : 'border-slate-100 dark:border-slate-700'} hover:shadow-md transition group/link relative overflow-hidden text-right">
                                <div class="flex items-start sm:items-center gap-3 flex-1 w-full">
                                    <div class="w-12 h-12 flex-shrink-0 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl group-hover/link:bg-blue-600 group-hover/link:text-white transition shadow-inner mt-1 sm:mt-0">
                                        <i class="ph-bold ph-play"></i>
                                    </div>
                                    <span class="${conf.text} font-bold text-sm flex-1 leading-relaxed text-right group-hover/link:underline decoration-2 underline-offset-4 break-words" style="word-break: break-word; white-space: normal;">${lnk.title}</span>
                                </div>
                                ${isRead ? `<span class="bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 text-xs font-black px-3 py-1.5 rounded-lg flex items-center flex-shrink-0 gap-1 ml-1 shadow-sm"><i class="ph-bold ph-check"></i> مكتمل</span>` : ''}
                            </button>`;
                        }).join('') : getEmptyStateHTML(conf.title);
                        
                        html += `<div class="${conf.bg} ${conf.border} p-6 rounded-[2rem] border shadow-sm"><h5 class="font-black ${conf.text} text-xl mb-5 flex items-center gap-2">${conf.icon} ${conf.title}</h5><div class="space-y-3">${linksList}</div></div>`;
                    });
                    html += `</div></div></div>`; 
                }
            }
        } else { 
            html += `<div class="text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm"><h3 class="text-xl font-bold text-slate-500 dark:text-slate-400">لا يوجد محتوى متاح لمستواك حالياً</h3></div>`; 
        }
    } else {
        
        sections.forEach((part, pIdx) => {
            let pColor = part.color === 'blue' ? 'blue' : 'indigo';
            html += `<div id="content-${part.id}" class="admin-part-content tab-content ${window.adminActivePart === part.id ? 'active' : ''}">`;
            
            // 1. أزرار تبويبات السنوات
            html += `<div class="flex flex-wrap gap-2 mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">`;
            part.years.forEach((year, yIdx) => {
                if(window.adminActiveYear[part.id] === undefined && yIdx === 0) window.adminActiveYear[part.id] = year.id;
                let isActive = window.adminActiveYear[part.id] === year.id;
                let btnCls = isActive ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400';
                html += `<button id="btn-${part.id}-${year.id}" onclick="switchAdminYear('${part.id}', '${year.id}')" class="admin-year-btn-${part.id} whitespace-nowrap px-4 py-3 font-black text-sm transition-all border-b-4 ${btnCls}">${year.title}</button>`;
            });
            html += `</div>`;

            // 2. محتوى كل سنة
            part.years.forEach((year, yIdx) => {
                let isYearActive = window.adminActiveYear[part.id] === year.id;
                html += `<div id="content-${part.id}-${year.id}" class="admin-year-content-${part.id} animate-[fadeInTab_0.3s_ease] ${isYearActive ? '' : 'hidden'}">`;
                
                if (year.branches && year.branches.length > 0) {
                    let activeBranch = window.adminActiveBranch[year.id];
                    
                    // الحالة الأولى للأستاذ: عرض البطاقات (Grid Cards)
                    if (!activeBranch) {
                        html += `<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-[fadeInTab_0.3s_ease]">`;
                        year.branches.forEach(branch => {
                            html += `
                            <div onclick="switchAdminBranch('${year.id}', '${branch.id}')" class="group cursor-pointer bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700 flex flex-col h-full relative overflow-hidden interactive-card">
                                <div class="flex items-center gap-4 mb-6">
                                    <div class="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-900/50 text-${pColor}-600 dark:text-${pColor}-400 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner border border-slate-100 dark:border-slate-800">
                                        ${getBranchIcon(branch.title)}
                                    </div>
                                    <h3 class="font-black text-xl text-slate-800 dark:text-white leading-tight flex-1">${branch.title}</h3>
                                </div>
                                <div class="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-slate-500 dark:text-slate-400">
                                    <span class="text-sm font-bold">إدارة المحتوى والمرفقات</span>
                                    <div class="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <i class="ph-bold ph-arrow-left"></i>
                                    </div>
                                </div>
                            </div>`;
                        });
                        html += `</div>`;
                    } 
                    // الحالة الثانية للأستاذ: عرض تفاصيل الوحدة للتعديل والإضافة
                    else {
                        let branch = year.branches.find(b => b.id === activeBranch);
                        let bIdx = year.branches.findIndex(b => b.id === activeBranch);
                        let cats = branch.id === 'm4_b5' ? ['past_exams', 'mock_exams'] : (branch.id.includes('_s') ? ['terms', 'exams'] : ['lessons', 'exercises']);
                        
                        html += `
                        <div class="mb-6 flex justify-start animate-[fadeInTab_0.3s_ease]">
                            <button onclick="returnToAdminGrid('${year.id}')" class="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 font-black text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-x-1">
                                <i class="ph-bold ph-arrow-right text-lg"></i> العودة للوحدات
                            </button>
                        </div>
                        
                        <div class="student-branch-wrapper rounded-[2.5rem] shadow-xl border-2 overflow-hidden interactive-card backdrop-blur-xl border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 animate-[fadeInTab_0.3s_ease]">
                            <div class="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50">
                                <div class="flex items-center gap-5">
                                    <div class="w-20 h-20 rounded-3xl bg-white dark:bg-slate-700 shadow-inner border border-slate-100 dark:border-slate-600 flex items-center justify-center text-5xl relative text-${pColor}-600 dark:text-${pColor}-400">
                                        ${getBranchIcon(branch.title)}
                                    </div>
                                    <div>
                                        <h3 class="branch-title text-3xl font-black text-slate-800 dark:text-white">${branch.title}</h3>
                                        <p class="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">تعديل، إضافة أو مسح محتوى الوحدة</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="p-6 md:p-8 bg-slate-50/80 dark:bg-slate-900/80">
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">`;
                        
                        cats.forEach(cat => {
                            let links = branch.categories[cat] || []; let conf = catConfig[cat];
                            let linksList = links.length ? links.map((lnk, lIdx) => `
                            <div class="flex justify-between items-center bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm text-sm mb-2 group interactive-card hover:shadow-md transition">
                                <a href="${lnk.url}" target="_blank" class="${conf.text} font-bold flex-1 leading-relaxed text-right hover:underline flex items-start sm:items-center gap-2 break-words" style="word-break: break-word; white-space: normal;">
                                    <div class="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1 sm:mt-0"><i class="ph-bold ph-link text-lg opacity-70"></i></div>
                                    <span class="flex-1">${lnk.title}</span>
                                </a>
                                <div class="flex gap-1 flex-shrink-0 mr-3">
                                    <button onclick="adminEditLinkModal(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', ${lIdx})" aria-label="تعديل الرابط" class="text-slate-400 hover:text-amber-500 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg transition" title="تعديل"><i class="ph-bold ph-pencil"></i></button>
                                    <button onclick="adminDeleteLink(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', ${lIdx})" aria-label="حذف الرابط" class="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-700 p-2 rounded-lg transition" title="مسح"><i class="ph-bold ph-trash"></i></button>
                                </div>
                            </div>`).join('') : getEmptyStateHTML('محتوى');
                            
                            html += `
                                <div class="${conf.bg} ${conf.border} p-6 rounded-[2rem] border flex flex-col h-full shadow-sm">
                                    <h5 class="font-black ${conf.text} text-lg mb-4 flex items-center gap-2">${conf.icon} ${conf.title}</h5>
                                    <div class="mb-2 max-h-60 overflow-y-auto pr-1 scroll-smooth flex-1 space-y-2">${linksList}</div>
                                    <div class="mt-4 pt-5 border-t border-slate-200/60 dark:border-slate-700/60 space-y-3 mt-auto">
                                        <div class="relative">
                                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400"><i class="ph-bold ph-text-t"></i></div>
                                            <input type="text" id="title_${branch.id}_${cat}" aria-label="عنوان المحتوى" class="w-full text-sm font-bold pl-3 pr-10 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 bg-white dark:bg-slate-900 text-slate-700 dark:text-white transition-all shadow-sm" placeholder="عنوان المحتوى...">
                                        </div>
                                        <div class="relative">
                                            <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400"><i class="ph-bold ph-link"></i></div>
                                            <input type="text" id="url_${branch.id}_${cat}" aria-label="رابط المحتوى" class="w-full text-sm pl-3 pr-10 py-3 border-2 border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-blue-400 bg-white dark:bg-slate-900 text-slate-600 dark:text-white text-left font-bold transition-all shadow-sm" dir="ltr" placeholder="https://...">
                                        </div>
                                        <button onclick="adminAddLink(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', '${branch.id}')" aria-label="إضافة" class="w-full bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-700 text-white text-sm font-black py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-md"><i class="ph-bold ph-plus"></i> إضافة إلى القائمة</button>
                                    </div>
                                </div>`;
                        });
                        html += `</div></div></div>`;
                    }
                }
                html += `</div>`; 
            });
            html += `</div>`; 
        });
    }
    document.getElementById(containerId).innerHTML = html;
};
