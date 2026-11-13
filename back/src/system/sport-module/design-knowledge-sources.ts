/**
 * **The sport's module, handed to the design-reasoning stage as plain rows — review pathway only** (Stage 1, November 2026).
 *
 * The design-reasoning stage (`../design-reasoning/`) is sport-neutral: it reasons over ids, relationship rows and declared fields, and never
 * names a sport. It still needs the sport module's Game Form rows, and the only way to reach that workbook is to import it by its file name,
 * which names the sport. So the import sits here, in the sport layer, beside the context library that already reads the same rows
 * (`rpc-library.ts`), and this file passes the workbook on unchanged: no field is renamed, filtered, defaulted or inferred.
 *
 * Nothing on the live route imports this file. Its only reader is `../design-reasoning/knowledge.ts`, whose own static test keeps every
 * production module from importing the stage.
 */
import sportModuleWorkbook from './soccer-module.rc1-v3.json'

/** The sport module's workbook path, as the repository holds it, for the stage's source citations. */
export const SPORT_MODULE_WORKBOOK_PATH = 'back/src/system/sport-module/soccer-module.rc1-v3.json'

/** The sport module workbook, exactly as committed. Callers receive it as data and copy before changing anything. */
export function sportModuleWorkbookRows(): unknown {
    return sportModuleWorkbook
}
