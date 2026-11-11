/** Opens the note finder on a tab in a given tuning next time it shows, e.g. from the tunings page. */
export function presetNoteFinder(tuningId: string, tab: 'path' | 'free' | 'games' | 'live' | 'sing'): void {
  try {
    const saved = JSON.parse(localStorage.getItem('quiz-prefs') ?? '{}')
    localStorage.setItem('quiz-prefs', JSON.stringify({ ...saved, tuningId, tab }))
  } catch {
    // storage unavailable: the note finder opens with its own defaults
  }
}
