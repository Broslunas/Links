document.addEventListener('DOMContentLoaded', async () => {
    const views = {
        input: document.getElementById('inputView'),
        loading: document.getElementById('loading'),
        result: document.getElementById('resultView'),
        error: document.getElementById('errorView'),
        settings: document.getElementById('settingsView'),
        login: document.getElementById('loginView')
    };

    const inputs = {
        originalUrl: document.getElementById('originalUrl'),
        customSlug: document.getElementById('customSlug'),
        shortUrl: document.getElementById('shortUrl'),
        apiKey: document.getElementById('apiKey'),
        apiEndpoint: document.getElementById('apiEndpoint')
    };

    const buttons = {
        shorten: document.getElementById('shortenBtn'),
        copy: document.getElementById('copyBtn'),
        newLink: document.getElementById('newLinkBtn'),
        settings: document.getElementById('settingsBtn'),
        back: document.getElementById('backBtn'),
        saveSettings: document.getElementById('saveSettingsBtn'),
        retry: document.getElementById('retryBtn'),
        login: document.getElementById('loginBtn'),
        loginToSettings: document.getElementById('loginToSettings'),
        logout: document.getElementById('logoutBtn')
    };

    const errorMessage = document.getElementById('errorMessage');

    // State
    let currentTabUrl = '';
    let settings = {
        apiKey: '',
        apiEndpoint: 'http://localhost:3000',
        isLoggedIn: false
    };

    // Initialize
    async function init() {
        // Load settings
        const stored = await chrome.storage.local.get(['apiKey', 'apiEndpoint', 'isLoggedIn']);
        
        if (stored.apiEndpoint) {
            settings.apiEndpoint = stored.apiEndpoint;
            inputs.apiEndpoint.value = stored.apiEndpoint;
        } else {
            // Default to production
            settings.apiEndpoint = 'https://broslunas.link';
            inputs.apiEndpoint.value = 'https://broslunas.link';
            await chrome.storage.local.set({ apiEndpoint: 'https://broslunas.link' });
        }

        if (stored.apiKey) {
            settings.apiKey = stored.apiKey;
            inputs.apiKey.value = '••••••••••••••••'; // Mascarar
            settings.isLoggedIn = true;
        }

        // Get current tab URL
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab && tab.url && tab.url.startsWith('http')) {
                currentTabUrl = tab.url;
                inputs.originalUrl.value = currentTabUrl;
            }
        } catch (e) {
            console.error('Error getting tab URL:', e);
        }

        if (settings.apiKey) {
            showView('input');
        } else {
            showView('login');
        }
    }

    function showView(viewId) {
        Object.values(views).forEach(v => {
            if (v) v.classList.add('hidden');
        });
        if (views[viewId]) views[viewId].classList.remove('hidden');
    }

    // Actions
    buttons.loginToSettings.onclick = () => {
        showView('settings');
    };

    buttons.login.onclick = () => {
        // Read directly from input if possible to avoid stale settings in this state
        const endpoint = inputs.apiEndpoint.value || settings.apiEndpoint;
        const loginUrl = `${endpoint}/extension/login`;
        chrome.tabs.create({ url: loginUrl });
    };

    buttons.logout.onclick = async () => {
        if (confirm('Are you sure you want to logout?')) {
            await chrome.storage.local.remove(['apiKey', 'isLoggedIn']);
            settings.apiKey = '';
            settings.isLoggedIn = false;
            showView('login');
        }
    };

    buttons.shorten.onclick = async () => {
        if (!settings.apiKey) {
            showView('login');
            return;
        }

        showView('loading');

        try {
            const response = await fetch(`${settings.apiEndpoint}/api/v1/links`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${settings.apiKey}`
                },
                body: JSON.stringify({
                    originalUrl: currentTabUrl,
                    slug: inputs.customSlug.value || undefined
                })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 401) {
                    await chrome.storage.local.remove(['apiKey', 'isLoggedIn']);
                    throw new Error('Sesión expirada. Por favor, inicia sesión de nuevo.');
                }
                throw new Error(data.message || 'Error al acortar el enlace');
            }

            inputs.shortUrl.value = data.data.shortUrl;
            showView('result');
            
            // Auto copy
            await copyToClipboard(data.data.shortUrl);
        } catch (e) {
            errorMessage.textContent = e.message;
            showView('error');
        }
    };

    buttons.copy.onclick = async () => {
        const url = inputs.shortUrl.value;
        await copyToClipboard(url);
        buttons.copy.textContent = '¡Copiado!';
        buttons.copy.style.borderColor = 'var(--success)';
        setTimeout(() => {
            buttons.copy.textContent = 'Copiar';
            buttons.copy.style.borderColor = 'var(--border-color)';
        }, 2000);
    };

    buttons.newLink.onclick = () => {
        inputs.customSlug.value = '';
        showView('input');
    };

    buttons.retry.onclick = () => {
        if (!settings.apiKey) showView('login');
        else showView('input');
    };

    buttons.settings.onclick = () => {
        showView('settings');
    };

    buttons.back.onclick = () => {
        if (settings.apiKey) showView('input');
        else showView('login');
    };

    buttons.saveSettings.onclick = async () => {
        const apiEndpoint = inputs.apiEndpoint.value.trim().replace(/\/$/, '');
        settings.apiEndpoint = apiEndpoint;
        await chrome.storage.local.set({ apiEndpoint });
        
        buttons.saveSettings.textContent = '¡Guardado!';
        setTimeout(() => {
            buttons.saveSettings.textContent = 'Guardar';
            if (settings.apiKey) showView('input');
            else showView('login');
        }, 1000);
    };

    async function copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
        } catch (err) {
            const textArea = document.createElement("textarea");
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand("copy");
            document.body.removeChild(textArea);
        }
    }

    // Listen for storage changes (to detect login from content script)
    chrome.storage.onChanged.addListener((changes, area) => {
        if (area === 'local' && changes.apiKey) {
            settings.apiKey = changes.apiKey.newValue;
            settings.isLoggedIn = true;
            init(); // Re-initialize UI
        }
    });

    await init();
});
