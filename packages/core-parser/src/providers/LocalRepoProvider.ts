export interface LocalRepoProvider {
  /**
   * Find and retrieve the raw YAML content of a prefab by its Unity GUID.
   */
  findPrefabByGuid(guid: string): Promise<string | null>;

  /**
   * Retrieve a mapping of script GUID to script class name (or name of C# class).
   */
  getScriptGuidMap(): Promise<Map<string, string>>;

  /**
   * Find the base64 data URL, blob URL, or resource URL for an asset (e.g. image) by its Unity GUID.
   */
  resolveAssetUrl?(guid: string): Promise<string | null>;
}
