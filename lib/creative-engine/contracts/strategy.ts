/**
 * Creative Strategy — contract (the doc's "Most Important New Concept")
 *
 * The system INTENTIONALLY chooses HOW to tell the visual story, rather than
 * letting it drift. A given brief (e.g. a traffic-awareness campaign) can be
 * told as a symbolic icon, a documentary moment, an activity-driven people-scene,
 * etc. — and the choice is controllable (a sensible default, overridable by the
 * user). The chosen strategy hard-constrains the Director.
 */

export type VisualStrategy =
  | 'symbolic' // one iconic symbol stands for the message
  | 'documentary' // candid, authentic real-world moment
  | 'activity-driven' // real people actively performing the event
  | 'institutional' // composed, premium, authority-forward
  | 'emotional' // human emotion / intimacy leads
  | 'cinematic' // dramatic film-still atmosphere
  | 'editorial-minimal' // restrained, lots of negative space, one clean idea

export interface StrategySelection {
  strategy: VisualStrategy
  /** The rule the Director MUST follow for this strategy. */
  directive: string
  source: 'default' | 'override'
}
