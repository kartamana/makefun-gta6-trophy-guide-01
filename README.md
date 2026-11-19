# makefun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/kartamana/makefun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/kartamana/makefun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

## Leonida Trophy Guide — GTA VI on PS5

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: 1 platinum, 2 gold, 6 silver and 46 bronze, no online trophies. Every trophy shows its official name, description and grade, plus a guide written for this entry in plain words, with the source its facts come from cited beside it. A three-stage roadmap leads to the platinum (story, then the 100% completion checklist, then Strangers & Freaks and cleanup), and the one trophy the guides flag as potentially missable — Positive Mental Attitude, whose first meditation spot in Chapter 1 can be missed — is flagged in the guide and in the app.

The tracker is a checklist whose progress is saved in the browser (localStorage) and can be exported to a file and imported back. It filters by kind (story, missable, collectibles, activities, crime, completion, platinum) and by grade, searches, sorts by roadmap order, name or grade, and has a spoiler setting that hides the names and descriptions of hidden story trophies until they are earned.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is static files under `app/` — no build step, no network at run time. The only thing it fetches is its own `app/data/trophies.json`.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

That copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
