// Hi-fi Profile A — dense KPI grid, weekly bars, tendencies, timeline

const WEEK_HIST_HI = [
  {wk:1, correct:12, total:16, rank:12, pts:12},
  {wk:2, correct:9,  total:13, rank:8,  pts:9},
  {wk:3, correct:14, total:16, rank:5,  pts:14},
  {wk:4, correct:8,  total:13, rank:9,  pts:8},
  {wk:5, correct:11, total:13, rank:7,  pts:11},
  {wk:6, correct:13, total:16, rank:6,  pts:13},
  {wk:7, correct:7,  total:13, rank:9,  pts:7},
  {wk:8, correct:10, total:13, rank:7,  pts:10},
];

function ProfileHi() {
  const totalC = WEEK_HIST_HI.reduce((a,w)=>a+w.correct,0);
  const totalT = WEEK_HIST_HI.reduce((a,w)=>a+w.total,0);
  const maxC = Math.max(...WEEK_HIST_HI.map(w=>w.correct));
  const winPct = Math.round(totalC/totalT*100);

  return (
    <div className="pp pp-gridbg" style={{width:1400, height:1000, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <PPNav active="Profile" right={<span className="pp-chip accent">RANK #7 · W1</span>}/>

      {/* Hero card */}
      <div className="pp-hero-grad" style={{padding:'24px 28px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'stretch', gap:28}}>
        <div style={{display:'flex', alignItems:'center', gap:18}}>
          <div style={{width:104, height:104, borderRadius:4, background:'linear-gradient(145deg, var(--bg3), var(--bg2))', border:'1px solid var(--line)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--disp)', fontWeight:900, fontSize:36, color:'var(--accent)'}}>DS</div>
          <div>
            <div className="tag">PROFILE · 2026</div>
            <div className="disp-900" style={{fontSize:56}}>Dana Scully</div>
            <div className="mono" style={{fontSize:12, color:'var(--ink2)', marginTop:4}}>@scully · joined 2022 · 3 seasons · 1 ring 💍</div>
            <div style={{display:'flex', gap:6, marginTop:10}}>
              <span className="pp-chip accent" style={{padding:'3px 8px'}}>🔥 W1 STREAK</span>
              <span className="pp-chip">TPP ORIGINAL</span>
              <span className="pp-chip">'22 CHAMP</span>
            </div>
          </div>
        </div>
        <div style={{width:1, background:'var(--line)'}}/>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:24, flex:1, alignItems:'center'}}>
          {[
            {k:'SEASON PTS', v:totalC, sub:'122 total', c:'accent'},
            {k:'WIN RATE', v:winPct+'%', sub:totalC+'-'+(totalT-totalC), c:'ink'},
            {k:'CURRENT RANK', v:'#7', sub:'of 40', c:'ink'},
            {k:'TO 1ST', v:'-20', sub:'8 wks left', c:'warn'},
            {k:'BEST WEEK', v:maxC, sub:'wk 3', c:'good'},
          ].map((s,i)=>(
            <div key={i}>
              <div className="tag">{s.k}</div>
              <div className="disp-900" style={{fontSize:40, color: s.c==='accent'?'var(--accent)':s.c==='warn'?'var(--warn)':s.c==='good'?'var(--good)':'var(--ink)'}}>{s.v}</div>
              <div className="mono" style={{fontSize:10, color:'var(--ink3)'}}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div style={{flex:1, display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:14, padding:'14px 24px 18px', overflow:'hidden', minHeight:0}}>

        {/* LEFT column */}
        <div style={{display:'flex', flexDirection:'column', gap:14, overflow:'hidden'}}>

          {/* Weekly performance */}
          <div className="pp-card" style={{padding:'16px 18px'}}>
            <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', marginBottom:12}}>
              <div>
                <div className="disp" style={{fontSize:18}}>WEEKLY PERFORMANCE</div>
                <div className="tag">correct picks per week · avg rank overlay</div>
              </div>
              <div style={{display:'flex', gap:12, alignItems:'center'}}>
                <span className="mono" style={{fontSize:10, color:'var(--good)'}}>■ correct</span>
                <span className="mono" style={{fontSize:10, color:'var(--ink3)'}}>□ missed</span>
                <span className="mono" style={{fontSize:10, color:'var(--accent)'}}>● rank</span>
              </div>
            </div>
            <div style={{display:'flex', gap:10, alignItems:'flex-end', height:180, padding:'0 4px', position:'relative'}}>
              {/* grid rules */}
              {[0,0.25,0.5,0.75,1].map(v=>(
                <div key={v} style={{position:'absolute', left:0, right:0, bottom: `${v*100}%`, height:1, background:'var(--line)', opacity:0.5}}/>
              ))}
              {WEEK_HIST_HI.map(w=>(
                <div key={w.wk} style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, position:'relative', height:'100%', justifyContent:'flex-end'}}>
                  <div style={{width:'100%', position:'relative', height: `${(w.correct/16)*100}%`, display:'flex', flexDirection:'column'}}>
                    <div className="num" style={{fontSize:16, color:'var(--ink)', textAlign:'center', position:'absolute', top:-22, left:0, right:0}}>{w.correct}</div>
                    <div style={{flex:1, background: w.correct>=11?'linear-gradient(180deg, var(--good), color-mix(in oklab, var(--good) 60%, #000))':w.correct>=8?'linear-gradient(180deg, var(--accent), color-mix(in oklab, var(--accent) 60%, #000))':'linear-gradient(180deg, var(--bad), color-mix(in oklab, var(--bad) 60%, #000))', borderRadius:'2px 2px 0 0'}}/>
                  </div>
                  <div className="tag" style={{fontSize:9}}>WK{w.wk}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent picks timeline */}
          <div className="pp-card" style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minHeight:0}}>
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'baseline', gap:8}}>
              <div className="disp" style={{fontSize:18}}>PICK HISTORY</div>
              <span className="tag">most recent</span>
              <div style={{flex:1}}/>
              <span className="pp-chip">Show all</span>
            </div>
            <div className="pp-scroll" style={{flex:1, overflowY:'auto'}}>
              {[
                {wk:8, t:'BUF', r:'pending', opp:'KC',  conf:16, ptsAgainst:'KC'},
                {wk:7, t:'PHI', r:'won',     opp:'NYG', conf:15, score:'28-10'},
                {wk:7, t:'KC',  r:'won',     opp:'LV',  conf:14, score:'31-17'},
                {wk:7, t:'SF',  r:'lost',    opp:'LAR', conf:12, score:'21-24'},
                {wk:6, t:'DET', r:'won',     opp:'MIN', conf:13, score:'24-17'},
                {wk:6, t:'BAL', r:'won',     opp:'CLE', conf:10, score:'20-14'},
                {wk:6, t:'MIA', r:'lost',    opp:'NE',  conf:9,  score:'13-20'},
              ].map((p,i)=>(
                <div key={i} style={{display:'grid', gridTemplateColumns:'44px 44px 1fr auto auto', gap:12, padding:'10px 18px', alignItems:'center', borderBottom:'1px solid var(--line)'}}>
                  <span className="tag">W{p.wk}</span>
                  <TeamLogo abbr={p.t} size={34}/>
                  <div style={{lineHeight:1.15}}>
                    <div style={{fontSize:13, fontWeight:600}}>{NFL[p.t].n} <span style={{color:'var(--ink3)', fontSize:11, fontWeight:400}}>vs {p.opp}</span></div>
                    <div className="mono" style={{fontSize:10, color:'var(--ink3)'}}>conf {p.conf}{p.score?' · final '+p.score:''}</div>
                  </div>
                  <div style={{width:120, height:6, background:'var(--bg3)', borderRadius:99, overflow:'hidden'}}>
                    <div style={{height:'100%', width:`${(p.conf/16)*100}%`, background: p.r==='won'?'var(--good)':p.r==='lost'?'var(--bad)':'var(--accent)'}}/>
                  </div>
                  {p.r==='won'     && <span className="pp-chip good"   style={{padding:'3px 8px', fontSize:10, minWidth:80, justifyContent:'center'}}>✓ WON +{p.conf}</span>}
                  {p.r==='lost'    && <span className="pp-chip bad"    style={{padding:'3px 8px', fontSize:10, minWidth:80, justifyContent:'center'}}>✗ LOST</span>}
                  {p.r==='pending' && <span className="pp-chip"        style={{padding:'3px 8px', fontSize:10, minWidth:80, justifyContent:'center', borderColor:'var(--accent)', color:'var(--accent)'}}>◌ PENDING</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT column */}
        <div style={{display:'flex', flexDirection:'column', gap:14, overflow:'hidden', minHeight:0}}>

          {/* Deeper stats */}
          <div className="pp-card" style={{padding:'14px 18px'}}>
            <div className="disp" style={{fontSize:18, marginBottom:10}}>ADVANCED</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              {[
                {k:'ATS RECORD', v:'48-42', sub:'53% · league #5'},
                {k:'VS FAVORITES', v:'68%', sub:'strong signal'},
                {k:'VS UNDERDOGS', v:'44%', sub:'room to grow'},
                {k:'AVG CONFIDENCE', v:'10.2', sub:'per correct pick'},
                {k:'CAREER PCT', v:'59%', sub:'322-224 · 3 yrs'},
                {k:'LONGEST STREAK', v:'7', sub:'wk 3-5, 2024'},
              ].map((s,i)=>(
                <div key={i} style={{padding:'10px', background:'var(--bg3)', border:'1px solid var(--line)', borderRadius:3}}>
                  <div className="tag">{s.k}</div>
                  <div className="num" style={{fontSize:24}}>{s.v}</div>
                  <div className="mono" style={{fontSize:9, color:'var(--ink3)'}}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pick tendencies */}
          <div className="pp-card" style={{display:'flex', flexDirection:'column', overflow:'hidden', flex:1, minHeight:0}}>
            <div style={{padding:'14px 18px', borderBottom:'1px solid var(--line)', display:'flex', alignItems:'baseline', gap:8}}>
              <div className="disp" style={{fontSize:18}}>TENDENCIES</div>
              <span className="tag">pick frequency · season</span>
            </div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', flex:1, overflow:'hidden'}}>
              <div style={{padding:'12px 16px', borderRight:'1px solid var(--line)', overflow:'auto'}} className="pp-scroll">
                <div className="tag" style={{marginBottom:8, color:'var(--good)'}}>■ MOST TRUSTED</div>
                {[{t:'KC',n:8,w:7},{t:'PHI',n:7,w:6},{t:'BAL',n:6,w:5},{t:'SF',n:5,w:3},{t:'DET',n:4,w:4}].map(r=>{
                  const pct = Math.round(r.w/r.n*100);
                  return (
                    <div key={r.t} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--line)'}}>
                      <TeamLogo abbr={r.t} size={28}/>
                      <div style={{flex:1, lineHeight:1.1}}>
                        <div style={{fontSize:12, fontWeight:600}}>{NFL[r.t].n}</div>
                        <div style={{height:4, background:'var(--bg3)', borderRadius:99, marginTop:3, overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${pct}%`, background:'var(--good)'}}/>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className="mono" style={{fontSize:11, fontWeight:700}}>{r.w}/{r.n}</div>
                        <div className="mono" style={{fontSize:9, color:'var(--good)'}}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{padding:'12px 16px', overflow:'auto'}} className="pp-scroll">
                <div className="tag" style={{marginBottom:8, color:'var(--bad)'}}>■ BLIND SPOTS</div>
                {[{t:'JAX',n:1,w:0},{t:'CAR',n:2,w:0},{t:'LV',n:3,w:0},{t:'NYJ',n:2,w:0},{t:'CHI',n:2,w:1}].map(r=>{
                  const pct = Math.round(r.w/r.n*100);
                  return (
                    <div key={r.t} style={{display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid var(--line)'}}>
                      <TeamLogo abbr={r.t} size={28}/>
                      <div style={{flex:1, lineHeight:1.1}}>
                        <div style={{fontSize:12, fontWeight:600}}>{NFL[r.t].n}</div>
                        <div style={{height:4, background:'var(--bg3)', borderRadius:99, marginTop:3, overflow:'hidden'}}>
                          <div style={{height:'100%', width:`${Math.max(pct, 6)}%`, background:'var(--bad)'}}/>
                        </div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div className="mono" style={{fontSize:11, fontWeight:700}}>{r.w}/{r.n}</div>
                        <div className="mono" style={{fontSize:9, color:'var(--bad)'}}>{pct}%</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ProfileHi });
