# Carry forward to the next email to Christian

Saved 22 September. The email describing package **revision 3** was sent. The email describing
**revision 4** was prepared but **not sent** (`email-christian-rev4-UNSENT.txt` in the session
scratchpad). Christian's reply of 22 September answers the revision-3 email, so **he has not seen
anything below.** The next email must tell him.

## What changed between revision 3 (sent) and revision 4 (unsent)

1. **The independent check was run a second time**, against revision 3. It found no contradictions with
   his rulings and no rule left without an implementation home, but two consistency defects and five
   places an implementer would still have had to decide something. All confirmed against the files and
   fixed. One reported point was not a defect: it said the package claimed one decision rather than two,
   comparing against an out-of-date brief; revision 3 already said two.

2. **Element identity was refined, and this bears on what he just accepted.** His reply accepts "the
   anonymous-element treatment" — that was revision 3's, which minted individual elements and **merged
   them whenever one satisfied another item's selector**. The second check showed the merge was itself a
   guess: a selector that allows one of several values (`IN`) cannot be matched without choosing one.
   Revision 4 therefore neither mints individuals nor merges: **each existence item defines one class** —
   the elements satisfying its selector — and classes are never merged. A derived fact about a class is a
   statement about every element satisfying it. This is *more* identity-neutral than what he accepted,
   and matches his words: "keep those elements identity-neutral beyond what authoritative selectors
   entail." He should be told it changed, not left to assume revision 3's version stands.

3. **Candidate matching follows from it**: each candidate element is assigned to every class whose
   selector it satisfies; nothing pairs a candidate element with an engine element.

4. **The value model covers every form the register permits**: qualitative terms, "where the ball went
   out" (a tagged token; any geometric use is refused), open role names (exact equality, no synonym
   matching), and procedures (refused; none in the corpus). Anything outside it is refused.

5. **Gate B reverse in derivation mode** reports `NOT_APPLICABLE`, not a pass it has not earned.

6. **Qualitative bounds** combine only on an identical canonical term; otherwise a refusal.

7. **Reachability had a refusing default** until he ruled. *Now superseded by his 22 September ruling —
   mention only in passing.*

## What the next email must also carry

- His two rulings of 22 September, incorporated.
- **The exact existing Gate A wording for residual space, and the property it appears intended to
  protect** — he asked for this explicitly before deciding to define or remove it.
- The result of the final independent check he asked for, on its four questions only.
- The exact residual known specification and knowledge gaps.
- Whether a genuine blocker was found — if not, implementation is authorized by his reply.
