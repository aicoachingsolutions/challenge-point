# Ecological Integrity Review Layer

## Purpose

This layer follows Christian's framing that the review performs an interaction-property audit, not a certification. It is an inspection layer: it surfaces what the activity text appears to preserve, remove, trade off, or put at risk, without turning that review into a pass/fail judgment.

## What this layer does NOT do

- Does not output pass/fail scores
- Does not assert "this is ecological" / "this is representative" / "this violates X"
- Does not seek affirmation or prove correctness
- Does not optimize toward a theoretical checklist

## What this layer DOES do

- Inspects observable interaction properties
- Identifies possible ecological failure modes
- Exposes hidden scripting or overconstraint
- Evaluates preserved vs removed informational variables
- Surfaces tradeoffs introduced by the activity structure

## The six integrity dimensions

### Constraint Integrity

Constraint Integrity evaluates whether constraints shape the environment or prescribe behavior directly.

- Observes prescriptive phrases such as "must pass", "always", and "only use"
- Observes exact-count requirements such as a required number of passes or fixed time limit
- Observes sequence markers such as "after every" or "first ... then"
- Observes multi-option markers such as "choose between", "decide whether", or "or recycle"
- Observes environmental markers in the rules such as zones, channels, areas, or time windows
- Observes decision-stem density across the activity bundle

### Opposition Integrity

Opposition Integrity evaluates whether opposition meaningfully shapes timing, spacing, affordances, and success conditions.

- Observes opposition markers such as opponent, defender, pressure, and contest language
- Observes passive-defender markers such as unopposed play, taking turns, or coach-served actions
- Observes whether the exchange rule names what the opponent does when the attacker misreads
- Observes whether scoring or win conditions include defensive consequence or only attacking success
- Observes whether the teams description specifies live opposition or static role assignment

### Decision Integrity

Decision Integrity evaluates whether players are solving live problems with uncertainty and multiple viable options.

- Observes decision-stem density across objective, rules, scoring, and coaching focus
- Observes multi-option enumeration such as X, Y, or Z phrasing
- Observes conditional or uncertain framing such as "when this happens" or "based on the picture"
- Observes compliance and memorization markers such as pattern, repetition, or repeat language
- Observes whether decision language appears in the objective specifically

### Representativeness Integrity

Representativeness Integrity evaluates whether the activity preserves meaningful informational relationships from game interaction.

- Observes game-context language such as live game, opposed teams, restarts, and transition moments
- Observes absence or presence of isolated-drill language such as unopposed reps, lines, taking turns, or coach-fed actions
- Observes directional consequence, including whether losing the ball matters or scoring chains to opponent response
- Observes whether scoring is tied to live interaction rather than technical completion
- Observes named informational variables such as pressure, support, space, timing, body shape, and angles

### Incentive Integrity

Incentive Integrity evaluates whether incentives shape action value indirectly instead of scripting a required action.

- Observes whether scoring rewards a specific named action or a broader class of outcomes
- Observes whether multiple scoring pathways are visible
- Observes bonus or multiplier language that may over-reward a specific solution
- Observes conditional scoring language such as "counts only when", which can shape value indirectly
- Observes whether scoring text contains prescriptive phrasing as a hidden-scripting signal

### Scaling Integrity

Scaling Integrity evaluates whether simplification preserves meaningful perception-action relationships.

- Observes concrete environmental parameters in setup, including field dimensions, zones, time windows, and numerical structures
- Observes whether restrictive rules dominate over environmental shaping
- Observes whether simplification removes opposition or pressure variables
- Observes placeholder setup language such as "if needed" or "appropriate to"

## Report shape

`EcologicalIntegrityReport` contains an `activityRef`, `reviewTimestamp`, `reviewLayerVersion`, ordered category `findings`, and cross-category observations. Each category finding has four structured buckets: `preservedInteractionProperties`, `removedInteractionProperties`, `possibleTradeoffs`, and `possibleEcologicalDriftRisks`, plus optional `reviewNotes` for observations that do not fit those buckets. Probabilistic language is used throughout; interpretive sentences use "may", "likely", and "appears to" through the helpers in `language-templates.ts`.

## How to run

### From a Mongo activity ID

```bash
npm run integrity-review -- --activity-id <id>
```

### From a JSON file

```bash
npm run integrity-review -- --activity-file ./fixture.json
```

```bash
npm run integrity-review -- --activity-file back/src/system/ecological-integrity-review/fixtures/finishing-sample.json
```

The fixture file shape is:

```json
{
  "activity": { /* ReviewableActivity fields */ },
  "context":  { /* optional ReviewContext fields */ }
}
```

### Stdout only

```bash
npm run integrity-review -- --activity-file ./fixture.json --no-files
```

### Output destinations

By default the script writes both a `.md` and a `.json` file to `./reports`. Pass `--no-files` to print Markdown to stdout instead. Pass `--output-dir <dir>` to override the destination. The directory is created if it does not exist.

## When to run this

- After major iteration updates
- After curriculum library expansion
- After validator changes
- After archetype or mechanic rewrites
- Before field-testing cycles
- During edge-case testing

## Reading the output

Each category produces four buckets: preserved interaction properties, removed interaction properties, possible tradeoffs, and possible ecological drift risks. Empty buckets mean nothing was flagged in that dimension — not that the category passed. The optional `Review notes` section under a category collects observations that did not fit one of the four buckets but were still worth surfacing. The optional `Cross-category observations` section at the end of the report names patterns visible only when looking across categories together (for example, decision language being strong while opposition is weak).

None of this is a verdict. All of it is input to iteration. A finding that says "this may collapse decision diversity" is an observation worth investigating, not a determination that the activity is broken.

## Limitations

- Deterministic text-pattern analysis. The layer reads the coach-facing text and detects markers; it cannot evaluate aspects of the activity that aren't expressed in text (for example, how players actually behave under it).
- Pattern lists are curated and incomplete by design. Adding markers expands what the layer can see; missing markers do not mean the dimension is absent from the activity — only that the layer did not detect a signal for it.
- Probabilistic language is not safety glass. A finding written with `may` or `appears to` is still only a heuristic observation. Read findings as prompts for further inspection, not as conclusions.
- The layer scores nothing. It does not rank activities, does not certify them as ecological, and does not output a verdict.

## Extending the layer

- New marker dictionaries go in `text-scanning.ts`. Add the marker, export it, and reference it from the analyzer that should use it.
- New probabilistic phrasings go in `language-templates.ts`. Each helper should produce a single sentence ending in a period, using `may`, `likely`, `appears to`, or another non-assertive verb.
- New per-category checks go in the analyzer file for that category. Keep each check focused on one observable pattern; populate the appropriate bucket from the category's `CategoryFinding`.
- The four `CategoryFinding` buckets are fixed by spec — do not add more buckets without aligning with the spec. The `reviewNotes` array is the escape hatch for observations that do not fit.
