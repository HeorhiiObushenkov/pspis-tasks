const App = {
    state: {
        subjects: [],
        currentSubjectId: null,
        tasks: JSON.parse(localStorage.getItem('semester_tasks') || '{}')
    },

    async init() {
        await this.loadManifest();
        this.setupTheme();

        // Auto-load first subject
        if (this.state.subjects.length > 0) {
            this.loadSubject(this.state.subjects[0].id);
        }
    },

    async loadManifest() {
        try {
            const res = await fetch('data/manifest.json');
            const data = await res.json();
            this.state.subjects = data.subjects;
            this.renderNav();
        } catch (e) {
            console.error("Failed to load manifest", e);
            document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load data.</div>`;
        }
    },

    setupTheme() {
        const controllers = document.querySelectorAll('.theme-controller');
        const savedTheme = localStorage.getItem('theme') || 'emerald';
        document.documentElement.setAttribute('data-theme', savedTheme);

        controllers.forEach(c => {
            c.checked = savedTheme === 'dim';
            c.addEventListener('change', (e) => {
                const newTheme = e.target.checked ? 'dim' : 'emerald';
                document.documentElement.setAttribute('data-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                // Sync all controllers
                controllers.forEach(other => other.checked = e.target.checked);
            });
        });
    },

    renderNav() {
        const container = document.getElementById('subject-nav');
        container.innerHTML = this.state.subjects.map(sub => `
            <li>
                <button 
                    onclick="App.loadSubject('${sub.id}')"
                    class="rounded-lg transition-all duration-300 subject-btn text-left p-3 flex items-center gap-3"
                    data-id="${sub.id}">
                    <span class="text-base-content/70 group-hover:text-primary transition-colors">
                        ${this.getIcon(sub.icon)}
                    </span>
                    <span class="font-medium flex-1">${sub.name}</span>
                </button>
            </li>
        `).join('');
    },

    async loadSubject(id) {
        this.state.currentSubjectId = id;

        // Auto-close drawer on mobile
        document.getElementById('my-drawer-2').checked = false;

        // Update Active State
        document.querySelectorAll('.subject-btn').forEach(btn => {
            if (btn.dataset.id === id) {
                btn.classList.add('active', 'bg-base-200', 'text-primary');
                btn.classList.remove('text-base-content/70');
            } else {
                btn.classList.remove('active', 'bg-base-200', 'text-primary');
                btn.classList.add('text-base-content/70');
            }
        });

        const subject = this.state.subjects.find(s => s.id === id);
        if (!subject) return;

        const contentArea = document.getElementById('content-area');
        contentArea.innerHTML = '<div class="skeleton w-full h-32 rounded-2xl"></div>'; // Loading state

        try {
            const res = await fetch(subject.path);
            const data = await res.json();
            this.renderLayout(data, contentArea);
        } catch (e) {
            contentArea.innerHTML = `<div class="alert alert-error">Error loading ${subject.name}</div>`;
        }
    },

    renderLayout(data, container) {
        container.innerHTML = '';

        if (data.layout) {
            data.layout.forEach(widget => {
                const widgetEl = this.renderWidget(widget);
                if (widgetEl) container.appendChild(widgetEl);
            });
        }

        // Slight animation trigger
        container.classList.remove('fade-in');
        void container.offsetWidth; // trigger reflow
        container.classList.add('fade-in');
    },

    renderWidget(widget) {
        switch (widget.type) {
            case 'hero': return this.createHero(widget);
            case 'info_card': return this.createInfoCard(widget);
            case 'link_group': return this.createLinkGroup(widget);
            case 'text_block': return this.createTextBlock(widget);
            // case 'task_list': return this.createTaskList(widget); // Removed per user request
            default: return null;
        }
    },

    // --- Widgets ---

    createHero({ title, subtitle }) {
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
    },

    createInfoCard({ title, content, variant = 'neutral' }) {
        const colors = {
            'neutral': 'border-neutral text-neutral',
            'info': 'border-info text-info',
            'success': 'border-success text-success',
            'warning': 'border-warning text-warning',
            'error': 'border-error text-error'
        };

        const div = document.createElement('div');
        // outline style: bg-base-100, colored border, shadow
        div.className = `p-4 mb-4 rounded-2xl border ${colors[variant] || colors['neutral']} bg-base-100 shadow-sm`;

        // Simple markdown-like line break processing
        const formattedContent = content.replace(/\n/g, '<br>');

        div.innerHTML = `
            <div>
                <h3 class="text-base-content ont-bold mb-1 opacity-90">${title}</h3>
                <div class="text-sm opacity-80 leading-relaxed text-base-content">${formattedContent}</div>
            </div>
        `;
        return div;
    },

    createTextBlock({ title, content }) {
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
    },

    createLinkGroup({ title, links, style = 'list' }) {
        const div = document.createElement('section');
        div.className = "mb-6";

        const header = `<h3 class="font-bold text-lg mb-3 px-1 flex items-center gap-2 opacity-75">${title}</h3>`;

        let content = '';
        if (style === 'buttons') {
            content = `<div class="grid grid-cols-2 gap-3">
                ${links.map(link => `
                    <a href="${link.url}" target="_blank" class="bg-base-100 btn btn-outline btn-neutral h-auto py-3 no-animation hover:bg-base-300 hover:text-base-content border-base-300">
                         <div class="flex flex-col items-center gap-1">
                            ${this.getIcon(link.icon || 'Link')}
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
                            ${this.getIcon(link.icon || 'Link')}
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
    },

    createTaskList({ title, tasks }) {
        const div = document.createElement('div');
        div.className = "card bg-base-100 shadow-sm border border-base-200 mb-6";

        const taskItems = tasks.map(task => {
            const isChecked = this.state.tasks[task.id] || false;
            return `
                <label class="label cursor-pointer justify-start gap-4 p-4 border-b border-base-200 last:border-0 hover:bg-base-200/50 transition-colors">
                    <input type="checkbox" class="checkbox checkbox-primary" 
                        onchange="App.toggleTask('${task.id}', this.checked)"
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
        return div;
    },

    toggleTask(taskId, isChecked) {
        this.state.tasks[taskId] = isChecked;
        localStorage.setItem('semester_tasks', JSON.stringify(this.state.tasks));

        // update UI instantly
        const textEl = document.getElementById(`text-${taskId}`);
        if (textEl) {
            if (isChecked) textEl.classList.add('line-through', 'opacity-50');
            else textEl.classList.remove('line-through', 'opacity-50');
        }
    },

    // Icons Map (Lucide-like SVG strings)
    getIcon(name) {
        const icons = {
            'Scale': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>',
            'Calculator': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>',
            'Languages': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>',
            'Atom': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>', // beaker icon specifically as Atom is complex
            'Code': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>',
            'Binary': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>',
            'Network': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
            'Globe': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>',
            'Link': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>',
            'List': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>',
            'AlertCircle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>',
            'Book': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>',
            'FileText': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>',
            'User': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>',
            'Upload': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>',
            'HelpCircle': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>',
            'BookOpen': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>',
            'MousePointer': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>',
            'Grid': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>',
            'CheckSquare': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>',
            'Cpu': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>',
            'File': '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>'
        };
        return icons[name] || icons['Link'];
    },

    // Fallback for document loading
    start() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
};

App.start();
