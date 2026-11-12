import { useState } from "react";
import { motion } from "framer-motion";
import * as XLSX from "xlsx";
import Navbar from "./Navbar";
import { toast } from "../hooks/use-toast";
import {
  CATEGORY_INFO,
  defaultConfig,
  downloadConfigTemplate,
  exportExcel,
  exportPdf,
  generateTeams,
  parseConfig,
  type Category,
  type GeneratedTeams,
  type TeamConfig,
} from "../lib/teamGeneration";
import { Spinner } from "./Spinner";

const CATEGORIES: Category[] = ["men", "women", "boys", "girls"];
const EMPTY: GeneratedTeams = { men: [], women: [], boys: [], girls: [] };

// Upload an Excel file (sheets MEN, WOMEN, Boys, Girls with the columns FullName and Age),
// pick the categories and team sizes, and generate teams. Everything happens in the browser.
export default function TeamGeneration() {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState("");
  const [selected, setSelected] = useState<Record<Category, boolean>>({ men: false, women: false, boys: false, girls: false });
  const [sizes, setSizes] = useState<Record<Category, number>>({ men: 7, women: 7, boys: 7, girls: 7 });
  const [teams, setTeams] = useState<GeneratedTeams>(EMPTY);
  const [config, setConfig] = useState<TeamConfig>(defaultConfig());
  const [configSummary, setConfigSummary] = useState("");
  const [pdfBusy, setPdfBusy] = useState(false);

  // optional second file: MVP players (with values) and team names
  const onConfigFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const wb = XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" });
        const { config: c, summary } = parseConfig(wb, file.name);
        setConfig(c);
        setConfigSummary(summary);
        setTeams(EMPTY);
        toast({ title: "MVP / team names file loaded", description: summary });
      } catch (err) {
        toast({ title: "Could not use that file", description: (err as Error).message, variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };
  const resetConfig = () => {
    setConfig(defaultConfig());
    setConfigSummary("");
    setTeams(EMPTY);
  };

  const chosen = CATEGORIES.filter((c) => selected[c]);
  const hasOutput = chosen.some((c) => teams[c].length > 0);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        setWorkbook(XLSX.read(ev.target?.result as ArrayBuffer, { type: "array" }));
        setFileName(file.name);
        setTeams(EMPTY);
      } catch {
        toast({ title: "Could not read the file", description: "Upload an Excel file (.xlsx).", variant: "destructive" });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const generate = () => {
    if (!workbook) {
      toast({ title: "No file loaded", description: "Upload the Excel file first.", variant: "destructive" });
      return;
    }
    if (chosen.length === 0) {
      toast({ title: "Pick a category", description: "Select at least one of Men, Women, Boys, Girls.", variant: "destructive" });
      return;
    }
    if (chosen.some((c) => !Number.isInteger(sizes[c]) || sizes[c] < 1)) {
      toast({ title: "Team size must be 1 or more", variant: "destructive" });
      return;
    }
    try {
      const result = generateTeams({ workbook, sizes, config });
      setTeams(result);
      const empty = chosen.filter((c) => result[c].length === 0).map((c) => CATEGORY_INFO[c].sheet);
      if (empty.length > 0) {
        toast({
          title: "No players found",
          description: `Check the sheet ${empty.join(", ")} (columns FullName and Age).`,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({ title: "Could not generate teams", description: (e as Error).message, variant: "destructive" });
    }
  };

  const pdf = async () => {
    if (!hasOutput) {
      toast({ title: "Nothing to export", description: "Generate the teams first.", variant: "destructive" });
      return;
    }
    setPdfBusy(true);
    try {
      await exportPdf(teams, chosen, config.teamNames);
    } catch (e) {
      toast({ title: "Could not create the PDF", description: (e as Error).message, variant: "destructive" });
    } finally {
      setPdfBusy(false);
    }
  };

  const excel = () => {
    if (!exportExcel(teams, chosen, config.teamNames)) {
      toast({ title: "Nothing to export", description: "Generate the teams first.", variant: "destructive" });
    }
  };

  return (
    <>
      <Navbar />
      <section className="min-h-[100vh] pt-28 pb-12 px-4 flex flex-col items-center">
        <motion.h1
          className="text-4xl md:text-5xl font-extrabold text-foreground mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Create the Team
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md bg-card/80 backdrop-blur-xl rounded-3xl p-6 shadow-2xl space-y-5"
        >
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1">Upload file</label>
            <input type="file" accept=".xlsx,.xls" onChange={onFile} className="text-sm text-foreground" />
            {fileName && <p className="text-xs text-foreground/60 mt-1">{fileName}</p>}
            <p className="text-xs text-foreground/60 mt-2">
              Sheets: MEN, WOMEN, Boys, Girls. Columns: FullName, Age.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Categories</p>
            <div className="flex flex-wrap gap-4">
              {CATEGORIES.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={selected[c]}
                    onChange={(e) => setSelected({ ...selected, [c]: e.target.checked })}
                    className="accent-red-600"
                  />
                  {CATEGORY_INFO[c].label}
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-background/50 p-3">
            <label className="block text-sm font-semibold text-foreground mb-1">MVP players and team names (optional)</label>
            <input type="file" accept=".xlsx,.xls" onChange={onConfigFile} className="text-sm text-foreground" />
            <p className="text-xs text-foreground/60 mt-2">
              Sheet "MVP": FullName and, if you have them, Value. Sheet "Teams": columns Men, Women, Boys, Girls with the
              team names. With values, the strongest MVPs are spread first, in a snake order, so teams stay balanced.
            </p>
            <p className="text-xs mt-1 text-foreground/80">
              {config.source ? `Using ${config.source}: ${configSummary}` : "Using the built-in lists."}
            </p>
            <div className="flex gap-3 mt-2">
              <button onClick={downloadConfigTemplate} className="text-xs font-semibold underline text-foreground/70">
                Download example file
              </button>
              {config.source && (
                <button onClick={resetConfig} className="text-xs font-semibold underline text-foreground/70">
                  Use built-in lists
                </button>
              )}
            </div>
          </div>

          {chosen.length > 0 && (
            <div className="space-y-3">
              {chosen.map((c) => (
                <div key={c} className="flex items-center justify-between gap-3">
                  <label className="text-sm text-foreground">Team size ({CATEGORY_INFO[c].label})</label>
                  <input
                    type="number"
                    min={1}
                    value={sizes[c]}
                    onChange={(e) => setSizes({ ...sizes, [c]: Number(e.target.value) })}
                    className="w-24 px-3 py-2 rounded-xl bg-background/70 border border-border text-sm"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <button onClick={generate} className="flex-1 py-2.5 rounded-full bg-red-600 text-white text-sm font-semibold">
              Generate Teams
            </button>
            <button onClick={pdf} className="flex-1 py-2.5 rounded-full border-2 border-red-600 text-red-600 text-sm font-semibold">
              {pdfBusy ? <Spinner label="Creating…" size={16} /> : "Export PDF"}
            </button>
            <button onClick={excel} className="flex-1 py-2.5 rounded-full border-2 border-red-600 text-red-600 text-sm font-semibold">
              Export Excel
            </button>
          </div>
        </motion.div>

        {hasOutput && (
          <div className="w-full max-w-6xl mt-10 p-4 bg-white rounded-3xl text-black">
            {chosen.map(
              (c) =>
                teams[c].length > 0 && (
                  <div key={c} className="mb-6 last:mb-0">
                    <p className="text-xl font-bold mb-3">{CATEGORY_INFO[c].label}</p>
                    <div className="flex flex-wrap gap-4">
                      {teams[c].map((team, i) => (
                        <table key={i} className="min-w-[180px] border border-black/20 text-sm">
                          <thead>
                            <tr>
                              <th className="bg-red-600 text-white px-3 py-2 text-left">
                                {config.teamNames[c][i] || `Team-${i + 1}`}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {team.map((player, p) => (
                              <tr key={p} className="border-t border-black/10">
                                <td className="px-3 py-1.5">
                                  {c === "men" && p === 0 && <b className="text-red-600">CAPTAIN: </b>}
                                  {player}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ))}
                    </div>
                  </div>
                )
            )}
          </div>
        )}
      </section>
    </>
  );
}
