# cue.clock — specyfikacja

Aplikacja mobilna (Android + iOS) do mierzenia czasu na uderzenie w bilardzie
("shot clock"), skierowana do sędziów oraz graczy prowadzących mecz bez sędziego.

## 1. Zakres funkcjonalny

1. **Start / pauza meczu** — jeden przycisk uruchamia/zatrzymuje odliczanie
   czasu na aktualne uderzenie.
2. **Zegar na uderzenie** — odliczanie w dół od skonfigurowanej wartości.
   Po osiągnięciu 0 zegar zatrzymuje się automatycznie, odtwarzany jest sygnał
   dźwiękowy + wibracja (faul czasowy), a UI podświetla się na czerwono.
3. **Ostrzeżenie 10 s** — krótki sygnał dźwiękowy/wibracja i zmiana koloru
   zegara, gdy zostanie 10 sekund (analogicznie do zawołania sędziego "time"
   w rozgrywkach zawodowych).
4. **Przedłużenie ("extension")** — każdy zawodnik może je wykorzystać
   **raz na partię** (rack/grę), a nie raz na cały mecz. Naciśnięcie przycisku
   dodaje skonfigurowany czas przedłużenia do aktualnie trwającego zegara
   uderzenia i blokuje przycisk dla tego zawodnika do końca bieżącej partii.
   Liczba dostępnych przedłużeń na partię jest konfigurowalna (domyślnie 1,
   zgodnie z zasadami zawodowymi — patrz niżej), więc da się ustawić np. 0
   (brak przedłużeń) lub więcej.
5. **Zmiana zawodnika** — ręczny przycisk sędziego/gracza przełącza aktywnego
   zawodnika i resetuje zegar uderzenia do pełnej wartości.
6. **Nowa partia** — resetuje licznik wykorzystanych przedłużeń obu graczy
   (bo przedłużenie przysługuje na partię) oraz zegar uderzenia; nie zeruje
   łącznego czasu meczu.
7. **Reset meczu** — powrót do ekranu ustawień, koniec bieżącego meczu.
8. **Łączny czas meczu (opcjonalny)** — dodatkowy, malejący licznik całego
   meczu, niezależny od zegara na pojedyncze uderzenie. Włączany/wyłączany
   w ustawieniach, ponieważ profesjonalne rozgrywki pool zwykle **nie** mają
   limitu czasu na cały mecz (grane są "do X wygranych partii"), ale opcja
   jest przydatna np. do gry rekreacyjnej lub rezerwacji stołu na czas.
9. **Konfiguracja** (ekran ustawień, zapisywana lokalnie na urządzeniu):
   - czas na uderzenie (s),
   - czas przedłużenia (s),
   - liczba przedłużeń na partię,
   - włącznik + długość łącznego czasu meczu (min),
   - nazwy obu zawodników.
10. Utrzymanie ekranu włączonego podczas trwania meczu (`expo-keep-awake`),
    żeby telefon/tablet nie usypiał w trakcie odmierzania.

Poza zakresem MVP (świadomie pominięte, można dodać później):
wielu sędziów/urządzeń w sieci, historia meczów/statystyki, więcej niż
2 zawodników, dodatkowy czas na pierwsze uderzenie po breaku.

## 2. Wartości domyślne — źródła

Zasady dot. zegara strzałowego różnią się w zależności od federacji/turnieju
(WPA nie narzuca jednego globalnego standardu — decyduje dyrektor turnieju),
dlatego jako domyślne przyjęto wartości najczęściej stosowane w topowych
rozgrywkach zawodowych (Matchroom World Nineball Tour / profesjonalny 9-ball):

| Parametr                         | Wartość domyślna | Źródło / uzasadnienie |
|-----------------------------------|------------------|------------------------|
| Czas na uderzenie                 | **30 s**         | Standardowy shot clock w profesjonalnym pool (m.in. World Nineball Tour, wiele turniejów WPA-sanctioned) |
| Czas przedłużenia                 | **30 s**         | World Nineball Tour: jedno przedłużenie = dodatkowe 30 s |
| Liczba przedłużeń na partię       | **1**            | Zasada "jedno przedłużenie na gracza na partię (rack)" konsekwentnie stosowana w głównych turniejach (m.in. World Nineball Tour, US Open 9-Ball) |
| Łączny czas meczu                 | **wyłączony** (domyślnie 60 min, gdy włączony) | W profesjonalnym pool mecze nie mają twardego limitu czasu (grane są do X wygranych partii), więc opcja jest domyślnie wyłączona; 60 min to rozsądny punkt startowy dla gry rekreacyjnej/rezerwacji stołu |

