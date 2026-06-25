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

## Long-term vision

This is the desired *communication standard*, not a specific implementation — achievable through
prompting, templates, validation, post-processing, or another mechanism. Over time, coach-facing
communication should become increasingly concise, practical, and focused on the environmental
modifications that create the intended learning experience. As the reasoning engine and libraries grow
more sophisticated, this standard should remain stable — ensuring that **increasing internal
sophistication yields simpler, not more complex, coach-facing output.**
