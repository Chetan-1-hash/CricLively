// Team generation, copied from the JPL project (logic kept the same on purpose).
import * as XLSX from "xlsx";

export interface SheetPlayer {
  name: string;
  age: number;
}

// Built-in lists, used until a "MVP & team names" file is uploaded
export const MVPMenList: string[] = [
  "Krushnadev Hipparkar", "Suraj More", "Pravin Deshmukh", "Rahul Kedar", "Kamlesh Patil", "Dnyanesh Raut",
  "Sunil Kumar Roy", "Rahul Shetti", "Mukund Thonge", "Shrikanth Dhatrak", "Pradip Gorle", "Jeevan Ghorpade",
];

export const MensTeamNames = ["Doremon", "Nobita", "Tom", "Jerry", "Raichu", "Pikachu", "Motu", "Patlu", "Shinchan", "SpongeBob SquarePants"];
export const WomensTeamNames = ["Wonder Woman", "Captian Marvel", "Mantis", "Moondragon"];
export const BoysTeamNames = ["Captian America", "Iron Man", "The Hulk", "Spider Man", "Batman", "Thor", "Loki", "Black Panther", "Hawkeye", "Vision"];
export const GirlsTeamNames = ["Cinderella", "Snow White", "Tom", "Jerry", "Moana", "Minnie Mouse"];

export type Category = "men" | "women" | "boys" | "girls";

/** One MVP player; `value` (optional) is the rating from the sheet: higher = stronger. */
export interface MvpPlayer {
  name: string;
  value: number | null;
}

/** Everything the person can change by uploading a file. */
export interface TeamConfig {
  mvp: MvpPlayer[];
  teamNames: Record<Category, string[]>;
  source: string | null; // file name, null = built-in lists
}

export function defaultConfig(): TeamConfig {
  return {
    mvp: MVPMenList.map((name) => ({ name, value: null })),
    teamNames: {
      men: MensTeamNames,
      women: WomensTeamNames,
      boys: BoysTeamNames,
      girls: GirlsTeamNames,
    },
    source: null,
  };
}

/** "  rahul   KEDAR Patil " -> "rahul patil": first + last name, lower case, so spellings match. */
export function normalizeName(raw: string): string {
  const parts = String(raw).trim().toLowerCase().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0] ?? "";
}

function findSheet(wb: XLSX.WorkBook, name: string): XLSX.WorkSheet | undefined {
  const key = wb.SheetNames.find((n) => n.trim().toLowerCase() === name);
  return key ? wb.Sheets[key] : undefined;
}

const col = (header: unknown[], ...names: string[]) =>
  header.findIndex((h) => names.includes(String(h ?? "").trim().toLowerCase()));

/**
 * Reads the "MVP & team names" file.
 *   Sheet "MVP":   column FullName (or Name) and, optional, Value (or Points / Rating / Score)
 *   Sheet "Teams": one column per category with the header Men, Women, Boys or Girls
 * Anything missing keeps the built-in list.
 */
export function parseConfig(workbook: XLSX.WorkBook, fileName: string): { config: TeamConfig; summary: string } {
  const config = defaultConfig();
  config.source = fileName;
  const notes: string[] = [];

  const mvpSheet = findSheet(workbook, "mvp");
  if (mvpSheet) {
    const rows: unknown[][] = XLSX.utils.sheet_to_json(mvpSheet, { header: 1 });
    const header = rows[0] ?? [];
    const nameIdx = col(header, "fullname", "full name", "name");
    const valueIdx = col(header, "value", "points", "rating", "score", "mvp value");
    if (nameIdx < 0) throw new Error('Sheet "MVP" needs a column called FullName');
    const list: MvpPlayer[] = [];
    for (let i = 1; i < rows.length; i++) {
      const name = rows[i]?.[nameIdx];
      if (!name) continue;
      const raw = valueIdx >= 0 ? Number(rows[i][valueIdx]) : NaN;
      list.push({ name: String(name).trim(), value: Number.isFinite(raw) ? raw : null });
    }
    config.mvp = list;
    notes.push(`${list.length} MVP players${valueIdx >= 0 ? " (with values)" : ""}`);
  }

  const teamsSheet = findSheet(workbook, "teams");
  if (teamsSheet) {
    const rows: unknown[][] = XLSX.utils.sheet_to_json(teamsSheet, { header: 1 });
    const header = rows[0] ?? [];
    (Object.keys(CATEGORY_INFO) as Category[]).forEach((c) => {
      const idx = col(header, c, CATEGORY_INFO[c].label.toLowerCase());
      if (idx < 0) return;
      const names = rows
        .slice(1)
        .map((r) => String(r?.[idx] ?? "").trim())
        .filter(Boolean);
      if (names.length > 0) {
        config.teamNames[c] = names;
        notes.push(`${names.length} ${CATEGORY_INFO[c].label} team names`);
      }
    });
  }

  if (!mvpSheet && !teamsSheet) throw new Error('The file needs a sheet called "MVP" and/or a sheet called "Teams"');
  return { config, summary: notes.join(", ") };
}

