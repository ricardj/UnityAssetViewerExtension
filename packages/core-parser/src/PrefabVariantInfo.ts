export interface PrefabVariantInfo {
  basePrefabGuid: string;
  modifications: Array<{
    targetFileId: string;
    propertyPath: string;
    value: any;
    objectReference?: any;
  }>;
}
