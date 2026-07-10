/* ==============================================================
   FREƎ-KY // DATA — Classification Protocol questions
   --------------------------------------------------------------
   Pure data, no logic. Consumed by js/quiz.js.
   // Load from API (future): fetch this array from a backend at
   // startup instead of reading it from disk. Every function that
   // reads FREEKY.data.questions stays exactly the same.
   ============================================================== */
window.FREEKY = window.FREEKY || {};
window.FREEKY.data = window.FREEKY.data || {};

FREEKY.data.questions = [
  {tag:"SIGNAL 001", title:"A structure ahead shows no thermal activity. The door is unlocked from the inside.",
    opts:[
      {t:"You catalog every anomaly before entering.", k:"researcher"},
      {t:"You check what disabled the lock mechanism.", k:"engineer"},
      {t:"You clear the room first, ask questions later.", k:"operative"},
      {t:"You go in without waiting for the others.", k:"navigator"}
    ]},
  {tag:"SIGNAL 002", title:"An order contradicts what you are seeing on the ground.",
    opts:[
      {t:"You request the data behind the order.", k:"researcher"},
      {t:"You look for what is physically preventing compliance.", k:"engineer"},
      {t:"You follow the order and adapt as you go.", k:"operative"},
      {t:"You act on what you see, not what you were told.", k:"navigator"}
    ]},
  {tag:"SIGNAL 003", title:"A transmission repeats every six hours from a sector with no listed personnel.",
    opts:[
      {t:"You record the pattern before deciding anything.", k:"researcher"},
      {t:"You try to trace what is generating it.", k:"engineer"},
      {t:"You treat it as a threat until proven otherwise.", k:"operative"},
      {t:"You move toward the source.", k:"navigator"}
    ]},
  {tag:"SIGNAL 004", title:"Power fails in a sealed corridor with one exit.",
    opts:[
      {t:"You observe what fails next before moving.", k:"researcher"},
      {t:"You find the fault and correct it.", k:"engineer"},
      {t:"You force the exit open.", k:"operative"},
      {t:"You find another way out.", k:"navigator"}
    ]},
  {tag:"SIGNAL 005", title:"Two reports describe the same location in contradictory terms.",
    opts:[
      {t:"You cross-reference both against the archive.", k:"researcher"},
      {t:"You check which instruments produced each report.", k:"engineer"},
      {t:"You trust the more recent report and move.", k:"operative"},
      {t:"You go and see it yourself.", k:"navigator"}
    ]}
];
