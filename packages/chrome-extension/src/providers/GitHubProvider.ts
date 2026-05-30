import { IGitProvider } from './IGitProvider';

export class GitHubProvider implements IGitProvider {
  public inject(renderCallback: (rawUrl: string, container: HTMLElement, button: HTMLButtonElement) => Promise<void>): void {
    // 1. PR / MR Pages
    const fileHeaders = document.querySelectorAll('.file-header');

    fileHeaders.forEach(header => {
      if (header.hasAttribute('data-unity-viewer-injected')) return;

      const titleLink = header.querySelector('a.Link--primary');
      if (!titleLink || !titleLink.textContent?.trim().endsWith('.prefab')) return;

      header.setAttribute('data-unity-viewer-injected', 'true');

      const button = document.createElement('button');
      button.textContent = '👁️ Render UI Prefab';
      button.className = 'btn btn-sm btn-primary';
      button.style.marginRight = '8px';

      button.addEventListener('click', async (e) => {
        e.preventDefault();

        const fileContainer = header.closest('.file');
        if (!fileContainer) return;

        const links = Array.from(header.querySelectorAll('a[href*="/blob/"]'));
        let rawUrl = '';
        if (links.length > 0) {
           rawUrl = (links[0] as HTMLAnchorElement).href.replace('/blob/', '/raw/');
        } else {
           alert('Could not find the raw file URL in the DOM.');
           return;
        }

        const contentDiv = fileContainer.querySelector('.js-file-content');
        if (contentDiv) {
          await renderCallback(rawUrl, contentDiv as HTMLElement, button);
        }
      });

      const fileActions = header.querySelector('.file-actions');
      if (fileActions) {
        fileActions.prepend(button);
      }
    });

    // 2. Single File Blob Pages
    const url = new URL(window.location.href);
    if (url.pathname.includes('/blob/') && url.pathname.endsWith('.prefab')) {
      const rawButton = document.querySelector('[data-testid="raw-button"]') || document.getElementById('raw-url');

      if (rawButton && !document.getElementById('unity-viewer-btn-blob')) {
        const button = document.createElement('button');
        button.id = 'unity-viewer-btn-blob';
        button.textContent = '👁️ Render UI Prefab';
        button.className = rawButton.className.includes('btn') ? 'btn btn-sm btn-primary' : 'types__StyledButton-sc-ws60qy-0 dLQcn types__BaseButton-sc-1lxyrv6-0 gnYqjI';
        button.style.marginRight = '8px';

        button.addEventListener('click', async (e) => {
          e.preventDefault();

          let rawUrl = (rawButton as HTMLAnchorElement).href;
          if (!rawUrl) rawUrl = window.location.href.replace('/blob/', '/raw/');

          const codeViewContainer = document.querySelector('.react-code-view-bottom') ||
                                    document.querySelector('.blob-wrapper') ||
                                    document.querySelector('[data-testid="read-only-cursor-text-area"]')?.parentElement?.parentElement ||
                                    document.querySelector('.js-file-content');

          if (codeViewContainer) {
            await renderCallback(rawUrl, codeViewContainer as HTMLElement, button);
          } else {
            const fallback = document.createElement('div');
            fallback.style.padding = '16px';
            rawButton.closest('div')?.parentElement?.parentElement?.appendChild(fallback);
            await renderCallback(rawUrl, fallback, button);
          }
        });

        if (rawButton.parentElement) {
          rawButton.parentElement.style.display = 'flex';
          rawButton.parentElement.style.alignItems = 'center';
          rawButton.parentElement.insertBefore(button, rawButton);
        }
      }
    }
  }
}
