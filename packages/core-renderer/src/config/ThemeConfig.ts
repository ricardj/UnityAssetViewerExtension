export type ThemeMode = 'light' | 'dark';

export class ThemeConfig {
  private static mode: ThemeMode = 'light';

  public static getMode(): ThemeMode {
    return this.mode;
  }

  public static setMode(mode: ThemeMode) {
    this.mode = mode;
  }

  public static applyThemeVariables(wrapper: HTMLElement, mode: ThemeMode = this.mode) {
    if (mode === 'light') {
      wrapper.style.setProperty('--uv-text', '#333333');
      wrapper.style.setProperty('--uv-bg', 'linear-gradient(to bottom, #314D79 0%, #76899A 50%, #4B4B4B 50%, #222222 100%)');
      wrapper.style.setProperty('--uv-panel-bg', '#f3f4f6');
      wrapper.style.setProperty('--uv-border', '#d1d5db');
      wrapper.style.setProperty('--uv-hover-bg', '#e5e7eb');
      wrapper.style.setProperty('--uv-comp-header-text', '#6b7280');
      wrapper.style.setProperty('--uv-comp-text', '#4b5563');
      wrapper.style.setProperty('--uv-hierarchy-active-bg', '#bfdbfe');
    } else {
      wrapper.style.setProperty('--uv-text', '#ffffff');
      wrapper.style.setProperty('--uv-bg', 'linear-gradient(to bottom, #314D79 0%, #76899A 50%, #4B4B4B 50%, #222222 100%)');
      wrapper.style.setProperty('--uv-panel-bg', '#383838');
      wrapper.style.setProperty('--uv-border', '#222222');
      wrapper.style.setProperty('--uv-hover-bg', '#444444');
      wrapper.style.setProperty('--uv-comp-header-text', '#aaaaaa');
      wrapper.style.setProperty('--uv-comp-text', '#cccccc');
      wrapper.style.setProperty('--uv-hierarchy-active-bg', 'rgb(44, 93, 135)');
    }
  }
}
