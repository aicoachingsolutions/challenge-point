# Gate A: derived decision procedures and the second replay

17 September 2026. Paper only: no implementation changed, nothing regenerated. Gate B was not touched,
and the representativeness question was kept out.

**Gate A's only claim:** this game can be coherently laid out and played as specified.

The derived specification and its ledgers are kept beside this report, in
[`gate-a/procedures-2026-09-17.json`](gate-a/procedures-2026-09-17.json) and
[`gate-a/ledgers-2026-09-17.json`](gate-a/ledgers-2026-09-17.json).

---

## The result in one line

**Two decision procedures replace the eight invariants. Two blind readers applying them agreed on all
60 verdicts. They caught 34 of 35 true structural defects, with 5 false alarms, 1 miss and 1
duplicate. Every error left is a policy choice or a fixable flaw in the specification, not reader
noise.**

One caveat governs how far that result travels. The procedures were derived from these same 60
activities, so this is in-sample fit, not validation (see *Overfitting*).

## The derived procedures

Thirteen candidate checks came in; two procedures came out.

| Procedure | The question | What it alone reports |
|---|---|---|
| **GA-LAYOUT** | Do the space declarations and the roster resolve to exactly one arrangement that fits 40 × 30 m and 12 players? | `L-UNPARSEABLE` a declaration no template can read · `L-INFEASIBLE` a region group with no layout inside the field · `L-ROSTER` no single team table totalling 12 |
| **GA-PLAY** | On that layout, does every structural rule have referents that exist, a typed effect, and no incompatible rival on the same trigger? | `P-REFERENT` a rule names something that does not exist · `P-EFFECT` an effect that cannot be typed · `P-CONFLICT` one trigger given incompatible values |

**One verdict rule governs both.** A statement fails only when, after closed shorthand readings and
defaults are applied, its field has zero values or incompatible values inside the envelope. Defaults
are filled before checking, so silence cannot skip a check. The only search allowed is over unstated
quantities (metres, which team takes which end); choosing between readings of words is never allowed.

This is what fixes the vagueness asymmetry:
- "two wide channels and a central corridor" passes because *some* layout exists;
- 18 + 18 + 18 m fails because *none* does.

A vague statement and a precise one now face the same test.

**Twenty candidates were excluded:**
- 4 as subjective: tempo words like "quickly", the "long kick" threshold, a local reading of "extra
  numbers", and the depth of an end object;
- 2 as Gate B;
- 7 as not structural defects;
- 7 merged into the two procedures.

**How the derivation ran.** Three independent derivations — defect-first, noise-first and
representation-first — then a judge. The defect-first derivation failed on an output limit, so the
judge merged two. The replay compensated with independent defect hunters.

## The replay

- **Readers:** each half of the 60 was read by two blind readers applying the specification. Neither
  saw the ledgers or the other's work. Their agreement was computed in code.
- **Hunters:** an independent defect hunter per half had no checklist and asked only whether the game
  could be laid out and played.
- **Scorer:** adjudicated the five categories, ruling on contested classes without deferring to the
  ledger.

### The five categories

| Category | Reader A | Reader B |
|---|---|---|
| True structural defects in scope | 35 | 35 |
| **Caught** | **34** | **34** |
| **False alarms** | **5** | **5** |
| **Missed** | **1** | **1** |
| **Duplicate findings** | **1** | **1** |
| **Still subjective** | 24 instances, 13 distinct issues | (shared) |

| Procedure | Caught | False alarms | Missed | Reader disagreements |
|---|---|---|---|---|
| GA-LAYOUT | 8 | 0 | 0 | 0 |
| GA-PLAY | 26 | 5 | 1 | 0 |

**No confirmed defect needed a ninth area.**

**At activity level:**
- Both readers failed 31 and passed 29. The adjudicated split is 29 fail, 31 pass.
- They match it on 56 of 60.
- They failed three activities on "extra numbers" alone (baseline s3, ls-none s3, scoring-swapped s3).
- They passed info-variable-target s3 despite a truncated setup sentence.

### Caught — 34 of 35

