// =====================================================
//  LODESTONE — sprites
//  every character is a 16px pixel grid. '.' = transparent.
//  each letter maps to a color in its palette.
//  want to redraw someone? edit the grid, keep it 16 wide.
// =====================================================

// ---------- pip the duck ----------
export const DUCK = {
  down: [
    '......BBBB......',
    '......BBBB......',
    '.....gbbbbg.....',
    '....bbbbbbbb....',
    '.....YYYYYY.....',
    '....YKYYYYKY....',
    '....YYYOOYYY....',
    '.....YYOOYY.....',
    '....YYYYYYYY....',
    '...YYWYYYYYYY...',
    '...YYYYYYYYYY...',
    '...yYYYYYYYYy...',
    '....yYYYYYYy....',
    '.....yyyyyy.....',
  ],
  up: [
    '......BBBB......',
    '......BBBB......',
    '.....bbbbbb.....',
    '....bbbbbbbb....',
    '.....YYYYYY.....',
    '....YYYYYYYY....',
    '....YYYYYYYY....',
    '.....YYYYYY.....',
    '....YYYYYYYY....',
    '...YYYYYYYYYY...',
    '...YYYYYYYYYY...',
    '...yYYYYYYYYy...',
    '....yYYyyYYy....',
    '.....yyyyyy.....',
  ],
  side: [
    '.....BBBB.......',
    '.....BBBB.......',
    '....bbbbbg......',
    '...bbbbbbbb.....',
    '.....YYYYY......',
    '.....YYYKYY.....',
    '.....YYYYYOOO...',
    '......YYYYOO....',
    '....YYYYYYY.....',
    '..yYYYYWYYYY....',
    '..yYYYYYYYYY....',
    '...yYYYYYYYY....',
    '....yYYYYYY.....',
    '.....yyyyy......',
  ],
};
export const DUCK_PAL = { B: '#4a2e18', b: '#c9972f', g: '#7fd0ff', Y: '#ffd23f', y: '#d8a028', K: '#1a1a1a', O: '#ff8c1a', W: '#fff6d0' };
export const SOOT_PAL = { ...DUCK_PAL, Y: '#7a6c48', y: '#5a4e34', W: '#9a8c6a', g: '#5a6a70' };

// ---------- townsfolk (one body, many outfits) ----------
// H hat, h brim, S skin, K eyes, C coat, c buttons, P pants, k boots
export const PERSON = {
  down: [
    '.....HHHHHH.....',
    '.....HHHHHH.....',
    '....hhhhhhhh....',
    '.....SSSSSS.....',
    '.....SKSSKS.....',
    '.....SSSSSS.....',
    '......SSSS......',
    '....CCCCCCCC....',
    '...CCCcCCcCCC...',
    '...CCCCCCCCCC...',
    '...SCCCCCCCCS...',
    '....CCCCCCCC....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....kkk..kkk....',
  ],
  up: [
    '.....HHHHHH.....',
    '.....HHHHHH.....',
    '....hhhhhhhh....',
    '.....HHHHHH.....',
    '.....HHHHHH.....',
    '.....SSSSSS.....',
    '......SSSS......',
    '....CCCCCCCC....',
    '...CCCCCCCCCC...',
    '...CCCCCCCCCC...',
    '...SCCCCCCCCS...',
    '....CCCCCCCC....',
    '....PPP..PPP....',
    '....PPP..PPP....',
    '....kkk..kkk....',
  ],
  side: [
    '.....HHHHHH.....',
    '.....HHHHHH.....',
    '....hhhhhhhhh...',
    '.....SSSSSS.....',
    '.....SSSSKS.....',
    '.....SSSSSSS....',
    '......SSSS......',
    '.....CCCCCC.....',
    '....CCCCCcCC....',
    '....CCCCCCCC....',
    '....CCCSCCCC....',
    '.....CCCCCC.....',
    '.....PPPPP......',
    '.....PP.PP......',
    '.....kk.kkk.....',
  ],
};

// tiny 7x6 emote icons that pop up in speech bubbles
export const EMOTES = {
  heart: ['.RR.RR.', 'RRRRRRR', 'RRRRRRR', '.RRRRR.', '..RRR..', '...R...'],
  note:  ['...BBB.', '...B.B.', '...B.B.', '.BBB.B.', 'BBBB...', '.BB....'],
  sweat: ['....b..', '...bb..', '..bbbb.', '..bbbb.', '...bb..', '.......'],
  dots:  ['.......', '.......', 'K.K.K..', '.......', '.......', '.......'],
  spark: ['...Y...', '...Y...', 'YYYYYYY', '...Y...', '...Y...', '.......'],
  zzz:   ['.KKKK..', '...K...', '..K....', '.KKKK..', '.......', '.......'],
  bang:  ['...R...', '...R...', '...R...', '...R...', '.......', '...R...'],
  q:     ['..BBB..', '.B...B.', '....B..', '...B...', '.......', '...B...'],
};
export const EMOTE_PAL = { R: '#d63a4a', B: '#3a5a9a', b: '#5ab0f0', K: '#2a1a10', Y: '#e0a020' };
