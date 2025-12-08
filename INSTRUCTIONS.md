# How to Run Your Hive Forecast App 🐝

Hello! Here is how you can get your bee app running on your screen.

## Step 1: Get the Tools Ready
You need a "terminal" (the black box where you type commands).
1. Make sure you are in the `hive_forecast_mobile` folder.

## Step 2: Connect a Device
You can run the app on:
- A real Android phone (plugged in with USB).
- An Android Emulator (a virtual phone on your computer).
- A web browser (like Chrome).

## Step 3: Run the App
Type this command in your terminal and hit Enter:

```bash
flutter run
```

If you have multiple devices connected, it might ask you to choose one.
- If it asks, it will show a list like:
  `[1]: Pixel 7 ...`
  `[2]: Chrome ...`
- Just type the number (like `1` or `2`) and hit Enter.

## Step 4: Use the App!
1. The app should pop up on your screen.
2. Type in a ZIP code (try `90210` or your own!).
3. Tap **Get Forecast**.
4. You'll see the bee forecast! Green means "Go check the bees!", Red means "Stay inside!".

## Troubleshooting
- **"No devices found"**: Make sure your phone is plugged in or open Chrome. You can try `flutter run -d chrome` to force it to open in a web browser.
- **Red Errors**: If you see big red text, don't panic! Read the first line of the error to see what went wrong.

---

## A Note for Later (The "Key" 🗝️)
I added some code to helping with "signing" the app. This is like putting your digital signature on a painting so people know it's really from you.
- **For now:** You don't need to do anything. You can just run and test the app.
- **For the App Store:** Later, when you want to put this on the Google Play Store, you'll need a special file called `upload-keystore.jks`. We can make that together when you are ready to publish!
