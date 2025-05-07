#!/usr/bin/env node

import * as checker from "license-checker";
import fs from "node:fs";
import path from "node:path";

const ROOT_PATH = path.join(import.meta.dirname, "..");

let md = `
This application bundles the following third-party software under their respective licenses.  Click a package to expand the full text.

---
`;

await new Promise((resolve, reject) =>
  checker.init(
    {
      start: ROOT_PATH,
      production: true,
    },
    (_, summaries) => {
      for (const [name, summary] of Object.entries(summaries).sort(([a], [b]) =>
        a.localeCompare(b),
      )) {
        let license =
          summary.licenseText ??
          (summary.licenseFile
            ? fs.readFileSync(summary.licenseFile, "utf8")
            : null);

        if (!license) {
          md += `**${name} - ${summary.licenses}**<br/>\n`;
          continue;
        }

        if (
          summary.licenseFile.toLowerCase().endsWith("readme.md") &&
          license.toLowerCase().indexOf("license") === -1
        ) {
          md += `**${name} - ${summary.licenses}**<br/>\n`;
          continue;
        }

        license = license.replace(/<[^>]+>/g, "");
        md += `<details><summary>${name} - ${summary.licenses}</summary><pre><code>${license}</code></pre></details>\n`;
      }
      resolve();
    },
  ),
);

fs.writeFileSync(path.join(ROOT_PATH, "THIRD-PARTY-NOTICES.md"), md);
