# cue.clock — specyfikacja

Aplikacja mobilna (Android + iOS) do mierzenia czasu na uderzenie w bilardzie
("shot clock"), skierowana do sędziów oraz graczy prowadzących mecz bez sędziego.

## 1. Zakres funkcjonalny

1. **Start / pauza meczu** — jeden przycisk uruchamia/zatrzymuje jednocześnie
   trzy liczniki: zegar na aktualne uderzenie, czas trwania partii i czas
   trwania meczu. Wszystkie trzy biegną tylko wtedy, gdy zegar uderzenia jest
   aktywnie uruchomiony — pauza, faul (czasowy lub zgłoszony ręcznie) i
   przerwa między uderzeniami zatrzymują je razem; żaden z nich nie biegnie
   w tle samodzielnie. Partia/mecz mogą zostać uruchomione wyłącznie tym
   przyciskiem — dotknięcie panelu zawodnika czy zgłoszenie faulu resetuje
   zegar uderzenia, ale nigdy nie uruchamia go automatycznie.
2. **Zegar na uderzenie** — odliczanie w dół od skonfigurowanej wartości.
   Po osiągnięciu 0 zegar zatrzymuje się automatycznie, odtwarzany jest sygnał
   dźwiękowy + wibracja (faul czasowy), a UI podświetla się na czerwono.
3. **Ostrzeżenie 10 s** — krótki sygnał dźwiękowy/wibracja i zmiana koloru
   zegara, gdy zostanie 10 sekund (analogicznie do zawołania sędziego "time"
   w rozgrywkach zawodowych). Dodatkowo od 5. sekundy zegar "tyka" — krótki
   sygnał raz na sekundę (5, 4, 3, 2, 1) — aż do zera, gdzie odzywa się
   dłuższy sygnał (buzzer).
4. **Przedłużenie ("extension")** — każdy zawodnik może je wykorzystać
   **raz na partię** (rack/grę), a nie raz na cały mecz. Naciśnięcie przycisku
   dodaje skonfigurowany czas przedłużenia do aktualnie trwającego zegara
   uderzenia i blokuje przycisk dla tego zawodnika do końca bieżącej partii.
   Liczba dostępnych przedłużeń na partię jest konfigurowalna (domyślnie 1,
   zgodnie z zasadami zawodowymi — patrz niżej), więc da się ustawić np. 0
   (brak przedłużeń) lub więcej.
5. **Zmiana zawodnika / nowe uderzenie** — nie ma osobnych przycisków; dotknięcie
   panelu aktywnego zawodnika resetuje mu zegar uderzenia (nowe uderzenie tej
   samej kolejki), a dotknięcie panelu drugiego zawodnika przełącza na niego
   i resetuje zegar. Żadna z tych akcji (ani faul) nie uruchamia zegara
   automatycznie — zawsze wymagane jest wciśnięcie przycisku Start.
5b. **Faul** — osobny przycisk zgłasza faul inny niż przekroczenie czasu
   (np. naruszenie zasad); ma ten sam efekt co faul czasowy (kończy
   bieżące uderzenie, automatycznie przełącza na drugiego zawodnika z premią
   +5 s na jego zegarze), ale liczony jest osobno ("Inne faule" w
   podsumowaniu, niezależnie od "Przekroczeń czasu"). Ta sama premia +5 s
   obowiązuje też po zwykłym faulu czasowym.
6a. **Zakończenie partii** — wskazanie zwycięzcy partii (dwa przyciski, po
   jednym na gracza) inkrementuje wynik meczu, pokazuje krótkie podsumowanie
   partii (przedłużenia wykorzystane w tej partii) i resetuje licznik
   przedłużeń oraz zegar uderzenia na kolejną partię; nie zeruje łącznego
   czasu meczu.
6b. **Wynik meczu** — widoczny na bieżąco w nagłówku ekranu meczu
   ("Gracz 1 X : Y Gracz 2").
6c. **Format meczu ("race to X")** — opcjonalne ustawienie liczby wygranych
   partii potrzebnych do wygrania meczu (0 = brak limitu, zakończenie ręczne).
   Gdy któryś z graczy osiągnie tę liczbę, po zamknięciu podsumowania partii
   od razu pokazywane jest podsumowanie meczu.
