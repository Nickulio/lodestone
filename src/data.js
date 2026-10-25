// =====================================================
//  LODESTONE — world + story
//  all dialogue lives here. lines can start with an emote
//  tag like {heart} {note} {sweat} {dots} {spark} {zzz} {bang} {q}
// =====================================================

export const TS = 16;
export const MW = 44, MH = 32;
export const T = { GRASS: 0, COBBLE: 1, WATER: 2, BRIDGE: 3, BRASS: 4, FENCE: 5, DOCK: 6 };

// ---------- tile map ----------
export const tiles = [...Array(MH)].map(() => Array(MW).fill(T.GRASS));
const fillT = (x0, y0, x1, y1, v) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) tiles[y][x] = v; };
fillT(1, 15, 42, 16, T.COBBLE);   // main street
fillT(1, 24, 42, 25, T.COBBLE);   // lower street
fillT(21, 13, 22, 30, T.COBBLE);  // north-south street
fillT(16, 6, 27, 12, T.BRASS);    // plaza
fillT(1, 26, 42, 27, T.WATER);    // canal
fillT(21, 26, 22, 27, T.BRIDGE);  // bridge
fillT(4, 28, 36, 30, T.DOCK);     // airship dock
for (const [x, y] of [[6, 14], [12, 14], [31, 14], [39, 14], [5, 23], [13, 23], [31, 23], [38, 23]]) tiles[y][x] = T.COBBLE;
for (let x = 0; x < MW; x++) { tiles[0][x] = T.FENCE; tiles[MH - 1][x] = T.FENCE; }
for (let y = 0; y < MH; y++) { tiles[y][0] = T.FENCE; tiles[y][MW - 1] = T.FENCE; }

// ---------- buildings ----------
export const BUILDINGS = [
  { name: 'archive',     x: 3,  y: 8,  w: 7, h: 6, door: 6,  roof: '#3f6f66', wall: '#6e4434', chim: true },
  { name: 'workshop',    x: 10, y: 9,  w: 6, h: 5, door: 12, roof: '#8a4b2a', wall: '#6a5844', chim: true },
  { name: 'foundry',     x: 28, y: 8,  w: 8, h: 6, door: 31, roof: '#4a4a52', wall: '#733c2c', chim: true, big: true },
  { name: 'house',       x: 37, y: 9,  w: 5, h: 5, door: 39, roof: '#5e3a52', wall: '#74624c' },
  { name: 'inn',         x: 3,  y: 18, w: 6, h: 5, door: 5,  roof: '#3f5a7a', wall: '#725438', chim: true },
  { name: 'telegraph',   x: 11, y: 18, w: 6, h: 5, door: 13, roof: '#76663c', wall: '#644636' },
  { name: 'garage',      x: 28, y: 18, w: 7, h: 5, door: 31, roof: '#55565c', wall: '#664c3c', chim: true },
  { name: 'house',       x: 36, y: 18, w: 5, h: 5, door: 38, roof: '#4a643c', wall: '#745c4c' },
  { name: 'clock tower', x: 19, y: 1,  w: 6, h: 5, door: 21, tower: true },
];

// ---------- props ----------
export const DECOR = [];
const addD = (kind, list) => list.forEach(([x, y, text]) => DECOR.push({ kind, x, y, text }));
addD('lamp', [[2, 17], [10, 17], [18, 17], [25, 17], [35, 17], [41, 17], [9, 23], [19, 23], [25, 23], [35, 23],
  [16, 6], [27, 6], [16, 12], [27, 12], [7, 30], [18, 30], [26, 30], [33, 30]]);
