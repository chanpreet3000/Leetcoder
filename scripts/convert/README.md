# Porting non-Java solutions to Java

The solver only submits Java. This harness turns the other-language solutions in `problems/` into Java, pack by pack.
Run everything from the repo root; working files go to `scripts/.work/convert` (git-ignored, override with `CONVERT_DIR`).

1. `node scripts/convert/catalog.mjs` lists the free, unsolved problems whose local solution is not Java yet (`todo.json`).
   It needs a logged-in profile (`npm start`, mode `L`) and Chrome not in use by a running bot.
2. `node scripts/convert/fetch-snippets.mjs` fetches LeetCode's Java starter for each of them and keeps the ones that
   offer Java at all (`convert.json`); SQL, Bash and JS-only problems drop out here.
3. `python3 scripts/convert/pack.py [size]` splits them into `packs/NNN.txt` (25 per pack by default): the Java
   signature plus the existing source of each problem.
4. Write the Java for a pack into a file of `//// <slug>` sections (keep LeetCode's class and method signatures) and run
   `python3 scripts/convert/write.py <file.java>`. It rewrites `problems/<slug>.json` as Java, or rejects a section whose
   names do not match the starter or whose brackets do not balance.
5. Submit with the bot as usual, one problem at a time: `printf '1\n' | caffeinate -dis npm start` (or `npm start`,
   mode `1`). Failures land in the bucket; review them with mode `F`, fix the Java, and rerun.

**Premium questions** (needs a Premium account): run `catalog.mjs --premium` and `fetch-snippets.mjs --browser`
(premium statements and starters are hidden from logged-out requests). Questions with no local solution at all get
their statement in the pack instead of source, and `write.py` creates their `problems/<slug>.json`. The solver attempts
premium questions only when the logged-in account has Premium.

Steps 1–3 are cheap to redo, so on another machine (or after more problems are solved) just rerun them: already
converted problems are Java now and drop out of `todo.json` automatically.
