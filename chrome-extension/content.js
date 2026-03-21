// Content script for Broslunas Link Extension
console.log('Broslunas Link Content Script Active');

// Listen for the custom event from the page
document.addEventListener('BroslunasLinkConnected', (e) => {
    const token = e.detail.token;
    if (token) {
        chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_PROVIDED', token: token }, (response) => {
            console.log('Token sent to extension background script');
        });
    }
});

// Fallback: Check for hidden element if the event already fired or we want a simpler way
const checkHandshake = () => {
    const handshake = document.getElementById('extension_auth_handshake');
    if (handshake && handshake.dataset.token) {
        const token = handshake.dataset.token;
        chrome.runtime.sendMessage({ type: 'AUTH_TOKEN_PROVIDED', token: token });
    }
};

// Periodic check in case it's a slow render
setInterval(checkHandshake, 2000);
checkHandshake();
