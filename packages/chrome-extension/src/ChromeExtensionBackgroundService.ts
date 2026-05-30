export class ChromeExtensionBackgroundService {
  public static bootstrap(): void {
    chrome.runtime.onInstalled.addListener((details) => {
      // Only open the popup on first install, not on extension refresh/update
      if (details.reason === 'install') {
        const popupUrl = chrome.runtime.getURL("popup.html");
        chrome.tabs.create({ url: popupUrl, active: true });
      }
    });
  }
}

if (typeof chrome !== 'undefined') {
  ChromeExtensionBackgroundService.bootstrap();
}
