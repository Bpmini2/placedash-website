"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

type Decision = "BET" | "WATCH" | "LOW VALUE" | "AVOID";

type Runner = {
  horse_number?: string | number;
  number?: string | number;
  runner_number?: string | number;
  saddlecloth?: string | number;

  horse_name?: string;
  name?: string;
  runner_name?: string;

  form?: string;
  recent_form?: string;

  ai_decision?: Decision | string;
  decision?: Decision | string;
  confidence?: string | number;
  ai_score?: number;
  score?: number;
  reasoning?: string;
  reasons?: string[];

  sb_win?: number | string;
  sb_place?: number | string;
  lb_win?: number | string;
  lb_place?: number | string;

  sportsbet_win?: number | string;
  sportsbet_place?: number | string;
  ladbrokes_win?: number | string;
  ladbrokes_place?: number | string;

  odds?: {
    sportsbet?: {
      win?: number | string;
      place?: number | string;
    };
    ladbrokes?: {
      win?: number | string;
      place?: number | string;
    };
    win?: number | string;
    place?: number | string;
  };

  stats?: {
    starts?: number;
    places?: number;
    place_percentage?: number;
    place_percent?: number;
    place_strike_rate?: number;
  };

  starts?: number;
  places?: number;
  place_percentage?: number;
  place_percent?: number;
  place_strike_rate?: number;

  [key: string]: any;
};

type Race = {
  race_date?: string;
  date?: string;
  course?: string;
  track?: string;
  venue?: string;
  race_number?: string | number;
  number?: string | number;
  race_time?: string;
  time?: string;
  state?: string;
  distance?: string | number;
  condition?: string;
  track_condition?: string;
  runner_count?: number;
  runners?: Runner[];
  selections?: Runner[];
  race_card_json?: any;
  [key: string]: any;
};

type FavouriteSplitBankSummary = {
  current_bank?: number;
  currentBank?: number;
  bank?: number;
  summary?: {
    current_bank?: number;
    currentBank?: number;
    bank?: number;
  };
};

const STARTING_FAVOURITE_SPLIT_BANK = 1000;

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const cleaned = String(value).replace(/[^0-9.]/g, "");
  if (!cleaned) return null;

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function money(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "-";
  return `$${value.toFixed(2)}`;
}

function odds(value: unknown): string {
  const n = toNumber(value);
  return n ? n.toFixed(2) : "-";
}

function getRaceDate(race: Race): string {
  return String(race.race_date || race.date || "");
}

function getCourse(race: Race): string {
  return String(race.course || race.track || race.venue || "Unknown Track");
}

function getRaceNumber(race: Race): string {
  return String(race.race_number || race.number || "");
}

function getRaceTime(race: Race): string {
  return String(race.race_time || race.time || "");
}

function getRaceState(race: Race): string {
  return String(race.state || "");
}

function getRaceDistance(race: Race): string {
  return race.distance ? String(race.distance) : "";
}

function getRaceCondition(race: Race): string {
  return String(race.condition || race.track_condition || "");
}

function getRunnerNumber(runner: Runner): string {
  return String(
    runner.horse_number ||
      runner.number ||
      runner.runner_number ||
      runner.saddlecloth ||
      ""
  );
}

function getRunnerName(runner: Runner): string {
  return String(runner.horse_name || runner.name || runner.runner_name || "Unknown Runner");
}

function getRunnerForm(runner: Runner): string {
  return String(runner.form || runner.recent_form || "");
}

function getRunnerStarts(runner: Runner): number {
  return (
    toNumber(runner.stats?.starts) ||
    toNumber(runner.starts) ||
    toNumber(runner.total_starts) ||
    0
  );
}

function getApiPlacePercent(runner: Runner): number {
  return (
    toNumber(runner.stats?.place_percentage) ||
    toNumber(runner.stats?.place_percent) ||
    toNumber(runner.stats?.place_strike_rate) ||
    toNumber(runner.place_percentage) ||
    toNumber(runner.place_percent) ||
    toNumber(runner.place_strike_rate) ||
    0
  );
}