addD('vent', [[18, 9], [25, 9]]);
addD('crate', [[15, 28], [16, 28], [29, 29], [30, 29]]);
addD('tree', [[3, 3], [8, 2], [11, 4], [14, 2], [29, 3], [33, 2], [37, 4], [41, 2], [2, 20], [9, 19], [19, 20], [25, 20], [42, 20]]);
addD('sign', [
  [20, 14, ['steamhaven plaza', 'home of the grand steam hackathon. it\'s happening this weekend, and you\'re here']],
  [23, 17, ['west: the archive and the workshop.   east: the foundry', 'south: the garage and the airship dock']],
  [20, 23, ['lower street', 'the bridge to the airship dock is just to the right']],
  [23, 28, ['airship dock', 'ships leave when they\'re ready. (they are never ready.)']],
]);
addD('statue', [[21, 9], [22, 9], [21, 10], [22, 10]]);
addD('brain', [[23, 12], [24, 12]]);
export const STATUE_TEXT = [
  'a brass gear on a pedestal. there\'s a plaque',
  '"to every duck who shipped something."',
  '{dots}...it\'s warm, like someone just touched it',
];
export const LOCKED_TOWER = ['the big door is locked', 'somewhere up there, the lodestone has gone cold'];

// ---------- time of day per stage ----------
export const STAGES = [
  { gear: 'idea',   time: 'FRI 9:00 PM',  obj: 'find cogsworth at the workshop, just west of the plaza', dark: 0.64, tint: [12, 6, 26], sky: ['#1a1428', '#3a2a3a', '#5a3a32'] },
  { gear: 'plan',   time: 'FRI 11:30 PM', obj: 'visit quill at the archive, on the far west side',       dark: 0.68, tint: [8, 4, 22],  sky: ['#100c20', '#2a2034', '#3e2a30'] },
  { gear: 'build',  time: 'SAT 9:00 AM',  obj: 'head east to the foundry and find ember',                 dark: 0.10, tint: [40, 30, 10], sky: ['#6a8aa8', '#b8a888', '#e0b888'] },
  { gear: 'debug',  time: 'SAT 4:00 PM',  obj: 'find sprocket at the garage, south of main street',       dark: 0.22, tint: [60, 30, 10], sky: ['#5a6a8a', '#c88a5a', '#e8a060'] },
  { gear: 'deploy', time: 'SAT 11:00 PM', obj: 'cross the bridge to the airship dock and find gale',      dark: 0.66, tint: [10, 6, 26], sky: ['#120e24', '#2a2238', '#40303a'] },
  { gear: 'submit', time: 'SUN 7:30 AM',  obj: 'meet the mayor at the clock tower before 9 am!',           dark: 0.30, tint: [40, 14, 34], sky: ['#3a3a6a', '#c87a8a', '#f0b090'] },
  { gear: '',       time: 'SUN 8:42 AM',  obj: 'you did it. go touch some grass',                         dark: 0.0,  tint: [30, 20, 10], sky: ['#5a8ac8', '#c8b8a0', '#f8d8a8'] },
];

export const INTRO_A = [
  'friday, 9 pm. steamhaven',
  'the town has been pretty dim lately',
  'the light at the top of the clock tower went cold a while ago. nobody really talks about why',
  'anyway, the grand steam hackathon just started',
  'and pip, a duck in a top hat, has a brilliant plan',
];
export const BIG_PROMPT = '> build me a big working website all at once. with login, payments, ai chat, multiplayer, a mobile app... and make it go viral by tomorrow. thanks!';
export const INTRO_B = [
  '...',
  'okay. that did not work',
  'turns out you can\'t ask a machine to build an entire project in one go',
  'real projects get built in small steps: idea, plan, build, debug, deploy, submit',
  'controls: arrow keys or wasd to walk, shift to run, space to talk, j for your journal, q to quack',
  'find the people with a ! over their heads. collect all 6 gears before the clock tower strikes 9 on sunday',
  'people with a ? have useful tips too. it\'s worth talking to everyone',
];
export const SMALL_NOTE = { name: 'brass brain', note: 'small prompts', sum: 'don\'t ask ai for everything at once. ask for one small, specific step, check the result, then ask for the next one' };

