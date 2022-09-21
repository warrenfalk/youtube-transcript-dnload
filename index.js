import fetch from "node-fetch";

// https://www.youtube.com/watch?v=Pemzj-vIHoY
// https://www.youtube.com/youtubei/v1/get_transcript?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false

async function fetchVideo(videoId) {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const text = await response.text();
    return text;
}

function findApiKey(videoText) {
    const match = /"innertubeApiKey":"(.*?)"/.exec(videoText);
    const apiKey = match[1];
    return apiKey;
}

function hexToBase64(hex) {
    return Buffer.from(hex.replace(/\s/g, ""), "hex").toString('base64');
}

function stringToHex(str) {
    return Buffer.from(str, "utf8").toString('hex');
}

function stringToHexWithLength(str) {
    return `${str.length.toString(16).padStart(2, '0')} ${stringToHex(str)}`
}

async function fetchTranscript(videoId, apiKey) {
    const langsHex = `0a ${stringToHexWithLength('asr')} 12 ${stringToHexWithLength('es')} 1a 00`
    const langsBase64 = hexToBase64(langsHex);
    const paramsHex = `
        0a ${stringToHexWithLength(videoId)}
        12 ${stringToHexWithLength(langsBase64)}
        18 01
        2a ${stringToHexWithLength("engagement-panel-searchable-transcript-search-panel")}
        30 00
        `
    const response = await fetch(`https://www.youtube.com/youtubei/v1/get_transcript?key=${apiKey}&prettyPrint=false`, {
        "headers": {
            "accept": "*/*",
            "accept-language": "en-US,en;q=0.9",
            "cache-control": "no-cache",
            "content-type": "application/json",
            "pragma": "no-cache",
            "sec-ch-ua": "\"Google Chrome\";v=\"105\", \"Not)A;Brand\";v=\"8\", \"Chromium\";v=\"105\"",
            "sec-ch-ua-arch": "\"x86\"",
            "sec-ch-ua-bitness": "\"64\"",
            "sec-ch-ua-full-version": "\"105.0.5195.102\"",
            "sec-ch-ua-full-version-list": "\"Google Chrome\";v=\"105.0.5195.102\", \"Not)A;Brand\";v=\"8.0.0.0\", \"Chromium\";v=\"105.0.5195.102\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-model": "",
            "sec-ch-ua-platform": "\"Linux\"",
            "sec-ch-ua-platform-version": "\"5.15.0\"",
            "sec-ch-ua-wow64": "?0",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "same-origin",
            "sec-fetch-site": "same-origin",
            //"x-goog-visitor-id": "CgtJbDhnLUNfdTlQNCj5-KaZBg%3D%3D",
            "x-youtube-bootstrap-logged-in": "false",
            "x-youtube-client-name": "1",
            "x-youtube-client-version": "2.20220919.00.00"
        },
        "referrer": `https://www.youtube.com/watch?v=${videoId}`,
        "referrerPolicy": "origin-when-cross-origin",
        "body": JSON.stringify({
            "context": {
              "client": {
                "hl": "en",
                "gl": "US",
                "remoteHost": "192.181.169.71",
                "deviceMake": "",
                "deviceModel": "",
                //"visitorData": "CgtJbDhnLUNfdTlQNCj5-KaZBg%3D%3D",
                "userAgent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36,gzip(gfe)",
                "clientName": "WEB",
                "clientVersion": "2.20220919.00.00",
                "osName": "X11",
                "osVersion": "",
                "originalUrl": `https://www.youtube.com/watch?v=${videoId}`,
                "platform": "DESKTOP",
                "clientFormFactor": "UNKNOWN_FORM_FACTOR",
                "browserName": "Chrome",
                "browserVersion": "105.0.0.0",
                "screenWidthPoints": 1053,
                "screenHeightPoints": 770,
                "screenPixelDensity": 1,
                "screenDensityFloat": 1.203125,
                "utcOffsetMinutes": -240,
                "userInterfaceTheme": "USER_INTERFACE_THEME_LIGHT",
                "connectionType": "CONN_CELLULAR_4G",
                "memoryTotalKbytes": "8000000",
                "mainAppWebInfo": {
                  "graftUrl": `https://www.youtube.com/watch?v=${videoId}`,
                  "pwaInstallabilityStatus": "PWA_INSTALLABILITY_STATUS_UNKNOWN",
                  "webDisplayMode": "WEB_DISPLAY_MODE_BROWSER",
                  "isWebNativeShareAvailable": false
                },
                "timeZone": "America/New_York"
              },
              "user": {
                "lockedSafetyMode": false
              },
              "request": {
                "useSsl": true,
                "internalExperimentFlags": [],
                "consistencyTokenJars": []
              },
            },
            "params": hexToBase64(paramsHex)
          }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
    const text = await response.text();
    return text;
}

function normalize(t) {
    return t;
}

async function main() {
    const args = process.argv.slice(2);
    if (args.length < 1) {
        console.log("pass the video id or url as an argument");
        return;
    }
    const m = /watch\?v\=(.*)/.exec(args[0]);
    const videoId = (m && m[1]) || args[0];
    console.log(videoId);
    const videoText = await fetchVideo(videoId);
    const apiKey = findApiKey(videoText);
    console.log(apiKey);
    const transcriptJson = await fetchTranscript(videoId, apiKey);
    const transcript = JSON.parse(transcriptJson);
    const json = JSON.stringify(normalize(transcript), null, 2);
    console.log(json);
    const segments = transcript.actions[0].updateEngagementPanelAction.content.transcriptRenderer.content.transcriptSearchPanelRenderer.body.transcriptSegmentListRenderer.initialSegments;
    let text = "";
    for (const segment of segments) {
        const snippetRuns = segment.transcriptSegmentRenderer.snippet.runs;
        for (const snippetRun of snippetRuns) {
            text += ' ' + snippetRun.text;
            //console.log(snippetRun.text);
        }
    }
    console.log(text);
}

main().then(() => {}).catch((e) => {console.log("catch", e)});

