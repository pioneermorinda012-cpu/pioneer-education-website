LISTENING RECORDINGS — DROP THEM HERE
=====================================

1. Put the MP3 files in this folder.

2. Name each one after the test it belongs to:

      al-b1.mp3      al-c3.mp3

   Anything after the test id is ignored, so these are fine too:

      al-b1 Cambridge Test 1.mp3
      al-c3-full-recording.mp3

3. Open PowerShell and run these two lines:

      cd C:\Users\Dell\pioneer-website-real
      npm run add-audio

That is all. The script will:
  - shrink each recording to about a third of its size (speech only needs
    mono at a low bitrate, and smaller files mean far more students can
    listen before you reach Supabase's monthly download limit)
  - check the length has not changed, because the section jump buttons
    depend on the timings stored in the paper
  - put it where the website looks for it
  - tell you which tests still have no recording

Run it with the folder empty at any time and it will simply list what is
still missing.

AFTER RUNNING IT
----------------
The audio is deliberately kept out of git — it is far too large to push.
Upload the contents of

      public\practice\media

into the practice-media bucket in Supabase, keeping the folder names
(al-b1\audio_main.mp3 and so on). Overwrite anything already there.

WHICH TESTS STILL NEED AUDIO
----------------------------
Run "npm run add-audio" with the folder empty and it will tell you.
