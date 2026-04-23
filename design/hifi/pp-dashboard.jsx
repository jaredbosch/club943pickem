// Hi-fi Dashboard A — ESPN-ish dense standings, live ticker, team stats.
// Uses pp-system: Barlow Condensed display, Inter body, JetBrains mono data.

const PLAYERS_HI = [
  { n:'Jerry Jones',   h:'@jjones',   pts:142, w:88, l:30, streak:5,  mv:'up',   mvn:2, lastPick:'KC', lastOk:true,  hot:true,  spark:[0.6,0.7,0.9,0.8,0.95,0.85,1.0,0.95] },
  { n:'Brady Gisele',  h:'@brady12',  pts:138, w:85, l:33, streak:3,  mv:'up',   mvn:1, lastPick:'BUF',lastOk:true,  hot:true,  spark:[0.5,0.65,0.7,0.9,0.85,0.88,0.92,0.9] },
  { n:'Hunter Time',   h:'@hunter',   pts:136, w:83, l:35, streak:2,  mv:'down', mvn:1, lastPick:'PHI',lastOk:true,  hot:false, spark:[0.7,0.8,0.9,0.95,0.85,0.8,0.85,0.88] },
  { n:'Coach Mike',    h:'@coachm',   pts:131, w:82, l:36, streak:-1, mv:'down', mvn:2, lastPick:'DAL',lastOk:false, hot:false, spark:[0.6,0.75,0.8,0.85,0.9,0.8,0.75,0.7] },
  { n:'Ron Swanson',   h:'@ron',      pts:128, w:79, l:39, streak:1,  mv:'up',   mvn:3, lastPick:'SF', lastOk:true,  hot:false, spark:[0.3,0.4,0.5,0.6,0.65,0.7,0.75,0.8] },
  { n:'Aaron R',       h:'@aaron',    pts:124, w:76, l:42, streak:-2, mv:'down', mvn:1, lastPick:'GB', lastOk:false, hot:false, spark:[0.8,0.7,0.75,0.7,0.65,0.6,0.5,0.45] },
  { n:'Dana Scully',   h:'@scully',   pts:122, w:75, l:43, streak:1,  mv:'up',   mvn:1, lastPick:'MIN',lastOk:true,  hot:false, spark:[0.5,0.55,0.6,0.7,0.65,0.7,0.72,0.78] },
  { n:'Walter White',  h:'@heisen',   pts:118, w:73, l:45, streak:0,  mv:'flat', lastPick:'DET',lastOk:true,  hot:false, spark:[0.6,0.6,0.6,0.65,0.7,0.65,0.7,0.68] },
  { n:'Michael Scott', h:'@mscott',   pts:114, w:71, l:47, streak:-3, mv:'down', mvn:2, lastPick:'NYJ',lastOk:false, hot:false, spark:[0.7,0.65,0.6,0.55,0.5,0.48,0.45,0.4] },
  { n:'Pam Beesly',    h:'@pam',      pts:110, w:68, l:50, streak:2,  mv:'up',   mvn:2, lastPick:'BAL',lastOk:true,  hot:false, spark:[0.4,0.45,0.5,0.55,0.6,0.62,0.65,0.7] },
];

const TEAM_STATS_HI = [
  { t:'KC',  rec:'7-1', pf:238, pa:162, ats:'5-3', form:['W','W','W','L','W'], picked:72 },
  { t:'BUF', rec:'6-2', pf:224, pa:178, ats:'4-4', form:['W','L','W','W','W'], picked:65 },
  { t:'PHI', rec:'6-2', pf:210, pa:170, ats:'5-3', form:['W','W','L','W','W'], picked:58 },
  { t:'DET', rec:'5-3', pf:212, pa:190, ats:'4-4', form:['W','W','L','W','L'], picked:51 },
  { t:'SF',  rec:'5-3', pf:198, pa:182, ats:'3-5', form:['L','W','W','L','W'], picked:44 },
  { t:'DAL', rec:'4-4', pf:192, pa:196, ats:'3-5', form:['L','L','W','W','L'], picked:38 },
];

