export function getIcon(name) {
    // Convert PascalCase to kebab-case for Lucide
    const kebabName = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    
    // Some specific mappings if our names differ from Lucide
    const specificMaps = {
        'network': 'network',
        'alert-circle': 'circle-alert',
        'check-square': 'square-check'
    };

    const finalName = specificMaps[kebabName] || kebabName;
    return `<i data-lucide="${finalName}" class="w-5 h-5"></i>`;
}
