import { getIcon } from './icons.js';
import { state, saveTasks } from './state.js';

export function renderNav(subjects) {
    const container = document.getElementById('subject-nav');
    container.innerHTML = subjects.map(sub => `
        <li>
            <button 
                class="rounded-lg transition-all duration-300 subject-btn text-left p-3 flex items-center gap-3 text-base-content/70 group"
                data-id="${sub.id}">
                <span class="group-hover:text-primary transition-colors">
                    ${getIcon(sub.icon)}
                </span>
                <span class="font-medium flex-1 subject-name">${sub.name}</span>
                <span class="short-name">${sub.shortName || sub.name.substring(0, 2).toUpperCase()}</span>
            </button>
        </li>
    `).join('');

    const gradesHtml = `
        <div class="divider mt-2 mb-2"></div>
        <li>
            <button 
                class="rounded-lg transition-all duration-300 subject-btn text-left p-3 flex items-center gap-3 text-base-content/70 group"
                data-id="grades">
                <span class="group-hover:text-primary transition-colors">
                    ${getIcon('Star')}
                </span>
                <span class="font-medium flex-1 subject-name">Оцінки</span>
                <span class="short-name">ОЦ</span>
            </button>
        </li>
    `;
    container.innerHTML += gradesHtml;

    // Add event listeners that update the hash
    container.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = btn.dataset.id;
        });
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderHome(subjects, container) {
    container.innerHTML = `
        <div class="space-y-8 fade-in">
            <div class="text-center space-y-2">
                <h1 class="text-4xl font-bold tracking-tight text-base-content">Ласкаво просимо</h1>
                <p class="text-base-content/60">Оберіть дисципліну для перегляду матеріалів та завдань</p>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                ${subjects.map(sub => `
                    <div class="card bg-base-100 shadow-sm hover:shadow-md transition-all duration-300 border border-base-200 group cursor-pointer" 
                         onclick="window.location.hash='${sub.id}'">
                        <div class="card-body p-6 flex flex-row items-center gap-4">
                            <div class="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-content transition-colors">
                                ${getIcon(sub.icon)}
                            </div>
                            <div>
                                <h2 class="card-title text-base font-bold">${sub.name}</h2>
                                <p class="text-xs text-base-content/50">Перейти до вивчення</p>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    if (window.lucide) window.lucide.createIcons();
}

export function updateActiveNav(id) {
    document.querySelectorAll('.subject-btn').forEach(btn => {
        if (btn.dataset.id === id) {
            btn.classList.add('active', 'bg-primary', 'text-primary-content');
            btn.classList.remove('text-base-content/70');
        } else {
            btn.classList.remove('active', 'bg-primary', 'text-primary-content');
            btn.classList.add('text-base-content/70');
        }
    });
}