7. **Zakończenie meczu** — pokazuje podsumowanie: czas trwania meczu, wynik
   końcowy, zwycięzcę (lub remis), liczbę rozegranych partii oraz tabelę
   statystyk na gracza (liczba uderzeń, łączny czas gry, średni czas
   uderzenia, najszybsze i najdłuższe uderzenie, przedłużenia łącznie,
   przekroczenia czasu/fauli), a także listę wyników poszczególnych partii,
   zanim wróci do ekranu ustawień. Każde uderzenie (zakończone nowym
   uderzeniem, zmianą zawodnika, końcem partii lub przekroczeniem czasu)
   jest rejestrowane z czasem jego trwania. Zakończenie meczu wymaga
   potwierdzenia (dialog "Zakończyć mecz?"); po potwierdzeniu aplikacja
   od razu wraca do ekranu ustawień, gotowa na konfigurację kolejnego meczu.
8. **Łączny czas meczu (opcjonalny)** — dodatkowy, malejący licznik całego
   meczu, niezależny od zegara na pojedyncze uderzenie. Włączany/wyłączany
   w ustawieniach, ponieważ profesjonalne rozgrywki pool zwykle **nie** mają
   limitu czasu na cały mecz (grane są "do X wygranych partii"), ale opcja
   jest przydatna np. do gry rekreacyjnej lub rezerwacji stołu na czas.
8b. **Maksymalny czas partii (opcjonalny)** — analogiczny, opcjonalny,
    malejący licznik pojedynczej partii; niezależny od zegara na uderzenie
    i od łącznego czasu meczu. Po jego przekroczeniu zegar uderzenia się
    zatrzymuje (podobnie jak przy przekroczeniu łącznego czasu meczu) —
    partię trzeba zakończyć ręcznie. Reset przy każdej nowej partii.
    Aktualny czas trwania partii oraz łączny czas trwania meczu (liczniki
    narastające, niezależne od włączenia limitów) są widoczne na ekranie
    meczu przez cały czas jego trwania.
9. **Konfiguracja** (ekran ustawień, zapisywana lokalnie na urządzeniu):
   - czas na uderzenie (s),
   - czas przedłużenia (s),
   - liczba przedłużeń na partię,
   - włącznik + długość łącznego czasu meczu (min),
   - włącznik + długość maksymalnego czasu partii (min),
   - nazwy obu zawodników — pole zaznacza cały tekst po dotknięciu (łatwa
     podmiana) i podpowiada ostatnio używane imiona z poprzednich meczów.
10. Utrzymanie ekranu włączonego podczas trwania meczu (`expo-keep-awake`),
    żeby telefon/tablet nie usypiał w trakcie odmierzania.
11. **Układ responsywny** — treść ekranów jest wyśrodkowana i ograniczona do
    szerokości telefonu (maks. 480 px), żeby na tablecie nie rozciągała się
    na całą szerokość; rozmiar zegara skaluje się do dostępnej szerokości.
12. **Kolory** — jasny/ciemny motyw (patrz sekcja 6), gracz 1 oznaczony
    czerwienią, gracz 2 błękitem (obramowanie aktywnego panelu, kolor imienia,
    wyniku i cyfr zegara uderzenia w trakcie normalnego odliczania); zielony
    oznacza stan aktywny/dostępny (przedłużenie, stepper, przełącznik czasu
    meczu), szary — nieaktywny/wyczerpany, a żółty/czerwony — ostrzeżenie
    10 s / faul czasowy niezależnie od gracza.
13. **Ikony przycisków** (Ionicons z `@expo/vector-icons`) — warning dla Faulu,
    play/pause dla Start/Pauza, flaga dla Zakończenia partii, power dla
    Zakończenia meczu, klepsydra dla Przedłużenia. Faul, Start/Pauza i
    Zakończ partię są w jednym rzędzie przycisków (poziomo, w tej kolejności),
    zarówno w pionowym, jak i poziomym układzie ekranu.
