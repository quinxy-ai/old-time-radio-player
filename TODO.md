# TODO

## Features

- [ ] **SHW station picker in Settings**
  - Create a master list of OTR shows with verified archive.org IDs
  - Add a tab in the Settings dialog to let the user choose which shows appear as fixed SHW stations
  - Ship a curated default set (current 7 stations) pre-selected on first run

## Known Issues / Investigation

- [ ] Science Fiction station only loads ~12 episodes — investigate why archive.org search returns so few
- [ ] Adventure station has duplicate episodes ("Part 01" vs "Pt 01" variants) — deduplicate
- [ ] Radio Theatre station: OGG files return HTTP 500 from archive.org — investigate or switch format
- [ ] Two stations can play simultaneously when tuning between them — audio from the previous station doesn't stop fast enough when moving to a new one
- [ ] Nixie display height shift on page load — on first load it shows "NO SIGNAL" in single-line height; when the dial is moved it reflows to two-line height and the whole page shifts
