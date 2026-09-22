/* The names the tests used to have.
 *
 * Every test was renamed twice. First from an internal code to a short one the
 * centre could say out loud, and then again once the Plus 2 answer sheet proved
 * that the two Plus sets had been labelled the wrong way round: the papers
 * coded P1 are Plus 2, and the papers coded P2 are some other book, held under
 * X1 until someone identifies it.
 *
 * Results already in the database refer to the older names, and so does any
 * link a student bookmarked, so every old name still resolves to the paper it
 * always meant. A past attempt still shows which test it was.
 *
 * One rule matters here: a name may only appear on the LEFT if nothing uses it
 * on the right any more. "p2l1" is a live test id today, so it must never be
 * aliased — that would send a student asking for P2L1 to a different paper
 * altogether. That is why the second rename went through a holding code.
 *
 * Nothing new should ever be added here. It exists so that two renamings did
 * not throw away work students had already done.
 */
export const RENAMED: Record<string, string> = {
  /* the original internal codes */
  "al-a1": "c17l1", "al-a2": "c17l2", "al-a3": "c17l3", "al-a4": "c17l4",
  "al-b1": "p2l1",  "al-b3": "p2l3",  "al-b4": "p2l4",  "al-b5": "p2l5",
  "al-c1": "x1l1",  "al-c2": "x1l2",  "al-c3": "x1l3",  "al-c4": "x1l4", "al-c5": "x1l5",
  "ar-a1": "p2r1",  "ar-a2": "p2r2",  "ar-a3": "p2r3",  "ar-a4": "p2r4", "ar-a5": "p2r5",
  "ar-b1": "x1r1",  "ar-b2": "x1r2",  "ar-b3": "x1r3",  "ar-b4": "x1r4",
  "ar-b5": "x1r5",  "ar-b6": "x1r6",
  "ar-c1": "nv1r1", "ar-c2": "nv1r2", "ar-c3": "nv2r1", "ar-c4": "nv2r2", "ar-c5": "b7r1",
  "gr-11": "gt1r1", "gr-12": "gt1r2", "gr-13": "gt1r3", "gr-14": "gt1r4",
  "gr-21": "gt2r1", "gr-22": "gt2r2",

  /* the day the Plus sets were labelled the wrong way round */
  "p1l1": "p2l1", "p1l3": "p2l3", "p1l4": "p2l4", "p1l5": "p2l5",
  "p1r1": "p2r1", "p1r2": "p2r2", "p1r3": "p2r3", "p1r4": "p2r4", "p1r5": "p2r5",
};

/** The name a test goes by now, whatever it was called when it was sat. */
export const currentId = (id: string): string => RENAMED[id] ?? id;
