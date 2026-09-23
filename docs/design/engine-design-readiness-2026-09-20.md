# Can derivation-engine implementation design begin? — the answer

20 September 2026. Paper only; implementation and generation stay frozen. Christian asked, after
closing the collision exercise: *"tell me whether any specific blocker remains before derivation-engine
implementation design can begin."* He also said not to run another broad conformance exercise unless a
change genuinely required one. None did, and none was run.

Method: four independent probes of the amended documents — an end-to-end walkthrough of what the engine
must decide, an adversary trying to build it on paper, an exhaustive inventory of every "open",
"flagged", "waits" or "my reading" in six files, and a pass over the standing-decision register asking
which decisions the engine has no deterministic way to obey — then a judge that verified each candidate
against the documents and killed the ones the engine can legitimately refuse.

## The answer: no true blocker. Three scoped items, each one sentence from you.

**Design can begin now**, provided the engine is specified as one that **refuses rather than guesses**.
That proviso is the whole of the answer: every candidate blocker that was killed was killed because a
written rule lets the engine report the case instead of inventing a rule for it. The refusals are
listed below and belong in the engine's specification, not in its implementer's judgement.

### The three scoped items

**1. Do a contract's declarations empty with its items when own-involvement scope resolves empty?**
(derivation spec §6, flagged there.) AM-13's restriction is written about items; 31 items and **29
declarations** sit at that scope across the eight contracts. Either reading blocks the game, so nothing
wrong ships — what changes is whether Wide Zone's channel lines report as `INVENTED` or as the gap the
object actually declared. **SD-28's principle points to the second**, and that is my recommendation.

**2. Nothing normalises an element reference held in an item's *value*.** (§4.1, which calls itself a
hole.) AM-12 covers selectors only, so a prose reference is matched verbatim, misses, and an authored
match is lost with no defect reported. Either extend AM-12 to the value side and report what will not
normalise — my recommendation — or require contract authors to write element ids in values, which the
grammar sheet does not currently say.

**3. The failure path is a product decision, not a grammar hole.** What a coach gets when a gate fails —
refuse, return fewer activities, or re-select — is still open. **It does not block the engine's design
if the engine is defined as report-only**: it emits verdicts, gate results and the audit, and the caller
decides. Support, statuses and both gates can be designed against that contract today. One caution: a
re-select loop with no stated bound is where a session's emphasis could disappear silently, so if that
is the direction, it needs a bound.

## What makes the rest non-blocking: the engine refuses

These belong in the engine's specification. Each one is a case where the rules stop, and each has a
written refusal rather than a default:

| Case | What the engine does |
|---|---|
| A comparison whose operand selector matches more than one element (no aggregate function is named) | Unmet if required, not evaluable if supporting. Names the selector and the elements matched |
| Effective value where more than one modifier applies to one referent and no authored rule fixes the order | **Not computable** under SD-24 — the operations do not commute, so a fold order would be an invented answer. The line is then a gap under SD-28 |
| A comparison an operand of which is a `FREE` range or a freshly chosen value | Not resolved-and-supported, so unmet or not evaluable — never quietly satisfied |
| A relationship rule whose outcome it cannot apply mechanically | `decidedBy` null, the line `UNRESOLVED`, both opposed items named (SD-02, fail loudly) |
| A free choice on a row with no `fillable` entry, or a count fill where no maximum is authored | Refused; the surplus is reported unsupported and the game blocks |
| A Gate A coherence check it cannot evaluate | Fails Gate A and names the pair — fail rather than infer |
| An element reference that does not normalise to a registered element id | Matches nothing, reported as a restatement defect, never matched by meaning (AM-12) |
| At load: an unregistered derived-operand rule, an unknown requirement kind, a comparative written as an exclusion, a magnitude with no declared operation | The contract is refused and the reason named |

**An engine that guesses in any of these places would produce a game that reads supported and is not.**
That is the failure this architecture exists to end, so the refusals are the design, not a limitation of
it.

## One consequence of your own ruling, carried through

Requiring a modifier to declare its operation adds a line per modifier to every game, because §1 says a
property the game needs but leaves unstated is listed with its verdict. In the slice game that line is
`NOT_AUTHORED` — **no object anywhere declares an operation.** That is the right outcome: "effective
value is not computable" now has a line the audit can point at, instead of being true for a reason
nothing records. It also means any game resolved before today is short one line per modifier, and its
audit does not mean what it says until it is re-derived.

## Two things worth knowing, neither of them blockers

**Your second comparison example cannot be written.** `count(A) = count(B)` needs a count to be a
property, and you ruled — correctly, on the evidence then — that cardinality gets no schema change yet.
So of the three examples you gave, `value(A) > value(B)` now works via a derived operand, `width(A) >
width(B)` works where the widths are authored rather than chosen, and the count comparison has nowhere
to stand. Nothing needs doing unless a real object wants one; I am not proposing a schema change on a
hypothetical.

**SD-10 cannot fire as its register entry is typed.** The entry expects an item saying an objective is
"functionally necessary to the representative game structure", and no requirement kind can say that. The
decision is sound; its typing is not. This is register hygiene and I will fix the typing rather than
send it back to you, unless you would rather see the correction first.

## How he ruled — all three scoped items closed, and design authorized

He accepted the central conclusion and closed every scoped item the same day. **Design may begin;
implementation stays frozen until he reviews the proposed design.**

| Item | His ruling |
|---|---|
| Own-involvement declarations | **Preserved.** "An empty resolved scope empties the item's application set, not the contract's declaration… authored intention that could not reach an element ≠ structure nobody authorized" (SD-31). Wide Zone's channel lines become a declared gap |
| AM-12 on values | **Extended, and generalised past what I proposed:** "Any structural reference participating in derivation must resolve through the registered identity/reference system before derivation… Do not silently use prose matching and do not infer the intended element" (SD-32) |
| The failure path | **Report-only, as recommended** — resolved results, gate results, structured failures, gaps and conflicts, and the audit. "It does not re-select knowledge, weaken requirements, decide to generate fewer activities, or otherwise repair selection." Recovery belongs to the caller, and **"do not design that recovery policy now"** (SD-33) |
| The modifier's operation | **Approved** as a local addition, with `multiply / add / replace` the vocabulary *currently* supported. An authored magnitude with no authored operation is **incomplete** (SD-30) |
| Comparative cardinality | Stays unsupported; his example was "illustrative, not authorization for a cardinality schema change" (SD-34) |
| SD-10 | Retyped as a prohibition, with his own machine test for structural necessity — and **a mere reference from optional or supporting knowledge is explicitly not sufficient**, which rejects the candidate test I had proposed (SD-10a) |
| AM-17 | Correction accepted. "Do not repair Wide Zone through derivation." Restating its contract is recorded as a future **knowledge-authoring** task, not work to do now |

**And one ruling that reaches backwards over everything:** *"No historical activity should be treated as
retrospectively validated under this newer specification merely because it passed an earlier audit."*
The slice, the replays and the conformance check describe what older rules said. None of them certifies
an activity under these.

## What was checked, and what was not

Six documents were read in full: the derivation specification, the representation specification at
revision 6, the register, the data-model design at revision 2, the grammar sheet and the conformance
check result — plus the amendments, the collision rerun and the six-sentence rulings. **No conformance
exercise was rerun**, as you asked. This is an analysis of the written rules, not a replay of the
slice.
