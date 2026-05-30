# Agent Rule: Single Class/Interface Per File

## 🎯 Objective
To maintain high modularity, enhance type-checking performance, and keep the codebase easy to parse for both human developers and AI coding agents, all classes and interfaces must be declared in separate files.

---

## 🚫 Critical Constraints

1. **No Multi-Class/Interface Files**: A single source file must not contain more than one primary class or interface declaration.
2. **Dedicated Files**: Each class, interface, custom type, or enum should reside in a file named exactly after it (using standard naming conventions, e.g., `MyInterface.ts` or `MyClass.ts`).
3. **No Mixed Declarations**: Do not declare an interface and a class together in the same file, even if the class implements the interface.

---

## 💡 Code Examples

### ❌ Bad Practice (Do NOT do this)

```typescript
// File: MyComponents.ts (Incorrectly bundling multiple declarations)

export interface UserProfile {
  id: string;
  name: string;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: boolean;
}

export class UserManager {
  private users: UserProfile[] = [];

  addUser(user: UserProfile) {
    this.users.push(user);
  }
}
```

###  Good Practice (Do this instead)

Split the declarations into separate files:

1. **File: `UserProfile.ts`**
   ```typescript
   export interface UserProfile {
     id: string;
     name: string;
   }
   ```

2. **File: `UserSettings.ts`**
   ```typescript
   export interface UserSettings {
     theme: 'light' | 'dark';
     notifications: boolean;
   }
   ```

3. **File: `UserManager.ts`**
   ```typescript
   import { UserProfile } from './UserProfile';

   export class UserManager {
     private users: UserProfile[] = [];

     addUser(user: UserProfile) {
       this.users.push(user);
     }
   }
   ```

---

## 🛡️ Exception Checklist
* Simple inline helper types or one-off parameter interfaces specifically used inside a single function can be placed in the same file if they are not exported and are extremely small (less than 5 lines).
* All exported classes and interfaces **must** have their own dedicated files.
