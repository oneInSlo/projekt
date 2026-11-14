# NailBabe 💅🏽 – Pregled projekta

Pregled je bil izveden na prevzetem projektu z lokalnim zagonom aplikacije (PostgreSQL v Docker vsebniku, backend na `http://localhost:3000`, frontend na `http://localhost:5173`). Preverjeni so bili dokumentacija v mapi `docs/`, arhitekturne odločitve (ADR), koda backenda in frontenda ter delovanje aplikacije v brskalniku.

## 1. Implementirane funkcionalnosti za MVP

Funkcionalnosti 1–7 so v [funkcionalnostih in obsegu](02-funkcionalnosti-in-obseg.md) označene kot MVP.

| # | Funkcionalnost | Stanje | Opomba |
|---|---|---|---|
| 1 | Iskanje salonov po regiji in kategoriji | ✅ Implementirano | Filtriranje po regiji, kategoriji in delu naziva; filtri se kombinirajo. |
| 2 | Profil salona z galerijo del | ⚠️ Delno | Vodja salona lahko v aplikaciji ustvari salon z eno sliko (do 5 MB). Urejanje in brisanje salona obstajata samo kot končni točki backenda (`PATCH`/`DELETE /api/v1/salons/:id`), v uporabniškem vmesniku ju ni. Stran profila salona in galerija ne obstajata. |
| 3 | Objava storitev in razpoložljivih terminov | ❌ Ni implementirano | V bazi ni tabel za storitve in termine, backend nima ustreznih končnih točk. |
| 4 | Rezervacija termina z inspiracijsko fotografijo | ❌ Ni implementirano | Rezervacije v sistemu ne obstajajo. |
| 5 | Potrjevanje in zavračanje rezervacij | ❌ Ni implementirano | Odvisno od funkcionalnosti 4. |
| 6 | Prestavitev in odpoved rezervacije | ❌ Ni implementirano | Odvisno od funkcionalnosti 4. |
| 7 | E-poštna obvestila | ⚠️ Delno | Implementirana je samo e-pošta s povabilom nail artistu (Nodemailer, Gmail SMTP). Pošiljanje zahteva Gmail račun z geslom za aplikacijo (`SMTP_USER`, `SMTP_PASS`), ki je po README neobvezna nastavitev; brez nje backend pravilno vrne 503 *»Could not send invitation email. Check SMTP configuration«*. Obvestil o rezervacijah, potrditvah in opomnikih ni. |

Poleg tega so implementirane podporne funkcionalnosti:

- registracija stranke in vodje salona ter prijava z JWT (dostopni in osvežitveni žeton, gesla zgoščena z bcrypt),
- povabilo nail artista prek e-pošte in sprejem povabila z nastavitvijo gesla in profila,
- urejanje in brisanje lastnega uporabniškega profila (samo na backendu, brez uporabniškega vmesnika),
- šifranta regij in kategorij storitev.

**Povzetek:** od sedmih MVP funkcionalnosti je v celoti implementirana ena (iskanje salonov), dve sta implementirani delno. Osrednji del domene – storitve, termini in rezervacije – ni implementiran.

## 2. Pregled uporabniških zgodb

Pregledanih je bilo prvih pet uporabniških zgodb iz [uporabniških zgodb](05-uporabniske-zgodbe.md). Oznake: ✅ izpolnjeno, ⚠️ delno izpolnjeno, ❌ ni izpolnjeno.

### US-01 – Registracija in prijava: ⚠️ večinoma izpolnjena

