export const darkThemes = ["dark", "synthwave", "halloween", "forest", "black", "luxury", "dracula", "business", "night", "coffee", "dim", "sunset"];
export const lightThemes = ["light", "cupcake", "bumblebee", "emerald", "corporate", "retro", "valentine", "garden", "lofi", "pastel", "fantasy", "wireframe", "cmyk", "autumn", "acid", "lemonade", "winter", "nord", "aqua", "cyberpunk"];
export const themes = [...lightThemes, ...darkThemes];

export function setTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);

    const isDark = darkThemes.includes(theme);

    // Sync toggles
    const controllers = document.querySelectorAll('.theme-controller');
    controllers.forEach(c => c.checked = isDark);

    // Save as preference for current mode
    if (isDark) localStorage.setItem('darkTheme', theme);
    else localStorage.setItem('lightTheme', theme);

    // Sync pickers if they exist
    const lp = document.getElementById('light-theme-picker');
    const dp = document.getElementById('dark-theme-picker');
    if (lp && !isDark) lp.value = theme;
    if (dp && isDark) dp.value = theme;
}

export function setupTheme() {
    const savedTheme = localStorage.getItem('theme') || 'emerald';
    setTheme(savedTheme);

    const controllers = document.querySelectorAll('.theme-controller');
    controllers.forEach(c => {
        c.addEventListener('change', (e) => {
            const lightRef = localStorage.getItem('lightTheme') || 'emerald';
            const darkRef = localStorage.getItem('darkTheme') || 'dim';
            setTheme(e.target.checked ? darkRef : lightRef);
        });
    });
}
