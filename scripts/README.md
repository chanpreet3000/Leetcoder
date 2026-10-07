# Solution tooling

Run everything from the repo root. Scratch files go to `scripts/.work` (git-ignored; override with `SP=<dir>`).

| Script | Purpose |
| --- | --- |
| `fetch-meta.mjs` | Cache each Java problem's LeetCode statement and metadata (needed by the checks below). |
| `verify-examples.mjs [slug...]` | Compile and run solutions against the examples in their statements (PASS / SOFT / FAIL / ERR / SKIP). SOFT = same characters, different order, so usually another valid answer. |
| `check-signatures.mjs` | Compare each solution's public method signatures with LeetCode's Java starter code. |
| `check-method-names.mjs` | Cheap check that the expected method or class name exists. |
| `format-java.mjs` | Format every Java `code` field with google-java-format (put `google-java-format-*-all-deps.jar` at `scripts/.work/fmt/gjf.jar`). Originals are backed up to `scripts/.work/orig`. |
| `import-java.mjs <batch>` | Add new problems from a batch file (`//// slug` then code); compile-checks first and refuses to overwrite. |
| `replace-java.mjs <batch>` | Same format, but overwrites existing Java solutions. |
| `show-problem.mjs`, `show-signature.mjs`, `compare-signature.mjs` | Print a statement with the current code, the expected signature, or expected vs actual method lines. |

`verify-examples.mjs` cannot run design, linked-list or tree problems and only reads single statement examples, so a pass is not a guarantee.
