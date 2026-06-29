# Challenge Point — Coach Communication Standard (CCS)

**v1.0 (Draft)** · Christian · captured 2026-06-17

> **Status:** a long-term, implementation-agnostic **design specification** for the coach-facing
> communication layer — *not* a current development milestone. Coach-facing output should converge
> toward these principles gradually, whenever Activity Assembly is being refined. The reasoning engine
> stays free to use sophisticated internal concepts; the coach receives only what they need to set up,
> run, observe, and adapt the activity.
>
> **Current alignment (2026-06-17):** the Round-8D.3 information *environmental realizations* are already
> written as observable environmental conditions (CCS §6/§7) — e.g. "the active scoring goal changes
> after the first penetrating pass." A first CCS guardrail is also folded into the assembly's
> information-expression directive: coach-facing wording must stay in plain coaching language and keep
> internal terms ("information mechanic", "perception problem", "affordance", "decision window") out of
> the activity text. Fuller adoption (prompts / templates / validation / post-processing — an open
> implementation choice) is deferred until the architecture and libraries stabilize.

---

## Fundamental principle

The coach-facing output is **not a transcript of the engine's reasoning**. It is a **translation of the
engine's conclusions into practical coaching language.** The sophistication belongs inside the engine;
the clarity belongs in the coach-facing output.

---

## Core principles

1. **Assume coaching competence.** Don't explain normal elements of the sport (teams attack after
   winning possession; defenders try to stop attackers; play continues after turnovers; players keep
   possession). Communicate only what is *unique* about this activity.
2. **Communicate modifications, not assumptions.** Treat every activity as *an existing game environment
   + deliberate environmental modifications*, and communicate the modifications rather than restating the
   underlying game.
3. **Every sentence earns its place.** Each sentence answers one practical coaching question. If removing
   it wouldn't change how a competent coach runs the activity, it probably shouldn't be displayed. Favor
   brevity over completeness.
4. **One purpose per section.**
   - **Objective** — what problem are players trying to solve?
   - **Setup** — how do I build the activity?
   - **Activity Conditions** *(working title)* — what environmental features / rule modifications make
     this activity different from normal play?
   - **Scoring** — what does the activity reward?
   - **Coaching Focus** — what interactions should I observe?

   Avoid repeating information across sections.
5. **Hide engine reasoning.** No internal terminology in coach output — avoid *decision window, remain
   live, connected advantage, disrupts structure, player structure logic, affordance, archetype,
   information mechanism.* Describe observable environmental conditions instead.
6. **Prefer observable environmental language.** Describe what the environment *does*:
   - ✓ "The active scoring goal changes after the first penetrating pass."
   - ✓ "After every turnover, the attacking team has six seconds to score."
   - ✓ "A neutral player joins the team in possession."
7. **Describe environmental mechanics.** Communicate how the environment changes, not how players should
   think. Environmental mechanics belong in the activity; player observations belong in Coaching Focus.
   Design the environment so opportunities appear, rather than telling players to recognize them.
8. **Information appears once.** Each concept appears once unless repetition is essential: Objective = why,
   Setup = where, Activity Conditions = what changed, Scoring = what counts, Coaching Focus = what to
   observe. Don't repeat the learning problem across sections.
9. **Respect coach attention.** Optimize for quick scanning, rapid setup, easy in-session reference, and
   minimal cognitive load. The goal is confident implementation, not exhaustive explanation.

---

## The five-question test (per sentence)

Every coach-facing sentence should help answer **one** of these:

1. What is the objective?
2. How do I set it up?
3. How do players play?
4. How do we score or win?
5. What should I observe?

If a sentence mainly exposes internal reasoning, scaffolding, or mechanic labels, it must either be
**translated into plain coaching language** or **kept out of the coach-facing output entirely.**

## Translation is a stopgap, not the strategy

The deterministic phrase translation in the coach-output post-processor (`compress-activity-output.ts`,
commit `af18b35` + follow-ups) is an MVP fix. **Coach-facing language must not become a growing list of
one-off phrase substitutions** (Christian, 2026-06-17). The permanent solution is structural — sections
with single responsibility that exclude internal language *by design* (see Coach Communication
Architecture below) — so we stop playing whack-a-mole with individual phrases.

## Preferred vocabulary

Favor plain coaching language coaches use on the training ground: *open passing lane, free player,
support angle, recover shape, switch play, attack quickly, press quickly, wide space, central space,
create space, exploit space, line-breaking pass.*

---

## Success criteria

A competent coach should be able to: understand the activity after one read; set it up confidently;
explain it to players; begin coaching without interpreting engine logic; and scan the activity in
~20–30 seconds before practice.

---

## Coach Communication Architecture (the next major pass — deferred)

Round-8D.3 retest takeaway (Christian): the reasoning engine now feels stable and is no longer the
friction; the friction is **how that reasoning is organized and presented to the coach.** Recurring
symptoms in current output:

- sections carry multiple kinds of information rather than one responsibility;
- the same concept repeats across Objective, Setup, Rules, Scoring, and Win Condition;
- internal reasoning language still surfaces (e.g. *Player Structure Logic, Two-sided Contest*);
- you must read the whole activity before you can picture the game you're meant to run.

These are not wording problems — they are **architecture**. The proposed fix is to redesign the
information hierarchy the way board games and video games communicate, in this order:

1. What is the objective of the game?
2. What are players trying to accomplish?
3. How is the game organized?
4. What are the rules?
5. How do you score?
6. How do you win?

Current output tends to explain mechanics *before* the coach has a picture of the game; reordering the
hierarchy is expected to improve readability far more than further per-sentence tweaks.

**Status: DEFERRED — do not build yet.** Christian's explicit guidance: finish validating the reasoning
engine first so communication changes aren't mixed with architectural validation. Once the engine is
confirmed stable, a dedicated Coach Communication Architecture pass (single-responsibility sections +
this hierarchy) is the next high-impact step — bigger than incremental wording changes.

## Long-term vision

This is the desired *communication standard*, not a specific implementation — achievable through
prompting, templates, validation, post-processing, or another mechanism. Over time, coach-facing
communication should become increasingly concise, practical, and focused on the environmental
modifications that create the intended learning experience. As the reasoning engine and libraries grow
more sophisticated, this standard should remain stable — ensuring that **increasing internal
sophistication yields simpler, not more complex, coach-facing output.**