function hasRecentTop3FromVisibleForm(runner: Runner): boolean {
  const form = getRunnerForm(runner);
  if (!form) return false;

  const visibleResults = form
    .replace(/[xXfFlLsS]/g, "")
    .split("")
    .filter((char) => /[0-9]/.test(char));

  const recentResults = visibleResults.slice(0, 5);

  return recentResults.some((result) => ["1", "2", "3"].includes(result));
}

function getEffectivePlaceSupport(runner: Runner): boolean {
  const apiPlacePercent = getApiPlacePercent(runner);

  if (apiPlacePercent > 0) return true;

  return hasRecentTop3FromVisibleForm(runner);
}

function normaliseDecision(value: unknown): Decision {
  const decision = String(value || "").toUpperCase();

  if (decision === "BET") return "BET";
  if (decision === "WATCH") return "WATCH";
  if (decision === "LOW VALUE" || decision === "LOW_VALUE") return "LOW VALUE";

  return "AVOID";
}

function getRunnerDecision(runner: Runner): Decision {
  const existingDecision = runner.ai_decision || runner.decision || runner.selection_status;

  if (existingDecision) {
    return normaliseDecision(existingDecision);
  }

  const score = toNumber(runner.ai_score || runner.score) || 0;
  const starts = getRunnerStarts(runner);
  const hasPlaceSupport = getEffectivePlaceSupport(runner);

  if (starts < 3) return "WATCH";
  if (!hasPlaceSupport) return "AVOID";
  if (score >= 70) return "BET";
  if (score >= 55) return "WATCH";
  if (score >= 45) return "LOW VALUE";

  return "AVOID";
}

function getRunnerScore(runner: Runner): number {
  return toNumber(runner.ai_score || runner.score || runner.confidence) || 0;
}

function getRunnerConfidence(runner: Runner): string {
  const confidence = runner.confidence;

  if (typeof confidence === "string" && confidence.trim()) {
    return confidence;
  }

  const score = getRunnerScore(runner);

  if (score >= 70) return "High";
  if (score >= 55) return "Medium";
  if (score > 0) return "Low";

  return "-";
}

function getRunnerReasoning(runner: Runner): string {
  if (runner.reasoning) return String(runner.reasoning);
  if (Array.isArray(runner.reasons)) return runner.reasons.join(", ");

  const hasPlaceSupport = getEffectivePlaceSupport(runner);
  const starts = getRunnerStarts(runner);

  if (starts < 3) return "Less than 3 career starts — not eligible as official BET.";
  if (!hasPlaceSupport) return "No recent top-3 placing support found.";
  return "Profile assessed by PlaceDash AI.";
}

function getSbWin(runner: Runner): number | null {
  return (
    toNumber(runner.sb_win) ||
    toNumber(runner.sportsbet_win) ||
    toNumber(runner.odds?.sportsbet?.win)
  );
}

function getSbPlace(runner: Runner): number | null {
  return (
    toNumber(runner.sb_place) ||
    toNumber(runner.sportsbet_place) ||
    toNumber(runner.odds?.sportsbet?.place)
  );
}

function getLbWin(runner: Runner): number | null {
  return (
    toNumber(runner.lb_win) ||
    toNumber(runner.ladbrokes_win) ||
    toNumber(runner.odds?.ladbrokes?.win)
  );
}

function getLbPlace(runner: Runner): number | null {
  return (
    toNumber(runner.lb_place) ||
    toNumber(runner.ladbrokes_place) ||
    toNumber(runner.odds?.ladbrokes?.place)
  );
}

function getBestAvailableWinOdds(runner: Runner): number | null {
  const sb = getSbWin(runner);
  const lb = getLbWin(runner);
  const options = [sb, lb].filter((value): value is number => !!value && value > 0);

  if (!options.length) return null;

  return Math.min(...options);
}

