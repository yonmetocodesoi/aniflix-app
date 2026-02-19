// ANIFLIX SENTINEL v3.5 - ULTRA BRIDGE

function rawInject() {
    try {
        document.documentElement.dataset.sentinelActive = "true";
        console.log("%c[Sentinel] ULTRA MASTER CONTROL ACTIVE.", "color: #00ffff; font-weight: bold; text-shadow: 0 0 15px #00ffff;");
    } catch (e) { }
}
rawInject();

window.addEventListener("message", (event) => {
    if (event.source !== window) return;

    const { type, payload } = event.data;

    const actions = {
        "SENTINEL_CAPTURE_REQUEST": "EXT_CAPTURE_VISIBLE",
        "SENTINEL_INTEL_REQUEST": "EXT_GET_DEEP_INTEL",
        "SENTINEL_LAUNCH_REQUEST": "EXT_DOWNLOAD_LAUNCH",
        "SENTINEL_TAB_ACTION": "EXT_TAB_ACTION",
        "SENTINEL_NOTIFY_REQUEST": "EXT_NOTIFY",
        "SENTINEL_EXEC_JS_REQUEST": "EXT_EXEC_JS",
        "SENTINEL_WIPE_REQUEST": "EXT_WIPE_DATA",
        "SENTINEL_COOKIES_REQUEST": "EXT_GET_COOKIES",
        "SENTINEL_MGMT_ACTION": "EXT_MGMT_ACTION",
        "SENTINEL_PRIVACY_ACTION": "EXT_PRIVACY_ACTION",
        "SENTINEL_BLOCK_DOMAIN": "EXT_BLOCK_DOMAIN"
    };

    if (actions[type]) {
        chrome.runtime.sendMessage({ action: actions[type], payload }, (response) => {
            // Respostas baseadas em tipo
            if (type === "SENTINEL_CAPTURE_REQUEST") {
                window.postMessage({ type: "SENTINEL_CAPTURE_RESPONSE", data: response?.data }, "*");
            }
            if (type === "SENTINEL_INTEL_REQUEST") {
                window.postMessage({ type: "SENTINEL_INTEL_RESPONSE", data: response }, "*");
            }
            if (type === "SENTINEL_EXEC_JS_REQUEST") {
                window.postMessage({ type: "SENTINEL_EXEC_JS_RESPONSE", data: response?.result }, "*");
            }
            if (type === "SENTINEL_COOKIES_REQUEST") {
                window.postMessage({ type: "SENTINEL_COOKIES_RESPONSE", data: response?.cookies }, "*");
            }
        });
    }
});