export function renderLayout(data, container, toggleTaskCallback) {
    container.innerHTML = '';

    if (data.tabs) {
        const tabsContainer = document.createElement('div');
        tabsContainer.role = 'tablist';
        tabsContainer.className = 'tabs tabs-boxed mb-6 bg-base-200/50 p-1 flex overflow-x-auto no-scrollbar';
        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'tab-content-area grid grid-cols-1 md:grid-cols-12 gap-6';

        let activeTabId = data.tabs[0].id;

        const renderActiveTab = () => {
            tabsContainer.innerHTML = data.tabs.map(tab => `
                <button role="tab" class="tab ${tab.id === activeTabId ? 'tab-active bg-base-100 shadow-sm text-primary font-bold' : 'text-base-content/60'}" data-tab-id="${tab.id}">
                    ${tab.label}
                </button>
            `).join('');

            tabsContainer.querySelectorAll('.tab').forEach(t => {
                t.addEventListener('click', () => {
                    activeTabId = t.dataset.tabId;
                    renderActiveTab();
                });
            });

            const activeTab = data.tabs.find(t => t.id === activeTabId);
            contentContainer.innerHTML = '';
            
            // Trigger animation
            contentContainer.classList.remove('tab-content-animated');
            void contentContainer.offsetWidth; // reflow
            contentContainer.classList.add('tab-content-animated');

            if (activeTab && activeTab.layout) {
                activeTab.layout.forEach(widget => {
                    const widgetEl = renderWidget(widget, toggleTaskCallback);
                    if (widgetEl) {
                        let sizeClass = 'md:col-span-12';
                        if (widget.size === 'half') sizeClass = 'md:col-span-6';
                        else if (widget.size === 'third') sizeClass = 'md:col-span-4';
                        else if (widget.size === 'two-thirds') sizeClass = 'md:col-span-8';
                        
                        widgetEl.classList.add('col-span-1', sizeClass);
                        widgetEl.classList.remove('mb-6', 'mb-4');
                        contentContainer.appendChild(widgetEl);
                    }
                });
            }
            if (window.lucide) window.lucide.createIcons();
        };

        // Swipe support
        let touchstartX = 0;
        let touchendX = 0;
        
        contentContainer.addEventListener('touchstart', e => {
            touchstartX = e.changedTouches[0].screenX;
        }, {passive: true});

        contentContainer.addEventListener('touchend', e => {
            touchendX = e.changedTouches[0].screenX;
            const diffX = touchendX - touchstartX;
            
            // Swipe threshold 50px
            if (Math.abs(diffX) > 50) {
                const currentIndex = data.tabs.findIndex(t => t.id === activeTabId);
                if (diffX < 0 && currentIndex < data.tabs.length - 1) {
                    // Swiped left (next)
                    activeTabId = data.tabs[currentIndex + 1].id;
                    renderActiveTab();
                } else if (diffX > 0 && currentIndex > 0) {
                    // Swiped right (prev)
                    activeTabId = data.tabs[currentIndex - 1].id;
                    renderActiveTab();
                }
            }
        }, {passive: true});

        // Swipe indicator for mobile
        const swipeIndicator = document.createElement('div');
        swipeIndicator.className = "md:hidden flex justify-center items-center text-base-content/50 text-xs py-3 mb-2 animate-pulse";
        swipeIndicator.innerHTML = `<i data-lucide="move-horizontal" class="w-4 h-4"></i><span class="ml-2">Свайпайте для перемикання вкладок</span>`;

        renderActiveTab();
        container.appendChild(swipeIndicator);
        container.appendChild(tabsContainer);
        container.appendChild(contentContainer);
    } else if (data.layout) {
        data.layout.forEach(widget => {
            const widgetEl = renderWidget(widget, toggleTaskCallback);
            if (widgetEl) container.appendChild(widgetEl);
        });
    }

    // Slight animation trigger
    container.classList.remove('fade-in');
    void container.offsetWidth; // trigger reflow
    container.classList.add('fade-in');
    if (window.lucide) window.lucide.createIcons();
}

function renderWidget(widget, toggleTaskCallback) {
    switch (widget.type) {
        case 'hero': return createHero(widget);
        case 'info_card': return createInfoCard(widget);
        case 'link_group': return createLinkGroup(widget);
        case 'text_block': return createTextBlock(widget);
        case 'task_list': return createTaskList(widget, toggleTaskCallback);
        case 'teacher_card': return createTeacherCard(widget);
        case 'collapsible_list': return createCollapsibleList(widget);
        default: return null;
    }
}

// --- Widgets ---

function createHero({ title, subtitle, image, courseUrl }) {
    const div = document.createElement('div');
    // Using a side-by-side layout on larger screens, stacked on mobile
    div.className = "relative bg-gradient-to-br from-base-100 to-base-200 rounded-[2rem] overflow-hidden mb-8 shadow-sm border border-base-200";
    div.innerHTML = `
        <div class="flex flex-col md:flex-row items-center gap-8 p-8 md:p-12 relative z-10 w-full">
            <div class="flex-1 text-center md:text-left">
                <div class="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-bold mb-4">
                    Дисципліна
                </div>
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-4 text-base-content tracking-tight leading-tight">${title}</h1>
                ${subtitle ? `<p class="py-2 text-base-content/70 text-lg md:text-xl font-medium max-w-xl">${subtitle}</p>` : ''}
                ${courseUrl ? `<div class="mt-8 flex justify-center md:justify-start"><a href="${courseUrl}" target="_blank" class="btn btn-primary btn-lg gap-2 shadow-md hover:shadow-lg transition-all rounded-full px-8"><i data-lucide="play" class="w-5 h-5 text-current fill-current"></i>Перейти на курс</a></div>` : ''}
            </div>
            ${image ? `
                <div class="flex-1 w-full max-w-lg mt-6 md:mt-0 relative group">
                    <!-- Decorative background blob behind image -->
                    <div class="absolute -inset-4 bg-gradient-to-r from-primary to-secondary opacity-20 blur-2xl rounded-full group-hover:opacity-30 transition-opacity duration-500"></div>
                    <img src="${image}" alt="${title}" class="relative w-full h-auto aspect-video md:aspect-[4/3] object-cover rounded-2xl shadow-xl ring-1 ring-base-content/5 group-hover:scale-[1.02] transition-transform duration-500" />
                </div>
            ` : ''}
        </div>
    `;
    return div;
}

