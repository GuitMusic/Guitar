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
        <h1>Tools</h1>
        <div className="segmented quiz-tabs tools-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={tab === "tools"}
            className={tab === "tools" ? "active" : ""}
            onClick={() => setTab("tools")}
          >
            <span className="tab-long">Tuner & metronome</span>
            <span className="tab-short">Tuner</span>
          </button>
          <button
            role="tab"
            aria-selected={tab === "rhythm"}
            className={tab === "rhythm" ? "active" : ""}
            onClick={() => setTab("rhythm")}
          >
            <span className="tab-long">Learn the metronome</span>
            <span className="tab-short">Lessons</span>
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
