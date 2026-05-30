import { IGitProvider } from './IGitProvider';

export class GitLabProvider implements IGitProvider {
  public inject(renderCallback: (rawUrl: string, container: HTMLElement, button: HTMLButtonElement) => Promise<void>): void {
    // 1. MR Pages
    const fileHeaders = document.querySelectorAll('.file-title-flex-parent');

    fileHeaders.forEach(header => {
      if (header.hasAttribute('data-unity-viewer-injected')) return;

      const titleElement = header.querySelector('.file-title-name');
      if (!titleElement || !titleElement.textContent?.trim().endsWith('.prefab')) return;

      header.setAttribute('data-unity-viewer-injected', 'true');

      const button = document.createElement('button');
      button.textContent = '👁️ Render UI Prefab';
      button.className = 'btn btn-sm btn-info gl-button gl-ml-3';

      button.addEventListener('click', async (e) => {
        e.preventDefault();

        const fileContainer = header.closest('.diff-file');
        if (!fileContainer) return;

        const fileHash = fileContainer.id; // e.g. diff-xxx
        // GitLab's raw URL might need to be constructed or fetched from the DOM
        const viewFileBtn = header.querySelector('a[href*="/-/blob/"]');
        let rawUrl = '';
        if (viewFileBtn) {
           rawUrl = (viewFileBtn as HTMLAnchorElement).href.replace('/-/blob/', '/-/raw/');
        } else {
           alert('Could not find the raw file URL in the DOM.');
           return;
        }

        const contentDiv = fileContainer.querySelector('.diff-content');
        if (contentDiv) {
          await renderCallback(rawUrl, contentDiv as HTMLElement, button);
        }
      });

      const fileActions = header.querySelector('.file-actions');
      if (fileActions) {
        fileActions.prepend(button);
      }
    });

    // 2. Single File View Pages
    const url = new URL(window.location.href);
    if (url.pathname.includes('/-/blob/') && url.pathname.endsWith('.prefab')) {
      const openRawBtn = document.querySelector('a[href*="/-/raw/"]');

      if (openRawBtn && !document.getElementById('unity-viewer-btn-blob')) {
        const button = document.createElement('button');
        button.id = 'unity-viewer-btn-blob';
        button.textContent = '👁️ Render UI Prefab';
        button.className = 'btn btn-sm btn-info gl-button gl-mr-3';

        button.addEventListener('click', async (e) => {
          e.preventDefault();

          let rawUrl = (openRawBtn as HTMLAnchorElement).href;

          const codeViewContainer = document.querySelector('.blob-viewer');

          if (codeViewContainer) {
            await renderCallback(rawUrl, codeViewContainer as HTMLElement, button);
          } else {
            const fallback = document.createElement('div');
            fallback.style.padding = '16px';
            openRawBtn.closest('div')?.parentElement?.appendChild(fallback);
            await renderCallback(rawUrl, fallback, button);
          }
        });

        if (openRawBtn.parentElement) {
          openRawBtn.parentElement.insertBefore(button, openRawBtn);
        }
      }
    }
  }
}
