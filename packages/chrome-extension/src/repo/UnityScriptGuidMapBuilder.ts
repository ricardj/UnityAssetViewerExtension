const GUID_REGEX = /guid:\s*([0-9a-f]{32})/;
const SKIP_DIRS = ['Library', 'Temp', 'Logs', 'Obj', 'UserSettings', 'Packages', 'ProjectSettings', '.git'];

export class UnityScriptGuidMapBuilder {
  /**
   * Recursively scan the Unity project for .cs.meta files and build a
   * mapping of script GUID → C# class name (derived from the filename).
   */
  public static async build(
    dirHandle: FileSystemDirectoryHandle,
    map: Map<string, string> = new Map()
  ): Promise<Map<string, string>> {
    for await (const entry of (dirHandle as any).values()) {
      if (entry.kind === 'directory') {
        if (SKIP_DIRS.includes(entry.name)) continue;
        await UnityScriptGuidMapBuilder.build(entry as FileSystemDirectoryHandle, map);
      } else if (entry.kind === 'file' && entry.name.endsWith('.cs.meta')) {
        try {
          const fileHandle = entry as FileSystemFileHandle;
          const file = await fileHandle.getFile();
          const text = await file.text();
          const match = GUID_REGEX.exec(text);
          if (match) {
            // "MyCustomButton.cs.meta" → "MyCustomButton"
            const className = entry.name.replace('.cs.meta', '');
            map.set(match[1], className);
          }
        } catch (e) {
          // Skip unreadable files silently
        }
      }
    }
    return map;
  }
}
