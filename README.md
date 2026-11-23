# NailBabe 💅🏽

[![CI/CD](https://github.com/oneInSlo/projekt/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/oneInSlo/projekt/actions/workflows/ci-cd.yml)

NailBabe je načrt spletne platforme za iskanje lepotnih salonov in rezervacijo terminov pri nail artistih. Stranke lahko primerjajo salone po regiji in storitvah, pregledajo njihove profile ter rezervirajo termin z možnostjo priložitve inspiracijske fotografije. Saloni upravljajo storitve, ekipo, razpoložljivost in rezervacije.

## Nameščena aplikacija

- **Aplikacija (frontend):** https://nailbabe.netlify.app
- **Backend API:** https://nailbabe-api.onrender.com (stanje povezave z bazo: [`/health`](https://nailbabe-api.onrender.com/health))

Backend teče na brezplačnem strežniku, ki se po 15 minutah neaktivnosti ustavi, zato lahko prvi zahtevek po premoru traja do ene minute.

## Tehnologije

Predvideni tehnološki sklad vključuje React, TypeScript, Tailwind CSS in Vite za uporabniški vmesnik; Node.js, Express.js in JavaScript za backend ter REST API; PostgreSQL za podatkovno bazo; JWT in bcrypt za avtentikacijo. Za lokalni razvoj so predvideni npm ter Docker in Docker Compose. Fotografije in e-poštna obvestila uporabljajo predvideni shrambi oziroma storitvi, kot so Multer in Nodemailer/SMTP. Sklad je podrobneje opisan v [arhitekturi in tehnološkem skladu](docs/04-arhitektura-in-tehnoloski-sklad.md).

## Lokalna namestitev

### Zahteve

- Git
- Node.js in npm
- PostgreSQL

### Fork in prenos projekta

1. Na GitHubu izberite **Fork**.
2. Klonirajte svoj fork in vstopite v projekt:

   ```bash
   git clone https://github.com/VAŠ-UPORABNIK/NailBabe.git
   cd NailBabe
   ```

   URL zamenjajte z URL-jem svojega forka.

### Podatkovna baza

Ustvarite prazno PostgreSQL podatkovno bazo, na primer `nailbabe`. Primer, če imate nameščena orodja PostgreSQL:

Uporabnik v `DATABASE_URL` mora imeti pravice za ustvarjanje tabel in PostgreSQL razširitev, ki jih zahtevajo migracije.

### Okoljske spremenljivke

Ustvarite lokalni datoteki `.env` iz priloženih primerov:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

V `backend/.env` nastavite `DATABASE_URL` za svojo podatkovno bazo. Ustvarite različni skrivnosti za JWT:

```bash
openssl rand -hex 32
openssl rand -hex 32
```

Prvo vrednost vnesite kot `JWT_SECRET`, drugo pa kot `JWT_REFRESH_SECRET`. `SMTP_USER` in `SMTP_PASS` sta potrebna samo za pošiljanje e-poštnih vabil nail artistom. Skrivnosti in lokalni `.env` datoteki ne dodajajte v Git.

`frontend/.env` privzeto uporablja backend na `http://localhost:3000`. Če spremenite naslov ali vrata backend strežnika, posodobite `VITE_API_BASE_URL` in `VITE_IMAGE_UPLOAD_URL`.

### Namestitev in zagon

V prvem terminalu namestite backend odvisnosti, zaženite migracije in zaženite API:

```bash
cd backend
npm install
node scripts/migrate.js
node index.js
```

Backend privzeto posluša na `http://localhost:3000`. Preverite povezavo z bazo na `http://localhost:3000/health`.

V drugem terminalu namestite frontend odvisnosti in zaženite Vite:

```bash
cd frontend
npm install
npm run dev
```

Frontend privzeto teče na `http://localhost:5173`.

Naložene salonske fotografije se lokalno shranijo v `backend/uploads/`. Ta mapa je namenjena lokalnemu razvoju in je izključena iz Gita.

### Koristni ukazi

Migracije so razvrščene po datotekah in se izvajajo samo enkrat; ob naslednjem zagonu `node scripts/migrate.js` preskoči že izvedene migracije.

## CI/CD cevovod

Cevovod je definiran v [`.github/workflows/ci-cd.yml`](.github/workflows/ci-cd.yml) in se sproži ob vsakem pull requestu v vejo `main` ter ob vsakem pushu na `main`. Spremembe se razvijajo v ločenih vejah in v `main` združujejo prek pull requestov; zaščita veje `main` zahteva uspešne preverbe `lint`, `build` in `test`.

| Faza | Kaj naredi |
|---|---|
| **lint** | Preveri slog in kakovost kode: ESLint za backend (`backend/eslint.config.js`), oxlint za frontend (`frontend/.oxlintrc.json`). Ob napaki job pade. |
| **build** | Namesti odvisnosti z npm cachingom, preveri sintakso backenda in zgradi frontend (`tsc -b` + `vite build`). Rezultate shrani kot artefakta `frontend-dist` in `backend-build`. |
| **test** | Zažene teste z Vitest za backend in frontend ter poročilo o pokritosti kode shrani kot artefakt `coverage-reports`. Če pade kateri koli test, pade cevovod. |
| **deploy** | Izvede se samo ob pushu na `main` in samo, če uspejo `lint`, `build` in `test`. Uporabi artefakte iz joba `build`: zažene migracije baze na Neon, artefakt backenda zapakira v Docker sliko (`ghcr.io`) in jo namesti na Render, artefakt frontenda pa naloži na Netlify. |

Faze `lint`, `build` in `test` tečejo vzporedno, `deploy` pa počaka na vse tri.

### Okolje za namestitev

| Del | Storitev |
|---|---|
| Podatkovna baza (PostgreSQL) | [Neon](https://neon.tech) |
| Backend | [Render](https://render.com) (Docker slika iz GitHub Container Registry) |
| Frontend | [Netlify](https://www.netlify.com) |

Job `deploy` uporablja GitHub okolje `production`, v katerem so shranjene skrivnosti `DATABASE_URL`, `RENDER_DEPLOY_HOOK_URL`, `NETLIFY_AUTH_TOKEN` in `NETLIFY_SITE_ID`. URL backenda se v frontend nastavi ob gradnji prek GitHub spremenljivk `VITE_API_BASE_URL` in `VITE_IMAGE_UPLOAD_URL`, naslov frontenda pa backend prebere iz okoljske spremenljivke `FRONTEND_URL` (CORS in povezave v e-poštnih vabilih).

### Lokalni zagon preverb

```bash
cd backend
npm run lint
npm test
npm run test:coverage

cd ../frontend
npm run lint
npm run build
npm test
```

## Dokumentacija

- [Zasnova rešitve](docs/01-zasnova-resitve.md)
- [Funkcionalnosti in obseg](docs/02-funkcionalnosti-in-obseg.md)
- [Podatkovni model](docs/03-podatkovni-model.md)
- [Arhitektura in tehnološki sklad](docs/04-arhitektura-in-tehnoloski-sklad.md)
- [Uporabniške zgodbe](docs/05-uporabniske-zgodbe.md)
- [Wireframes](docs/06-wireframes.md)
- [Pregled projekta](docs/07-pregled-projekta.md)
