import { useState } from "react";
import { RhythmTrainer } from "../rhythm/RhythmTrainer";
import { Metronome } from "./Metronome";
import { Tuner } from "./Tuner";

type Tab = "tools" | "rhythm";

function loadTab(): Tab {
  try {
    return localStorage.getItem("tools-tab") === "rhythm" ? "rhythm" : "tools";
  } catch {
    return "tools";
  }
}

/** Tuner and metronome, plus lessons on playing in time with a metronome. */
export function ToolsPage() {
  const [tab, setTabState] = useState<Tab>(loadTab);
  const setTab = (t: Tab) => {
    setTabState(t);
    try {
      localStorage.setItem("tools-tab", t);
    } catch {
      // storage unavailable
    }
  };
  return (
    <>
      <div className="tools-tabs-wrap">
        <div className="segmented quiz-tabs tools-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "tools"}
            className={tab === "tools" ? "active" : ""}
            onClick={() => setTab("tools")}
          >
            Tuner & metronome
          </button>
          <button
            role="tab"
            aria-selected={tab === "rhythm"}
            className={tab === "rhythm" ? "active" : ""}
            onClick={() => setTab("rhythm")}
          >
            Learn the metronome
          </button>
        </div>
      </div>
      <div
        className={tab === "tools" ? "tools-page" : "tools-page rhythm-page"}
      >
        {tab === "tools" ? (
          <>
            <Tuner />
            <Metronome />
          </>
        ) : (
          <div>
            <h1>Play in time</h1>
            <RhythmTrainer />
          </div>
        )}
      </div>
    </>
  );
}
