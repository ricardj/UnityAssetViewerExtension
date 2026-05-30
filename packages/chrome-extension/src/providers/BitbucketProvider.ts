import { IGitProvider } from './IGitProvider';

export class BitbucketProvider implements IGitProvider {
  public inject(renderCallback: (rawUrl: string, container: HTMLElement, button: HTMLButtonElement) => Promise<void>): void {
    // 1. PR Pages
    const fileHeaders = document.querySelectorAll('.diff-container');

    fileHeaders.forEach(header => {
      if (header.hasAttribute('data-unity-viewer-injected')) return;

      const titleElement = header.querySelector('.filename');
      if (!titleElement || !titleElement.textContent?.trim().endsWith('.prefab')) return;

      header.setAttribute('data-unity-viewer-injected', 'true');

      const button = document.createElement('button');
      button.textContent = '👁️ Render UI Prefab';
      button.className = 'aui-button aui-button-primary aui-button-compact';
      button.style.marginRight = '8px';

      button.addEventListener('click', async (e) => {
        e.preventDefault();

        // Construct or find the raw URL. In bitbucket usually there's a raw link in the header.
        const rawLink = header.querySelector('.execute-file-action') as HTMLAnchorElement;
        let rawUrl = '';
        if (rawLink && rawLink.href) {
           rawUrl = rawLink.href.replace('/browse/', '/raw/'); // Simplistic fallback
        } else {
           // Fallback to searching for other anchor tags that might point to the raw file
           const possibleRawLinks = Array.from(header.querySelectorAll('a')).filter(a => a.href.includes('/raw/'));
           if (possibleRawLinks.length > 0) {
               rawUrl = possibleRawLinks[0].href;
           } else {
               alert('Could not find the raw file URL in the DOM.');
               return;
           }
        }

        const contentDiv = header.querySelector('.diff-content-container');
        if (contentDiv) {
          await renderCallback(rawUrl, contentDiv as HTMLElement, button);
        }
      });

      const fileActions = header.querySelector('.diff-actions');
      if (fileActions) {
        fileActions.prepend(button);
      }
    });

    // 2. Single File View Pages
    const url = new URL(window.location.href);
    if (url.pathname.includes('/src/') && url.pathname.endsWith('.prefab')) {
      const headerActions = document.querySelector('.file-header-actions');

      if (headerActions && !document.getElementById('unity-viewer-btn-blob')) {
        const button = document.createElement('button');
        button.id = 'unity-viewer-btn-blob';
        button.textContent = '👁️ Render UI Prefab';
        button.className = 'aui-button aui-button-primary';
        button.style.marginRight = '8px';

        button.addEventListener('click', async (e) => {
          e.preventDefault();

          let rawUrl = window.location.href.replace('/src/', '/raw/');

          const codeViewContainer = document.querySelector('.file-source');

          if (codeViewContainer) {
            await renderCallback(rawUrl, codeViewContainer as HTMLElement, button);
          } else {
            const fallback = document.createElement('div');
            fallback.style.padding = '16px';
            headerActions.parentElement?.appendChild(fallback);
            await renderCallback(rawUrl, fallback, button);
          }
        });

        headerActions.prepend(button);
      }
    }
  }
}
