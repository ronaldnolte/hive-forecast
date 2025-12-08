$env:JAVA_HOME="C:\Program Files\Android\Android Studio\jbr"
Write-Host "Set JAVA_HOME to $env:JAVA_HOME"
Write-Host "Cleaning Project (fixing ghosts in the machine)..."
flutter clean
flutter pub get
Write-Host "Starting Hive Forecast..."
flutter run