/** A ready-to-fill example file (the built-in lists), so the layout is clear. */
export function downloadConfigTemplate(): void {
  const wb = XLSX.utils.book_new();
  const mvp = [["FullName", "Value"], ...MVPMenList.map((n) => [n, ""])];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(mvp), "MVP");
  const lists = [MensTeamNames, WomensTeamNames, BoysTeamNames, GirlsTeamNames];
  const most = Math.max(...lists.map((l) => l.length));
  const teams: string[][] = [["Men", "Women", "Boys", "Girls"]];
  for (let i = 0; i < most; i++) teams.push(lists.map((l) => l[i] ?? ""));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(teams), "Teams");
  XLSX.writeFile(wb, "MVP_and_Team_Names_Template.xlsx");
}

export const CATEGORY_INFO: Record<Category, { label: string; sheet: string; teamNames: string[] }> = {
  men: { label: "Men", sheet: "MEN", teamNames: MensTeamNames },
  women: { label: "Women", sheet: "WOMEN", teamNames: WomensTeamNames },
  boys: { label: "Boys", sheet: "Boys", teamNames: BoysTeamNames },
  girls: { label: "Girls", sheet: "Girls", teamNames: GirlsTeamNames },
};

/** Reads one sheet: needs the columns "FullName" and "Age". Keeps first + last name only. */
export function extractNamesAndAges(workbook: XLSX.WorkBook, sheetName: string): SheetPlayer[] {
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return []; // a missing sheet = nobody in that category (the page tells the person)

  const rows: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  if (!rows.length) return [];
  const fullNameIndex = rows[0].indexOf("FullName");
  const ageIndex = rows[0].indexOf("Age");
  if (fullNameIndex < 0 || ageIndex < 0) {
    throw new Error(`Sheet "${sheetName}" needs the columns FullName and Age`);
  }

  const players: SheetPlayer[] = [];
  for (let i = 1; i < rows.length; i++) {
    const rawName = rows[i][fullNameIndex];
    const age = rows[i][ageIndex];
    if (rawName && age) {
      const parts = String(rawName).split(" ").filter(Boolean);
      const name = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : String(rawName);
      players.push({ name, age: Number(age) });
    }
  }
  return players;
}

