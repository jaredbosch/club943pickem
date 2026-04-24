// Hi-fi Weekly Grid — C style (heatmap) with filled-square correct/wrong cells

const WG_GAMES_HI = [
  { id:'g1', away:'NYJ', home:'BUF', winner:'BUF', final:'31-14', done:true },
  { id:'g2', away:'CIN', home:'BAL', winner:'BAL', final:'24-21', done:true },
  { id:'g3', away:'DET', home:'GB',  winner:'DET', final:'28-20', done:true },
  { id:'g4', away:'CAR', home:'ATL', winner:'ATL', final:'17-10', done:true },
  { id:'g5', away:'MIA', home:'NE',  winner:'MIA', final:'23-13', done:true },
  { id:'g6', away:'HOU', home:'IND', winner:'IND', final:'27-24', done:true },
  { id:'g7', away:'CLE', home:'PIT', live:'Q3 14-10', live_:true },
  { id:'g8', away:'LAR', home:'SF',  live:'Q2 7-10', live_:true },
  { id:'g9', away:'KC',  home:'DEN', pending:true },
  { id:'g10',away:'LV',  home:'LAC', pending:true },
  { id:'g11',away:'NO',  home:'TB',  pending:true },
  { id:'g12',away:'PHI', home:'DAL', pending:true, primetime:true },
  { id:'g13',away:'MIN', home:'CHI', pending:true, primetime:true },
];

const WG_PICKS_HI = [
  { n:'Jerry Jones',   pts:9,  picks:['BUF','BAL','DET','ATL','MIA','IND','CLE','SF','KC','LAC','TB','PHI','MIN'] },
  { n:'Brady Gisele',  pts:8,  picks:['BUF','BAL','DET','ATL','MIA','IND','PIT','SF','KC','LV','TB','PHI','CHI'] },
  { n:'Hunter Time',   pts:8,  picks:['BUF','CIN','DET','ATL','MIA','IND','CLE','SF','KC','LAC','NO','DAL','MIN'] },
  { n:'Coach Mike',    pts:7,  picks:['BUF','BAL','GB','ATL','MIA','HOU','PIT','LAR','KC','LAC','TB','PHI','MIN'] },
  { n:'Ron Swanson',   pts:7,  picks:['BUF','BAL','DET','CAR','NE','IND','CLE','SF','DEN','LAC','TB','DAL','MIN'] },
  { n:'Aaron R',       pts:6,  picks:['NYJ','BAL','DET','ATL','MIA','IND','PIT','SF','KC','LV','NO','PHI','CHI'] },
  { n:'Dana Scully',   pts:6,  picks:['BUF','CIN','GB','ATL','MIA','IND','CLE','LAR','KC','LAC','TB','PHI','MIN'] },
  { n:'Walter White',  pts:5,  picks:['BUF','BAL','GB','CAR','NE','IND','PIT','SF','DEN','LAC','NO','DAL','MIN'] },
  { n:'Michael Scott', pts:5,  picks:['NYJ','BAL','DET','ATL','NE','HOU','CLE','LAR','KC','LV','TB','PHI','MIN'] },
  { n:'Pam Beesly',    pts:4,  picks:['NYJ','CIN','DET','CAR','MIA','HOU','PIT','SF','KC','LAC','NO','DAL','CHI'] },
  { n:'Jim Halpert',   pts:4,  picks:['BUF','CIN','GB','ATL','NE','IND','CLE','LAR','DEN','LV','TB','PHI','CHI'] },
  { n:'Kevin M.',      pts:3,  picks:['NYJ','BAL','GB','CAR','MIA','HOU','PIT','LAR','KC','LV','NO','DAL','CHI'] },
];

