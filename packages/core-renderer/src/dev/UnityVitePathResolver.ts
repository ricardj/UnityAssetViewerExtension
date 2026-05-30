export class UnityVitePathResolver {
  public static getViteFsUrl(absolutePath: string): string {
    const normalized = absolutePath.replace(/\\/g, '/');
    return normalized.startsWith('/') ? `/@fs${normalized}` : `/@fs/${normalized}`;
  }
}
