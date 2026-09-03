import { db, usersCol } from '../config/firebase.js';
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const calculateProgressXP = (userLevel, userData, sections) => {
    let xp = 0; let totalLinks = 0; let clickedLinks = userData.clickedLinks || [];
    if (!sections || !Array.isArray(sections)) return { xp: 0, percent: 0 };
    
    sections.forEach(p => {
        if(p.years && Array.isArray(p.years)) {
            p.years.forEach(y => {
                if (y.id === userLevel && y.branches) {
                    y.branches.forEach(b => {
                        if(b.categories) {
                            Object.values(b.categories).forEach(cat => {
                                if(Array.isArray(cat)) {
                                    totalLinks += cat.length;
                                    cat.forEach(l => { if (clickedLinks.includes(l.url)) xp += 10; });
                                }
                            });
                        }
                    });
                }
            });
        }
    });
    
    let maxXP = totalLinks * 10;
    let percent = maxXP > 0 ? Math.round((xp / maxXP) * 100) : 0;
    return { xp, percent, maxXP };
};

export const updateProgressUI = (sections) => {
    if (!window.currentUserRecord || window.currentUserRecord.role === 'admin') return;
    let prog = calculateProgressXP(window.currentUserRecord.level, window.currentUserRecord, sections);
    const xpText = document.getElementById('progress-text-xp');
    const barFill = document.getElementById('progress-bar-fill');
    if (xpText) xpText.innerText = prog.xp;
    if (barFill) barFill.style.width = `${prog.percent}%`;
};

export const handleStudentLinkClick = async (url) => {
    if (window.originalAdminRecord) return; 
    let clicked = window.currentUserRecord.clickedLinks || [];
    
    if (!clicked.includes(url)) {
        clicked.push(url);
        window.currentUserRecord.clickedLinks = clicked;
        try {
            await updateDoc(doc(usersCol, window.currentUserRecord.username), { clickedLinks: clicked });
            updateProgressUI(window.currentSections);
            renderProgramUI(window.currentSections, 'student-program-view', false);
        } catch(e) { console.error("Error updating XP", e); }
    }
};