function LiveGameHi({ a, b, sa, sb, q, poss, spread, featured }) {
  return (
    <div className="pp-card" style={{
      padding:'12px 14px', minWidth: featured?260:220,
      background: featured ? 'var(--bg3)' : 'var(--bg2)',
      border: featured ? '1px solid var(--accent)' : '1px solid var(--line)',
      position:'relative', overflow:'hidden'
    }}>
      {featured && (
        <div style={{position:'absolute', top:0, left:0, right:0, height:2, background:'var(--accent)'}}/>
      )}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8}}>
        <div style={{display:'flex', alignItems:'center', gap:5}}>
          <span className="pp-live-dot"/>
          <span className="mono" style={{fontSize:10, color:'var(--live)', fontWeight:700, letterSpacing:'0.08em'}}>LIVE</span>
          <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>· {q}</span>
        </div>
        <span className="mono" style={{fontSize:9, color:'var(--ink3)'}}>{spread}</span>
      </div>
      {[[a,sa],[b,sb]].map(([tm,sc],i)=>(
        <div key={tm} style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0', borderTop: i===1?'1px solid var(--line)':'none'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <TeamLogo abbr={tm} size={26}/>
            <div style={{lineHeight:1.05}}>
              <div className="disp" style={{fontSize:15, fontWeight:800}}>{tm}</div>
              <div className="mono" style={{fontSize:9, color:'var(--ink3)'}}>{NFL[tm].n}</div>
            </div>
            {poss===tm && <span style={{fontSize:10, color:'var(--accent)'}}>●</span>}
          </div>
          <span className="num" style={{fontSize:28, color: sc === Math.max(sa,sb) ? 'var(--ink)' : 'var(--ink2)'}}>{sc}</span>
        </div>
      ))}
    </div>
  );
}

function TickerStrip() {
  const items = [
    'KC 21 · BUF 17 · Q3',
    'PHI 10 · DAL 14 · Q2',
    'SF 24 · LAR 13 · Q4',
    'CIN 31 · CLE 14 · FINAL',
    'DET 28 · GB 20 · FINAL',
    'MIA 23 · NE 13 · FINAL',
    'HOU 27 · IND 24 · FINAL',
    '🏆 WK HIGH · Jerry Jones · 9 pts',
    '↑ Ron Swanson +3 ranks',
  ];
  return (
    <div style={{borderBottom:'1px solid var(--line)', borderTop:'1px solid var(--line)', background:'var(--bg2)', overflow:'hidden', position:'relative'}}>
      <div style={{display:'flex', whiteSpace:'nowrap', padding:'6px 0'}} className="pp-ticker-track">
        {[...items, ...items].map((t,i)=>(
          <span key={i} className="mono" style={{fontSize:10, padding:'0 18px', color:'var(--ink2)', letterSpacing:'0.04em', display:'inline-flex', alignItems:'center', gap:6}}>
            <span className="pp-live-dot" style={{animationDelay:`${i*0.1}s`}}/>
            {t}
          </span>
        ))}
      </div>
      <div style={{position:'absolute', left:0, top:0, bottom:0, width:40, background:'linear-gradient(90deg, var(--bg2), transparent)', pointerEvents:'none'}}/>
      <div style={{position:'absolute', right:0, top:0, bottom:0, width:40, background:'linear-gradient(270deg, var(--bg2), transparent)', pointerEvents:'none'}}/>
    </div>
  );
}