function getFavouriteOdds(runner: Runner): {
  winOdds: number | null;
  placeOdds: number | null;
  source: "Sportsbet" | "Ladbrokes" | "Unknown";
} {
  const sbWin = getSbWin(runner);
  const lbWin = getLbWin(runner);
  const sbPlace = getSbPlace(runner);
  const lbPlace = getLbPlace(runner);

  if (sbWin && lbWin) {
    if (sbWin <= lbWin) {
      return {
        winOdds: sbWin,
        placeOdds: sbPlace || lbPlace || null,
        source: "Sportsbet",
      };
    }

    return {
      winOdds: lbWin,
      placeOdds: lbPlace || sbPlace || null,
      source: "Ladbrokes",
    };
  }

  if (sbWin) {
    return {
      winOdds: sbWin,
      placeOdds: sbPlace || lbPlace || null,
      source: "Sportsbet",
    };
  }

  if (lbWin) {
    return {
      winOdds: lbWin,
      placeOdds: lbPlace || sbPlace || null,
      source: "Ladbrokes",
    };
  }

  return {
    winOdds: null,
    placeOdds: sbPlace || lbPlace || null,
    source: "Unknown",
  };
}

function getFavouriteRunner(race: Race): Runner | null {
  const runners = race.runners || race.selections || [];

  const runnersWithOdds = runners
    .map((runner) => ({
      runner,
      winOdds: getBestAvailableWinOdds(runner),
    }))
    .filter((item) => item.winOdds !== null && item.winOdds > 0)
    .sort((a, b) => Number(a.winOdds) - Number(b.winOdds));

  return runnersWithOdds[0]?.runner || null;
}

function getOfficialBetRunner(race: Race): Runner | null {
  const runners = race.runners || race.selections || [];

  return runners.find((runner) => getRunnerDecision(runner) === "BET") || null;
}

function getRaceCardJson(race: Race): any {
  return race.race_card_json || race;
}

function getDecisionClasses(decision: Decision): string {
  if (decision === "BET") {
    return "border-green-400 bg-green-500/15 text-green-300";
  }

  if (decision === "WATCH") {
    return "border-sky-400 bg-sky-500/15 text-sky-300";
  }

  if (decision === "LOW VALUE") {
    return "border-yellow-400 bg-yellow-500/15 text-yellow-300";
  }

  return "border-red-400 bg-red-500/15 text-red-300";
}

function getDecisionText(decision: Decision): string {
  if (decision === "BET") return "Official PlaceDash selection";
  if (decision === "WATCH") return "Possible contender — punter decides";
  if (decision === "LOW VALUE") return "Good profile maybe, but price too short";
  return "AI does not like the profile";
}

