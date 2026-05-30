export interface IGitProvider {
  inject(renderCallback: (rawUrl: string, container: HTMLElement, button: HTMLButtonElement) => Promise<void>): void;
}
