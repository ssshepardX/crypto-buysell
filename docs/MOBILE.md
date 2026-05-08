# Mobile

## Platform

The mobile app uses Capacitor.

Config:

```txt
capacitor.config.ts
```

Current values:

```txt
appId: com.shepardai.app
appName: Shepard AI
webDir: dist
```

## Build Web Assets

```bash
pnpm run build
```

## Sync Native Projects

```bash
npx cap sync android
npx cap sync ios
```

## Android

Open Android Studio:

```bash
npx cap open android
```

Debug APK:

```bash
cd android
.\gradlew.bat assembleDebug
```

Output path:

```txt
android/app/build/outputs/apk/debug/app-debug.apk
```

Release requires:

- app signing key
- versionCode/versionName update
- Play Console setup

## iOS

Requires macOS and Xcode.

```bash
npx cap open ios
```

Release requires:

- Apple Developer account
- bundle identifier
- signing team
- App Store Connect setup

## Auth Redirect

Native OAuth redirect uses:

```txt
com.shepardai.app://auth/callback
```

Supabase and OAuth provider redirect URLs must include the native callback if mobile OAuth is enabled.

## Payment Redirect

Creem checkout opens externally in mobile builds.

## Common Android Issues

### Gradle metadata missing

Fix:

- close Android Studio
- stop Gradle daemons
- clear corrupted Gradle cache
- rebuild

### JRE instead of JDK

Gradle needs a JDK with `javac`.

Use Android Studio bundled JDK or install a full JDK 21.

Set `JAVA_HOME` to a JDK path, not JRE.

## MVP Publishing Advice

Start with Android internal testing.

Do not publish iOS until:

- auth redirect is verified
- payment flow is verified
- privacy policy is final
- app store screenshots are ready