function HeatCell({ game, pick }) {
  const CELL = 52;
  if (!pick) return <div style={{width:CELL, height:CELL, background:'var(--bg3)', border:'1px dashed var(--line2)'}}/>;
  const c = NFL[pick].p;
  let state = 'pending';
  let bg = 'var(--bg3)';
  let border = '1px solid var(--line)';
  let overlayIcon = null;
  if (game.done) {
    const ok = pick === game.winner;
    state = ok ? 'win' : 'loss';
    bg = ok
      ? `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 70%, #000))`
      : `color-mix(in oklab, ${c} 35%, var(--bg2))`;
    border = ok
      ? `1px solid color-mix(in oklab, ${c} 60%, var(--ink))`
      : '1px solid var(--line)';
    overlayIcon = ok ? '✓' : '✗';
  } else if (game.live_) {
    state = 'live';
    bg = `linear-gradient(135deg, ${c}, color-mix(in oklab, ${c} 75%, #000))`;
    border = '1px solid var(--accent)';
  } else {
    bg = `color-mix(in oklab, ${c} 30%, var(--bg2))`;
  }
  return (
    <div style={{
      width:CELL, height:CELL, background:bg, border, position:'relative',
      display:'flex', alignItems:'center', justifyContent:'center',
      color: state==='win'||state==='live' ? '#fff' : 'var(--ink2)',
      fontFamily:'var(--disp)', fontWeight:800, fontSize:13, letterSpacing:'0.02em',
    }}>
      {pick}
      {overlayIcon === '✓' && (
        <span style={{position:'absolute', top:3, right:4, fontSize:9, color:'#fff', fontWeight:900}}>✓</span>
      )}
      {overlayIcon === '✗' && (
        <span style={{position:'absolute', top:3, right:4, fontSize:10, color:'var(--bad)', fontWeight:900, textShadow:'0 0 1px #000'}}>✗</span>
      )}
      {state==='live' && (
        <span className="pp-live-dot" style={{position:'absolute', top:4, left:4, width:5, height:5}}/>
      )}
    </div>
  );
}

