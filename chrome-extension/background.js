chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.get(['apiEndpoint'], (result) => {
        if (!result.apiEndpoint) {
            chrome.storage.local.set({ apiEndpoint: 'https://broslunas.link' });
        }
    });

    console.log('Broslunas Links Extension Installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'AUTH_TOKEN_PROVIDED' && message.token) {
        chrome.storage.local.set({ 
            apiKey: message.token,
            isLoggedIn: true
        }, () => {
            console.log('API Token saved and user logged in.');
            sendResponse({ success: true });
            
            // Send a notification to the user
            chrome.notifications.create('authSuccess', {
                type: 'basic',
                iconUrl: 'icons/icon128.png',
                title: 'Conexión Exitosa',
                message: 'Extensión conectada correctamente con tu cuenta de Broslunas Link.'
            }, (notificationId) => {
                // optional cleanup
            });
        });
        return true; // Keep channel open for async response
    }
});

// Optionally, add a context menu item
chrome.contextMenus.create({
    id: "shortenLink",
    title: "Shorten this link",
    contexts: ["link"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "shortenLink") {
        // Here we would shorten the link. However, background scripts don't have direct access
        // to a popup. We would normally need to show a notification or update a state.
        // For now, this is a placeholder.
        console.log('Shortening link from context menu:', info.linkUrl);
        // We could also open the popup or send a message.
        chrome.action.openPopup();
    }
});
