const audio = new Audio("assets/vacs.mp3");
let timeout = -1;

const downloadButton = document.getElementById("download-button");
const files = Object.entries({
    windows: "_x64-setup.exe",
    "linux-rpm": ".x86_64.rpm",
    "linux-deb": "_amd64.deb",
    "macos-silicon": "_aarch64.dmg",
    "macos-intel": "_x64.dmg",
});
const downloadLinks = {};

function play() {
    audio.play();
    timeout = -1;
}

function playDelayed() {
    timeout = setTimeout(play, 150);
    console.log(timeout);
}

function cancelTimeout() {
    if (timeout !== -1) {
        clearTimeout(timeout);
    }
}

async function fetchDownloadLinks() {
    const res = await fetch("https://api.github.com/repos/vacs-project/vacs/releases/latest", {
        headers: { Accept: "application/vnd.github+json" },
    });
    if (!res.ok) return;

    const data = await res.json();
    for (const element of data.assets) {
        const os = files.find((f) => element.name.endsWith(f[1]));

        if (os === undefined) continue;

        downloadLinks[os[0]] = element.browser_download_url;
    }

    downloadButton.innerHTML = downloadButton.innerHTML.replace("latest", data.tag_name.replace("vacs-client-", ""));
}
fetchDownloadLinks();

function download(target) {
    const downloadLink = downloadLinks[target] ?? "https://github.com/vacs-project/vacs/releases/latest";
    document.location = downloadLink;
}

downloadButton.addEventListener("click", async () => {
    let detectedKey = await detectPlatform();
    download(detectedKey);
});

async function detectPlatform() {
    const ua = navigator.userAgent;
    const p = navigator.platform || "";

    if (/Mac/.test(p) || /Macintosh/.test(ua)) {
        // Apple Silicon detection (heuristic – works on chrome)
        const isArm =
            /arm/i.test(navigator.userAgentData?.platform || "") ||
            typeof navigator.userAgentData?.getHighEntropyValues === "function";
        if (navigator.userAgentData?.getHighEntropyValues) {
            // userAgentData.getHighEntropyValues is the most reliable method in Chrome/Edge
            try {
                const data = await navigator.userAgentData.getHighEntropyValues(["architecture"]);
                return data.architecture === "arm" ? "macos-silicon" : "macos-intel";
            } catch {
                /* fall through */
            }
        }
        return "macos-silicon";
    }
    if (/Win/.test(p) || /Windows/.test(ua)) return "windows";
    if (/Linux/.test(p) || /Linux/.test(ua)) return "linux-deb"; // default to deb; user can pick rpm
    return null;
}