// journal entries for each gear
export const GEAR_NOTES = [
  { t: 'idea',   s: 'pick one real problem, then shrink it until you can build it in a weekend. describe it in one sentence: "my project helps ___ do ___."' },
  { t: 'plan',   s: 'sort features into must-have, should-have, and could-have. build every must-have first. plan backwards from the deadline, write it down, and then actually start' },
  { t: 'build',  s: 'start from a template. get the smallest working version running first. commit to git every time something works. read what ai writes for you. take breaks' },
  { t: 'debug',  s: 'read the whole error message. reproduce the bug. change one thing at a time. stuck for 20 minutes? ask someone. bugs don\'t mean you\'re bad at this' },
  { t: 'deploy', s: 'push your code to github. host it on github pages or vercel. test the link on another device. keep api keys in a .env file. ship before it\'s perfect' },
  { t: 'submit', s: 'your devpost should cover the problem, what you built, how, and what\'s next. record a short demo video, submit early, and lead your pitch with the demo' },
];

// ---------- people ----------
const P = (H, h, S, C, c, Pn, k) => ({ H, h, S, C, c, P: Pn, k, K: '#141018' });

export const NPCS = [
  // ============ the six mentors ============
  { id: 'cogsworth', name: 'cogsworth', x: 12, y: 14, quest: 0, acc: 'goggles', color: '#e8a050',
    pal: P('#3a3434', '#221e1e', '#f0c8a0', '#8a4b2a', '#e0b04a', '#4a3a2a', '#2a1a10'),
    lesson: [
      'oh, hey! are you here for the hackathon?',
      'i\'m cogsworth. i make inventions. well... i start inventions',
      '{sweat}i have 41 unfinished ones in there. every single one was going to change the world',
      'anyway! step one of any project is the idea. but it has to be a small one',
      'pick a problem that you, or people you know, actually have. something real',
      'then cut it in half. then cut it in half again. if you can\'t build it in a weekend, it\'s too big',
      'try to describe it in one sentence: "my project helps ___ do ___." if you can\'t, keep shrinking',
      { quiz: {
        q: 'quick check! which of these is a weekend-sized idea?',
        opts: ['an app that fixes all of social media', 'a site that turns your class schedule into a calendar', 'an online game with 200 quests and voice chat'],
        ans: 1,
        right: 'exactly! it\'s small, it\'s real, and you could actually finish it',
        wrong: 'hmm, that\'s more like a whole company. think smaller. much smaller' } },
      '{dots}...',
      '...huh. i just told you to think small, and i have 41 giant unfinished projects',
      '{spark}okay. i\'m going to finish one. just one. the little wind-up duck. it only has to walk',
      'here, take this gear. you earned it. next, go see quill at the archive. they\'re way more organized than me',
    ],
    recap: ['{heart}i finished the wind-up duck! it walks in a circle. it\'s perfect', 'one problem, one sentence. small and finished beats big and broken'] },

  { id: 'quill', name: 'quill', x: 6, y: 14, quest: 1, acc: 'monocle', color: '#b8a0e8',
    pal: P('#3a2a4a', '#231a2e', '#e8c0a0', '#4a3a6a', '#d8b860', '#3a3040', '#1a1420'),
    early: ['shh... the archive is for people who already have an idea. cogsworth\'s workshop is right next door'],
    lesson: [
      'oh, you have an idea? cogsworth sent you? wonderful',
      'i\'m quill. i keep the archive. to be honest, it\'s mostly full of my own plans',
      'here\'s how to plan. make three lists: must-have, should-have, and could-have',
      'build every must-have first. should-haves only if you have time. could-haves are for... another life',
      'then plan backwards from the deadline. save about two hours at the end for your write-up. trust me',
      'and write things down. i use obsidian: one note for the plan, one for bugs, and one for the devpost',
      { quiz: {
        q: 'you have 36 hours. what do you build first?',
        opts: ['the main feature, the one thing it HAS to do', 'a dark mode toggle', 'a fancy login page'],
        ans: 0,
        right: 'yes! must-haves first, always. dark mode can wait',
        wrong: 'that\'s a could-have. what does your project need in order to work at all?' } },
      '{dots}...',
      'can i tell you something? i\'ve planned about 300 projects',
      '{sweat}i\'ve started zero of them. planning always felt safer than actually doing',
      'but a plan you never start is just a diary',
      '{spark}okay. tonight i start one. badly. on purpose',
      'here\'s the plan gear. ember at the foundry will get you building. it\'s the big smoky building to the east',
    ],
    recap: ['{heart}i started it! it\'s not good yet. but it\'s mine', 'must, should, could. then a timeline. then you actually start'] },

  { id: 'ember', name: 'ember', x: 31, y: 14, quest: 2, acc: 'apron', color: '#f08050',
    pal: P('#5a2a1a', '#3a1a10', '#d8a07a', '#8a3a2a', '#f0a040', '#3a2a22', '#1a1008'),
    early: ['{sweat}the foundry is a little busy right now. come back once you have a plan. quill can help'],
    lesson: [
      '{zzz}...huh? oh, a duck. hi. sorry, i zoned out',
      'i\'m ember. i run the foundry. let\'s build something',
      'first, your tools: vs code to write code, node to run it, and git to save your progress',
      'don\'t start from zero. use a template like vite. one command and you have a working project',
      'run "npm run dev" and you\'ll get a localhost link. that\'s your project running on your own computer',
      'build the smallest version that works first. one button, one screen. that\'s it',
      'make it work first, then make it pretty. not the other way around',
      'ai can help you code, and that\'s fine. just read what it writes. you\'re the one in charge',
      'oh, and the brass brain in the plaza got fixed. go ask it something. something SMALL this time',
      { quiz: {
        q: 'your project finally works. what should you do right now?',
        opts: ['keep going and save it later', 'rewrite it all so it\'s cleaner', 'commit it to git'],
        ans: 2,
        right: 'exactly. now if you break something later, you can always go back',
        wrong: 'risky... if you break it, you can\'t undo it. save your progress first' } },
      '{zzz}...',
      'sorry. i\'ve been awake since tuesday. i thought if i stopped, i\'d fall behind',
      '(pip offers ember a slice of pizza. nobody knows where pip got it.)',
      '{heart}...ha. okay. thank you. maybe builders need fuel too',
      'i\'m going to take a nap. a real one. next, go see sprocket at the garage, south of main street',
      'oh, right. here\'s your build gear',
    ],
    recap: ['{zzz}i slept 9 hours, then built more in one hour than i did all week. who knew?', 'smallest version first. commit often. you\'re in charge, not the ai. and take breaks'] },

  { id: 'sprocket', name: 'sprocket', x: 31, y: 23, quest: 3, acc: 'wrench', color: '#80c0e0',
    pal: P('#2a4a5a', '#1a3040', '#f0c8a0', '#3a5a6a', '#c0c4c8', '#2a3a44', '#141a20'),
    early: ['nothing to fix yet! go build something at the foundry first'],
    lesson: [
      'let me guess. something broke',
      '{note}don\'t worry. it always breaks. that\'s normal',
      'i\'m sprocket. i fix things. here\'s how',
      'step 1: read the entire error message. it usually tells you exactly where the problem is',
      'step 2: make it break the same way again. if you can repeat a bug, you can fix it',
      'step 3: change one thing at a time. change five things at once and you won\'t know what worked',
      'step 4: stuck for 20 minutes? ask someone. that\'s what mentors are there for',
      'also, check the browser console. press f12, or right-click and choose inspect. errors hide there',
      { quiz: {
        q: 'a red error message pops up. what\'s your first move?',
        opts: ['change a bunch of things and hope', 'read the whole error, top to bottom', 'delete the file'],
        ans: 1,
        right: 'yes! the error message is trying to help you',
        wrong: 'slow down! the error message usually tells you what\'s wrong' } },
      '{dots}...',
      'see the big machine under the tarp in the back? five years ago, i showed it to the whole town',
      '{sweat}it broke in front of everyone. smoke and everything. i haven\'t touched it since',
      'i thought the error meant i was bad at this',
      'but like i just told you, the error isn\'t mad at you. it\'s showing you where to look',
      '{spark}...okay. i\'m opening that tarp. after you leave. don\'t watch',
      'here\'s the debug gear. now let\'s put your project online. the airship dock is across the bridge, to the south',
    ],
    recap: ['{heart}i fixed the old machine! it was ONE loose bolt. five years!', 'read it, reproduce it, change one thing at a time, and ask for help'] },

  { id: 'gale', name: 'gale', x: 12, y: 29, quest: 4, acc: 'aviator', color: '#e0d070',
    pal: P('#6a4a2a', '#4a321a', '#e0b090', '#5a6a3a', '#e0c070', '#4a3a2a', '#2a1a10'),
    early: ['no project, no flight! get it working first. sprocket\'s garage can help'],
    lesson: [
      'hey. that\'s my airship, the steady breeze',
      'she\'s been "almost ready" for three years',
      'anyway, deploying. if nobody can open your project, does it even exist?',
      'first, push your code to github. it\'s your backup and your portfolio at the same time',
      'then host it on github pages or vercel. you\'ll get a real link anyone can open',
      'open that link on your phone and on a friend\'s laptop. if it works there, you\'re good',
      'and deploy early. not at 8:55 am. please',
      { quiz: {
        q: 'your app uses a secret api key. where should it go?',
        opts: ['pasted in your code and pushed to github', 'in the readme so people can use it', 'in a .env file that\'s listed in .gitignore'],
        ans: 2,
        right: 'perfect. the key stays secret, and the code stays public',
        wrong: 'oof. bots scan github for keys constantly. keep it in a .env file' } },
      '{dots}...',
      '"ship it early, ship it before it\'s perfect." that\'s what i always tell people',
      '{sweat}and then i never do it myself. the paint isn\'t right. the ropes are old. there\'s always something',
      '{bang}...okay. you\'re going to watch me launch her. right now. before i talk myself out of it',
    ],
    recap: ['{heart}she flies every morning now. still a little crooked. nobody cares', 'github for your code, a host for your link, and a test on another device. then ship it'] },

  { id: 'mayor', name: 'mayor brassbell', x: 22, y: 7, quest: 5, acc: 'tophat', color: '#f0c050',
    pal: P('#2a2a30', '#18181c', '#f0c8a0', '#6a2a3a', '#e8c060', '#2a2228', '#141014'),
    early: ['{dots}hm? the clock tower is closed for now. come back when you\'re ready to submit something'],
    lesson: [
      'so you\'re the duck everyone\'s been talking about',
      'cogsworth finished something. quill started something. ember finally slept',
      'sprocket fixed the old machine. and gale\'s airship just flew over my house',
      '{heart}i\'ll be honest, i cried a little',
      'do you know why the lodestone up there went cold?',
      'it only glows when someone finishes something and shares it. nobody had in a long time',
      'last step: submitting. make a devpost page. explain the problem, what you built, how, and what\'s next',
      'record a short demo video. show the best part in the first 10 seconds. the judges are tired',
      'submit before 9. not at 8:59. the clock doesn\'t care about your feelings',
      { quiz: {
        q: 'the judges give you two minutes. what do you show first?',
        opts: ['the best part, working, live', 'your folder structure', 'a 12-slide deck about your journey'],
        ans: 0,
        right: 'yes! lead with the good stuff. that\'s what they\'ll remember',
        wrong: 'they\'d fall asleep! show the thing working, first' } },
      'at judging, just talk for about two minutes: the problem, a quick demo, and why it matters. and breathe',
      '...six gears. that\'s a whole project',
      '{spark}come on. let\'s go light it',
    ],
    recap: ['{heart}look at it. it\'s so warm up there'] },

  // ============ workshop notes (optional, from this weekend) ============
  { id: 'copilot', name: 'copilot fan', x: 17, y: 14, note: 'copilot', pal: P('#2a2a2a', '#1a1a1a', '#e8c0a0', '#3a6aa8', '#e0e0e0', '#2a2a3a', '#141418'),
    lines: ['i just went to the github copilot workshop', 'it\'s like autocomplete, but it can write whole functions',
      'tip: write a comment first describing what you want. it gets way smarter', '{sweat}still, read what it gives you. sometimes it makes things up'],
    sum: 'write a comment describing what you want first, then let copilot fill it in. always read the code it gives you' },
  { id: 'aistudio', name: 'ai studio fan', x: 26, y: 14, note: 'ai studio', pal: P('#5a3a8a', '#3a2a5a', '#d8a888', '#6a4aa8', '#f0d070', '#2a2a3a', '#141418'),
    lines: ['{spark}the google ai studio workshop was honestly great', 'you can test gemini prompts for free, right in your browser',
      'get the prompt working there first, THEN put it in your code', 'that\'s also where you get an api key. keep it secret, though'],
    sum: 'test ai prompts in the browser first, then move them into your code. keep your api key secret' },
  { id: 'prompt', name: 'prompt nerd', x: 8, y: 15, note: 'prompting', acc: 'hood', pal: P('#3a5a3a', '#2a3a2a', '#f0c8a0', '#4a6a4a', '#c8e0a0', '#2a3a2a', '#141a14'),
    lines: ['tip from the "ai for hackathons" workshop:', 'a good prompt = context + the exact task + the format you want back',
      'give it an example of what you want. examples are basically cheat codes', 'and if it gets something wrong, tell it what was wrong. don\'t just hit regenerate'],
    sum: 'good prompts have context, an exact task, and a format. give examples. when it\'s wrong, explain what was wrong' },
  { id: 'api', name: 'api person', x: 35, y: 16, note: 'rest apis', pal: P('#a83a3a', '#7a2a2a', '#e8b890', '#e0e0e0', '#a83a3a', '#3a3a4a', '#1a1a20'),
    lines: ['an api is just a url that gives you data', 'get requests read data. post requests send data',
      'you usually get json back. it\'s just text shaped like objects', '{note}there are free apis for pokemon, weather, jokes... great for practice'],
    sum: 'an api is a url that gives you data. get reads, post sends, and you usually get json back' },
  { id: 'security', name: 'security phd', x: 10, y: 21, note: 'security', acc: 'monocle', pal: P('#1a1a2a', '#10101a', '#d8b090', '#2a2a3a', '#7fd0ff', '#1a1a2a', '#0a0a10'),
    lines: ['i gave the cybersecurity talk', '{bang}never push passwords or api keys to github. bots find them within minutes',
      'put them in a .env file, and add that file to .gitignore', 'and never trust user input. always check it before you use it'],
    sum: 'secrets go in a .env file listed in .gitignore, never on github. never trust user input' },
  { id: 'fullstack', name: 'full stack dev', x: 17, y: 21, note: 'full stack', pal: P('#4a3a2a', '#2a2018', '#c89070', '#2a6a5a', '#f0d070', '#2a3a3a', '#141a1a'),
    lines: ['frontend is what you see. backend is the server. the database is the memory', 'you don\'t always need all three, honestly',
      'lots of hackathon winners are just a really good frontend', 'vercel, firebase, supabase... pick one and don\'t overthink it'],
    sum: 'frontend is what you see, backend is the server, the database is memory. you don\'t always need all three' },
  { id: 'arduino', name: 'arduino kid', x: 27, y: 21, note: 'hardware', acc: 'goggles', pal: P('#2a5a8a', '#1a3a5a', '#f0c8a0', '#2a8a5a', '#f0f0f0', '#2a3a44', '#141a20'),
    lines: ['hardware projects hit different, because judges can actually touch them', 'start by blinking an led. that\'s the "hello world" of hardware',
      'then add a sensor. then make it do something with the data', '{sweat}and bring extra cables. trust me'],
    sum: 'start with a blinking led, then add a sensor, then do something with the data. bring extra cables' },
  { id: 'industry', name: 'industry person', x: 36, y: 25, note: 'mixers', pal: P('#2a2a30', '#18181c', '#e8c0a0', '#2a2a3a', '#d8d8e0', '#1a1a22', '#0a0a10'),
    lines: ['at the mixers, ask people what they work on. people love talking about their work', 'don\'t just ask for a job. be curious',
      'afterward, connect on linkedin with a note about what you talked about'],
    sum: 'ask people what they work on and be curious. follow up with a note about your conversation' },
  { id: 'clips', name: 'clip editor', x: 40, y: 25, note: 'game feel', pal: P('#8a2a8a', '#5a1a5a', '#d8a888', '#3a3a3a', '#e85ae8', '#2a2a2a', '#141414'),
    lines: ['if you\'re making a game, the first 10 seconds matter most', 'make moving around feel good. little sounds, little effects',
      '{note}if it\'s fun to watch, it\'s fun to clip'],
    sum: 'nail the first 10 seconds. small sounds and effects make a game feel good to play' },
  { id: 'pivot', name: 'pivot guy', x: 14, y: 7, note: 'pivoting', pal: P('#6a5a2a', '#4a3a1a', '#f0c8a0', '#a87a2a', '#f0e0a0', '#3a3a2a', '#1a1a10'),
    lines: ['i switched my idea four times this weekend', 'a clip editor, a regex tool, a 3d game... and then somehow a duck rpg',
      'changing your idea early is fine. just don\'t do it at 3 am on sunday', 'pick one, commit to it, and ship it'],
    sum: 'pivoting early is fine. pivoting late is painful. pick one idea and commit' },
  { id: 'node', name: 'node guy', x: 23, y: 19, note: 'setup errors', pal: P('#3a6a3a', '#2a4a2a', '#e8c0a0', '#5a8a3a', '#f0f0c0', '#2a3a2a', '#141a14'),
    lines: ['{sweat}my terminal said "npm: command not found" and i panicked', 'turns out i just didn\'t have node installed',
      '"command not found" usually means you need to install something', 'also, localhost only works on your own computer. deploy it if you want to share it'],
    sum: '"command not found" means you need to install the tool. localhost only works on your computer until you deploy' },
  { id: 'notes', name: 'note taker', x: 2, y: 12, note: 'notes', acc: 'monocle', pal: P('#5a4a6a', '#3a2a4a', '#f0c8a0', '#7a6a9a', '#f0e0c0', '#3a3044', '#1a1420'),
    lines: ['i keep all my notes in obsidian', 'one note for the plan, one for bugs, and one for the devpost',
      '{heart}when you\'re exhausted at 4 am, notes from earlier-you are a lifesaver'],
    sum: 'keep notes for your plan, your bugs, and your devpost. you\'ll need them at 4 am' },

  // ============ townsfolk ============
  { id: 'volunteer', name: 'volunteer', x: 19, y: 16, pal: P('#2a8a8a', '#1a5a5a', '#f0c8a0', '#2aa0a0', '#ffffff', '#2a3a44', '#141a20'),
    lines: ['{note}hi! i\'m a volunteer. i have wristbands and emotional support', 'if you\'re lost, look for the ! over someone\'s head, or check your objective in the top left', 'also, there\'s pizza somewhere. i think'] },
  { id: 'tired', name: 'tired hacker', x: 39, y: 14, acc: 'hood', pal: P('#3a3a44', '#2a2a32', '#d8b090', '#44444e', '#6a6a74', '#2a2a32', '#141418'),
    lines: ['{zzz}i\'ve been debugging for six hours', 'it was a typo. the whole time', 'read your error messages. every word'] },
  { id: 'kid', name: 'kid', x: 5, y: 23, pal: P('#8a3a2a', '#5a2418', '#f0c8a0', '#d88a2a', '#fff0c0', '#3a4a6a', '#1a1a2a'),
    lines: ['{bang}whoa, a duck in a hat!', 'are you a hacker too?', 'my sister says a small project that works is better than a big one that doesn\'t'] },
  { id: 'pizza', name: 'pizza guy', x: 25, y: 11, acc: 'pizza', pal: P('#d83a2a', '#a82a1a', '#e8b890', '#f0f0f0', '#d83a2a', '#3a3a44', '#1a1a20'),
    lines: ['Pizza?', '{q}wait, you\'re a duck. can ducks eat pizza?', 'either way, eat something. a tired brain writes buggy code'] },
  { id: 'cat', name: 'cat-bot', x: 34, y: 29, cat: true, lines: ['{heart}mrrr. bzzt', '...commit often. mrrr'] },

  // ============ the quiet one ============
  // moves around town each chapter. says a little more each time.
  { id: 'hood', name: '???', x: 5, y: 5, acc: 'hood', hood: true, pal: P('#1a1a24', '#101018', '#c8c0d8', '#22222e', '#3a3a4a', '#1a1a24', '#0a0a10'),
    path: [[5, 5], [40, 7], [2, 25], [41, 29], [17, 3], [26, 13], [22, 11]],
    talks: [
      ['oh. hi', 'not you, the duck. i mean you. the one holding the keyboard', '{heart}...you\'re doing great, by the way. just thought you should know'],
      ['it\'s getting late, huh?', 'drink some water. both of you'],
      ['morning. did you sleep?', '{dots}...me neither'],
      ['i broke this whole town about 40 times while i was making it', 'it still works, though. kind of like you'],
      ['everyone in this town is stuck on something', 'that\'s normal. the trick is to keep going anyway'],
      ['{note}almost there', 'i\'ll see you at the clock tower'],
      ['...'],
    ] },
];

