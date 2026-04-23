// Hi-fi Make Picks — B primary (confidence ladder), A secondary (split card)

const MATCHUPS_HI = [
  { away:{t:'KC', rec:'7-1'}, home:{t:'BUF',rec:'6-2'}, spread:'BUF -2.5', ou:48.5, time:'SUN 4:25P', net:'CBS', primetime:false, locked:false, picked:'BUF', conf:16, picked_pct:42 },
  { away:{t:'PHI',rec:'6-2'}, home:{t:'DAL',rec:'4-4'}, spread:'PHI -3',   ou:46.0, time:'SUN 8:20P', net:'NBC', primetime:true,  locked:false, picked:'PHI', conf:15, picked_pct:61 },
  { away:{t:'SF', rec:'5-3'}, home:{t:'LAR',rec:'4-4'}, spread:'SF -4',    ou:44.5, time:'SUN 4:05P', net:'FOX', primetime:false, locked:false, picked:'SF',  conf:13, picked_pct:54 },
  { away:{t:'DET',rec:'5-3'}, home:{t:'GB', rec:'5-3'}, spread:'DET -1',   ou:49.5, time:'SUN 1:00P', net:'FOX', primetime:false, locked:false, picked:'DET', conf:11, picked_pct:58 },
  { away:{t:'MIA',rec:'4-4'}, home:{t:'NE', rec:'2-6'}, spread:'MIA -6',   ou:42.0, time:'SUN 1:00P', net:'CBS', primetime:false, locked:false, picked:'MIA', conf:10, picked_pct:72 },
  { away:{t:'CIN',rec:'4-4'}, home:{t:'BAL',rec:'6-2'}, spread:'BAL -5.5', ou:47.0, time:'THU 8:15P', net:'AMZ', primetime:true,  locked:true,  picked:'BAL', conf:9, picked_pct:68, final:'BAL 24-21', won:true },
  { away:{t:'NYJ',rec:'3-5'}, home:{t:'IND',rec:'5-3'}, spread:'IND -4.5', ou:43.5, time:'SUN 1:00P', net:'CBS', primetime:false, locked:false, picked:'IND', conf:7,  picked_pct:71 },
  { away:{t:'CHI',rec:'3-5'}, home:{t:'WAS',rec:'4-4'}, spread:'WAS -3',   ou:45.5, time:'SUN 1:00P', net:'FOX', primetime:false, locked:false, picked:null, conf:null, picked_pct:null },
];

