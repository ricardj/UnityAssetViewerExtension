chrome.runtime.onInstalled.addListener(()=>{const e=chrome.runtime.getURL("popup.html");chrome.tabs.create({url:e,active:!0})});