| Kriterij | Stanje | Ugotovitev |
|---|---|---|
| Stranka ali vodja salona ob registraciji vnese ime, e-pošto, geslo in vlogo; nail artist se ustvari prek povabila | ⚠️ | Registracija obeh vlog deluje, po njej sledi preusmeritev na prijavo. Povabilo nail artista je na backendu implementirano, a brez nastavljenega SMTP vrne 503 *»Could not send invitation email«*. Poleg tega je stran `/accept-invitation` v frontendu znotraj `ProtectedRoute`, zato povabljeni artist, ki še nima računa in ni prijavljen, ob odprtju povezave pristane na `/login` in povabila ne more sprejeti (preverjeno v zasebnem oknu brskalnika). |
| Zavrnitev že uporabljenega e-poštnega naslova z razumljivo napako | ✅ | Backend vrne 409, prikaže se *»Email already exists«*. |
| Prijava z registriranim e-poštnim naslovom in geslom | ✅ | Uspešna prijava preusmeri na `/dashboard`; napačno geslo vrne 401 in sporočilo *»Invalid email or password«*. |
| Prijavljen uporabnik dostopa samo do funkcij svoje vloge | ⚠️ | Backend pri obstoječih dejanjih (ustvarjanje in urejanje salona, povabila, urejanje profila) preverja vlogo oziroma lastništvo. `ProtectedRoute` v frontendu preverja samo, ali je uporabnik prijavljen, ne pa njegove vloge. Frontend stranko preusmeri s strani `/dashboard/create-salon`, stran `/dashboard/invite` pa je stranki dostopna – dejanje sicer zavrne backend (*»Only a salon manager with a salon can invite nail artists«*). |

### US-02 – Iskanje salonov: ⚠️ večinoma izpolnjena

| Kriterij | Stanje | Ugotovitev |
|---|---|---|
| Filtriranje po regiji in kategoriji ter iskanje po delu naziva | ✅ | Vsi trije načini delujejo; iskanje po nazivu najde salon tudi po delu imena. |
| Pri več filtrih so prikazani samo saloni, ki ustrezajo vsem | ✅ | Filtri se kombinirajo (AND). |
| Rezultat prikaže vsaj naziv, regijo in povezavo do profila | ⚠️ | Prikazana sta naziv in kategorija ter gumb *»Ogled profila«*. Regija ni prikazana, povezava pa vodi na neobstoječo stran (glej US-03). |
| Sporočilo, ko ni ujemanj | ✅ | Prikaže se *»Ni najdenih salonov.«* |

### US-03 – Pregled profila salona: ❌ ni izpolnjena

Gumb *»Ogled profila«* vodi na `/salon/:id`, vendar ta pot v frontendu ne obstaja (v konzoli: *»No routes matched location«*). Backend nima končne točke za pridobitev posameznega salona. Zato nobenega kriterija ni mogoče izpolniti.

| Kriterij | Stanje | Ugotovitev |
|---|---|---|
| Naziv, opis, lokacija, regija, kontakt in delovni čas | ❌ | Stran profila ne obstaja. Podatki razen delovnega časa so sicer shranjeni v bazi. |
| Storitve z nazivom, trajanjem in ceno | ❌ | Storitve v sistemu ne obstajajo. |
| Nail artisti salona in njihove specializacije | ❌ | Podatki obstajajo v bazi, prikaza ni. |
| Galerija objavljenih fotografij | ❌ | Salon ima samo eno sliko, galerije ni. |
| Manjkajoči podatki ne povzročijo napake strani | ❌ | Ni mogoče preveriti, ker stran ne obstaja. |

### US-04 – Objava storitev in terminov: ❌ ni izpolnjena

Vodja salona ima v aplikaciji na voljo samo ustvarjanje salona, *»Invite nail artists«* in odjavo. V bazi ni tabel za storitve ali termine.

| Kriterij | Stanje | Ugotovitev |
|---|---|---|
| Ustvarjanje storitve z nazivom, trajanjem, ceno in kategorijo | ❌ | Ni implementirano. |
| Zavrnitev storitve brez naziva, trajanja ali z neveljavno ceno | ❌ | Ni implementirano. |
| Povezava storitve z artisti salona | ❌ | Ni implementirano. |
| Nail artist objavi proste termine brez prekrivanja | ❌ | Ni implementirano. |

### US-05 – Rezervacija s fotografijo: ❌ ni izpolnjena

Stranka v aplikaciji nima možnosti rezervacije. Obstaja le nalaganje slike salona (do 5 MB), ne pa inspiracijske fotografije ob rezervaciji (zahtevano do 10 MB).

| Kriterij | Stanje | Ugotovitev |
|---|---|---|
| Izbira storitve, artista in prostega termina | ❌ | Ni implementirano. |
| Neobvezna slikovna datoteka do 10 MB | ❌ | Ni implementirano. |
| Povzetek rezervacije s stanjem »čaka na potrditev« | ❌ | Ni implementirano. |
| Zavrnitev, če termin ni več prost | ❌ | Ni implementirano. |