export function shuffleArray(arr: string[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function splitIntoTeams(players: string[], teamSize: number): string[][] {
  const teams: string[][] = [];
  for (let i = 0; i < players.length; i += teamSize) {
    teams.push(players.slice(i, i + teamSize));
  }
  return teams;
}

function initializeEmptyTeams(total: number): string[][] {
  return Array.from({ length: total }, () => []);
}

/**
 * Spreads the MVP players so every team gets some.
 * Without values: one by one, round robin (as before).
 * With values: strongest first, in a snake (1..n, n..1, 1..n ...) so the teams stay balanced.
 */
function distributeMVPPlayers(teams: string[][], special: string[], snake: boolean): void {
  if (!teams.length) return;
  let teamIndex = 0;
  let step = 1;
  special.forEach((player) => {
    teams[teamIndex].push(player);
    if (!snake) {
      teamIndex = (teamIndex + 1) % teams.length;
    } else if (teams.length > 1) {
      const next = teamIndex + step;
      if (next < 0 || next >= teams.length) step = -step; // turn around: the same team picks again
      else teamIndex = next;
    }
  });
}

function fillTeams(teams: string[][], remaining: string[], teamSize: number): string[][] {
  for (const player of remaining) {
    for (const team of teams) {
      if (team.length < teamSize) {
        team.push(player);
        break;
      }
    }
  }
  return teams;
}

export interface GenerateInput {
  workbook: XLSX.WorkBook;
  sizes: Record<Category, number>;
  config?: TeamConfig; // MVP list + team names (built-in when not given)
}

export type GeneratedTeams = Record<Category, string[][]>;

export function generateTeams({ workbook, sizes, config = defaultConfig() }: GenerateInput): GeneratedTeams {
  const men = extractNamesAndAges(workbook, CATEGORY_INFO.men.sheet);
  const women = extractNamesAndAges(workbook, CATEGORY_INFO.women.sheet);
  const boys = extractNamesAndAges(workbook, CATEGORY_INFO.boys.sheet);
  const girls = extractNamesAndAges(workbook, CATEGORY_INFO.girls.sheet);

  // Men: age 13 and above; the MVP players are spread first, then the rest fill the teams
  const menNames = men.filter((p) => p.age >= 13).map((p) => p.name);
  const valueOf = new Map<string, number | null>(config.mvp.map((m) => [normalizeName(m.name), m.value]));
  const mvp = menNames.filter((n) => valueOf.has(normalizeName(n)));
  const others = menNames.filter((n) => !valueOf.has(normalizeName(n)));
  shuffleArray(mvp);
  shuffleArray(others);

  // when the sheet gives values: strongest first (the shuffle above only breaks ties)
  const hasValues = mvp.some((n) => valueOf.get(normalizeName(n)) != null);
  if (hasValues) {
    mvp.sort((x, y) => (valueOf.get(normalizeName(y)) ?? -Infinity) - (valueOf.get(normalizeName(x)) ?? -Infinity));
  }

  const totalTeams = Math.ceil(menNames.length / sizes.men);
  const menTeams = initializeEmptyTeams(totalTeams);
  distributeMVPPlayers(menTeams, mvp, hasValues);

  return {
    men: fillTeams(menTeams, others, sizes.men),
    women: splitIntoTeams(women.map((p) => p.name), sizes.women),
    boys: splitIntoTeams(boys.map((p) => p.name), sizes.boys),
    girls: splitIntoTeams(girls.map((p) => p.name), sizes.girls),
  };
}

/** Excel layout: team names across the top, players underneath, one blank column between teams. */
export function sheetRows(teams: string[][], teamNames: string[]): string[][] {
  const rows: string[][] = [];
  const header: string[] = [];
  teams.forEach((_, i) => {
    header.push(teamNames[i] || `Team-${i + 1}`);
    if (i < teams.length - 1) header.push("");
  });
  rows.push(header);

  const maxPlayers = Math.max(0, ...teams.map((t) => t.length));
  for (let i = 0; i < maxPlayers; i++) {
    const row: string[] = [];
    teams.forEach((team, idx) => {
      row.push(team[i] || "");
      if (idx < teams.length - 1) row.push("");
    });
    rows.push(row);
  }
  return rows;
}

export function exportExcel(
  teams: GeneratedTeams,
  selected: Category[],
  teamNames: Record<Category, string[]> = defaultConfig().teamNames
): boolean {
  const wb = XLSX.utils.book_new();
  let any = false;
  for (const c of selected) {
    if (teams[c].length > 0) {
      const sheet = XLSX.utils.aoa_to_sheet(sheetRows(teams[c], teamNames[c]));
      XLSX.utils.book_append_sheet(wb, sheet, `${CATEGORY_INFO[c].label} Teams`);
      any = true;
    }
  }
  if (any) XLSX.writeFile(wb, "Generated_Teams_Excel.xlsx");
  return any;
}

/**
 * PDF drawn directly with jsPDF (no screenshot of the page).
 * The old way took a picture of the page with html2canvas, which cannot read the modern
 * colors the page uses, so it failed. This one never touches the page.
 */
export async function exportPdf(
  teams: GeneratedTeams,
  selected: Category[],
  teamNames: Record<Category, string[]> = defaultConfig().teamNames
): Promise<boolean> {
  const chosen = selected.filter((c) => teams[c].length > 0);
  if (chosen.length === 0) return false;

  const { default: jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36, colW = 170, gap = 14, rowH = 18, headH = 24;
  const perRow = Math.max(1, Math.floor((pageW - 2 * margin + gap) / (colW + gap)));
  const rowsPerPage = Math.max(1, Math.floor((pageH - 2 * margin - headH) / rowH));
  let y = margin;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Generated Teams", margin, y + 12);
  y += 34;

  for (const c of chosen) {
    if (y + 20 + headH + rowH > pageH - margin) {
      doc.addPage();
      y = margin;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(CATEGORY_INFO[c].label, margin, y + 12);
    y += 22;

    for (let start = 0; start < teams[c].length; start += perRow) {
      const group = teams[c].slice(start, start + perRow);
      const maxPlayers = Math.max(...group.map((t) => t.length), 1);

      for (let r0 = 0; r0 < maxPlayers; r0 += rowsPerPage) {
        const rows = Math.min(rowsPerPage, maxPlayers - r0);
        if (y + headH + rows * rowH > pageH - margin) {
          doc.addPage();
          y = margin;
        }
        group.forEach((team, g) => {
          const x = margin + g * (colW + gap);
          const name = teamNames[c][start + g] || `Team-${start + g + 1}`;
          doc.setFillColor(220, 38, 38);
          doc.rect(x, y, colW, headH, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(11);
          doc.setTextColor(255, 255, 255);
          doc.text(doc.splitTextToSize(name, colW - 12)[0], x + 6, y + 16);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(0, 0, 0);
          doc.setDrawColor(220, 220, 220);
          for (let r = 0; r < rows; r++) {
            const idx = r0 + r;
            const ry = y + headH + r * rowH;
            doc.rect(x, ry, colW, rowH);
            const player = team[idx];
            if (!player) continue;
            const label = c === "men" && idx === 0 ? `CAPTAIN: ${player}` : player;
            doc.text(doc.splitTextToSize(label, colW - 12)[0], x + 6, ry + 12);
          }
        });
        y += headH + rows * rowH + 6;
      }
      y += 10;
    }
    y += 8;
  }

  doc.save("Generated_Teams.pdf");
  return true;
}