function createInfoCard({ title, content, variant = 'neutral' }) {
    const colors = {
        'neutral': 'border-neutral text-neutral',
        'info': 'border-info text-info',
        'success': 'border-success text-success',
        'warning': 'border-warning text-warning',
        'error': 'border-error text-error'
    };

    const div = document.createElement('div');
    div.className = `card p-4 mb-4 rounded-2xl border ${colors[variant] || colors['neutral']} bg-base-100 shadow-sm`;

    const formattedContent = content.replace(/\n/g, '<br>');

    div.innerHTML = `
        <div>
            <h3 class="text-base-content font-bold mb-1 opacity-90">${title}</h3>
            <div class="text-sm opacity-80 leading-relaxed text-base-content">${formattedContent}</div>
        </div>
    `;
    return div;
}

function createTextBlock({ title, content }) {
    const div = document.createElement('div');
    div.className = "card bg-base-100 shadow-sm border border-base-200 mb-4 hover-card";

    const lines = content.split('\n').map(line => {
        if (line.startsWith('- ')) return `<li class="ml-4">${line.substring(2)}</li>`;
        if (line.match(/^\d+\./)) return `<li class="ml-4 list-decimal">${line.replace(/^\d+\.\s*/, '')}</li>`;
        return `<p class="mb-2">${line}</p>`;
    }).join('');

    div.innerHTML = `
        <div class="card-body">
            <h2 class="card-title text-lg mb-2 text-primary">${title}</h2>
            <div class="text-base-content/80 text-sm">${lines}</div>
        </div>
    `;
    return div;
}

function createLinkGroup({ title, links, style = 'list' }) {
    const div = document.createElement('section');
    div.className = "mb-6";

    const header = `<h3 class="font-bold text-lg mb-3 px-1 flex items-center gap-2 opacity-75">${title}</h3>`;

    let content = '';
    if (style === 'buttons') {
        content = `<div class="grid grid-cols-2 gap-3">
            ${links.map(link => `
                <a href="${link.url}" target="_blank" class="bg-base-100 btn btn-outline btn-neutral h-auto py-3 no-animation hover:bg-base-300 hover:text-base-content border-base-300">
                     <div class="flex flex-col items-center gap-1">
                        ${getIcon(link.icon || 'Link')}
                        <span class="text-xs font-normal">${link.label}</span>
                     </div>
                </a>
            `).join('')}
        </div>`;
    } else {
        content = `<div class="flex flex-col gap-2">
            ${links.map(link => `
                <a href="${link.url}" target="_blank" class="flex items-center gap-3 p-3 bg-base-100 rounded-xl border border-base-200 hover:border-primary/50 hover:bg-base-200/50 transition-all group shadow-sm">
                    <div class="p-2 bg-base-200 rounded-lg text-primary group-hover:scale-110 transition-transform">
                        ${getIcon(link.icon || 'Link')}
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate">${link.label}</div>
                        ${link.description ? `<div class="text-xs text-base-content/60 truncate mt-0.5">${link.description}</div>` : ''}
                    </div>
                    ${getIcon('MousePointer')}
                </a>
            `).join('')}
        </div>`;
    }

    div.innerHTML = header + content;
    return div;
}

function createTaskList({ title, tasks }, toggleTaskCallback) {
    const div = document.createElement('div');
    div.className = "card bg-base-100 shadow-sm border border-base-200 w-full flex flex-col mb-6";

    const taskItems = tasks.map(task => {
        const isChecked = state.tasks[task.id] || false;
        return `
            <label class="label cursor-pointer justify-start gap-4 p-4 border-b border-base-200 last:border-0 hover:bg-base-200/50 transition-colors">
                <input type="checkbox" class="checkbox checkbox-primary task-checkbox" 
                    data-id="${task.id}"
                    ${isChecked ? 'checked' : ''} />
                <span class="label-text font-medium ${isChecked ? 'line-through opacity-50' : ''}" id="text-${task.id}">${task.text}</span>
            </label>
        `;
    }).join('');

    div.innerHTML = `
        <div class="card-body p-0">
            <div class="p-4 bg-base-200/50 border-b border-base-200 rounded-t-2xl">
                 <h2 class="card-title text-base font-bold flex items-center gap-2">
                    ${getIcon('List')}
                    ${title}
                 </h2>
            </div>
            <div class="flex flex-col">
                ${taskItems}
            </div>
        </div>
    `;

    // Add event listeners for checkboxes
    div.querySelectorAll('.task-checkbox').forEach(cb => {
        cb.addEventListener('change', (e) => toggleTaskCallback(e.target.dataset.id, e.target.checked));
    });

    return div;
}

