# Tandem – Calls prototype

Interactive HTML/CSS/JS prototype of video calls inside the Tandem ERP, built from the Figma file
"Tandem – Call interface" (39 frames). No build step, no dependencies.

## Run

Open `index.html` in Chrome, or serve the folder (any static server), e.g.

```
ruby -run -e httpd . -p 8080
```

Reference size is 1440 × 1024; the layout stretches for other laptop/desktop sizes (min 1024 px).

## Main flow

1. **Chats → #design-team**: live call banner (frame 20) → **Join** → pre-join (28) → **Join now** → video room (01).
2. In the call: mic / camera (click the chevron for devices), share menu (06), raise hand, reactions (15),
   more menu (16), captions, grid ↔ speaker view (10), pin a tile, full screen.
3. Side panels: People (02 / host controls 18), Chat (04), Details with linked task, checklist and shared notes (05).
4. Share your screen (08) or a live workspace object – table, task or doc (09). Edit a price cell in the shared table.
5. Click any item in the left menu → the call minimizes (34) with a mini window and a **Call** pill in the top bar.
6. **Leave** → summary (35). As host you get the leave dialog (17).

## Simulated events

Press **D** on the keyboard (outside a text field) to open the scenario menu:

- In a call: Marco shares his screen (07), Marco presents a table (09), many events at once (12),
  unstable connection (13), connection drops (14), 16 people (11), become host (18), guest asks to join,
  everyone leaves (03), host ends the call (36).
- Outside a call: incoming call (25), guest join by link → waiting room → limited guest call (31 → 30 → 19),
  camera blocked in pre-join (29), call Marco with no answer → try again (32 / 33).

Other entry points: Calls page with **New call** menu (22 / 26), Start a call modal (23), Schedule a call (24),
Calendar event with Join (27), chat call menu while in a call (21b), direct chat “Add to call” (21c).

Shortcuts in a call: **M** mute · **V** camera · **H** raise hand · **Esc** close menus and panels.