14. **Układ poziomy (tablet / obrócony telefon)** — gdy szerokość ekranu jest
    większa niż wysokość, panele obu zawodników przesuwają się na boki, a
    zegar uderzenia zostaje wyśrodkowany między nimi; rząd przycisków akcji
    pozostaje jeden, na dole ekranu.
15. **Język interfejsu** — wybór spośród polskiego, angielskiego, niemieckiego,
    francuskiego i hiszpańskiego, przełączany na ekranie ustawień. Przy
    pierwszym uruchomieniu (brak zapisanych ustawień) język jest wykrywany
    automatycznie z ustawień lokalnych urządzenia (`expo-localization`);
    jeśli język urządzenia nie jest wspierany, domyślnie używany jest polski.
    Wybór jest zapamiętywany lokalnie razem z resztą ustawień.

Poza zakresem MVP (świadomie pominięte, można dodać później):
wielu sędziów/urządzeń w sieci, historia wielu meczów (obecnie tylko bieżący
mecz), więcej niż
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
| Maksymalny czas partii             | **wyłączony** (domyślnie 15 min, gdy włączony) | Analogicznie do łącznego czasu meczu — profesjonalne rozgrywki nie limitują czasu partii, ale to przydatne dla gry rekreacyjnej/rezerwacji stołu; 15 min to rozsądny punkt startowy dla pojedynczej partii |

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
  language: 'pl' | 'en' | 'de' | 'fr' | 'es'; // domyślnie wykrywany z urządzenia, fallback 'pl'
  shotSeconds: number;          // domyślnie 30, zakres 5–120
  extensionSeconds: number;     // domyślnie 30, zakres 0–120
  extensionsPerGame: number;    // domyślnie 1, zakres 0–5
  totalMatchEnabled: boolean;   // domyślnie false
  totalMatchMinutes: number;    // domyślnie 60, zakres 1–999
  totalGameEnabled: boolean;    // domyślnie false
  totalGameMinutes: number;     // domyślnie 15, zakres 1–120
  player1Name: string;          // domyślnie "Gracz 1"
  player2Name: string;          // domyślnie "Gracz 2"
  shotClockSoundEnabled: boolean;      // domyślnie true
  gameTimeWarningSoundEnabled: boolean; // domyślnie true
}

interface MatchState {
  currentPlayer: 1 | 2;
  gameNumber: number;
  shotRemainingMs: number;
  totalRemainingMs: number | null;   // null gdy totalMatchEnabled = false
  matchElapsedMs: number;            // narastający czas trwania meczu
  totalGameRemainingMs: number | null; // null gdy totalGameEnabled = false
  gameElapsedMs: number;              // narastający czas trwania bieżącej partii
  extensionsUsed: { 1: number; 2: number }; // reset przy "nowa partia"
  isRunning: boolean;
  isExpired: boolean;                // zegar uderzenia doszedł do 0
  isMatchTimeExpired: boolean;
  isGameTimeExpired: boolean;
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

- 10 s pozostało (zegar uderzenia): krótki podwójny sygnał dźwiękowy +
  wibracja + żółty kolor.
- 0 s (zegar uderzenia): dłuższy sygnał (buzzer) + mocniejsza wibracja +
  czerwony kolor, zegar zatrzymuje się automatycznie.
- 2 min i 1 min pozostało do końca partii (gdy włączony "Maksymalny czas
  partii"): osobny sygnał dźwiękowy (dzwonek), inny niż dźwięki zegara
  uderzenia — odtwarzany raz na każdy próg, resetowany na kolejną partię.
- Oba rodzaje dźwięku (zegar uderzenia i ostrzeżenie o końcu partii) można
  niezależnie wyłączyć w ustawieniach; wibracje/haptyka nie są tym wyłączane.
- Dźwięki są zsyntetyzowane lokalnie (proste tony, brak zależności od
  zewnętrznych plików audio / licencji).

## 6. Stos technologiczny

- **React Native + Expo (SDK 57, TypeScript)** — jeden kod na Android i iOS.
- `@react-native-async-storage/async-storage` — zapis ustawień.
- `expo-audio` — sygnały dźwiękowe.
- `expo-haptics` — wibracje.
- `expo-keep-awake` — ekran aktywny podczas meczu.
