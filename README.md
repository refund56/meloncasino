# Casino Elite - Zaawansowany System Kasynowy

Profesjonalna aplikacja kasynowa z systemem logowania, panelem admina i bazą danych SQLite.

## Cechy

✨ **Dla Graczy:**
- Rejestracja i logowanie
- 3 gry hazardowe: Blackjack, Ruletka, Automaty
- System zarządzania balansem
- Historia gier
- Responsywny interfejs

👨‍💼 **Dla Administratorów:**
- Panel administracyjny
- Zarządzanie użytkownikami
- Przeglądanie statystyk
- Zarządzanie balansem użytkowników
- Dziennik zdarzeń

🔐 **Bezpieczeństwo:**
- Szyfrowanie haseł (bcryptjs)
- Autentykacja JWT
- Walidacja danych

💾 **Baza Danych:**
- SQLite
- Tabele: użytkownicy, historia gier, transakcje, dziennik admina

## Struktura Projektu

```
casino/
├── server.js                 # Główny plik serwera
├── package.json             # Zależności Node.js
├── .env                     # Zmienne środowiskowe
├── public/
│   ├── index.html          # Główny HTML
│   ├── css/
│   │   └── styles.css      # Style CSS
│   └── js/
│       └── app.js          # Logika JavaScript
├── src/
│   ├── database/
│   │   └── init.js         # Inicjalizacja bazy danych
│   ├── middleware/
│   │   └── auth.js         # Middleware autentykacji
│   └── routes/
│       ├── auth.js         # Endpoint logowania/rejestracji
│       ├── games.js        # Endpointy gier
│       └── admin.js        # Endpointy admina
└── .github/
    └── copilot-instructions.md
```

## Wymagania

- Node.js (v14+)
- npm lub yarn

## Instalacja

1. **Zainstaluj zależności:**
```bash
npm install
```

2. **Skonfiguruj zmienne środowiskowe** (edytuj `.env`):
```
JWT_SECRET=your_secret_key_change_this_in_production
PORT=3000
NODE_ENV=development
```

3. **Uruchom serwer:**
```bash
npm start
```

Aplikacja będzie dostępna na: `http://localhost:3000`

## Domyślne Konta

**Admin:**
- Nazwa: `admin`
- Hasło: `admin123`

## Konto do gry:
Utwórz nowe konto przez formularz rejestracji.

## API Endpoints

### Autentykacja
- `POST /api/auth/register` - Rejestracja
- `POST /api/auth/login` - Logowanie
- `GET /api/auth/profile` - Profil użytkownika

### Gry
- `POST /api/games/blackjack` - Gra w Blackjacka
- `POST /api/games/roulette` - Gra w Ruletkę
- `POST /api/games/slots` - Gra w Automaty
- `GET /api/games/history` - Historia gier

### Admin
- `GET /api/admin/users` - Lista użytkowników
- `GET /api/admin/users/:id` - Szczegóły użytkownika
- `PUT /api/admin/users/:id/balance` - Zmiana salda
- `DELETE /api/admin/users/:id` - Usunięcie użytkownika
- `GET /api/admin/statistics` - Statystyki ogólne
- `GET /api/admin/game-stats` - Statystyki gier
- `GET /api/admin/logs` - Dziennik zdarzeń

## Rozgrywka

### Blackjack
- Celem jest uzyskanie sumy kart zbliżonej do 21 ale nie przekraczającej tej liczby
- Wygrana: 2x stawka
- Remis: zwrot stawki
- Przegrana: utrata stawki

### Ruletka
- Możliwe typy zakładów: liczba, kolor (czerwone/czarne), parzysta/nieparzysta
- Kula może wypaść na dowolne pola od 0 do 36
- Wygrana za liczbę: 36x stawka
- Wygrana za kolor/parzystość: 2x stawka

### Automaty
- 3 bębny ze symbolami
- Trzy takie same symbole = jackpot (100x stawka)
- Dwa takie same = wygrana (3x stawka)

## Rozwój

### Uruchomienie w trybie developerskim z auto-restartowaniem:
```bash
npm run dev
```

### Baza danych
- Automatycznie tworzy się plik `casino.db` w katalogu głównym
- Admin automat jest tworzony przy pierwszym uruchomieniu

## Bezpieczeństwo

⚠️ **Uwaga**: Ta aplikacja jest przeznaczona do celów edukacyjnych/demonstracyjnych.

Dla produkcji:
- Zmień `JWT_SECRET` na silny tajny klucz
- Skonfiguruj HTTPS
- Dodaj walidację input
- Wdrożyć rate limiting
- Dodać 2FA

## Licencja

MIT

## Autor

Casino Elite Application

## Wsparcie

Dla problemów lub sugestii, skontaktuj się z administratorem.