// Make Picks — B primary (confidence ladder)
function MakePicksHiB() {
  const picked = MATCHUPS_HI.filter(m=>m.picked).length;
  const used = MATCHUPS_HI.filter(m=>m.picked).map(m=>m.conf).sort((a,b)=>b-a);
  const allConfs = Array.from({length:16}).map((_,i)=>16-i);
  return (
    <div className="pp pp-gridbg" style={{width:760, height:1080, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <PPNav active="Make Picks" right={<span className="pp-chip accent">{picked}/8 LOCKED</span>}/>

      {/* Hero */}
      <div className="pp-hero-grad" style={{padding:'22px 24px', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:20}}>
          <div>
            <div className="tag">WEEK 8 · CONFIDENCE PICKS</div>
            <div className="disp-900" style={{fontSize:52, marginTop:4}}>LOCK IT IN</div>
            <div className="mono" style={{fontSize:11, color:'var(--ink2)', marginTop:4}}>assign 1–16 points per game · higher = more confident</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div className="tag">DEADLINE</div>
            <div className="disp-900" style={{fontSize:36, color:'var(--warn)'}}>2D 4H</div>
            <div className="mono" style={{fontSize:10, color:'var(--ink3)'}}>thu · aug 22 · 8:15P</div>
          </div>
        </div>
      </div>

      {/* Confidence budget strip */}
      <div style={{padding:'12px 24px', background:'var(--bg2)', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
          <div className="tag">CONFIDENCE BUDGET · 1–16</div>
          <div style={{display:'flex', gap:10, alignItems:'center'}}>
            <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>used {used.length}/16</span>
            <span className="pp-chip good" style={{padding:'2px 6px'}}>on track</span>
          </div>
        </div>
        <div style={{display:'flex', gap:3}}>
          {allConfs.map(n=>{
            const isUsed = used.includes(n);
            return (
              <div key={n} style={{
                flex:1, height:26, borderRadius:2,
                background: isUsed ? 'var(--accent)' : 'var(--bg3)',
                border: isUsed ? '1px solid var(--accent)' : '1px solid var(--line)',
                color: isUsed ? '#000' : 'var(--ink3)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontFamily:'var(--mono)', fontSize:11, fontWeight:700,
              }}>{n}</div>
            );
          })}
        </div>
      </div>

      {/* Pick list */}
      <div className="pp-scroll" style={{flex:1, padding:'14px 24px 100px', overflow:'auto'}}>
        {MATCHUPS_HI.map((m,i)=><PickRowHiB key={i} m={m}/>)}
      </div>

      {/* Sticky footer */}
      <div style={{padding:'14px 24px', borderTop:'1px solid var(--line)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:14}}>
        <div>
          <div className="tag">TIEBREAKER · MNF TOTAL POINTS</div>
          <div style={{display:'flex', alignItems:'center', gap:8, marginTop:4}}>
            <input defaultValue="48" style={{width:60, padding:'6px 10px', background:'var(--bg3)', border:'1px solid var(--line2)', borderRadius:3, color:'var(--ink)', fontFamily:'var(--disp)', fontSize:22, fontWeight:800, textAlign:'center'}}/>
            <span className="mono" style={{fontSize:11, color:'var(--ink3)'}}>MIN @ CHI · Mon 8:15P</span>
          </div>
        </div>
        <div style={{flex:1}}/>
        <button className="pp-btn ghost">Auto-pick favs</button>
        <button className="pp-btn primary">Lock picks ↗</button>
      </div>
    </div>
  );
}

function PickRowHiB({ m }) {
  const pickedAway = m.picked === m.away.t;
  const pickedHome = m.picked === m.home.t;
  const hasPick = !!m.picked;
  const pickedTeam = m.picked ? (pickedAway ? m.away.t : m.home.t) : null;
  const confColor = !m.conf ? 'var(--ink3)' : m.conf >= 13 ? 'var(--good)' : m.conf >= 8 ? 'var(--accent)' : 'var(--ink2)';

  const Side = ({ side, team, picked }) => {
    const c = NFL[team.t].p;
    return (
      <div style={{
        flex:1, display:'flex', alignItems:'center', gap:10, padding:'12px 14px',
        background: picked ? `linear-gradient(${side==='away'?'90deg':'270deg'}, color-mix(in oklab, ${c} 22%, transparent), color-mix(in oklab, ${c} 6%, transparent))` : 'transparent',
        position:'relative', cursor: m.locked?'default':'pointer',
      }}>
        {picked && <div style={{position:'absolute', [side==='away']:0, left: side==='away'?0:'auto', right: side==='home'?0:'auto', top:0, bottom:0, width:3, background: c}}/>}
        {side==='home' && <div style={{flex:1}}/>}
        <TeamLogo abbr={team.t} size={44}/>
        <div style={{lineHeight:1.1, textAlign: side==='away'?'left':'right', order: side==='home'?-1:0}}>
          <div className="disp-900" style={{fontSize:22, color: picked ? 'var(--ink)' : 'var(--ink2)'}}>{team.t}</div>
          <div className="mono" style={{fontSize:10, color:'var(--ink3)'}}>{NFL[team.t].n} · {team.rec}</div>
        </div>
        {side==='home' && null}
      </div>
    );
  };

  return (
    <div className="pp-card" style={{marginBottom:10, overflow:'hidden', opacity: m.locked?0.65:1, position:'relative', borderColor: hasPick ? 'var(--line2)' : 'var(--line)'}}>
      {/* Confidence rail on left */}
      <div style={{display:'grid', gridTemplateColumns:'68px 1fr auto', alignItems:'stretch'}}>
        <div style={{
          background: hasPick ? (m.conf >= 13 ? 'var(--accent)' : 'var(--bg3)') : 'var(--bg3)',
          color: hasPick && m.conf>=13 ? '#000' : 'var(--ink)',
          borderRight:'1px solid var(--line)',
          display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
          padding:'12px 8px',
        }}>
          <div className="disp-900" style={{fontSize:38, lineHeight:0.9, color: hasPick ? (m.conf>=13?'#000':confColor) : 'var(--ink3)'}}>{m.conf ?? '—'}</div>
          <div className="tag" style={{fontSize:8, marginTop:2, color: hasPick && m.conf>=13 ? '#000' : 'var(--ink3)'}}>CONF</div>
        </div>

        <div style={{display:'flex', flexDirection:'column'}}>
          {/* meta strip */}
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'8px 14px', borderBottom:'1px solid var(--line)', background:'var(--bg3)'}}>
            <span className="mono" style={{fontSize:10, color:'var(--ink2)', fontWeight:600, letterSpacing:'0.06em'}}>{m.time}</span>
            <span className="pp-chip" style={{padding:'1px 6px', fontSize:9}}>{m.net}</span>
            <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>SPREAD</span>
            <span className="mono" style={{fontSize:11, fontWeight:700}}>{m.spread}</span>
            <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>O/U</span>
            <span className="mono" style={{fontSize:11, fontWeight:700}}>{m.ou}</span>
            <div style={{flex:1}}/>
            {m.picked_pct != null && (
              <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>
                <span style={{color:'var(--ink2)'}}>{m.picked_pct}%</span> of league picked <b style={{color:'var(--ink)'}}>{pickedTeam || '—'}</b>
              </span>
            )}
            {m.primetime && <span className="pp-chip accent" style={{padding:'1px 6px', fontSize:9}}>★ PRIME</span>}
            {m.locked && <span className="pp-chip" style={{padding:'1px 6px', fontSize:9, background:'var(--good)', color:'#000', borderColor:'var(--good)'}}>🔒 {m.final} · +{m.conf}</span>}
          </div>
          {/* teams */}
          <div style={{display:'flex', alignItems:'stretch', position:'relative', minHeight:70}}>
            <Side side="away" team={m.away} picked={pickedAway}/>
            <div style={{display:'flex', alignItems:'center', justifyContent:'center', padding:'0 6px', color:'var(--ink3)', fontFamily:'var(--disp)', fontSize:14, fontWeight:800}}>@</div>
            <Side side="home" team={m.home} picked={pickedHome}/>
          </div>
        </div>

        {/* right rail — change conf */}
        <div style={{padding:'12px 14px', borderLeft:'1px solid var(--line)', background:'var(--bg3)', display:'flex', flexDirection:'column', gap:6, alignItems:'center', justifyContent:'center', minWidth:70}}>
          <button style={{width:28, height:22, background:'var(--bg2)', border:'1px solid var(--line)', color:'var(--ink)', borderRadius:2, cursor:'pointer', fontFamily:'var(--disp)', fontWeight:800}}>▲</button>
          <span className="tag" style={{fontSize:8}}>RANK</span>
          <button style={{width:28, height:22, background:'var(--bg2)', border:'1px solid var(--line)', color:'var(--ink)', borderRadius:2, cursor:'pointer', fontFamily:'var(--disp)', fontWeight:800}}>▼</button>
        </div>
      </div>
    </div>
  );
}


// Make Picks — A secondary (split card, picked side flood)
function MakePicksHiA() {
  const picked = MATCHUPS_HI.filter(m=>m.picked).length;
  return (
    <div className="pp pp-gridbg" style={{width:760, height:1080, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <PPNav active="Make Picks" right={<span className="pp-chip accent">{picked}/8 picked</span>}/>

      <div className="pp-hero-grad" style={{padding:'22px 24px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'flex-end', justifyContent:'space-between'}}>
        <div>
          <div className="tag">WEEK 8 · STRAIGHT PICKS</div>
          <div className="disp-900" style={{fontSize:52, marginTop:4}}>WHO YA GOT?</div>
          <div className="mono" style={{fontSize:11, color:'var(--ink2)', marginTop:4}}>tap either side · no confidence needed</div>
        </div>
        <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6}}>
          <div style={{width:200, height:8, background:'var(--bg3)', border:'1px solid var(--line)', borderRadius:99, overflow:'hidden'}}>
            <div style={{height:'100%', width: `${(picked/8)*100}%`, background:'var(--accent)'}}/>
          </div>
          <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>{picked} of 8 · {Math.round(picked/8*100)}%</span>
        </div>
      </div>

      <div className="pp-scroll" style={{flex:1, padding:'14px 24px', overflow:'auto'}}>
        {MATCHUPS_HI.map((m,i)=><PickRowHiA key={i} m={m}/>)}
      </div>

      <div style={{padding:'14px 24px', borderTop:'1px solid var(--line)', background:'var(--bg2)', display:'flex', alignItems:'center', gap:10}}>
        <button className="pp-btn ghost">Reset</button>
        <div style={{flex:1}}/>
        <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>autosave on · last {picked>0?'12s ago':'—'}</span>
        <button className="pp-btn primary">Submit →</button>
      </div>
    </div>
  );
}

function PickRowHiA({ m }) {
  const pickedAway = m.picked === m.away.t;
  const pickedHome = m.picked === m.home.t;
  const awayC = NFL[m.away.t].p;
  const homeC = NFL[m.home.t].p;
  const Side = ({ side, team, picked, c }) => (
    <div style={{
      flex:1, display:'flex', alignItems:'center', gap:12, padding:'18px 20px',
      justifyContent: side==='away' ? 'flex-start' : 'flex-end',
      background: picked ? `linear-gradient(${side==='away'?'90deg':'270deg'}, ${c}, color-mix(in oklab, ${c} 60%, #000))` : 'transparent',
      color: picked ? '#fff' : 'var(--ink2)',
      position:'relative', cursor: m.locked?'default':'pointer',
      transition:'all .15s',
    }}>
      {side==='home' && <div style={{flex:1}}/>}
      <TeamLogo abbr={team.t} size={52}/>
      <div style={{lineHeight:1.05, textAlign: side==='away'?'left':'right', order: side==='home'?-1:0}}>
        <div className="disp-900" style={{fontSize:28, color: picked?'#fff':'var(--ink)'}}>{team.t}</div>
        <div className="mono" style={{fontSize:10, opacity: picked?0.9:0.7, marginTop:2}}>{NFL[team.t].n}</div>
        <div className="mono" style={{fontSize:10, opacity: picked?0.8:0.5, marginTop:1}}>{team.rec}</div>
      </div>
      {picked && (
        <div style={{position:'absolute', top:10, [side==='away'?'left':'right']:14, display:'flex', alignItems:'center', gap:4}}>
          <span style={{width:14, height:14, borderRadius:99, background:'#fff', color:c, fontSize:10, fontFamily:'var(--disp)', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center'}}>✓</span>
          <span className="mono" style={{fontSize:9, fontWeight:700, letterSpacing:'0.08em'}}>PICKED</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="pp-card" style={{marginBottom:10, overflow:'hidden', opacity: m.locked?0.65:1, border: (pickedAway||pickedHome) ? '1px solid var(--line2)' : '1px solid var(--line)'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 14px', background:'var(--bg3)', borderBottom:'1px solid var(--line)'}}>
        <div style={{display:'flex', gap:10, alignItems:'center'}}>
          <span className="mono" style={{fontSize:10, color:'var(--ink2)', fontWeight:600}}>{m.time}</span>
          <span className="pp-chip" style={{padding:'1px 6px', fontSize:9}}>{m.net}</span>
          {m.primetime && <span className="pp-chip accent" style={{padding:'1px 6px', fontSize:9}}>PRIME</span>}
        </div>
        <div style={{display:'flex', gap:12, alignItems:'center'}}>
          <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>SPREAD <b style={{color:'var(--ink)'}}>{m.spread}</b></span>
          <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>O/U <b style={{color:'var(--ink)'}}>{m.ou}</b></span>
          {m.locked && <span className="pp-chip" style={{background:'var(--good)', color:'#000', borderColor:'var(--good)', padding:'1px 6px', fontSize:9}}>🔒 {m.final}</span>}
        </div>
      </div>
      <div style={{display:'flex', alignItems:'stretch', position:'relative', minHeight:90}}>
        <Side side="away" team={m.away} picked={pickedAway} c={awayC}/>
        <div style={{position:'absolute', left:'50%', top:'50%', transform:'translate(-50%,-50%)', width:36, height:36, borderRadius:99, background:'var(--bg2)', border:'2px solid var(--line2)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--disp)', fontSize:13, fontWeight:800, color:'var(--ink3)', zIndex:2}}>@</div>
        <Side side="home" team={m.home} picked={pickedHome} c={homeC}/>
      </div>
      {m.picked_pct != null && (
        <div style={{padding:'6px 14px', borderTop:'1px solid var(--line)', background:'var(--bg2)', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <span className="tag">LEAGUE CONSENSUS</span>
          <div style={{flex:1, margin:'0 12px', height:5, background:'var(--bg3)', borderRadius:99, display:'flex', overflow:'hidden'}}>
            <div style={{width:`${m.picked_pct}%`, background: pickedAway?awayC:homeC}}/>
            <div style={{width:`${100-m.picked_pct}%`, background: pickedHome?homeC:awayC, opacity:0.4}}/>
          </div>
          <span className="mono" style={{fontSize:10, color:'var(--ink2)', fontWeight:600}}>{m.picked_pct}% / {100-m.picked_pct}%</span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { MakePicksHiA, MakePicksHiB, MATCHUPS_HI });