Warianty spotykane w innych regulaminach (dla kontekstu, nieużywane jako
domyślne): 35 s na uderzenie z 25-sekundowym przedłużeniem; 40 s na uderzenie
(80 s na pierwsze uderzenie po breaku) z jednym przedłużeniem na partię na
US Open 9-Ball.

Źródła:
- WPA World Standardized Pool Rules — https://www.wpa-pool.com/wpa-world-standardized-pool-rules-explained/
- WPA Rules of Play (2025-09-15) — https://wpapool.com/wp-content/uploads/2025/09/2025.09.15-WPA-Rules.pdf
- The Official World Nineball Tour Event Rules (Matchroom Pool) — https://matchroompool.com/wp-content/uploads/World-Nineball-Tour-Event-Rules-1.pdf
- US 9-Ball Rules — UPA Tour — https://upatour.com/9-ball-rules/

Wszystkie wartości są konfigurowalne przez użytkownika — powyższe to jedynie
domyślne ustawienia startowe aplikacji.

## 3. Model danych

```ts
interface Settings {
  shotSeconds: number;          // domyślnie 30, zakres 5–120
  extensionSeconds: number;     // domyślnie 30, zakres 0–120
  extensionsPerGame: number;    // domyślnie 1, zakres 0–5
  totalMatchEnabled: boolean;   // domyślnie false
  totalMatchMinutes: number;    // domyślnie 60, zakres 1–999
  player1Name: string;          // domyślnie "Gracz 1"
  player2Name: string;          // domyślnie "Gracz 2"
}

interface MatchState {
  currentPlayer: 1 | 2;
  gameNumber: number;
  shotRemainingMs: number;
  totalRemainingMs: number | null;   // null gdy totalMatchEnabled = false
  extensionsUsed: { 1: number; 2: number }; // reset przy "nowa partia"
  isRunning: boolean;
  isExpired: boolean;                // zegar uderzenia doszedł do 0
}
```

Ustawienia są trwałe (AsyncStorage), stan meczu żyje tylko w pamięci —
zamknięcie/restart meczu zaczyna od ekranu ustawień.

## 4. Ekrany

- **Ustawienia** — formularz z krokowymi polami liczbowymi (stepper) dla
  każdego parametru, przełącznik łącznego czasu meczu, pola nazw graczy,
  przycisk "Rozpocznij mecz".
- **Mecz** — duży zegar uderzenia na środku (kolor zależny od pozostałego
  czasu: neutralny → żółty ≤10s → czerwony/0), pod spodem panel obu graczy
  z nazwą, liczbą pozostałych przedłużeń i przyciskiem "Przedłużenie"
  (aktywnym tylko dla zawodnika na ruchu, o ile ma jeszcze przedłużenia w tej
  partii), opcjonalny mniejszy licznik łącznego czasu meczu, numer partii,
  przyciski sterujące: Start/Pauza, Zmiana zawodnika, Nowa partia, Zakończ
  mecz (powrót do ustawień).

## 5. Sygnalizacja

- 10 s pozostało: krótki podwójny sygnał dźwiękowy + wibracja + żółty kolor.
- 0 s: dłuższy sygnał (buzzer) + mocniejsza wibracja + czerwony kolor,
  zegar zatrzymuje się automatycznie.
- Dźwięki są zsyntetyzowane lokalnie (proste tony, brak zależności od
  zewnętrznych plików audio / licencji).

## 6. Stos technologiczny

- **React Native + Expo (SDK 57, TypeScript)** — jeden kod na Android i iOS.
- `@react-native-async-storage/async-storage` — zapis ustawień.
- `expo-audio` — sygnały dźwiękowe.
- `expo-haptics` — wibracje.
- `expo-keep-awake` — ekran aktywny podczas meczu.
