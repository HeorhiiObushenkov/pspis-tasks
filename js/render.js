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
                <span class="font-medium flex-1">${sub.name}</span>
            </button>
        </li>
    `).join('');

    // Add event listeners that update the hash
    container.querySelectorAll('.subject-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            window.location.hash = btn.dataset.id;
        });
    });
}

export function renderHome(subjects, container) {
    container.innerHTML = `
        <div class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
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

    if (data.layout) {
        data.layout.forEach(widget => {
            const widgetEl = renderWidget(widget, toggleTaskCallback);
            if (widgetEl) container.appendChild(widgetEl);
        });
    }

    // Slight animation trigger
    container.classList.remove('fade-in');
    void container.offsetWidth; // trigger reflow
    container.classList.add('fade-in');
}

function renderWidget(widget, toggleTaskCallback) {
    switch (widget.type) {
        case 'hero': return createHero(widget);
        case 'info_card': return createInfoCard(widget);
        case 'link_group': return createLinkGroup(widget);
        case 'text_block': return createTextBlock(widget);
        case 'task_list': return createTaskList(widget, toggleTaskCallback);
        default: return null;
    }
}

// --- Widgets ---

function createHero({ title, subtitle }) {
    const div = document.createElement('div');
    div.className = "hero bg-base-100 rounded-3xl p-8 mb-6 shadow-sm border border-base-200";
    div.innerHTML = `
        <div class="hero-content text-center overflow-hidden">
            <div class="max-w-md">
                <h1 class="text-4xl font-bold mb-2 text-base-content">${title}</h1>
                <p class="py-2 text-base-content/60 text-lg">${subtitle}</p>
            </div>
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
    div.className = `p-4 mb-4 rounded-2xl border ${colors[variant] || colors['neutral']} bg-base-100 shadow-sm`;

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
                    <svg class="w-4 h-4 opacity-30 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                </a>
            `).join('')}
        </div>`;
    }

    div.innerHTML = header + content;
    return div;
}

function createTaskList({ title, tasks }, toggleTaskCallback) {
    const div = document.createElement('div');
    div.className = "card bg-base-100 shadow-sm border border-base-200 mb-6";

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
                    <svg class="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
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