**Povzetek:** implementirane funkcionalnosti večinoma zadoščajo zgodbama US-01 in US-02 – registracija, prijava in iskanje delujejo, pomanjkljivosti pa so sprejem povabila nail artista, preverjanje vlog v frontendu in prikaz regije v rezultatih. Zgodbam US-03, US-04 in US-05 ne zadoščajo.

## 3. Druga opažanja

- **Docker Compose:** [ADR 0008](adr/0008-docker-compose-za-lokalno-bazo.md) in [arhitektura](04-arhitektura-in-tehnoloski-sklad.md) predvidevata zagon baze z `docker compose up -d`, vendar datoteka `docker-compose.yml` v repozitoriju ni obstajala. Dodana je bila v okviru prevzema projekta.
- **README:** v razdelku *Podatkovna baza* manjka napovedani primer ukaza za ustvarjanje baze, med zahtevami pa ni naveden Docker.
- **Registracija vodje salona:** polje `display_name` je v obrazcu poimenovano *»Salon name«*, čeprav gre za prikazno ime vodje; naziv salona se nato vnese še enkrat ob ustvarjanju salona.
- **Prevelika slika salona:** ob nalaganju slike, večje od 5 MB, backend napake Multer (`File too large`) ne obravnava, zato privzeti Express handler vrne 500 s HTML stranjo; v razvojnem načinu ta vsebuje celoten stack trace z lokalnimi potmi do datotek. Enako velja za nedovoljen format datoteke (dovoljeni so JPEG, PNG in WebP). Uporabnik v aplikaciji vidi le *»Request failed (500)«*. Pričakovan bi bil odgovor 400/413 z razumljivim sporočilom.
- **Odjava ne deluje:** frontend ob odjavi kliče `POST /api/v1/users/logout`, vendar ta pot v `backend/src/routes/user.routes.js` ni registrirana (funkcija `logout` v kontrolerju obstaja), zato backend vrne 404. Piškotek z osvežitvenim žetonom se ne izbriše in žeton ostane veljaven: preverjeno je bilo, da `GET /api/v1/users/refresh` po odjavi še vedno vrne 200. Uporabnik je po osvežitvi strani zato ponovno prijavljen: po odjavi in osvežitvi se ročno odprt `/dashboard` prikaže brez ponovne prijave. Ker stran `/login` prijavljenega uporabnika ne preusmeri, je napaka na prvi pogled skrita.
- **Potek veljavnosti žetona:** `auth.middleware.js` za potečen ali neveljaven dostopni žeton vrne 403 namesto 401.
- **Gradnja frontenda:** `npm run build` v prevzetem projektu ni deloval. `package-lock.json` namesti TypeScript 7, ki je odstranil možnost `baseUrl`, zato `tsc -b` pade z napako *TS5102: Option 'baseUrl' has been removed* v `tsconfig.app.json`. Po odstranitvi te možnosti je `tsc` (z `noUnusedLocals`) javil še neuporabljeni spremenljivki `salon` in `checkedSalon` v `app-sidebar.tsx`: komponenta je klicala `/salons/my-salon`, rezultata pa ni nikjer uporabila. Razvojni strežnik (`npm run dev`) tipov ne preverja, zato napaki med razvojem nista bili opazni. Obe sta bili odpravljeni v okviru vzpostavitve CI/CD.
- **Kakovost kode:** backend nima testov (`npm test` vrne napako) niti linterja; frontend uporablja `oxlint`, testov nima.
- **Konfiguracija za namestitev:** povezava v e-pošti s povabilom (`http://localhost:5173/accept-invitation`) in dovoljeni izvori CORS v `backend/index.js` so zapisani trdo za lokalno okolje, zato jih bo treba za namestitev nastaviti prek okoljskih spremenljivk.
- **Shranjevanje slik:** slike salonov se shranjujejo na lokalni disk (`backend/uploads/`), čeprav [ADR 0005](adr/0005-fotografije-v-loceni-shrambi.md) predvideva ločeno shrambo.