function createTeacherCard({ name, email, role, avatar, socials }) {
    const div = document.createElement('div');
    div.className = "card bg-base-100 shadow-sm hover:shadow-md transition-shadow border border-base-200 w-full flex flex-col sm:flex-row items-center p-5 gap-5 mb-4";
    const initial = name ? name.charAt(0).toUpperCase() : '?';
    
    let socialsHtml = '';
    if (socials && socials.length > 0) {
        socialsHtml = `<div class="flex gap-2 mt-3 sm:mt-0 sm:ml-auto">
            ${socials.map(soc => `
                <a href="${soc.url}" target="_blank" class="btn btn-circle btn-ghost btn-sm text-base-content/60 hover:text-primary hover:bg-primary/10" title="${soc.platform || ''}">
                    ${getIcon(soc.icon || 'link')}
                </a>
            `).join('')}
        </div>`;
    }

    div.innerHTML = `
        <div class="avatar placeholder shrink-0">
          <div class="bg-primary/10 text-primary border border-primary/20 rounded-full w-16 h-16 flex items-center justify-center shadow-sm">
            ${avatar ? `<img src="${avatar}" alt="${name}" class="rounded-full w-full h-full object-cover" />` : `<span class="text-2xl font-bold">${initial}</span>`}
          </div>
        </div>
        <div class="text-center sm:text-left flex-1">
            <h3 class="font-bold text-xl mb-1">${name}</h3>
            <p class="text-sm font-medium text-primary mb-1">${role || 'Викладач'}</p>
            ${email ? `<a href="mailto:${email}" class="text-sm text-base-content/70 hover:text-primary hover:underline flex items-center justify-center sm:justify-start gap-1.5"><i data-lucide="mail" class="w-3.5 h-3.5"></i>${email}</a>` : ''}
        </div>
        ${socialsHtml}
    `;
    return div;
}

function createCollapsibleList({ title, items }) {
    const div = document.createElement('div');
    div.className = "card bg-base-100 shadow-sm border border-base-200 w-full flex flex-col mb-4";
    
    const itemsHtml = items.map((item, index) => `
        <div class="collapse collapse-arrow bg-base-100 border-b border-base-200 last:border-b-0 rounded-none first:rounded-t-none last:rounded-b-2xl">
            <input type="radio" name="accordion-${title ? title.replace(/\s/g, '') : 'group'}" ${index === 0 ? 'checked="checked"' : ''} /> 
            <div class="collapse-title text-base font-medium text-base-content/90">
                ${item.title}
            </div>
            <div class="collapse-content text-sm text-base-content/70">
                <p>${item.content.replace(/\n/g, '<br>')}</p>
            </div>
        </div>
    `).join('');

    div.innerHTML = `
        <div class="card-body p-0">
            ${title ? `<div class="p-4 bg-base-200/50 border-b border-base-200 rounded-t-2xl font-bold flex items-center gap-2">${getIcon('List')}${title}</div>` : ''}
            <div class="flex flex-col">
                ${itemsHtml}
            </div>
        </div>
    `;
    return div;
}