export const renderProgramUI = (sections, containerId, isAdmin = false) => {
    const container = document.getElementById(containerId);
    if (!container || !sections || !Array.isArray(sections)) return;
    let html = '';

    // ==========================================
    // واجهة التلميذ
    // ==========================================
    if (!isAdmin) {
        const userLevel = window.currentUserRecord?.level || '';
        let currentYear = null, pColor = 'blue';
        
        sections.forEach(p => p.years.forEach(y => {
            if(y.id === userLevel) { currentYear = y; pColor = p.color; }
        }));
        
        if (!currentYear) {
            container.innerHTML = `<div class="text-center p-10 font-bold text-slate-500 bg-white dark:bg-slate-800 rounded-3xl">مستواك الدراسي غير متوفر.</div>`;
            return;
        }

        let clickedLinks = window.currentUserRecord?.clickedLinks || [];
        
        if (!window.studentActiveBranchTab) {
            html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 animate-[fadeInTab_0.3s_ease]">`;
            currentYear.branches.forEach(branch => {
                let tLinks = 0; let cLinks = 0;
                Object.values(branch.categories).forEach(cat => {
                    tLinks += cat.length;
                    cat.forEach(l => { if(clickedLinks.includes(l.url)) cLinks++; });
                });
                let pcent = tLinks > 0 ? Math.round((cLinks/tLinks)*100) : 0;
                
                html += `
                <div onclick="window.studentActiveBranchTab = '${branch.id}'; window.renderProgramUI(window.currentSections, 'student-program-view', false);" class="group cursor-pointer bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700 relative overflow-hidden interactive-card">
                    <div class="absolute inset-0 bg-gradient-to-br from-${pColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div class="w-16 h-16 mb-5 bg-${pColor}-50 dark:bg-${pColor}-900/30 text-${pColor}-600 dark:text-${pColor}-400 rounded-2xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:bg-${pColor}-600 group-hover:text-white transition-all"><i class="ph-fill ph-folder"></i></div>
                    <h4 class="font-black text-xl text-slate-800 dark:text-white mb-2">${branch.title}</h4>
                    <div class="flex items-center justify-between text-sm mt-5">
                        <span class="font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1 rounded-lg">إنجاز: ${pcent}%</span>
                        <span class="text-${pColor}-600 dark:text-${pColor}-400 font-bold group-hover:-translate-x-1 transition-transform">تصفح <i class="ph-bold ph-arrow-left"></i></span>
                    </div>
                </div>`;
            });
            html += `</div>`;
        } 
        else {
            let branch = currentYear.branches.find(b => b.id === window.studentActiveBranchTab);
            html += `
            <div class="mb-6 flex justify-start animate-[fadeInTab_0.3s_ease]">
                <button onclick="window.studentActiveBranchTab = null; window.renderProgramUI(window.currentSections, 'student-program-view', false);" class="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm hover:shadow-md border border-slate-200 dark:border-slate-700 font-black text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:-translate-x-1">
                    <i class="ph-bold ph-arrow-right text-lg"></i> العودة للوحدات
                </button>
            </div>
            <div class="bg-white/50 dark:bg-slate-900/50 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 animate-[fadeInTab_0.3s_ease]">
                <h3 class="text-3xl font-black text-slate-800 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-700 pb-5 flex items-center gap-4"><i class="ph-fill ph-folder-open text-${pColor}-500 text-4xl"></i> ${branch.title}</h3>
            `;
            
            const catNames = { 'lessons': 'الدروس', 'exercises': 'التمارين', 'terms': 'المصطلحات', 'exams': 'الاختبارات', 'past_exams': 'مواضيع الشهادات', 'mock_exams': 'مواضيع مقترحة' };
            Object.keys(branch.categories).forEach(cat => {
                let links = branch.categories[cat];
                if (links.length > 0) {
                    html += `
                    <div class="mb-8 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-700">
                        <h4 class="font-black text-xl text-${pColor}-700 dark:text-${pColor}-400 mb-5 flex items-center gap-2"><i class="ph-fill ph-bookmark-simple"></i> ${catNames[cat] || cat}</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
                    links.forEach(l => {
                        let isDone = clickedLinks.includes(l.url);
                        let bg = isDone ? `bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-400` : `bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-${pColor}-300 hover:shadow-md`;
                        let icon = isDone ? `<i class="ph-fill ph-check-circle text-emerald-500 text-3xl"></i>` : `<i class="ph-fill ph-play-circle text-${pColor}-500 text-3xl group-hover:scale-110 transition"></i>`;
                        
                        html += `
                        <a href="${l.url}" target="_blank" onclick="window.handleStudentLinkClick('${l.url}')" class="flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 group ${bg}">
                            ${icon}
                            <span class="font-bold text-sm truncate flex-1">${l.title}</span>
                            ${isDone ? `<span class="text-[10px] bg-emerald-100 dark:bg-emerald-900/50 px-2 py-1.5 rounded-lg font-black text-emerald-700 dark:text-emerald-400">+10 XP</span>` : ''}
                        </a>`;
                    });
                    html += `</div></div>`;
                }
            });
            html += `</div>`;
        }
    } 
    // ==========================================
    // واجهة الأستاذ (عزل تام للطور)
    // ==========================================
    else {
        if (!window.adminActivePart) return; // لا تبني شيئاً إذا لم يحدد الأستاذ طوراً
        
        const activePartObj = sections.find(p => p.id === window.adminActivePart);
        if (!activePartObj) return;

        let pColor = activePartObj.color === 'blue' ? 'blue' : 'indigo';
        const pIdx = sections.findIndex(p => p.id === window.adminActivePart);
        
        let currentActiveYear = window.adminActiveYear[activePartObj.id] || activePartObj.years[0].id;
        let activeBranchId = window.adminActiveBranch[currentActiveYear];

        html += `<div class="block animate-[fadeInTab_0.3s_ease]">`;
        
        if (!activeBranchId) {
            // شاشة اختيار السنة للطور المحدد
            html += `<div class="flex flex-wrap gap-3 mb-8">`;
            activePartObj.years.forEach((year) => {
                let isYActive = currentActiveYear === year.id;
                let activeClasses = isYActive ? `bg-${pColor}-600 text-white shadow-lg shadow-${pColor}-500/30 scale-105 border-transparent` : `bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700`;
                html += `<button onclick="window.switchAdminYear('${activePartObj.id}', '${year.id}')" class="px-6 py-3 rounded-2xl font-black text-sm border-2 transition-all duration-300 ${activeClasses}">${year.title}</button>`;
            });
            html += `</div>`;
            
            // بطاقات الوحدات للسنة المحددة
            let yearObj = activePartObj.years.find(y => y.id === currentActiveYear);
            if (yearObj) {
                html += `<div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">`;
                yearObj.branches.forEach((branch) => {
                    html += `
                    <div onclick="window.switchAdminBranch('${yearObj.id}', '${branch.id}')" class="group cursor-pointer bg-white dark:bg-slate-800 rounded-[2rem] p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-slate-100 dark:border-slate-700 text-center interactive-card relative overflow-hidden">
                        <div class="absolute inset-0 bg-gradient-to-br from-${pColor}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div class="w-20 h-20 mx-auto mb-5 bg-${pColor}-50 dark:bg-${pColor}-900/30 text-${pColor}-600 dark:text-${pColor}-400 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:scale-110 group-hover:bg-${pColor}-600 group-hover:text-white transition-all"><i class="ph-fill ph-folder"></i></div>
                        <h4 class="font-black text-xl text-slate-800 dark:text-white mb-2">${branch.title}</h4>
                        <div class="text-${pColor}-600 dark:text-${pColor}-400 font-bold text-sm mt-4 flex items-center justify-center gap-2 opacity-80 group-hover:opacity-100">إدارة الدروس <i class="ph-bold ph-arrow-left"></i></div>
                    </div>`;
                });
                html += `</div>`;
            }
        } 
        else {
            // شاشة إدارة الروابط داخل الوحدة
            let yearObj = activePartObj.years.find(y => y.id === currentActiveYear);
            let branchObj = yearObj.branches.find(b => b.id === activeBranchId);
            let bIdx = yearObj.branches.findIndex(b => b.id === activeBranchId);
            let yIdx = activePartObj.years.findIndex(y => y.id === currentActiveYear);

            html += `
            <div class="mb-6 flex justify-start animate-[fadeInTab_0.3s_ease]">
                <button onclick="window.returnToAdminGrid('${yearObj.id}')" class="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 font-black text-sm transition-all hover:bg-slate-50 hover:-translate-x-1">
                    <i class="ph-bold ph-arrow-right text-lg"></i> العودة لوحدات (${yearObj.title})
                </button>
            </div>
            
            <div class="bg-slate-50/50 dark:bg-slate-900/50 p-6 md:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 animate-[fadeInTab_0.3s_ease]">
                <h4 class="text-3xl font-black text-slate-800 dark:text-white mb-8 border-b border-slate-200 dark:border-slate-700 pb-5 flex items-center gap-4">
                    <div class="w-14 h-14 bg-${pColor}-100 dark:bg-${pColor}-900/50 text-${pColor}-600 dark:text-${pColor}-400 rounded-2xl flex items-center justify-center text-3xl shadow-inner"><i class="ph-fill ph-folder-open"></i></div>
                    ${branchObj.title}
                </h4>`;

            const catNames = { 'lessons': 'الدروس', 'exercises': 'التمارين', 'terms': 'المصطلحات', 'exams': 'الاختبارات', 'past_exams': 'مواضيع الشهادات', 'mock_exams': 'مواضيع مقترحة' };
            Object.keys(branchObj.categories).forEach(cat => {
                html += `
                <div class="mb-8 bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700">
                    <h5 class="font-black text-xl text-${pColor}-700 dark:text-${pColor}-400 mb-5 flex items-center gap-2"><i class="ph-fill ph-bookmark-simple"></i> ${catNames[cat] || cat}</h5>
                    
                    <div class="flex flex-col md:flex-row gap-4 mb-6 p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
                        <input type="text" id="title_${branchObj.id}_${cat}" class="flex-1 p-4 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-${pColor}-500 bg-white dark:bg-slate-800 font-bold dark:text-white text-base transition" placeholder="عنوان المحتوى">
                        <input type="text" id="url_${branchObj.id}_${cat}" class="flex-1 p-4 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:border-${pColor}-500 text-left bg-white dark:bg-slate-800 font-bold dark:text-white text-base transition" dir="ltr" placeholder="رابط الملف (http...)">
                        <button onclick="window.adminAddLink(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', '${branchObj.id}')" class="bg-${pColor}-600 hover:bg-${pColor}-700 text-white font-black px-8 py-4 rounded-xl transition-all shadow-md flex items-center gap-2 hover:scale-105"><i class="ph-bold ph-plus text-xl"></i> إضافة المحتوى</button>
                    </div>
                    <div class="space-y-3">`;
                
                branchObj.categories[cat].forEach((link, lIdx) => {
                    html += `
                        <div class="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 dark:bg-slate-900/50 dark:hover:bg-slate-900/80 rounded-2xl border border-slate-100 dark:border-slate-700 transition-all group">
                            <a href="${link.url}" target="_blank" class="font-bold text-slate-700 dark:text-slate-300 hover:text-${pColor}-600 flex items-center gap-3 truncate max-w-[70%] text-base"><i class="ph-fill ph-link text-${pColor}-500 text-xl bg-${pColor}-50 dark:bg-${pColor}-900/30 p-2 rounded-lg"></i> ${link.title}</a>
                            <div class="flex gap-2">
                                <button onclick="window.adminEditLinkModal(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', ${lIdx})" class="text-amber-500 bg-amber-50 hover:bg-amber-100 p-3 rounded-xl transition border border-amber-100 shadow-sm dark:bg-amber-900/20 dark:border-amber-800/50" title="تعديل"><i class="ph-bold ph-pencil-simple text-xl"></i></button>
                                <button onclick="window.adminDeleteLink(${pIdx}, ${yIdx}, ${bIdx}, '${cat}', ${lIdx})" class="text-red-500 bg-red-50 hover:bg-red-100 p-3 rounded-xl transition border border-red-100 shadow-sm dark:bg-red-900/20 dark:border-red-800/50" title="حذف"><i class="ph-bold ph-trash text-xl"></i></button>
                            </div>
                        </div>`;
                });
                
                if (branchObj.categories[cat].length === 0) {
                    html += `<div class="text-sm font-bold text-slate-400 dark:text-slate-500 text-center p-8 bg-slate-50/50 dark:bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center gap-3"><i class="ph-fill ph-empty text-4xl opacity-50"></i> لا يوجد محتوى مضاف هنا بعد</div>`;
                }
                
                html += `</div></div>`;
            });
            
            html += `</div>`;
        }
        html += `</div>`;
    }
    
    container.innerHTML = html;
};

export const executeStudentSearch = () => {
    let input = document.getElementById('lesson-search').value.trim().toLowerCase();
    let container = document.getElementById('student-program-view');
    if (!input) { renderProgramUI(window.currentSections, 'student-program-view', false); return; }
    
    let userLevel = window.currentUserRecord?.level || '';
    let currentYear = null, pColor = 'blue';
    window.currentSections.forEach(p => p.years.forEach(y => { if(y.id === userLevel) { currentYear = y; pColor = p.color; } }));
    if(!currentYear) return;

    let resultsHtml = `<div class="mb-5 text-slate-500 font-bold text-sm bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">نتائج البحث عن: <span class="text-${pColor}-600">"${input}"</span></div><div class="grid grid-cols-1 md:grid-cols-2 gap-4">`;
    let found = false;
    let clickedLinks = window.currentUserRecord?.clickedLinks || [];

    currentYear.branches.forEach(branch => {
        Object.values(branch.categories).forEach(cat => {
            cat.forEach(l => {
                if (l.title.toLowerCase().includes(input) || branch.title.toLowerCase().includes(input)) {
                    found = true;
                    let isDone = clickedLinks.includes(l.url);
                    let bg = isDone ? `bg-emerald-50 border-emerald-200 dark:bg-emerald-900/20` : `bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-${pColor}-300`;
                    let icon = isDone ? `<i class="ph-fill ph-check-circle text-emerald-500 text-3xl"></i>` : `<i class="ph-fill ph-play-circle text-${pColor}-500 text-3xl group-hover:scale-110 transition"></i>`;
                    
                    resultsHtml += `
                    <a href="${l.url}" target="_blank" onclick="window.handleStudentLinkClick('${l.url}')" class="flex items-center p-4 rounded-2xl border shadow-sm transition-all duration-300 group ${bg}">
                        <div class="mr-4 flex-shrink-0">${icon}</div>
                        <div class="flex-1 min-w-0">
                            <div class="font-black text-slate-800 dark:text-white truncate text-base mb-1">${l.title}</div>
                            <div class="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-900 dark:text-slate-400 px-2 py-1 rounded inline-block">في وحدة: ${branch.title}</div>
                        </div>
                    </a>`;
                }
            });
        });
    });
    
    if (!found) resultsHtml += `<div class="col-span-full text-center p-12 bg-white dark:bg-slate-800 rounded-3xl border shadow-sm"><div class="font-bold text-slate-500">لم يتم العثور على نتائج.</div></div>`;
    resultsHtml += `</div>`;
    container.innerHTML = resultsHtml;
};

export const renderLeaderboard = () => {
    const container = document.getElementById('leaderboard-container');
    if (!container || !window.allStudentsProgress || !window.currentUserRecord || window.currentUserRecord.role === 'admin') return;
    
    const myLevel = window.currentUserRecord.level;
    let studentsInMyLevel = window.allStudentsProgress.filter(s => s.level === myLevel && s.approved).sort((a, b) => b.xp - a.xp);
    
    if (studentsInMyLevel.length === 0) {
        container.innerHTML = `<div class="text-center text-sm font-bold text-slate-500 p-4">لا يوجد متفوقين حالياً.</div>`;
        return;
    }

    let html = '<div class="flex flex-col gap-3">';
    studentsInMyLevel.forEach((st, idx) => {
        let isMe = st.id === window.currentUserRecord.username;
        let rankClass = ''; let icon = '';
        if (idx === 0) { rankClass = 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 shadow-md'; icon = '🥇'; }
        else if (idx === 1) { rankClass = 'bg-slate-100 border-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-300 shadow-sm'; icon = '🥈'; }
        else if (idx === 2) { rankClass = 'bg-orange-50 border-orange-300 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400 shadow-sm'; icon = '🥉'; }
        else { rankClass = 'bg-white border-slate-100 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'; icon = `<span class="text-xs font-black w-6 h-6 flex items-center justify-center bg-slate-200 dark:bg-slate-700 rounded-full">${idx + 1}</span>`; }
        
        if (isMe && idx > 0) rankClass += ' ring-2 ring-blue-500/50';

        html += `
        <div class="flex items-center justify-between p-3.5 rounded-2xl border ${rankClass} transition-all">
            <div class="flex items-center gap-3">
                <div class="text-2xl">${icon}</div>
                <span class="font-black text-sm ${isMe ? 'text-blue-600 dark:text-blue-400 text-base' : ''}">${st.id} ${isMe ? '(أنت)' : ''}</span>
            </div>
            <span class="font-black bg-white/60 dark:bg-black/30 px-3 py-1.5 rounded-xl text-sm shadow-inner">${st.xp} XP</span>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
};

export const renderStudentNotifications = (myUpdates, seenUpdates) => {
    const notifContainer = document.getElementById('student-notifications-container');
    const badge = document.getElementById('student-global-badge');
    if (!notifContainer || !badge) return;

    let unreadCount = 0;
    let notifHtml = '';

    [...myUpdates].reverse().forEach(u => {
        let isSeen = seenUpdates.includes(u.id);
        if (!isSeen) unreadCount++;
        notifHtml += `
        <div class="p-4 rounded-2xl border ${isSeen ? 'bg-slate-50 border-slate-100 dark:bg-slate-900/50 dark:border-slate-800 opacity-70' : 'bg-blue-50 border-blue-200 dark:bg-blue-900/30 dark:border-blue-800 shadow-sm'} mb-3 transition-all">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-800 dark:text-blue-300 flex items-center justify-center text-xl flex-shrink-0 shadow-inner"><i class="ph-fill ph-bell-ringing"></i></div>
                <div>
                    <div class="font-black text-sm text-slate-800 dark:text-white mb-1">${u.title}</div>
                    <div class="text-xs font-bold text-slate-500 bg-white/50 px-2 py-0.5 rounded inline-block mt-1 dark:bg-slate-900/50 dark:text-slate-400">وحدة: ${u.branch}</div>
                    ${!isSeen ? `<div class="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded font-black mt-2 inline-block shadow-sm">جديد</div>` : ''}
                </div>
            </div>
        </div>`;
    });

    if (myUpdates.length === 0) {
        notifContainer.innerHTML = '<div class="text-center text-slate-500 text-sm font-bold p-6">لا توجد إشعارات جديدة</div>';
    } else {
        notifContainer.innerHTML = notifHtml;
    }

    if (unreadCount > 0) {
        badge.innerText = unreadCount > 9 ? '9+' : unreadCount;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
};

export const markStudentNotificationsAsRead = () => {
    if (!window.currentUserRecord || window.currentUserRecord.role === 'admin' || !window.currentUpdates) return;
    let myUpdates = window.currentUpdates.filter(u => u.level === window.currentUserRecord.level);
    if (myUpdates.length === 0) return;
    
    let seenUpdates = JSON.parse(localStorage.getItem(`seen_updates_${window.currentUserRecord.username}`)) || [];
    let changed = false;
    
    myUpdates.forEach(u => { if (!seenUpdates.includes(u.id)) { seenUpdates.push(u.id); changed = true; } });
    
    if (changed) {
        localStorage.setItem(`seen_updates_${window.currentUserRecord.username}`, JSON.stringify(seenUpdates));
        const badge = document.getElementById('student-global-badge');
        if(badge) badge.classList.add('hidden');
        renderStudentNotifications(myUpdates, seenUpdates);
    }
};