function getFavouriteSplitCurrentBank(data: FavouriteSplitBankSummary): number {
  return (
    toNumber(data.current_bank) ||
    toNumber(data.currentBank) ||
    toNumber(data.bank) ||
    toNumber(data.summary?.current_bank) ||
    toNumber(data.summary?.currentBank) ||
    toNumber(data.summary?.bank) ||
    STARTING_FAVOURITE_SPLIT_BANK
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();

  const isAdmin = searchParams.get("admin") === "true";
  const isAdminReviewToday = isAdmin && searchParams.get("debugToday") === "true";
  const isAdminPreviewTomorrow = isAdmin && searchParams.get("forcePreview") === "true";

  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedRace, setSelectedRace] = useState<Race | null>(null);
  const [savingRaceKey, setSavingRaceKey] = useState("");
  const [savingFavouriteRaceKey, setSavingFavouriteRaceKey] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [favouriteSplitBank, setFavouriteSplitBank] = useState<number>(
    STARTING_FAVOURITE_SPLIT_BANK
  );

  const endpoint = isAdminPreviewTomorrow
    ? "/api/placedash-races/preview"
    : "/api/placedash-races/today";

  useEffect(() => {
    async function loadRaces() {
      try {
        setLoading(true);
        setError("");
        setSaveMessage("");

        const response = await fetch(endpoint, {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(`Failed to load races: ${response.status}`);
        }

        const data = await response.json();

        const loadedRaces: Race[] = Array.isArray(data)
          ? data
          : data.races || data.data || data.results || [];

        setRaces(loadedRaces);
      } catch (err: any) {
        setError(err?.message || "Failed to load dashboard races.");
      } finally {
        setLoading(false);
      }
    }

    loadRaces();
  }, [endpoint]);

  useEffect(() => {
    async function loadFavouriteSplitBank() {
      if (!isAdmin) return;

      try {
        const response = await fetch("/api/favourite-split-picks?summary=true", {
          cache: "no-store",
        });

        if (!response.ok) return;

        const data = await response.json();
        setFavouriteSplitBank(getFavouriteSplitCurrentBank(data));
      } catch {
        setFavouriteSplitBank(STARTING_FAVOURITE_SPLIT_BANK);
      }
    }

    loadFavouriteSplitBank();
  }, [isAdmin]);

  const displayRaces = useMemo(() => {
    if (isAdminReviewToday || isAdminPreviewTomorrow) {
      return races;
    }

    return races.filter((race) => !!getOfficialBetRunner(race));
  }, [races, isAdminReviewToday, isAdminPreviewTomorrow]);

  const pageTitle = isAdminPreviewTomorrow
    ? "Admin Preview Tomorrow"
    : isAdminReviewToday
      ? "Admin Review Today"
      : "PlaceDash Dashboard";

  const pageSubtitle = isAdminPreviewTomorrow
    ? "Preview mode only. These races are not saved to the current v2 Track Record."
    : isAdminReviewToday
      ? "Admin review mode shows all qualifying races before the public BET-only filter."
      : "Today’s official PlaceDash BET selections.";

  async function saveV2TrackRecordPick(race: Race) {
    const officialBet = getOfficialBetRunner(race);

    if (!officialBet) {
      setSaveMessage("Only BET selections can be saved to the current v2 Track Record.");
      return;
    }

    const raceKey = `${getRaceDate(race)}-${getCourse(race)}-${getRaceNumber(race)}`;

    try {
      setSavingRaceKey(raceKey);
      setSaveMessage("");

      const payload = {
        race_date: getRaceDate(race),
        course: getCourse(race),
        race_number: getRaceNumber(race),
        race_time: getRaceTime(race),
        state: getRaceState(race),
        distance: getRaceDistance(race),
        condition: getRaceCondition(race),
        runner_count: race.runner_count || (race.runners || []).length,

        horse_number: getRunnerNumber(officialBet),
        horse_name: getRunnerName(officialBet),
        confidence: getRunnerConfidence(officialBet),
        ai_score: getRunnerScore(officialBet),
        reasoning: getRunnerReasoning(officialBet),

        race_card_json: getRaceCardJson(race),
        logic_version: "v2_value_bet",
      };

      const response = await fetch("/api/saved-picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || data?.message || "Failed to save v2 pick.");
      }

      setSaveMessage(`Saved v2 BET pick: ${getRunnerName(officialBet)}.`);
    } catch (err: any) {
      setSaveMessage(err?.message || "Failed to save v2 pick.");
    } finally {
      setSavingRaceKey("");
    }
  }

  async function saveFavouriteSplitPick(race: Race) {
    const favourite = getFavouriteRunner(race);

    if (!favourite) {
      setSaveMessage("No favourite could be found because no win odds were available.");
      return;
    }

    const raceKey = `${getRaceDate(race)}-${getCourse(race)}-${getRaceNumber(race)}`;

    try {
      setSavingFavouriteRaceKey(raceKey);
      setSaveMessage("");

      let currentBank = favouriteSplitBank;

      try {
        const summaryResponse = await fetch("/api/favourite-split-picks?summary=true", {
          cache: "no-store",
        });

        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          currentBank = getFavouriteSplitCurrentBank(summaryData);
          setFavouriteSplitBank(currentBank);
        }
      } catch {
        currentBank = favouriteSplitBank || STARTING_FAVOURITE_SPLIT_BANK;
      }

      const totalStake = Number((currentBank * 0.1).toFixed(2));
      const winStake = Number((totalStake * 0.25).toFixed(2));
      const placeStake = Number((totalStake * 0.75).toFixed(2));

      const favouriteOdds = getFavouriteOdds(favourite);

      const payload = {
        race_date: getRaceDate(race),
        course: getCourse(race),
        race_number: getRaceNumber(race),
        race_time: getRaceTime(race),
        state: getRaceState(race),

        horse_number: getRunnerNumber(favourite),
        horse_name: getRunnerName(favourite),

        favourite_horse_number: getRunnerNumber(favourite),
        favourite_horse_name: getRunnerName(favourite),

        win_odds: favouriteOdds.winOdds,
        place_odds: favouriteOdds.placeOdds,
        odds_source: favouriteOdds.source,

        bank_before_bet: currentBank,
        current_bank: currentBank,
        total_stake: totalStake,
        win_stake: winStake,
        place_stake: placeStake,

        race_card_json: getRaceCardJson(race),
        strategy_version: "v3_favourite_split",
        logic_version: "v3_favourite_split",
      };

      const response = await fetch("/api/favourite-split-picks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || data?.message || "Failed to save Favourite Split test pick."
        );
      }

      setSaveMessage(
        `Saved Favourite Split test pick: ${getRunnerName(favourite)}. Total stake ${money(
          totalStake
        )} — Win ${money(winStake)}, Place ${money(placeStake)}.`
      );
    } catch (err: any) {
      setSaveMessage(err?.message || "Failed to save Favourite Split test pick.");
    } finally {
      setSavingFavouriteRaceKey("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-sm font-semibold text-sky-300 hover:text-sky-200">
              ← PlaceDash
            </Link>

            <h1 className="mt-3 text-3xl font-bold tracking-tight text-white">
              {pageTitle}
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-300">{pageSubtitle}</p>

            <p className="mt-2 text-xs text-slate-400">
              Gamble responsibly. PlaceDash is for analysis and testing only.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300"
            >
              Dashboard
            </Link>

            <Link
              href="/track-record"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300"
            >
              Track Record
            </Link>

            <Link
              href="/bankroll-calculator"
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-sky-400 hover:text-sky-300"
            >
              Bankroll Planner
            </Link>

            {isAdmin && (
              <div className="group relative">
                <button className="rounded-xl border border-sky-500 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-200">
                  Admin ▾
                </button>

                <div className="absolute right-0 z-30 mt-2 hidden w-60 overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-2xl group-hover:block">
                  <Link
                    href="/track-record?admin=true"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 hover:text-sky-300"
                  >
                    Admin Track Record
                  </Link>

                  <Link
                    href="/dashboard?admin=true&debugToday=true"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 hover:text-sky-300"
                  >
                    Admin Review Today
                  </Link>

                  <Link
                    href="/dashboard?admin=true&forcePreview=true"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 hover:text-sky-300"
                  >
                    Admin Preview Tomorrow
                  </Link>

                  <Link
                    href="/track-record-favourite-split?admin=true"
                    className="block px-4 py-3 text-sm text-slate-200 hover:bg-slate-800 hover:text-sky-300"
                  >
                    Admin Favourite Split
                  </Link>
                </div>
              </div>
            )}
          </nav>
        </header>

        {saveMessage && (
          <div className="mb-6 rounded-2xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm text-sky-100">
            {saveMessage}
          </div>
        )}

        {isAdmin && (
          <section className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-100">Admin testing tools</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Favourite Split current bank:{" "}
                  <span className="font-semibold text-sky-300">
                    {money(favouriteSplitBank)}
                  </span>
                  . V3 Favourite Split saves separately and does not affect the v2 Track Record.
                </p>
              </div>

              <Link
                href="/track-record-favourite-split?admin=true"
                className="rounded-xl bg-sky-500 px-4 py-2 text-center text-sm font-bold text-slate-950 hover:bg-sky-400"
              >
                View Favourite Split
              </Link>
            </div>
          </section>
        )}

        {loading && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center text-slate-300">
            Loading PlaceDash races...
          </div>
        )}

        {!loading && error && (
          <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {!loading && !error && displayRaces.length === 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
            <h2 className="text-lg font-bold text-white">No races to show</h2>
            <p className="mt-2 text-sm text-slate-400">
              There are no official BET selections available for this dashboard view.
            </p>
          </div>
        )}

        {!loading && !error && displayRaces.length > 0 && (
          <section className="grid gap-5">
            {displayRaces.map((race) => {
              const runners = race.runners || race.selections || [];
              const officialBet = getOfficialBetRunner(race);
              const favourite = getFavouriteRunner(race);
              const cardRunner = officialBet || favourite || runners[0] || null;
              const cardDecision = cardRunner ? getRunnerDecision(cardRunner) : "AVOID";
              const raceKey = `${getRaceDate(race)}-${getCourse(race)}-${getRaceNumber(race)}`;
              const favouriteOdds = favourite ? getFavouriteOdds(favourite) : null;

              return (
                <article
                  key={raceKey}
                  className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 shadow-xl"
                >
                  <div className="border-b border-slate-800 bg-slate-900 p-5">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
                            {getCourse(race)}
                          </span>

                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
                            Race {getRaceNumber(race)}
                          </span>

                          {getRaceState(race) && (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
                              {getRaceState(race)}
                            </span>
                          )}

                          {getRaceTime(race) && (
                            <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-bold text-slate-200">
                              {getRaceTime(race)}
                            </span>
                          )}
                        </div>

                        <h2 className="mt-4 text-2xl font-bold text-white">
                          {cardRunner ? getRunnerName(cardRunner) : "Race card"}
                        </h2>

                        <p className="mt-2 text-sm text-slate-400">
                          {getRaceDate(race)}
                          {getRaceDistance(race) ? ` · ${getRaceDistance(race)}m` : ""}
                          {getRaceCondition(race) ? ` · ${getRaceCondition(race)}` : ""}
                          {runners.length ? ` · ${runners.length} runners` : ""}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        <div
                          className={`rounded-2xl border px-4 py-3 text-sm font-bold ${getDecisionClasses(
                            cardDecision
                          )}`}
                        >
                          <div>{cardDecision}</div>
                          <div className="mt-1 text-xs font-medium opacity-90">
                            {getDecisionText(cardDecision)}
                          </div>
                        </div>

                        {officialBet && (
                          <div className="text-right text-xs text-slate-400">
                            v2 official BET:{" "}
                            <span className="font-semibold text-green-300">
                              {getRunnerName(officialBet)}
                            </span>
                          </div>
                        )}

                        {favourite && favouriteOdds && (
                          <div className="text-right text-xs text-slate-400">
                            Favourite:{" "}
                            <span className="font-semibold text-sky-300">
                              {getRunnerName(favourite)}
                            </span>{" "}
                            · Win {odds(favouriteOdds.winOdds)} · Place{" "}
                            {odds(favouriteOdds.placeOdds)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 p-5 lg:grid-cols-[1fr_auto]">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Confidence
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {cardRunner ? getRunnerConfidence(cardRunner) : "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          AI Score
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {cardRunner ? getRunnerScore(cardRunner) : "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          SB Place
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {cardRunner ? odds(getSbPlace(cardRunner)) : "-"}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          LB Place
                        </div>
                        <div className="mt-2 text-lg font-bold text-white">
                          {cardRunner ? odds(getLbPlace(cardRunner)) : "-"}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 lg:min-w-72">
                      <button
                        type="button"
                        onClick={() => setSelectedRace(race)}
                        className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-100 hover:border-sky-400 hover:text-sky-300"
                      >
                        View Race Card
                      </button>

                      {isAdmin && officialBet && (
                        <button
                          type="button"
                          onClick={() => saveV2TrackRecordPick(race)}
                          disabled={savingRaceKey === raceKey}
                          className="rounded-xl bg-green-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingRaceKey === raceKey
                            ? "Saving v2 BET..."
                            : "Save v2 Track Record Pick"}
                        </button>
                      )}

                      {isAdmin && (
                        <button
                          type="button"
                          onClick={() => saveFavouriteSplitPick(race)}
                          disabled={savingFavouriteRaceKey === raceKey}
                          className="rounded-xl bg-sky-400 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {savingFavouriteRaceKey === raceKey
                            ? "Saving Favourite Split..."
                            : "Save Favourite Split Test Pick"}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-800 px-5 py-4">
                    <p className="text-sm text-slate-300">
                      {cardRunner ? getRunnerReasoning(cardRunner) : "No runner data available."}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>

      {selectedRace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4">
          <div className="max-h-[90vh] w-full max-w-7xl overflow-hidden rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl">
            <div className="flex flex-col gap-3 border-b border-slate-800 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">
                  {getCourse(selectedRace)} Race {getRaceNumber(selectedRace)}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {getRaceDate(selectedRace)}
                  {getRaceTime(selectedRace) ? ` · ${getRaceTime(selectedRace)}` : ""}
                  {getRaceState(selectedRace) ? ` · ${getRaceState(selectedRace)}` : ""}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRace(null)}
                className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-100 hover:border-red-400 hover:text-red-300"
              >
                Close
              </button>
            </div>

            <div className="max-h-[72vh] overflow-auto p-5">
              <table className="min-w-full border-separate border-spacing-y-2 text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">No.</th>
                    <th className="px-3 py-2">Runner</th>
                    <th className="px-3 py-2">AI Decision</th>
                    <th className="px-3 py-2">Confidence / Score</th>
                    <th className="px-3 py-2">SB Win</th>
                    <th className="px-3 py-2">SB Place</th>
                    <th className="px-3 py-2">LB Win</th>
                    <th className="px-3 py-2">LB Place</th>
                    <th className="px-3 py-2">Reasoning</th>
                  </tr>
                </thead>

                <tbody>
                  {(selectedRace.runners || selectedRace.selections || []).map((runner, index) => {
                    const decision = getRunnerDecision(runner);

                    return (
                      <tr
                        key={`${getRunnerNumber(runner)}-${getRunnerName(runner)}-${index}`}
                        className="rounded-2xl bg-slate-900/80"
                      >
                        <td className="rounded-l-2xl px-3 py-3 font-bold text-slate-200">
                          {getRunnerNumber(runner) || "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="font-bold text-white">{getRunnerName(runner)}</div>
                          {getRunnerForm(runner) && (
                            <div className="mt-1 text-xs text-slate-500">
                              Form: {getRunnerForm(runner)}
                            </div>
                          )}
                        </td>

                        <td className="px-3 py-3">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getDecisionClasses(
                              decision
                            )}`}
                          >
                            {decision}
                          </span>
                        </td>

                        <td className="px-3 py-3 text-slate-200">
                          {getRunnerConfidence(runner)} / {getRunnerScore(runner)}
                        </td>

                        <td className="px-3 py-3 text-slate-200">{odds(getSbWin(runner))}</td>

                        <td className="px-3 py-3 text-slate-200">{odds(getSbPlace(runner))}</td>

                        <td className="px-3 py-3 text-slate-200">{odds(getLbWin(runner))}</td>

                        <td className="px-3 py-3 text-slate-200">{odds(getLbPlace(runner))}</td>

                        <td className="rounded-r-2xl px-3 py-3 text-slate-300">
                          {getRunnerReasoning(runner)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {(selectedRace.runners || selectedRace.selections || []).length === 0 && (
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center text-slate-400">
                  No runners found for this race card.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-950 p-8 text-white">
          Loading PlaceDash dashboard...
        </main>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