function WeeklyGridHi() {
  const sorted = [...WG_PICKS_HI].sort((a,b)=>b.pts-a.pts);
  const maxPossible = 13;
  return (
    <div className="pp pp-gridbg" style={{width:1400, height:1000, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <PPNav active="Weekly Grid" right={<span className="pp-chip"><span className="pp-live-dot"/> 2 LIVE · 7 FINAL</span>}/>

      {/* Hero */}
      <div className="pp-hero-grad" style={{padding:'18px 24px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20}}>
        <div>
          <div className="tag">WEEK 8 · PICKS MATRIX</div>
          <div className="disp-900" style={{fontSize:48, marginTop:4}}>THE GRID</div>
          <div className="mono" style={{fontSize:11, color:'var(--ink2)', marginTop:4}}>
            <span style={{color:'var(--good)'}}>■ correct</span> · <span style={{color:'var(--bad)'}}>■ wrong</span> · <span style={{color:'var(--accent)'}}>■ live</span> · <span style={{color:'var(--ink3)'}}>■ pending</span>
          </div>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <button className="pp-btn ghost">← Wk 7</button>
          <div className="pp-chip accent" style={{padding:'6px 14px', fontSize:12}}>WEEK 8</div>
          <button className="pp-btn ghost">Wk 9 →</button>
        </div>
      </div>

      {/* Grid container */}
      <div className="pp-scroll" style={{flex:1, overflow:'auto', padding:'14px 24px 18px'}}>
        <div style={{display:'flex', gap:0, minWidth:'fit-content'}}>
          {/* Left freeze column — player + pts */}
          <div style={{position:'sticky', left:0, zIndex:2, background:'var(--bg)', display:'flex', flexDirection:'column', gap:0}}>
            {/* spacer row matching game header */}
            <div style={{height:76, display:'flex', alignItems:'flex-end', padding:'0 14px 10px', borderBottom:'1px solid var(--line)'}}>
              <div className="tag">RANK · PLAYER · PTS</div>
            </div>
            {sorted.map((p,i)=>(
              <div key={p.n} style={{
                display:'flex', alignItems:'center', gap:10,
                padding:'8px 14px', height:54, minWidth:320,
                borderBottom:'1px solid var(--line)',
                background: i===0 ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : (i%2===0?'var(--bg2)':'transparent'),
                position:'relative',
              }}>
                {i===0 && <div style={{position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--accent)'}}/>}
                <span className="num" style={{fontSize:22, width:32, color: i<3?'var(--ink)':'var(--ink3)'}}>{String(i+1).padStart(2,'0')}</span>
                <div style={{width:32, height:32, borderRadius:3, background:'var(--bg3)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--disp)', fontWeight:800, fontSize:11, flexShrink:0}}>
                  {p.n.split(' ').map(x=>x[0]).join('')}
                </div>
                <div style={{flex:1, lineHeight:1.1, minWidth:0}}>
                  <div style={{fontSize:13, fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.n}</div>
                  <div style={{height:4, background:'var(--bg3)', borderRadius:99, marginTop:3, overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${(p.pts/maxPossible)*100}%`, background: i===0?'var(--accent)':'var(--ink2)'}}/>
                  </div>
                </div>
                <div style={{textAlign:'right'}}>
                  <div className="num" style={{fontSize:24, color: i===0?'var(--accent)':'var(--ink)'}}>{p.pts}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Right — game columns */}
          <div>
            {/* Game headers */}
            <div style={{display:'flex', gap:4, padding:'0 0 10px', borderBottom:'1px solid var(--line)', height:76, alignItems:'flex-end'}}>
              {WG_GAMES_HI.map(g => (
                <div key={g.id} style={{width:52, display:'flex', flexDirection:'column', alignItems:'center', gap:3}}>
                  <div style={{display:'flex', gap:2}}>
                    <TeamLogo abbr={g.away} size={18}/>
                    <span className="mono" style={{fontSize:8, color:'var(--ink3)', alignSelf:'center'}}>@</span>
                    <TeamLogo abbr={g.home} size={18}/>
                  </div>
                  <div className="disp" style={{fontSize:11, color:'var(--ink2)'}}>{g.away}·{g.home}</div>
                  <div className="mono" style={{fontSize:8, textAlign:'center', lineHeight:1.2, color: g.done?'var(--good)':g.live_?'var(--accent)':'var(--ink3)'}}>
                    {g.done ? g.final : g.live_ ? g.live : g.primetime ? 'MNF' : 'SUN 1P'}
                  </div>
                </div>
              ))}
            </div>
            {/* Cells */}
            {sorted.map((p,i)=>(
              <div key={p.n} style={{
                display:'flex', gap:4, padding:'1px 0', height:54, alignItems:'center',
                borderBottom:'1px solid var(--line)',
                background: i===0 ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : (i%2===0?'var(--bg2)':'transparent'),
              }}>
                {WG_GAMES_HI.map((g,gi)=>(
                  <HeatCell key={gi} game={g} pick={p.picks[gi]}/>
                ))}
              </div>
            ))}

            {/* Consensus footer */}
            <div style={{display:'flex', gap:4, padding:'12px 0 4px', borderTop:'2px solid var(--line2)', marginTop:6}}>
              {WG_GAMES_HI.map((g,gi)=>{
                const counts = {};
                WG_PICKS_HI.forEach(p=>{ counts[p.picks[gi]] = (counts[p.picks[gi]]||0)+1; });
                const top = Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
                const pct = Math.round(top[1]/WG_PICKS_HI.length*100);
                return (
                  <div key={g.id} style={{width:52, display:'flex', flexDirection:'column', alignItems:'center', gap:3}}>
                    <div className="tag" style={{fontSize:8}}>CONSENSUS</div>
                    <TeamLogo abbr={top[0]} size={22}/>
                    <div className="num" style={{fontSize:13}}>{pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { WeeklyGridHi, WG_GAMES_HI, WG_PICKS_HI });
