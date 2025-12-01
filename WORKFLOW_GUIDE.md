# The "One Codebase" Workflow

It can be confusing because you have two different editors (Antigravity & Android Studio) open at once. Here is the mental model to make it simple:

**You only have ONE app.** It lives in Antigravity.

## The Golden Rule
**Always edit your code in Antigravity.**
Think of Android Studio as just a "printer" that takes your web code and prints it into an Android App Bundle. You rarely need to edit code there.

---

## The Cycle of Life (How to Update)

Whenever you want to make a change (e.g., change the scoring logic, update a color, fix a typo):

### 1. Edit in Antigravity (Web)
*   Make your changes in `app/`, `components/`, or `lib/`.
*   Test it in your browser (`npm run dev`).
*   *This is where you spend 99% of your time.*

### 2. "Freeze" the Web Version
*   Stop the dev server.
*   Run the build command:
    ```bash
    npm run build
    ```
*   This creates a snapshot of your app in the `out/` folder.

### 3. Sync to Android
*   Move that snapshot into the Android project:
    ```bash
    npx cap sync
    ```
*   *Now Android Studio knows about your changes.*

### 4. Build the Android App
*   Open Android Studio.
*   **Build > Generate Signed Bundle**.
*   Upload that bundle to Google Play.

### 5. Save to GitHub
*   Commit and push your changes.
    ```bash
    git add .
    git commit -m "Updated scoring logic"
    git push
    ```
*   GitHub saves *everything*: your web code, your Android settings, and your icons.

---

## Who Does What?

| Tool | Role | What you do here |
| :--- | :--- | :--- |
| **Antigravity** | **The Architect** | Write code, design UI, fix bugs. |
| **Terminal** | **The Mover** | `npm run build` (pack it up), `npx cap sync` (move it to Android). |
| **Android Studio** | **The Factory** | Sign the app, build the `.aab` file. Don't touch code here! |
| **GitHub** | **The Vault** | Backs up your work. |

## Summary
1. **Code** (Antigravity)
2. **Build** (Terminal)
3. **Sync** (Terminal)
4. **Release** (Android Studio)
