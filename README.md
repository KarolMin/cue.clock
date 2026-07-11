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

## Budowanie instalowalnej apki w chmurze (EAS Build)

Repozytorium ma gotowy pipeline (`eas.json` + `.github/workflows/eas-build.yml`),
który buduje w chmurze Expo (EAS) instalowalne paczki: `.apk` na Androida i
build na iOS. Żeby zacząć z niego korzystać, potrzebne jest jednorazowe
skonfigurowanie konta (nie da się tego zrobić bez Twojego udziału):

1. Załóż darmowe konto na [expo.dev](https://expo.dev) i zainstaluj CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. W katalogu projektu uruchom **jednorazowo**:
   ```bash
   eas init
   ```
   To zarejestruje projekt na Twoim koncie Expo i dopisze `extra.eas.projectId`
   do `app.json` — zacommituj tę zmianę.
3. Wygeneruj token dostępu: [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)
   i dodaj go w GitHub jako sekret repozytorium `EXPO_TOKEN`
   (Settings → Secrets and variables → Actions).
4. Uruchom workflow ręcznie: zakładka **Actions → EAS Build → Run workflow**,
   wybierając platformę (`android` / `ios` / `all`) i profil (`preview` — apka
   do testów wewnętrznych). Link do gotowego builda pojawi się w logu joba
   (albo od razu na [expo.dev](https://expo.dev) w sekcji Builds).
5. Android: pobierasz `.apk` z linku i instalujesz na tablecie (trzeba
   zezwolić na instalację z nieznanych źródeł).

**Ograniczenie dot. iOS:** bez płatnego konta Apple Developer Program
(99 USD/rok) EAS nie może podpisać builda pod prawdziwe urządzenie — profil
`preview` buduje więc iOS pod **Symulator** (przydatne tylko na Macu z Xcode,
nie zainstalujesz tego na fizycznym iPadzie). Gdy założysz konto Apple
Developer, wystarczy raz uruchomić `eas credentials` (poprowadzi Cię przez
logowanie do Apple i wygenerowanie certyfikatów), zmienić w `eas.json` profil
iOS z `"simulator": true` na normalny build z dystrybucją `internal`, i
pipeline zacznie produkować buildy instalowalne bezpośrednio na iPadzie.

## Publikacja jako strona internetowa (GitHub Pages)

Aplikacja działa też jako strona WWW (React Native Web), więc można ją
wystawić pod własną domeną praktycznie za darmo — jedyny koszt to sama
domena (kilka–kilkanaście USD/rok, zależnie od TLD). Hosting (GitHub Pages)
jest darmowy i deployuje się automatycznie przy każdym pushu do `main` przez
`.github/workflows/deploy-web.yml` — nie trzeba żadnych sekretów ani
dodatkowego konta poza GitHubem.

### 1. Włącz GitHub Pages (jednorazowo)

Repo → **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
Od tego momentu każdy push do `main` (albo ręczne uruchomienie z zakładki
Actions) zbuduje `npx expo export --platform web` i opublikuje zawartość
`dist/` pod adresem `https://<user>.github.io/<repo>/`.

### 2. Domena

Kupiona: **cueclock.online**. Plik `public/CNAME` z tą domeną jest już w
repo (kopiowany automatycznie do `dist/` przy każdym deployu).

### 3. Ustaw DNS u rejestratora domeny

`cueclock.online` to domena bez subdomeny (apex), więc potrzebne są **4
rekordy A** wskazujące na adresy IP GitHub Pages:

| Typ | Nazwa/Host | Wartość |
|-----|-----------|---------|
| A | @ (albo puste/`cueclock.online`) | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |

Opcjonalnie dodaj też IPv6 (`AAAA`, po jednym rekordzie na każdy z poniższych):
`2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`.

Jeśli chcesz też, żeby działało `www.cueclock.online`, dodaj dodatkowo:

| Typ | Nazwa/Host | Wartość |
|-----|-----------|---------|
| CNAME | www | `karolmin.github.io` |

Zmiany DNS potrafią propagować się od kilku minut do kilku godzin.

### 4. Włącz custom domain w GitHub Pages

Repo → **Settings → Pages** → w polu "Custom domain" wpisz `cueclock.online`
i zapisz. Gdy DNS się rozpropaguje, zaznacz **"Enforce HTTPS"** — GitHub
sam wystawi darmowy certyfikat SSL (zwykle w ciągu kilkunastu minut).

Od tego momentu strona jest w pełni zarządzana przez GitHub Actions —
wystarczy pushować zmiany do `main`, a `https://cueclock.online` zaktualizuje
się automatycznie.