export function renderGrades(container, isUpdate = false) {
    const grades = JSON.parse(localStorage.getItem('grades')) || {};

    const semestersData = [
        {
            name: "1 Курс, 1 Семестр",
            id: "y1s1",
            subjects: [
                { id: "y1s1_eng", name: "Іноземна мова", icon: "Languages" },
                { id: "y1s1_ukr", name: "Українське фахове мовлення", icon: "Book" },
                { id: "y1s1_phys", name: "Фізика", icon: "Atom" },
                { id: "y1s1_math", name: "Вища математика", icon: "Calculator" },
                { id: "y1s1_disc", name: "Комп'ютерна дискретна математика", icon: "Binary" },
                { id: "y1s1_prog", name: "Основи програмування", icon: "Code" }
            ]
        },
        {
            name: "1 Курс, 2 Семестр",
            id: "y1s2",
            subjects: [
                { id: "y1s2_hyper", name: "Гіпертекст та гіпермедіа", icon: "Globe" },
                { id: "y1s2_eng", name: "Іноземна мова", icon: "Languages" },
                { id: "y1s2_oop", name: "Об'єктно-орієнтоване програмування", icon: "Code" },
                { id: "y1s2_law", name: "Основи права", icon: "Scale" },
                { id: "y1s2_se", name: "Основи програмної інженерії", icon: "Grid" },
                { id: "y1s2_oop_cw", name: "ООП (Курсова робота)", icon: "FileText" },
                { id: "y1s2_algo", name: "Алгоритми та структури даних", icon: "Network" },
                { id: "y1s2_math", name: "Вища математика", icon: "Calculator" },
                { id: "y1s2_phys", name: "Фізика", icon: "Atom" }
            ]
        },
        {
            name: "2 Курс, 1 Семестр",
            id: "y2s1",
            subjects: state.subjects.map(s => ({ id: s.id, name: s.name, icon: s.icon }))
        }
    ];

    let globalTotal = 0;
    let globalCount = 0;

    const semestersHtml = semestersData.map(sem => {
        let semTotal = 0;
        let semCount = 0;

        const rowsHtml = sem.subjects.map(sub => {
            const val = parseFloat(grades[sub.id]);
            if (!isNaN(val)) {
                semTotal += val;
                semCount++;
                globalTotal += val;
                globalCount++;
            }
            return `
                <tr class="hover">
                    <td class="font-medium whitespace-normal">
                        <div class="flex items-center gap-3">
                            <div class="text-primary/70 shrink-0">${getIcon(sub.icon)}</div>
                            <span>${sub.name}</span>
                        </div>
                    </td>
                    <td class="w-32">
                        <input type="number" min="0" max="100" class="input input-sm input-bordered w-full grade-input text-center" data-id="${sub.id}" value="${grades[sub.id] !== undefined ? grades[sub.id] : ''}" placeholder="—">
                    </td>
                </tr>
            `;
        }).join('');

        const semAvg = semCount > 0 ? (semTotal / semCount).toFixed(2) : '—';

        return `
            <div class="card bg-base-100 shadow-sm border border-base-200 mb-6 overflow-hidden">
                <div class="bg-base-200/50 p-4 border-b border-base-200 flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
                    <h2 class="font-bold text-lg">${sem.name}</h2>
                    <div class="badge badge-primary badge-outline font-bold gap-1 py-3 text-sm ${isUpdate ? 'fade-in' : ''}">Середній: ${semAvg}</div>
                </div>
                <div class="overflow-x-auto">
                    <table class="table w-full">
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }).join('');

    const globalAvg = globalCount > 0 ? (globalTotal / globalCount).toFixed(2) : '—';
    
    let fivePoint = '—';
    let ects = '—';
    if (globalCount > 0) {
        const numAvg = parseFloat(globalAvg);
        if (numAvg >= 90) { fivePoint = '5'; ects = 'A'; }
        else if (numAvg >= 82) { fivePoint = '4'; ects = 'B'; }
        else if (numAvg >= 74) { fivePoint = '4'; ects = 'C'; }
        else if (numAvg >= 64) { fivePoint = '3'; ects = 'D'; }
        else if (numAvg >= 60) { fivePoint = '3'; ects = 'E'; }
        else if (numAvg >= 35) { fivePoint = '2'; ects = 'FX'; }
        else { fivePoint = '2'; ects = 'F'; }
    }

    container.innerHTML = `
        <div class="space-y-6 ${isUpdate ? '' : 'fade-in'}">
            <div class="flex justify-between items-end">
                <div>
                    <h1 class="text-3xl font-bold tracking-tight text-base-content mb-1">Оцінки</h1>
                    <p class="text-base-content/60">Ваша успішність за всі семестри</p>
                </div>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 ${isUpdate ? 'fade-in' : ''}">
                <div class="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl col-span-2 md:col-span-1">
                    <div class="stat-title text-xs sm:text-sm whitespace-normal">Загальний середній бал (100)</div>
                    <div class="stat-value text-primary" id="avg-100">${globalAvg}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl col-span-1">
                    <div class="stat-title text-xs sm:text-sm">За 5-бальною</div>
                    <div class="stat-value" id="avg-5">${fivePoint}</div>
                </div>
                <div class="stat bg-base-100 shadow-sm border border-base-200 rounded-2xl col-span-1">
                    <div class="stat-title text-xs sm:text-sm">Система ECTS</div>
                    <div class="stat-value" id="avg-ects">${ects}</div>
                </div>
            </div>

            <div class="space-y-6">
                ${semestersHtml}
            </div>
        </div>
    `;

    container.querySelectorAll('.grade-input').forEach(input => {
        input.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            let val = parseFloat(e.target.value);
            
            if (isNaN(val)) {
                delete grades[id];
            } else {
                if (val > 100) val = 100;
                if (val < 0) val = 0;
                e.target.value = val;
                grades[id] = val;
            }
            
            localStorage.setItem('grades', JSON.stringify(grades));
            renderGrades(container, true);
        });
    });
    if (window.lucide) window.lucide.createIcons();
}
