/* The names the tests used to have.
 *
 * Every test was renamed from an internal code to the name the centre calls it
 * by — "al-b3" became "p1l3", Plus 1 Listening Test 3. Results already sitting
 * in the database still refer to the old names, and so does any link a student
 * bookmarked, so the old names keep working: they resolve to the new file, and
 * a past attempt still shows which paper it was.
 *
 * Nothing new should ever be added here. It exists so that one rename did not
 * throw away work students had already done.
 */
export const RENAMED: Record<string, string> = {
  "al-a1": "c17l1", "al-a2": "c17l2", "al-a3": "c17l3", "al-a4": "c17l4",
  "al-b1": "p1l1",  "al-b3": "p1l3",  "al-b4": "p1l4",  "al-b5": "p1l5",
  "al-c1": "p2l1",  "al-c2": "p2l2",  "al-c3": "p2l3",  "al-c4": "p2l4", "al-c5": "p2l5",
  "ar-a1": "p1r1",  "ar-a2": "p1r2",  "ar-a3": "p1r3",  "ar-a4": "p1r4", "ar-a5": "p1r5",
  "ar-b1": "p2r1",  "ar-b2": "p2r2",  "ar-b3": "p2r3",  "ar-b4": "p2r4",
  "ar-b5": "p2r5",  "ar-b6": "p2r6",
  "ar-c1": "nv1r1", "ar-c2": "nv1r2", "ar-c3": "nv2r1", "ar-c4": "nv2r2", "ar-c5": "b7r1",
  "gr-11": "gt1r1", "gr-12": "gt1r2", "gr-13": "gt1r3", "gr-14": "gt1r4",
  "gr-21": "gt2r1", "gr-22": "gt2r2",
};

/** The name a test goes by now, whatever it was called when it was sat. */
export const currentId = (id: string): string => RENAMED[id] ?? id;
