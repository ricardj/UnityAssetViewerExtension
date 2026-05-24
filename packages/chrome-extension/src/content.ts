console.log("Unity Asset Viewer content script loaded.");

const banner = document.createElement('div');
banner.style.position = 'fixed';
banner.style.bottom = '20px';
banner.style.right = '20px';
banner.style.backgroundColor = '#2563eb';
banner.style.color = '#ffffff';
banner.style.padding = '12px 24px';
banner.style.borderRadius = '8px';
banner.style.zIndex = '999999';
banner.style.fontFamily = 'system-ui, sans-serif';
banner.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
banner.style.fontWeight = '500';
banner.innerHTML = '🎮 Unity Asset Viewer is Active!';

document.body.appendChild(banner);
