# Agent Rule: Self-Explanatory & C# Naming Conventions

## 🎯 Objective
To ensure the codebase remains highly readable, self-documenting, and effortless to navigate for both human developers and AI coding agents. Short, cryptic, or ambiguous names lead to severe navigation difficulty and code duplication. All files, classes, interfaces, variables, and methods must use long, descriptive, self-explanatory names, and strictly adhere to C# naming conventions (mirroring the Unity engine styling).

---

## 🚫 Critical Constraints

1. **Promote Long, Self-Explanatory Names**: Never use short, cryptic, or highly abbreviated names. Names must be long enough to be completely self-documenting. If a name needs to be 30 or 40 characters to fully explain its purpose, prefer the longer name.
2. **C# Class and Struct Naming (PascalCase)**:
   - All classes and structs must be named using **PascalCase** (e.g., `RectTransformApplier`, `LocalRepoProvider`).
   - Every file must be named exactly after the primary class or struct it contains (e.g., `RectTransformApplier.ts`).
3. **C# Interface Naming (PascalCase with `I` Prefix)**:
   - All interfaces must be named using **PascalCase** and strictly prefixed with a capital **`I`** (e.g., `IRepositoryProvider`, `IHierarchyNode`).
   - The file containing the interface must match the interface name exactly (e.g., `IRepositoryProvider.ts`).
4. **Context-Rich Naming (No Ambiguous Duplicates)**:
   - Avoid generic names that could conflict or cause confusion across different packages.
   - When scripts serve a similar purpose in different workspace packages (e.g., repository retrieval), they must be prefixed or suffixed with clear environment context (e.g., `ChromeLocalRepoProvider` inside `chrome-extension` vs. `WebviewLocalRepoProvider` inside `vscode-extension`, rather than using `LocalRepo.ts` in both).
5. **No Cryptic Variables/Methods**: Avoid single-letter variable names (except standard loop indexers like `i`) or cryptic abbreviations. Use clear, descriptive camelCase names for variables and methods.

---

## 💡 Code Examples

### ❌ Bad Practice (Do NOT do this)

Ambiguous naming, lack of C# interface prefixing, and short/cryptic names:

```typescript
// File: parse.ts (Ambiguous file name, unclear context)
export interface Parser { // Missing 'I' prefix for C# interface convention
  p(s: string): any;      // Cryptic method name and parameters
}

export class YamlPar implements Parser { // Cryptic class name abbreviation
  private u: any;                        // Cryptic private field

  p(s: string) {
    // ...
  }
}
```

Multiple generic files with the same name across different extension packages:
```
packages/chrome-extension/src/LocalRepo.ts
packages/vscode-extension/src/LocalRepo.ts
```

###  Good Practice (Do this instead)

Self-explanatory, long, memorable names following strict C# naming conventions:

```typescript
// File: IUnityYamlParser.ts (Perfect C# interface naming, file matches interface)
export interface IUnityYamlParser {
  parseUnityYaml(yamlString: string): UnityObject[]; // Self-explanatory method name
}

// File: StandardUnityYamlParser.ts (Descriptive class name, file matches class)
import { IUnityYamlParser } from './IUnityYamlParser';
import { UnityObject } from '../types/UnityObject';

export class StandardUnityYamlParser implements IUnityYamlParser {
  private parsedUnityDocuments: UnityObject[] = []; // Explicit variable name

  parseUnityYaml(yamlString: string): UnityObject[] {
    // ...
    return this.parsedUnityDocuments;
  }
}
```

Context-rich and distinct names across packages to prevent ambiguity:
```
packages/chrome-extension/src/repo/ChromeLocalRepoProvider.ts
packages/vscode-extension/src/webview-host/WebviewLocalRepoProvider.ts
```

---

## 🛡️ Exception Checklist
* Standard short variable names are permitted for highly localized, short-lived variables in math equations or loops (e.g., `i`, `x`, `y` inside a coordinates calculator or `for` loop).
* Standard libraries or third-party wrappers where the name is predetermined by the external API.