- **Unlayable geometry (GA-LAYOUT), 3:** 18 m channels across a 30 m width.
- **Unparseable declaration (GA-LAYOUT), 1:** "two halves in each half" (em-consequence-progression s3).
- **Impossible rosters (GA-LAYOUT), 4:**
  - "10 players in a 6v6 format";
  - "14 players in a 7v5 format";
  - "Teams of 7 with a goalkeeper create a 7v5 overload";
  - 7v5 plus an extra attacker for the team in possession, which comes to 13.
- **"Deep" tier with no region (GA-PLAY `P-REFERENT`), 19.**
- **Overload zone that does not exist, 1:** ps-none s3 starts play "from the overloaded zone" in an
  even game with no zone.
- **Untyped effect "the other team gets the opposite channel" (`P-EFFECT`), 3.**
- **Turnover conflicts (`P-CONFLICT`), 2:** a restart from a place contradicts "play does not stop"
  (ps-central s1 and s2).
- **Untyped effect "the next action decides it" (`P-EFFECT`), 1.**

### False alarms — 5

- **"Worth more where you have the extra numbers" in an even-sided game, 4.** Ruled subjective: coaches
  reward a local 3v2 by eye, and the missing area size is a judgement threshold like "long kick". The
  specification excluded the local reading as subjective, then failed the text for lacking a whole-team
  referent. That turned a judgement into a structural failure.
- **"Score within a 30-second window" with no stated start or expiry, 1.** Ruled ordinary shorthand: a
  shot clock that starts when your team wins the ball, in the same class as the admitted "complete three
  passes before scoring".

### Missed — 1

**info-variable-target s3.** "Create a central overload by having one team." The sentence stops
mid-clause, gives no way to create the overload, and declares no central region. Both readers passed it
because the specification routes sentences by verb, and "create" plus a non-region noun counts as
tactical. The independent hunter caught it.

### Duplicate — 1

**ps-none s3.** A second `P-REFERENT` for the named zone repeats the overload finding on the same setup
fact. A place name attached to an advantage statement should merge into that statement's group.

### Still subjective — 13 distinct issues

| Issue | Instances | Verdict changes? |
|---|---|---|
| "Use" + region noun: the specification lists "Use" as a layout verb *and* as a tactical verb | 12 activities | Yes, on ps-goal-kicks s3 |
| "Worth more where you have the extra numbers" in even games (local judgement) | 4 | Yes |
| Whether "middle" resolves against unlabelled or complement central bands | 2 | No |
| Which transition slots "restarts the same way" writes | 2 | No |
| Whether a verbless "6v6 format with two 18 m channels" parses | 1 | No |
| "Use the goalkeeper to reset play when possession is lost": tactical, or a restart contradicting "no reset" | 1 | No |
| "7v5 for the attacking team": fixed 7v5, or 5v5 plus 2 floaters (both 12) | 1 | No |
| ps-none s3: one finding or two | 1 | No |

## Determinism

| | First replay (8 invariants) | Second replay (2 procedures) |
|---|---|---|
| Readers on identical text | applied four invariants in opposite directions | **60 / 60 verdicts agree** |
| Fact codes | — | **60 / 60** |
| Exact finding keys | — | **59 / 60** (the one miss is a label, "zone" against "one zone") |

**The caveat.** Agreement is real but partly inflated.
- Reader B raised 12 indeterminates on "Use + region noun" that reader A resolved silently the same way.
  Two readers making the same silent choice is not the specification deciding.
- The specification also settles several contested sentences by naming the activity, which a new corpus
  would not have.

The honest statement: **every remaining error is shared by both readers, so it comes from the
specification's policy or its own flaws, not from reader noise.** That is the property Christian asked
for — a gate rather than a principle — with two known holes.

## Contested classes, ruled

