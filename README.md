# cue.clock

Zegar strzałowy (shot clock) do bilarda — aplikacja na Android i iOS zbudowana
w React Native / Expo.

Pełna specyfikacja funkcjonalna i uzasadnienie wartości domyślnych: [SPEC.md](./SPEC.md).

## Uruchomienie

```bash
npm install
npm start        # otwiera Expo Dev Tools (skanuj kod QR aplikacją Expo Go)
npm run android  # uruchomienie na emulatorze/urządzeniu Android
npm run ios      # uruchomienie na symulatorze/urządzeniu iOS (wymaga macOS)
npm run web      # podgląd w przeglądarce
```

## Funkcje

- Konfigurowalny czas na uderzenie, czas przedłużenia, liczba przedłużeń na
  partię oraz opcjonalny łączny czas meczu.
- Jedno przedłużenie na partię na zawodnika (zgodnie z ustawieniami).
- Sygnał dźwiękowy i wibracja przy 10 sekundach i po upływie czasu.
- Ustawienia zapisywane lokalnie na urządzeniu.