function DashboardHi() {
  return (
    <div className="pp pp-gridbg" style={{ width:1400, height:1000, overflow:'hidden', display:'flex', flexDirection:'column' }}>
      <PPNav active="Dashboard" right={
        <>
          <span className="pp-chip live"><span className="pp-live-dot" style={{background:'#fff'}}/> 3 LIVE</span>
          <span style={{width:26, height:26, borderRadius:99, background:'var(--bg3)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700}}>DS</span>
        </>
      }/>

      {/* Hero: gradient banner with headline stats */}
      <div className="pp-hero-grad" style={{padding:'22px 24px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'stretch', gap:28}}>
        <div style={{flex:'0 0 auto'}}>
          <div className="tag">SEASON 2026 · WEEK 8 · STANDINGS</div>
          <div className="disp-900" style={{fontSize:56, marginTop:6}}>THE BOARD</div>
          <div style={{display:'flex', alignItems:'baseline', gap:10, marginTop:6}}>
            <span className="mono" style={{fontSize:12, color:'var(--ink2)'}}>40 players · 112 games remaining · $1,200 pot</span>
          </div>
        </div>
        <div style={{width:1, background:'var(--line)'}}/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, auto)', gap:28, flex:1, alignItems:'center'}}>
          {[
            {k:'YOUR RANK', v:'#7', d:'+1 this wk', c:'good'},
            {k:'POINTS TO 1ST', v:'-20', d:'8 weeks left', c:'ink2'},
            {k:'WEEK HIGH', v:'9', d:'Jerry Jones', c:'accent'},
            {k:'POOL POT', v:'$1.2K', d:'winner take most', c:'ink2'},
          ].map((s,i)=>(
            <div key={i}>
              <div className="tag">{s.k}</div>
              <div className="disp-900" style={{fontSize:44, color: s.c==='accent'?'var(--accent)':s.c==='good'?'var(--good)':'var(--ink)'}}>{s.v}</div>
              <div className="mono" style={{fontSize:10, color:'var(--ink3)', marginTop:2}}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ticker */}
      <TickerStrip/>

      {/* Live games row */}
      <div style={{padding:'16px 24px 10px', display:'flex', gap:12, alignItems:'center'}}>
        <div style={{display:'flex', flexDirection:'column', gap:2, marginRight:6}}>
          <span className="disp" style={{fontSize:16}}>LIVE NOW</span>
          <span className="tag">featured</span>
        </div>
        <LiveGameHi a="KC" b="BUF" sa={21} sb={17} q="Q3 4:22" poss="KC" spread="BUF -2.5" featured/>
        <LiveGameHi a="PHI" b="DAL" sa={10} sb={14} q="Q2 0:48" poss="DAL" spread="PHI -3"/>
        <LiveGameHi a="SF" b="LAR" sa={24} sb={13} q="Q4 9:11" poss="SF" spread="SF -4"/>
        <div style={{flex:1}}/>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          <button className="pp-btn primary">Make Your Picks →</button>
          <span className="mono" style={{fontSize:10, color:'var(--ink3)', textAlign:'right'}}>deadline · 2d 4h 12m</span>
        </div>
      </div>

      {/* Main grid */}
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1.6fr 1fr', gap:14, padding:'10px 24px 18px', overflow:'hidden', minHeight:0}}>
        {/* LEFT — standings */}
        <div className="pp-card" style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'14px 16px', borderBottom:'1px solid var(--line)'}}>
            <div>
              <div className="disp" style={{fontSize:20}}>LEAGUE STANDINGS</div>
              <div className="tag">live · updates per game</div>
            </div>
            <div style={{flex:1}}/>
            <div style={{display:'flex', gap:0, border:'1px solid var(--line)', borderRadius:3, overflow:'hidden'}}>
              <button className="pp-btn ghost" style={{borderRadius:0, borderWidth:0, background:'var(--accent)', color:'#000'}}>Season</button>
              <button className="pp-btn ghost" style={{borderRadius:0, borderWidth:0, borderLeft:'1px solid var(--line)'}}>Week</button>
              <button className="pp-btn ghost" style={{borderRadius:0, borderWidth:0, borderLeft:'1px solid var(--line)'}}>ATS</button>
            </div>
          </div>

          {/* Column headers */}
          <div style={{display:'grid', gridTemplateColumns:'40px 1.8fr 44px 60px 90px 60px 60px 60px', padding:'8px 16px', borderBottom:'1px solid var(--line)', background:'var(--bg3)'}}>
            {['#','PLAYER','Δ','REC','FORM','PTS','STR','LAST'].map(h=>(
              <span key={h} className="tag" style={{fontSize:9}}>{h}</span>
            ))}
          </div>

          <div className="pp-scroll" style={{overflowY:'auto', flex:1}}>
            {PLAYERS_HI.map((p,i)=>(
              <div key={p.n} style={{
                display:'grid', gridTemplateColumns:'40px 1.8fr 44px 60px 90px 60px 60px 60px',
                padding:'10px 16px', alignItems:'center',
                borderBottom:'1px solid var(--line)',
                background: i===0 ? 'color-mix(in oklab, var(--accent) 10%, transparent)' : 'transparent',
                position:'relative',
              }}>
                {i===0 && <div style={{position:'absolute', left:0, top:0, bottom:0, width:3, background:'var(--accent)'}}/>}
                <span className="num" style={{fontSize:20, color: i<3?'var(--ink)':'var(--ink2)'}}>{String(i+1).padStart(2,'0')}</span>
                <div style={{display:'flex', alignItems:'center', gap:10, minWidth:0}}>
                  <div style={{width:30, height:30, borderRadius:3, background:'var(--bg3)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--disp)', fontWeight:800, fontSize:11, flexShrink:0}}>
                    {p.n.split(' ').map(x=>x[0]).join('')}
                  </div>
                  <div style={{lineHeight:1.1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:5}}>
                      <span style={{whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>{p.n}</span>
                      {p.hot && <span style={{fontSize:10}}>🔥</span>}
                    </div>
                    <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>{p.h}</span>
                  </div>
                </div>
                <RankDelta dir={p.mv} n={p.mvn}/>
                <span className="mono" style={{fontSize:12, color:'var(--ink2)'}}>{p.w}–{p.l}</span>
                <span style={{color: p.streak>=0?'var(--good)':'var(--bad)'}}>
                  <Sparkline data={p.spark} w={80} h={22} fill/>
                </span>
                <span className="num" style={{fontSize:22, color: i===0?'var(--accent)':'var(--ink)'}}>{p.pts}</span>
                <span className="mono" style={{fontSize:11, fontWeight:600, color: p.streak>0?'var(--good)':p.streak<0?'var(--bad)':'var(--ink3)'}}>
                  {p.streak>0?`W${p.streak}`:p.streak<0?`L${-p.streak}`:'—'}
                </span>
                <div style={{display:'flex', alignItems:'center', gap:5}}>
                  <TeamLogo abbr={p.lastPick} size={22}/>
                  <span className="mono" style={{fontSize:10, color: p.lastOk?'var(--good)':'var(--bad)', fontWeight:700}}>
                    {p.lastOk?'W':'L'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — team stats + activity */}
        <div style={{display:'flex', flexDirection:'column', gap:14, overflow:'hidden'}}>
          <div className="pp-card" style={{display:'flex', flexDirection:'column', overflow:'hidden'}}>
            <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'baseline', gap:8}}>
              <div className="disp" style={{fontSize:18}}>TEAM STATS</div>
              <span className="tag">most-picked this wk</span>
            </div>
            <div>
              {TEAM_STATS_HI.map((t,i)=>(
                <div key={t.t} style={{
                  display:'grid', gridTemplateColumns:'auto 1fr auto auto',
                  gap:10, padding:'10px 14px', alignItems:'center',
                  borderBottom: i<TEAM_STATS_HI.length-1 ? '1px solid var(--line)':'none',
                }}>
                  <TeamLogo abbr={t.t} size={34}/>
                  <div style={{lineHeight:1.1, minWidth:0}}>
                    <div style={{fontSize:13, fontWeight:600}}>{NFL[t.t].n}</div>
                    <div className="mono" style={{fontSize:10, color:'var(--ink3)'}}>{t.rec} · ATS {t.ats} · {t.pf}/{t.pa}</div>
                  </div>
                  <div style={{display:'flex', gap:2}}>
                    {t.form.map((f,ix)=>(
                      <span key={ix} style={{
                        width:14, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center',
                        background: f==='W'?'var(--good)':'var(--bad)',
                        color:'#000', fontFamily:'var(--disp)', fontWeight:800, fontSize:9, borderRadius:2,
                      }}>{f}</span>
                    ))}
                  </div>
                  <div style={{textAlign:'right', minWidth:50}}>
                    <div className="num" style={{fontSize:18}}>{t.picked}<span style={{fontSize:11, color:'var(--ink3)'}}>%</span></div>
                    <div className="tag" style={{fontSize:8}}>picked</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pp-card" style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0}}>
            <div style={{padding:'12px 14px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'baseline', gap:8}}>
              <div className="disp" style={{fontSize:18}}>ACTIVITY</div>
              <span className="tag">live feed</span>
            </div>
            <div className="pp-scroll" style={{overflow:'auto', flex:1}}>
              {[
                {t:'2s ago',  txt:'Jerry Jones moved to #1', b:'↑', c:'accent'},
                {t:'1m ago',  txt:'KC scored · 14 players correct', b:'TD', c:'good'},
                {t:'3m ago',  txt:'Ron Swanson picked SF (late entry)', b:'🏈', c:'ink'},
                {t:'7m ago',  txt:'Brady locked 16 picks for Wk 8',     b:'🔒', c:'ink'},
                {t:'12m ago', txt:'PHI scored FG · 8 players correct', b:'FG', c:'good'},
                {t:'22m ago', txt:'Michael Scott joined streak: L3',    b:'❄', c:'bad'},
                {t:'31m ago', txt:'Weekly deadline · 2d 4h remaining',  b:'⏱', c:'warn'},
                {t:'1h ago',  txt:'Hunter gained confidence +3 (KC)',   b:'▲', c:'good'},
              ].map((a,i)=>(
                <div key={i} style={{display:'flex', alignItems:'center', gap:10, padding:'9px 14px', borderBottom:'1px solid var(--line)'}}>
                  <div style={{width:24, height:24, borderRadius:3, background:'var(--bg3)', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontFamily:'var(--disp)', fontWeight:800, color: a.c==='accent'?'var(--accent)':a.c==='good'?'var(--good)':a.c==='bad'?'var(--bad)':a.c==='warn'?'var(--warn)':'var(--ink)'}}>
                    {a.b}
                  </div>
                  <span style={{fontSize:12, flex:1}}>{a.txt}</span>
                  <span className="mono" style={{fontSize:9, color:'var(--ink3)'}}>{a.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { DashboardHi, PLAYERS_HI, TEAM_STATS_HI });
