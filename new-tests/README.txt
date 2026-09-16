ADDING A NEW TEST
=================

Put the files here, then run these two lines in PowerShell:

    cd C:\Users\Dell\pioneer-website-real
    npm run add-test

WHAT TO PUT HERE
----------------
Per test, named by its id:

    ar-a5.json          the paper                       (required)
    ar-a5.key.json      the answers                     (optional)
    ar-a5.mp3           the recording                   (listening only)
    ar-a5.img_map.png   any diagram the paper refers to

The first two letters of the id decide where it appears:

    al-   Academic Listening        gl-   GT Listening
    ar-   Academic Reading          gr-   GT Reading

WHAT IT DOES
------------
It checks the paper before writing anything: that the question numbers run
1..N with no gaps or repeats, that the total matches, that the answer key
covers every question and none is blank, that a listening paper has its
audio, and that every diagram it mentions was supplied.

If anything is wrong the test is rejected whole and nothing is written.
That is deliberate. A test that refuses to install is a nuisance; a test
that installs wrongly marks a correct answer wrong, and the student will
believe the machine over themselves.

When it passes, the paper, the key, the media and the library entry are all
put in place, and it prints the three git commands to publish.

Without a key the test still installs and is playable — it just shows as
"Answer key pending" until you add one.

WORD AND PDF PAPERS
-------------------
An IELTS paper uses eighteen different question layouts, and guessing wrong
costs a student marks, so these are not converted automatically.

Drop a .docx here and running the command writes the text out beside it as a
.txt file. Send that text to Claude and it will build the .json for you —
much faster than sending the document itself.

PDFs cannot be read here at all; send those to Claude directly.
