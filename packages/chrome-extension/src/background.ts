chrome.runtime.onInstalled.addListener(() => {
  const popupUrl = chrome.runtime.getURL("popup.html");
  chrome.tabs.create({ url: popupUrl, active: true });
});
