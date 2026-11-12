// Team generation, copied from the JPL project (logic kept the same on purpose).
import * as XLSX from "xlsx";

export interface SheetPlayer {
  name: string;
  age: number;
}

// Players who are spread across teams first (one per team, round robin)
export const MVPMenList: string[] = [
  "Krushnadev Hipparkar", "Suraj More", "Pravin Deshmukh", "Rahul Kedar", "Kamlesh Patil", "Dnyanesh Raut",
  "Sunil Kumar Roy", "Rahul Shetti", "Mukund Thonge", "Shrikanth Dhatrak", "Pradip Gorle", "Jeevan Ghorpade",
];

export const MensTeamNames = ["Doremon", "Nobita", "Tom", "Jerry", "Raichu", "Pikachu", "Motu", "Patlu", "Shinchan", "SpongeBob SquarePants"];
export const WomensTeamNames = ["Wonder Woman", "Captian Marvel", "Mantis", "Moondragon"];
export const BoysTeamNames = ["Captian America", "Iron Man", "The Hulk", "Spider Man", "Batman", "Thor", "Loki", "Black Panther", "Hawkeye", "Vision"];
export const GirlsTeamNames = ["Cinderella", "Snow White", "Tom", "Jerry", "Moana", "Minnie Mouse"];

export type Category = "men" | "women" | "boys" | "girls";

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

function distributeMVPPlayers(teams: string[][], special: string[]): void {
  if (!teams.length) return;
  let teamIndex = 0;
  special.forEach((player) => {
    teams[teamIndex].push(player);
    teamIndex = (teamIndex + 1) % teams.length;
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
}

export type GeneratedTeams = Record<Category, string[][]>;

export function generateTeams({ workbook, sizes }: GenerateInput): GeneratedTeams {
  const men = extractNamesAndAges(workbook, CATEGORY_INFO.men.sheet);
  const women = extractNamesAndAges(workbook, CATEGORY_INFO.women.sheet);
  const boys = extractNamesAndAges(workbook, CATEGORY_INFO.boys.sheet);
  const girls = extractNamesAndAges(workbook, CATEGORY_INFO.girls.sheet);

  // Men: age 13 and above; the special (MVP) players are spread first, then the rest fill the teams
  const menNames = men.filter((p) => p.age >= 13).map((p) => p.name);
  const mvp = menNames.filter((n) => MVPMenList.includes(n));
  const others = menNames.filter((n) => !MVPMenList.includes(n));
  shuffleArray(mvp);
  shuffleArray(others);

  const totalTeams = Math.ceil(menNames.length / sizes.men);
  const menTeams = initializeEmptyTeams(totalTeams);
  distributeMVPPlayers(menTeams, mvp);

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

export function exportExcel(teams: GeneratedTeams, selected: Category[]): boolean {
  const wb = XLSX.utils.book_new();
  let any = false;
  for (const c of selected) {
    if (teams[c].length > 0) {
      const sheet = XLSX.utils.aoa_to_sheet(sheetRows(teams[c], CATEGORY_INFO[c].teamNames));
      XLSX.utils.book_append_sheet(wb, sheet, `${CATEGORY_INFO[c].label} Teams`);
      any = true;
    }
  }
  if (any) XLSX.writeFile(wb, "Generated_Teams_Excel.xlsx");
  return any;
}
