/**
 * Prose scales for the lesson body, in one place so the two narrow layouts that
 * need it stay in step.
 *
 * `lesson-prose` sizes itself for a full reading column. When the column shrinks
 * — the terminal opens beside it, or the statement sits in the activity panel —
 * the same markdown has to fit in far less width, so the type scales down with
 * it instead of turning into three words per line.
 */
export const COMPACT_PROSE =
  "[&_.lesson-prose_h2]:text-2xl [&_.lesson-prose_h3]:text-xl [&_.lesson-prose_p]:text-base [&_.lesson-prose_ul]:text-base [&_.lesson-prose_ol]:text-base"

/** Narrower still: the activity statement next to the terminal. */
export const DENSE_PROSE =
  "[&_.lesson-prose_h2]:text-lg [&_.lesson-prose_h3]:text-base [&_.lesson-prose_p]:text-sm [&_.lesson-prose_ul]:text-sm [&_.lesson-prose_ol]:text-sm [&_.lesson-prose_li]:text-sm [&_.lesson-prose_pre]:text-xs [&_.lesson-prose_code]:text-xs"
