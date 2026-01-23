import { state, saveTasks } from './state.js';
import { setupTheme } from './theme.js';
import { renderNav, updateActiveNav, renderLayout } from './render.js';

const App = {
    async init() {
        await this.loadManifest();
        setupTheme();
        this.setupSettings();

        window.addEventListener('hashchange', () => this.handleHashChange());

        // Initial load based on hash or default to home
        if (!window.location.hash) {
            this.updateHash('home');
        } else {
            this.handleHashChange();
        }
    },

    handleHashChange() {
        const hash = window.location.hash.substring(1);
        if (hash) {
            this.loadSubject(hash);
            return true;
        }
        return false;
    },

    updateHash(id) {
        window.location.hash = id;
    },

    async loadManifest() {
        try {
            const res = await fetch('data/manifest.json');
            const data = await res.json();
            state.subjects = data.subjects;
            renderNav(state.subjects);

            // Start preloading subjects in background
            this.preloadSubjects();
        } catch (e) {
            console.error("Failed to load manifest", e);
            document.getElementById('content-area').innerHTML = `<div class="alert alert-error">Failed to load data.</div>`;
        }
    },

    async preloadSubjects() {
        state.subjects.forEach(async (subject) => {
            if (!state.cache[subject.id]) {
                try {
                    const res = await fetch(subject.path);
                    const data = await res.json();
                    state.cache[subject.id] = data;
                    console.log(`Preloaded: ${subject.name}`);
                } catch (e) {
                    console.warn(`Failed to preload ${subject.name}`, e);
                }
            }
        });
    },

    setupSettings() {
        const lightPicker = document.getElementById('light-theme-picker');
        const darkPicker = document.getElementById('dark-theme-picker');
        const clearCacheBtn = document.getElementById('clear-cache-btn');

        if (lightPicker && darkPicker) {
            import('./theme.js').then(m => {
                const createOptions = (themes) => themes.map(t => `<option value="${t}">${t.charAt(0).toUpperCase() + t.slice(1)}</option>`).join('');

                lightPicker.innerHTML = createOptions(m.lightThemes);
                darkPicker.innerHTML = createOptions(m.darkThemes);

                lightPicker.value = localStorage.getItem('lightTheme') || 'emerald';
                darkPicker.value = localStorage.getItem('darkTheme') || 'dim';

                lightPicker.addEventListener('change', (e) => m.setTheme(e.target.value));
                darkPicker.addEventListener('change', (e) => m.setTheme(e.target.value));
            });
        }

        if (clearCacheBtn) {
            clearCacheBtn.addEventListener('click', () => {
                state.cache = {};
                const originalText = clearCacheBtn.textContent;
                clearCacheBtn.textContent = 'Очищено!';
                clearCacheBtn.classList.replace('btn-warning', 'btn-success');

                this.preloadSubjects();

                setTimeout(() => {
                    clearCacheBtn.textContent = originalText;
                    clearCacheBtn.classList.replace('btn-success', 'btn-warning');
                }, 2000);
            });
        }
    },

    async loadSubject(id) {
        state.currentSubjectId = id;

        // Auto-close drawer on mobile
        const drawerToggle = document.getElementById('my-drawer-2');
        if (drawerToggle) drawerToggle.checked = false;

        // Update Active State in UI (passing null if home to clear highlights)
        updateActiveNav(id === 'home' ? null : id);

        const contentArea = document.getElementById('content-area');

        if (id === 'home') {
            import('./render.js').then(m => m.renderHome(state.subjects, contentArea));
            return;
        }

        const subject = state.subjects.find(s => s.id === id);
        if (!subject) return;

        // Check cache first
        if (state.cache[id]) {
            renderLayout(state.cache[id], contentArea, this.toggleTask.bind(this));
            return;
        }

        contentArea.innerHTML = '<div class="skeleton w-full h-32 rounded-2xl"></div>'; // Loading state

        try {
            const res = await fetch(subject.path);
            const data = await res.json();
            state.cache[id] = data; // Save to cache
            renderLayout(data, contentArea, this.toggleTask.bind(this));
        } catch (e) {
            contentArea.innerHTML = `<div class="alert alert-error">Error loading ${subject.name}</div>`;
        }
    },

    toggleTask(taskId, isChecked) {
        state.tasks[taskId] = isChecked;
        saveTasks(state.tasks);

        // update UI instantly
        const textEl = document.getElementById(`text-${taskId}`);
        if (textEl) {
            if (isChecked) textEl.classList.add('line-through', 'opacity-50');
            else textEl.classList.remove('line-through', 'opacity-50');
        }
    }
};

// Entry Point
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
} else {
    App.init();
}
