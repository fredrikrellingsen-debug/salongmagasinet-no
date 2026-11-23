# Lesertall i footeren

Tallet eies av DigitalPR-huben. Magasinet skal aldri regne det ut selv.

## Kontrakt

```
GET https://digitalpr.no/api/public/lesertall?domene=<eget domene>
```

```jsonc
{
  "ok": true,
  "portal": {
    "domene": "auton.no",
    "navn": "Auton",
    "lesere": 1200,      // null når tallet ikke kan publiseres
    "publisert": true,   // false => vis ingenting
    "grunn": "publisert",
    "periode": { "fra": "2026-10-21", "til": "2026-11-19", "dager": 30 },
    "oppdatert": "2026-11-20T09:13:00.000Z",
    "metode": "ga4-active-users-v1",
    "terskel": 100,
    "saker": 6
  }
}
```

## Regler

- `publisert: false` betyr: vis ingenting. Aldri «0 lesere», aldri eget anslag.
- Tallet rendres server-side (`revalidate: 3600`), ikke hentet i nettleseren.
- Feiler huben, rendres ingenting (`try/catch` er ikke valgfritt).
- Avrunding og terskel bestemmes av huben. Endres reglene, endres de ett sted.

## Slik er den koblet inn

`src/components/ReaderStrip.tsx` rendres i `src/components/Footer.tsx`, i
kolonne 1 rett under domenenavnet:

```tsx
import ReaderStrip from '@/components/ReaderStrip';

// ...
<ReaderStrip />
```

Det er hele endringen. Ingen klient-JS, ingen cookies, ingen layout-endring.

## Verifisering etter deploy

```powershell
curl.exe -s https://auton.no | Select-String "lesere siste"
```

Treff betyr at tallet er over terskelen og publiseres. Ingen treff betyr at
portalen er under terskelen – som er riktig oppførsel, ikke en feil.

## Hvor tallet kommer fra

- Kilde: Google Analytics 4, magasinets egen eiendom, siste 30 hele døgn.
- Avrunding: alltid nedover (10 under 1 000, 100 over). Aldri oppover.
- Terskel: 100 lesere i perioden. Under det vises ingenting.
- Metode og revisjonsspor: <https://digitalpr.no/lesertall>
