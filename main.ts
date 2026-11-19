// Leonida Trophy Guide — hand-in program (Node 22, standard library only).
//
// The guide itself is plain static files in app/: app/index.html opens in a
// browser, loads its stylesheet and script from beside it, and fetches its
// trophy list from app/data/trophies.json. Nothing is built and nothing is
// fetched over the network at run time.
//
// This program hands the guide in. It copies app/ and screenshots/ from this
// directory into the output directory and writes dossier.json there, the
// summary the judge reads (the screenshots, the first load's files and
// bytes, and the source), using the vendored make.fun library.
//
// vendor/makefun-frontend.ts must stay exactly as the kit shipped it: the
// scorer rebuilds the dossier with its own copy and requires the two to
// match byte for byte.
//
// Run it outside the grader with MAKEFUN_OUTPUT_DIR standing in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'app'), join(outputDir, 'app'), { recursive: true });

const shotsDir = join(outputDir, 'screenshots');
mkdirSync(shotsDir, { recursive: true });
const repoShots = join(repoDir, 'screenshots');
if (existsSync(repoShots)) {
  cpSync(repoShots, shotsDir, { recursive: true });
}

// The caps match the scorer's gate: at most 4 screenshots of at most
// 256 KiB each, at most 993 files and directories in app/ totalling at most
// 48 MiB, and the dossier text capped at 160 KiB. app/ counts beside
// /output's own 1,000-entry cap, which app/, screenshots/ and dossier.json
// share, so the entry must leave room.
writeFileSync(
  join(outputDir, 'dossier.json'),
  buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
  }),
);
