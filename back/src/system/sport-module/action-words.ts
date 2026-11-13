/**
 * **For tests only.** The action words of a text: one reading, shared by the checks that hold an action word to its class.
 *
 * Added 11 November 2026 (A02 package, stage W3). High Press Escape's four coach rules say 'keeps the ball with the next pass' where
 * the approved condition (RPC-PROP-133) says "the attacking team retains possession through the next action." (approved 13 September
 * 2026). A specific action ('pass') stood where the source names any action. Christian's reply received 11 November 2026, second reply,
 * item 4: "That appears to introduce an unsupported restriction on the players' possible solutions." "I don't want to prescribe passing
 * when a dribble or another functional action may legitimately solve the problem." and item 7: "What automated safeguard could have
 * detected this problem before it affected another activity?" (received 11 November 2026, second reply). Two tests read action words
 * through this one module, so they cannot drift apart: primary-scoring.unit.ts (Test 2c: an action word of a coach rule keeps its class)
 * and requirement-bindings.unit.ts (B13c: no restatement names an action word its cited rows lack).
 *
 * THE READING. 'action' is GENERIC: it names any action and never grounds a specific one. Ten classes are SPECIFIC, each read in the
 * forms listed in ACTION_WORD_FORMS, in any letter case, as whole words: pass, dribble, shot (shot, shoot), kick, cross, clearance,
 * header, carry, touch and turn. Two words are not read because their common senses are not actions: a bare 'clear' (an adjective as often as a
 * verb) and 'heading' (a heading); 'head' is not read either. It sees words, not meaning: 'crosses the protected line' reads as 'cross'
 * (moving over a line, not crossing the ball), 'Passing it around' reads as 'pass' wherever it stands, and an action named by a word
 * outside these classes ('with the next play') is not read at all, so it passes unread. The list supports review; it does not replace it.
 *
 * 'touch' and 'turn' added 12 November 2026 (stage B1 of the A02 complete-activity package; UA2 E5). Christian's reply received 12
 * November 2026, item 2: "For a player already carrying or dribbling, please avoid introducing an artificial extra touch, distance or time
 * requirement simply to create a separate action." and "What counts: A meaningful continuation such as a pass, dribble, carry, turn, or
 * another legitimate interaction that maintains attacking possession." (received 12 November 2026). Until this, 'with the next touch'
 * passed unread (measured by U2), so a continuation narrowed to a touch could not be caught; read as a specific class, it now is. Whole
 * words only: 'touchline', 'turnover' and 'turnaround' are other words and are not read.
 *
 * Pure. Sport-specific (soccer action vocabulary), so it sits in the sport layer and is declared in the sport-coupling guard's
 * SPORT_LAYER_FILES. Imported by unit tests only; no engine module reads it (primary-scoring.unit.ts holds that by a scan).
 */

/** The specific action classes this reader knows. */
export type ActionClass = 'pass' | 'dribble' | 'shot' | 'kick' | 'cross' | 'clearance' | 'header' | 'carry' | 'touch' | 'turn'

/** Each class's word forms, read whole-word in any letter case. */
export const ACTION_WORD_FORMS: Readonly<Record<ActionClass, RegExp>> = {
    pass: /\b(pass|passes|passed|passing)\b/gi,
    dribble: /\b(dribble|dribbles|dribbled|dribbling)\b/gi,
    shot: /\b(shot|shots|shoot|shoots|shooting)\b/gi,
    kick: /\b(kick|kicks|kicked|kicking)\b/gi,
    cross: /\b(cross|crosses|crossed|crossing)\b/gi,
    clearance: /\b(clearance|clearances|clears|cleared)\b/gi,
    header: /\b(header|headers|headed)\b/gi,
    carry: /\b(carry|carries|carried|carrying)\b/gi,
    touch: /\b(touch|touches|touched|touching)\b/gi,
    turn: /\b(turn|turns|turned|turning)\b/gi,
}

/** The generic action word, read whole-word in any letter case. */
export const GENERIC_ACTION_FORMS = /\b(action|actions)\b/gi

/** The classes in the order the reader reports them. */
export const ACTION_CLASSES: readonly ActionClass[] = Object.keys(ACTION_WORD_FORMS) as ActionClass[]

/** One specific action word found in a text: its class, the word as written, and where it starts. */
export interface ActionWord {
    actionClass: ActionClass
    word: string
    at: number
}

/** Every specific action word of a text, in text order. */
export function actionWordsIn(text: string): ActionWord[] {
    const found: ActionWord[] = []
    for (const actionClass of ACTION_CLASSES) {
        const forms = new RegExp(ACTION_WORD_FORMS[actionClass].source, 'gi')
        for (const match of text.matchAll(forms)) found.push({ actionClass, word: match[0], at: match.index ?? 0 })
    }
    return found.sort((a, b) => a.at - b.at)
}

/** The specific classes a text names, each once, in the reader's order. */
export function actionClassesIn(text: string): ActionClass[] {
    const named = new Set(actionWordsIn(text).map((word) => word.actionClass))
    return ACTION_CLASSES.filter((actionClass) => named.has(actionClass))
}

/** Whether a text names the generic 'action'. */
export function namesGenericAction(text: string): boolean {
    return new RegExp(GENERIC_ACTION_FORMS.source, 'i').test(text)
}
