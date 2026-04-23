// Hi-fi design system — "thepickempool"
// Sports-broadcast ESPN vibe: dense, confident, bright.
// Accent: #ffcc00 on near-black. Team colors contained.
// Both dark and light equally polished.

// Type: Barlow Condensed display (caps, tight, sporty) + Inter body + JetBrains Mono data.
// Google Fonts loaded inline below.

if (typeof document !== 'undefined' && !document.getElementById('pp-styles')) {
  const s = document.createElement('style');
  s.id = 'pp-styles';
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    .pp {
      --bg:        #0a0a0b;
      --bg2:       #131317;
      --bg3:       #1c1c22;
      --line:      #2a2a33;
      --line2:     #3a3a45;
      --ink:       #f5f5f7;
      --ink2:      #a8a8b3;
      --ink3:      #6a6a75;
      --accent:    #ffcc00;
      --accent2:   #ffe066;
      --good:      #00d663;
      --bad:       #ff3d4c;
      --warn:      #ff8c1a;
      --live:      #ff3d4c;
      --hi:        #ffcc00;
      --grid:      rgba(255,255,255,0.04);
      --disp: "Barlow Condensed", Impact, sans-serif;
      --sans: "Inter", -apple-system, system-ui, sans-serif;
      --mono: "JetBrains Mono", ui-monospace, monospace;

      font-family: var(--sans);
      color: var(--ink);
      background: var(--bg);
      font-feature-settings: 'ss01', 'cv11';
    }
    .pp.light {
      --bg:        #fafaf7;
      --bg2:       #ffffff;
      --bg3:       #f0f0ec;
      --line:      #e4e4de;
      --line2:     #c8c8c0;
      --ink:       #0a0a0b;
      --ink2:      #4a4a52;
      --ink3:      #8a8a92;
      --accent:    #ffcc00;
      --accent2:   #cc9900;
      --good:      #00a84f;
      --bad:       #e0293a;
      --warn:      #e07d15;
      --live:      #e0293a;
      --hi:        #fff3b0;
      --grid:      rgba(0,0,0,0.04);
    }

    .pp * { box-sizing: border-box; }
    .pp .disp { font-family: var(--disp); font-weight: 800; letter-spacing: -0.01em; line-height: 0.95; text-transform: uppercase; }
    .pp .disp-900 { font-family: var(--disp); font-weight: 900; line-height: 0.9; text-transform: uppercase; letter-spacing: -0.015em; }
    .pp .mono { font-family: var(--mono); font-feature-settings: 'zero' 1; }
    .pp .tag { font-family: var(--mono); font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: var(--ink3); font-weight: 500; }
    .pp .num { font-family: var(--disp); font-weight: 800; font-variant-numeric: tabular-nums; }

    /* Thin blueprint grid bg */
    .pp-gridbg {
      background-image:
        linear-gradient(var(--grid) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid) 1px, transparent 1px);
      background-size: 24px 24px;
    }

    .pp-card {
      background: var(--bg2);
      border: 1px solid var(--line);
      border-radius: 4px;
    }
    .pp-card.alt { background: var(--bg3); }
    .pp-divider { height:1px; background: var(--line); border: 0; margin: 0; }

    .pp-chip {
      display: inline-flex; align-items: center; gap: 4px;
      font-family: var(--mono); font-size: 10px; font-weight: 500;
      text-transform: uppercase; letter-spacing: 0.06em;
      padding: 3px 7px; border-radius: 3px;
      background: var(--bg3); color: var(--ink2); border: 1px solid var(--line);
    }
    .pp-chip.solid { background: var(--ink); color: var(--bg); border-color: var(--ink); }
    .pp-chip.accent { background: var(--accent); color: #000; border-color: var(--accent); }
    .pp-chip.good { background: color-mix(in oklab, var(--good) 22%, transparent); color: var(--good); border-color: color-mix(in oklab, var(--good) 40%, transparent); }
    .pp-chip.bad { background: color-mix(in oklab, var(--bad) 22%, transparent); color: var(--bad); border-color: color-mix(in oklab, var(--bad) 40%, transparent); }
    .pp-chip.live { background: var(--live); color: #fff; border-color: var(--live); }

    /* Live dot pulse */
    @keyframes pp-pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .4; transform: scale(0.8); } }
    .pp-live-dot {
      width: 7px; height: 7px; border-radius: 99px; background: var(--live);
      box-shadow: 0 0 0 0 color-mix(in oklab, var(--live) 50%, transparent);
      animation: pp-pulse 1.4s infinite;
    }

    /* Ticker scroll */
    @keyframes pp-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
    .pp-ticker-track { animation: pp-scroll 50s linear infinite; }

    /* Number count-up via CSS transition hook (used w/ inline style) */
    .pp-stat-up { transition: all .3s ease; }

    /* Team chip — colored bar to the left with abbreviation */
    .pp-team {
      display: inline-flex; align-items: center; gap: 8px;
      font-weight: 700;
    }
    .pp-team .bar {
      width: 4px; align-self: stretch; border-radius: 2px; min-height: 16px;
    }
    .pp-team .abbr {
      font-family: var(--disp); font-weight: 800; font-size: 14px;
      letter-spacing: 0.02em;
    }
    .pp-teamlogo {
      display: inline-flex; align-items: center; justify-content: center;
      border-radius: 4px; color: #fff; font-family: var(--disp); font-weight: 800;
      font-size: 11px; letter-spacing: 0.02em; flex-shrink: 0;
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.15), inset 0 -6px 10px rgba(0,0,0,0.22);
    }

    /* Accent "live gradient" used on hero blocks */
    .pp-hero-grad {
      background:
        radial-gradient(1000px 400px at 0% 0%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 60%),
        radial-gradient(800px 300px at 100% 100%, color-mix(in oklab, var(--live) 18%, transparent), transparent 60%),
        var(--bg2);
    }

    .pp-btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; font-family: var(--disp); font-weight: 700;
      font-size: 13px; letter-spacing: 0.03em; text-transform: uppercase;
      border: 1px solid var(--line2); background: var(--bg2); color: var(--ink);
      border-radius: 3px; cursor: pointer;
    }
    .pp-btn.primary { background: var(--accent); color: #000; border-color: var(--accent); }
    .pp-btn.ghost { background: transparent; border-color: var(--line); }

    .pp-navlink {
      font-family: var(--disp); font-weight: 700; font-size: 13px;
      letter-spacing: 0.04em; text-transform: uppercase; color: var(--ink2);
      padding: 6px 2px; border-bottom: 2px solid transparent; cursor: pointer;
    }
    .pp-navlink.active { color: var(--ink); border-bottom-color: var(--accent); }

    .pp-sparkline path { stroke: currentColor; fill: none; stroke-width: 1.5; }

    .pp-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
    .pp-scroll::-webkit-scrollbar-thumb { background: var(--line2); border-radius: 99px; }
    .pp-scroll::-webkit-scrollbar-track { background: transparent; }
  `;
  document.head.appendChild(s);
}

// Team primary & secondary colors (real NFL palette)
const NFL = {
  ARI:{p:'#97233F',s:'#000',n:'Cardinals'}, ATL:{p:'#A71930',s:'#000',n:'Falcons'},
  BAL:{p:'#241773',s:'#9E7C0C',n:'Ravens'}, BUF:{p:'#00338D',s:'#C60C30',n:'Bills'},
  CAR:{p:'#0085CA',s:'#000',n:'Panthers'},  CHI:{p:'#0B162A',s:'#C83803',n:'Bears'},
  CIN:{p:'#FB4F14',s:'#000',n:'Bengals'},   CLE:{p:'#FF3C00',s:'#311D00',n:'Browns'},
  DAL:{p:'#003594',s:'#869397',n:'Cowboys'},DEN:{p:'#FB4F14',s:'#002244',n:'Broncos'},
  DET:{p:'#0076B6',s:'#B0B7BC',n:'Lions'},  GB: {p:'#203731',s:'#FFB612',n:'Packers'},
  HOU:{p:'#03202F',s:'#A71930',n:'Texans'}, IND:{p:'#002C5F',s:'#A2AAAD',n:'Colts'},
  JAX:{p:'#006778',s:'#D7A22A',n:'Jaguars'},KC: {p:'#E31837',s:'#FFB81C',n:'Chiefs'},
  LV: {p:'#000000',s:'#A5ACAF',n:'Raiders'},LAC:{p:'#0080C6',s:'#FFC20E',n:'Chargers'},
  LAR:{p:'#003594',s:'#FFA300',n:'Rams'},   MIA:{p:'#008E97',s:'#F58220',n:'Dolphins'},
  MIN:{p:'#4F2683',s:'#FFC62F',n:'Vikings'},NE: {p:'#002244',s:'#C60C30',n:'Patriots'},
  NO: {p:'#D3BC8D',s:'#101820',n:'Saints'}, NYG:{p:'#0B2265',s:'#A71930',n:'Giants'},
  NYJ:{p:'#125740',s:'#000',n:'Jets'},      PHI:{p:'#004C54',s:'#A5ACAF',n:'Eagles'},
  PIT:{p:'#FFB612',s:'#101820',n:'Steelers'},SF:{p:'#AA0000',s:'#B3995D',n:'49ers'},
  SEA:{p:'#002244',s:'#69BE28',n:'Seahawks'},TB:{p:'#D50A0A',s:'#FF7900',n:'Buccaneers'},
  TEN:{p:'#0C2340',s:'#4B92DB',n:'Titans'}, WAS:{p:'#5A1414',s:'#FFB612',n:'Commanders'},
};

function TeamLogo({ abbr, size = 32 }) {
  const t = NFL[abbr] || { p:'#333', n:abbr };
  const fs = Math.round(size * 0.42);
  return (
    <span className="pp-teamlogo" style={{ width: size, height: size, background: `linear-gradient(145deg, ${t.p}, color-mix(in oklab, ${t.p} 70%, #000))`, fontSize: fs }}>
      {abbr}
    </span>
  );
}

function TeamChip({ abbr, showName, size = 32 }) {
  const t = NFL[abbr] || { p:'#333', n:abbr };
  return (
    <span className="pp-team">
      <TeamLogo abbr={abbr} size={size}/>
      {showName && <span className="abbr">{abbr}</span>}
    </span>
  );
}

// Tiny SVG sparkline from 0..1 values
function Sparkline({ data, w=80, h=22, color='var(--ink)', fill=false }) {
  const pts = data.map((v,i)=>{
    const x = (i/(data.length-1))*w;
    const y = h - v*(h-2) - 1;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg className="pp-sparkline" width={w} height={h} style={{color, display:'block'}}>
      {fill && <polyline points={areaPts} fill="currentColor" opacity="0.15" stroke="none"/>}
      <polyline points={pts} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function RankDelta({ dir, n }) {
  if (dir === 'flat' || !n) return <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>—</span>;
  const up = dir === 'up';
  const c = up ? 'var(--good)' : 'var(--bad)';
  return (
    <span style={{display:'inline-flex', alignItems:'center', gap:2, color:c, fontFamily:'var(--mono)', fontSize:10, fontWeight:600}}>
      <svg width="8" height="8" viewBox="0 0 8 8"><polygon points={up?'4,0 8,6 0,6':'4,8 8,2 0,2'} fill={c}/></svg>
      {n}
    </span>
  );
}

// Shared nav header
function PPNav({ active, right, week = 'WK 8', season = '2026' }) {
  const items = ['Dashboard', 'Make Picks', 'Weekly Grid', 'Profile'];
  return (
    <header style={{display:'flex', alignItems:'center', gap:18, padding:'14px 24px', borderBottom:'1px solid var(--line)', background:'var(--bg2)'}}>
      <div style={{display:'flex', alignItems:'center', gap:10}}>
        <div style={{width:28, height:28, background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:3}}>
          <span className="disp-900" style={{fontSize:14, color:'#000'}}>TPP</span>
        </div>
        <div style={{lineHeight:1}}>
          <div className="disp" style={{fontSize:16}}>thepickempool</div>
          <div className="tag" style={{fontSize:8, marginTop:2}}>league · hq</div>
        </div>
      </div>
      <div style={{width:1, height:24, background:'var(--line)'}}/>
      <div className="pp-chip solid">{season} · {week}</div>
      <nav style={{display:'flex', gap:22, marginLeft:14}}>
        {items.map(n=>(
          <a key={n} className={'pp-navlink'+(n===active?' active':'')}>{n}</a>
        ))}
      </nav>
      <div style={{flex:1}}/>
      <div style={{display:'flex', alignItems:'center', gap:10}}>{right}</div>
    </header>
  );
}

Object.assign(window, { NFL, TeamLogo, TeamChip, Sparkline, RankDelta, PPNav });