| Class | Rows | Ruling | Why |
|---|---|---|---|
| "Worth most through the middle, then wide, then **deep**", no deep region | 19 | **Structural defect** (low severity) | Read "deep" as near your own end and no score can be deep, so the tier is dead. Read it as in behind and every score is also middle or wide, so it gets two values. Middle and wide already cover the width. All four independent reads flagged it |
| "Worth more where you have the extra numbers", even game | 4 | **Subjective — out of Gate A** | A local overload judged by eye; area size is a threshold |
| "Restart with a goal kick" with no goals | 0 | Shorthand | The keeper restarts from their own end line; no goal is needed |
| Goalkeeper-start boilerplate beside live turnovers | 0 | Shorthand | It is the restart rule; the specific turnover rules govern turnovers. The hunters with no checklist flagged it in 57 of 60 |
| 30-second window with no stated start | 1 | Shorthand | A standard shot clock |
| "Use the goalkeeper to reset play" beside "no reset" | 0 | Subjective | Settled by stipulation, not by coaching usage |
| "No zones are marked" beside "Mark a target zone" | 0 | Shorthand | The negation plainly means internal zones |
| Truncated "Create a central overload by having one team." | 0 → 1 | **Structural defect** | A setup instruction with no reading a coach can carry out |
| "Use the wide channels to create space" | 0 | Shorthand | A coaching instruction, not a layout declaration |

**The most consequential call is "deep".** 19 of the 35 true defects depend on it, and it is one
sentence. It is ruled structural because no reading gives every score a single value. A reasonable
owner could instead rule it a harmless dead tier. That decision is Christian's.

## Where the true defects come from

| Origin | Defects | Source |
|---|---|---|
| **System-written template sentences** | **23** | `coach-voice.ts`: line 209 "…then wide, then deep" (19), line 73 "…the other team gets the opposite channel" (3), line 112 "…the next action decides it" (1) |
| Model-written text | 10 | geometry 3, rosters 4, nested halves 1, a phantom overload zone 1, a truncated sentence 1 |
| Model text contradicting a system rule | 2 | turnover restarts against "play does not stop" |

**Two-thirds of the remaining structural defects are the system's own sentences.** Each writes a value
tier, a channel reference or an effect as prose, with nothing it has to bind to. That is the
shared-representation argument in miniature. In a resolved game, a value tier must name a region the
Space table holds, and an effect must have a type. These 23 would be prevented by construction rather
than caught afterwards.

## What the replay found wrong in the specification

Found, not applied — the specification is paper and implementation is frozen:
1. **The "Use" contradiction.** Only "Use | Set a <band>" with an indefinite article should declare a
   region. This removes 12 indeterminates and the ps-goal-kicks s3 flip.
2. **Merge advantage-attached place names into the advantage group.** This removes the one duplicate.
3. **Verb-first routing lets a garbled declaration pass.** A setup sentence that attempts a region or
   performer arrangement but cannot be read should fail `L-UNPARSEABLE`, not be routed to tactical by
   its verb. This catches the one miss.
4. **Policy.**
   - "Extra numbers" in even games moves out of Gate A as subjective, removing 4 false alarms.
   - The shot clock is admitted as shorthand, removing 1.

With 1–4, this corpus would score 35 of 35 caught with no false alarms, misses or duplicates. **That
number would mean little**, for the reason below.

## Overfitting

- **The specification is in-sample.** It, its ledgers and its must-pass list were all derived from these
  60 activities. The admitted-shorthand entries name specific activities, and the lexicons are closed
  around this corpus's phrasing. The 60/60 agreement, the 34/35 recall and zero must-pass rejections are
  in-sample fit.
- **The corpus is heavily templated.** It holds about 9 distinct defect types; 19 defects are one
  sentence, 3 are another, and 57 of 60 activities share the goalkeeper boilerplate. Row counts
  overstate the evidence.
- **It fails closed.** New but legal wording ("Divide the field into three zones" with no list) would
  produce false alarms, not silent passes.
- **The only independent signal came from the hunters.** With no checklist, they found every true defect
  plus the one both readers missed. They also raised 78 reports dominated by shorthand the specification
  correctly admits. So the specification's demonstrated value is precision.

**The real test** is a held-out set of activities, read by fresh readers against a ledger written before
anyone sees the results. That needs new generation, which is frozen, so it is Christian's call when to
run it.

## Preserved as unresolved

- Game Form restart × From Goal Kicks;
- central value weighting × Wide Zone Advantage;
- Turnover Reward's missing authored consequence;
- Environmental Manipulation family-ID provenance;
- Counterattack timing;
- the three wording issues.

Gate B and the representativeness question were not touched.