// where everyone stands for the finale
export const FINALE_SPOTS = {
  cogsworth: [18, 8], quill: [25, 8], ember: [17, 11], sprocket: [26, 11], gale: [19, 12], mayor: [22, 7], hood: [22, 11],
};
export const FINALE_LINES = [
  ['cogsworth', '{heart}i brought the wind-up duck. it only walks in circles. i love it'],
  ['quill', 'i finished page one. of one thing. that\'s more than i\'ve ever done'],
  ['ember', '{zzz}i took a nap. it changed my life'],
  ['sprocket', '{note}the old machine works now. it makes toast. that\'s all it does'],
  ['gale', 'i saw the light from the sky. it\'s so much brighter up there'],
  ['mayor', '{heart}steamhaven hasn\'t looked like this in years. thank you, pip'],
];
export const NICK_LINES = [
  'Hey.',
  'it\'s me. the one who\'s been hanging around',
  'i\'m nick. i made this game at sbuhacks 2026',
  'on friday, i didn\'t even know what to build. i switched ideas four times',
  'it broke a lot. i asked for too much at once. i didn\'t sleep enough',
  '{dots}kind of like everyone in this town',
  'it isn\'t perfect. but it\'s finished, and now you\'ve played it',
  '{heart}that\'s the whole point. make something small. finish it. share it',
  'thanks for playing. now go make something',
];
export const CREDITS = [
  ['pip', 'learned how real projects get made'],
  ['cogsworth', 'finished the wind-up duck (40 to go, no rush)'],
  ['quill', 'started the thing. it\'s rough, but it\'s theirs'],
  ['ember', 'sleeps now, and builds better'],
  ['sprocket', 'fixed the old machine. it was one bolt'],
  ['gale', 'flies every morning, a little crooked'],
  ['mayor brassbell', 'keeps the lodestone warm'],
  ['the brass brain', 'only takes small requests now. much happier'],
  ['cat-bot', 'commits often. mrrr'],
];

export const NOTE_COUNT = NPCS.filter(n => n.note).length + 1; // +1 for the brass brain
