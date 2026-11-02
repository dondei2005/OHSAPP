// 2026-11-02 計算題「數字變化題」：沿用原題的觀念，每次出題隨機換數字，答案由公式現算，避免背答案。
// 每個題型 key 不可改（作答統計存在 state.topicStats.calcv[key]）。
// src＝對應的原題 id；base＝原題的數字、orig＝原題答案（用來驗算公式算得出原題答案）；
// rand(R)＝隨機產生一組數字；make(p)＝回傳 {text, ans, unit, dp, steps, tol?, exact?, denom?}
//   dp＝答案顯示到小數第幾位；tol＝容許誤差（預設：小數最後一位的 0.6 或答案的 1%，取大者）；
//   exact＝必須完全相同（級數、根數、人數這類）；denom＝問「幾分之一」，填分母或 1/分母 都算對。
(function(){
  const R = {
    int:(a,b)=>a+Math.floor(Math.random()*(b-a+1)),
    pick:a=>a[Math.floor(Math.random()*a.length)],
    step:(a,b,s)=>{ const n = Math.round((b-a)/s); return +(a+s*Math.floor(Math.random()*(n+1))).toFixed(6); },
  };
  const n = x=>String(+(+x).toFixed(6));                       // 題目裡的數字（去掉多餘的 0）
  const c = x=>(+x).toLocaleString("en-US",{maximumFractionDigits:6}); // 大數字加千分位
  const r = (x,dp)=>+(+x).toFixed(dp);
  const trunc = (x,dp)=>{ const k = Math.pow(10,dp); return Math.floor(x*k+1e-9)/k; };
  const log10 = Math.log10;
  const ORG = {
    1:{coef:0.3, names:["三氯甲烷","四氯化碳","1,2-二氯乙烷","二硫化碳","三氯乙烯"]},
    2:{coef:0.04, names:["甲苯","丙酮","二甲苯","異丙醇","正己烷","甲醇","乙酸乙酯"]},
    3:{coef:0.01, names:["汽油","石油醚","松節油","礦油精","石油精"]},
  };
  const ALLOW = {1:[1,15,"1/15"], 2:[2,5,"2/5"], 3:[3,2,"3/2"]};
  const vfactor = pel=>pel<1?3 : pel<10?2 : pel<100?1.5 : pel<1000?1.25 : 1;
  const noiseT = L=>8/Math.pow(2,(L-90)/5);

  const V = [
    {key:"fr", title:"失能傷害頻率 FR", src:["ch36-017","examB-S10807-11"], base:{n:4,H:1568000}, orig:2.55,
      rand:()=>({n:R.int(1,9), H:R.step(150000,3000000,1000)}),
      make:p=>{ const raw = p.n*1e6/p.H, ans = trunc(raw,2);
        return {text:`某工廠某月份失能傷害件數為${p.n}件，總經歷工時為${c(p.H)}小時，其失能傷害頻率(FR)為多少？（取到小數點以下第二位，第三位以後捨棄）`,
          ans, unit:"", dp:2, tol:0.0001,
          steps:[`FR ＝ 失能傷害人次數 × 10⁶ ÷ 總經歷工時`, `＝ ${p.n} × 1,000,000 ÷ ${c(p.H)} ＝ ${raw.toFixed(4)}…`, `第三位以後捨棄（不是四捨五入）→ ${ans.toFixed(2)}`]}; }},
    {key:"sr", title:"失能傷害嚴重率 SR", src:["examB-S10807-12","ch38-029"], base:{d:15,H:20000,death:0}, orig:750,
      rand:()=>({d:R.int(5,400), H:R.step(20000,2000000,1000), death:Math.random()<0.3?1:0}),
      make:p=>{ const days = p.d+p.death*6000, raw = days*1e6/p.H, ans = trunc(raw,0);
        return {text:`某事業單位某月總經歷工時${c(p.H)}小時，${p.death?`發生死亡1人，另其他失能傷害損失日數合計${p.d}日`:`失能傷害總損失日數${p.d}日`}，其失能傷害嚴重率(SR)為何？（小數點以下捨棄）`,
          ans, unit:"", dp:0, tol:0.0001,
          steps:[...(p.death?[`死亡一人損失日數以 6,000 日計 → 總損失日數 ＝ 6,000 ＋ ${p.d} ＝ ${c(days)} 日`]:[]),
            `SR ＝ 總損失日數 × 10⁶ ÷ 總經歷工時 ＝ ${c(days)} × 1,000,000 ÷ ${c(p.H)} ＝ ${raw.toFixed(3)}…`, `SR 取整數，小數點以下捨棄 → ${ans}`]}; }},
    {key:"fsi", title:"總合傷害指數", src:["ch36-019"], base:{FR:40,k:20}, orig:20,
      rand:()=>({FR:R.pick([2,4,5,8,10,20,25,40,50]), k:R.int(2,30)}),
      make:p=>{ const SR = p.k*p.k*1000/p.FR;
        return {text:`某事業單位某年度失能傷害頻率(FR)為${p.FR}，失能傷害嚴重率(SR)為${c(SR)}，其總合傷害指數為何？`,
          ans:p.k, unit:"", dp:2,
          steps:[`總合傷害指數 ＝ √(FR × SR ÷ 1,000)`, `＝ √(${p.FR} × ${c(SR)} ÷ 1,000) ＝ √${c(p.k*p.k)} ＝ ${p.k}`]}; }},
    {key:"lel", title:"測爆計讀數換算濃度", src:["ch25-037"], base:{L:1,r:30}, orig:0.3,
      rand:()=>({L:R.pick([1,1.2,1.5,2,2.1,2.5,3,4,5]), r:R.step(5,95,5)}),
      make:p=>{ const ans = p.L*p.r/100;
        return {text:`可燃性氣體測定器指針指在${p.r}%LEL位置，而該可燃性氣體之爆炸下限（LEL）為${n(p.L)}%時，此氣體在環境中之濃度約為多少%？`,
          ans, unit:"%", dp:3,
          steps:[`測定值是「爆炸下限的百分之幾」，不是空氣中的濃度`, `濃度 ＝ LEL × 讀數 ÷ 100 ＝ ${n(p.L)}% × ${p.r} ÷ 100 ＝ ${n(r(ans,4))}%`]}; }},
    {key:"dilute", title:"稀釋後測爆計讀數", src:["examB-W03-115"], base:{L:5,c:5,k:4}, orig:20,
      rand:()=>{ const L = R.pick([2,2.5,4,5]); return {L, c:+(L*R.pick([0.5,1,1.5,2])).toFixed(2), k:R.int(1,9)}; },
      make:p=>{ const after = p.c/(1+p.k), ans = after/p.L*100;
        return {text:`某一可燃性氣體之爆炸下限為${n(p.L)}%，現場濃度為${n(p.c)}%，如以${p.k}倍空氣稀釋使之完全混合後，以測爆計測定，其測定值為爆炸下限之百分之多少？`,
          ans, unit:"%LEL", dp:1,
          steps:[`原氣體 1 份＋空氣 ${p.k} 份 → 共 ${1+p.k} 份`, `稀釋後濃度 ＝ ${n(p.c)}% ÷ ${1+p.k} ＝ ${n(r(after,4))}%`, `測定值 ＝ ${n(r(after,4))}% ÷ LEL ${n(p.L)}% × 100 ＝ ${n(r(ans,2))}%LEL`]}; }},
    {key:"co2", title:"稀釋換氣量（ppm）", src:["ch29-009"], base:{G:5,C0:400,C:1400}, orig:5000,
      rand:()=>({G:R.step(0.5,10,0.5), C0:R.pick([350,400,450]), C:R.pick([800,1000,1200,1400,1500,2000,5000])}),
      make:p=>{ const ans = p.G*1e6/(p.C-p.C0);
        return {text:`某戶內工作環境，作業人員呼氣與製程所產生二氧化碳之速率為${n(p.G)} m³/hr，戶外二氧化碳濃度為${p.C0} ppm，如欲使戶內二氧化碳濃度不超過${p.C} ppm，則戶外空氣之進氣量應至少為多少 m³/hr？`,
          ans, unit:"m³/hr", dp:0,
          steps:[`Q ＝ G ÷ (C − C₀)；ppm ＝ cm³/m³，所以 G 要換成 cm³/hr`, `G ＝ ${n(p.G)} m³/hr × 10⁶ ＝ ${c(p.G*1e6)} cm³/hr`, `Q ＝ ${c(p.G*1e6)} ÷ (${p.C} − ${p.C0}) ＝ ${c(r(ans,1))} m³/hr`]}; }},
    {key:"ach", title:"換氣次數", src:["ch29-010"], base:{v:5,q:0.6}, orig:7.2,
      rand:()=>({v:R.int(4,15), q:R.step(0.2,1.2,0.1)}),
      make:p=>{ const ans = 60*p.q/p.v;
        return {text:`工作場所每一勞工平均佔${p.v} m³，雇主提供每一勞工每分鐘${n(p.q)} m³新鮮空氣，依換氣次數公式 N = 60×Q/V，請計算工作場所換氣率為每小時多少次？`,
          ans, unit:"次/小時", dp:1,
          steps:[`每小時新鮮空氣量 ＝ ${n(p.q)} × 60 ＝ ${n(r(p.q*60,4))} m³`, `N ＝ ${n(r(p.q*60,4))} ÷ ${p.v} ＝ ${n(r(ans,2))} 次/小時`]}; }},
    {key:"orgvent", title:"有機溶劑整體換氣量", src:["ch29-013","ch14-016"], base:{t:2,a:"甲苯",b:"丙酮",ka:2,kb:4,h:8}, orig:30,
      rand:()=>{ const t = R.pick([1,2,2,2,3]), names = ORG[t].names.slice().sort(()=>Math.random()-0.5);
        return {t, a:names[0], b:Math.random()<0.35?null:names[1], ka:R.step(0.5,6,0.5), kb:R.step(0.5,6,0.5), h:R.pick([4,6,8,8,8,10])}; },
      make:p=>{ const kg = p.ka+(p.b?p.kb:0), W = kg*1000/p.h, coef = ORG[p.t].coef, ans = W*coef;
        return {text:`某作業場所每日${p.h}小時使用第${["","一","二","三"][p.t]}種有機溶劑${p.a}${n(p.ka)}公斤${p.b?`及${p.b}${n(p.kb)}公斤`:""}，依「有機溶劑中毒預防規則」，使用整體換氣裝置控制時，最少換氣量為多少 m³/min？`,
          ans, unit:"m³/min", dp:2,
          steps:[`每小時消費量 W ＝ ${p.b?`(${n(p.ka)}＋${n(p.kb)}) `:`${n(p.ka)} `}公斤 × 1000 ÷ ${p.h} 小時 ＝ ${n(r(W,3))} g/hr`,
            `第${["","一","二","三"][p.t]}種係數 ${coef}（第一種 0.3、第二種 0.04、第三種 0.01）`,
            `Q ＝ ${n(r(W,3))} × ${coef} ＝ ${n(r(ans,3))} m³/min（法規公式，係數已含 hr→min，不用再 ÷60）`]}; }},
    {key:"allow", title:"有機溶劑容許消費量", src:["ch14-013"], base:{L:15,W:8,H:3.2,t:2}, orig:60,
      rand:()=>({L:R.int(2,15), W:R.int(2,10), H:R.pick([2.5,3,3.2,3.5,4,4.5,5,6]), t:R.pick([1,2,2,3])}),
      make:p=>{ const He = Math.min(p.H,4), Vr = p.L*p.W*He, Vc = Math.min(Vr,150), [a,b,fs] = ALLOW[p.t], ans = Vc*a/b;
        return {text:`一室內作業場所氣積${p.L}m×${p.W}m×${n(p.H)}m（長×寬×高），為通風不充分之室內作業場所，使用第${["","一","二","三"][p.t]}種有機溶劑，其容許消費量為每日多少公克？`,
          ans, unit:"g/日", dp:1,
          steps:[...(p.H>4?[`高度超過地面 4 公尺的空間不計 → 高度以 4 m 計`]:[]),
            `氣積 V ＝ ${p.L} × ${p.W} × ${n(He)} ＝ ${n(r(Vr,3))} m³${Vr>150?` ＞ 150，以 150 m³ 計`:``}`,
            `第${["","一","二","三"][p.t]}種 W ＝ ${fs} × V（第一種 1/15、第二種 2/5、第三種 3/2）`,
            `W ＝ ${fs} × ${n(Vc)} ＝ ${n(r(ans,2))} g`]}; }},
    {key:"hood", title:"外裝式氣罩風速衰減", src:["ch29-022"], base:{A:1,X:1}, orig:11,
      rand:()=>({A:R.pick([0.1,0.2,0.25,0.5,1,2]), X:R.pick([0.2,0.3,0.5,1])}),
      make:p=>{ const k = 10*p.X*p.X+p.A, ans = k/p.A;
        return {text:`有一外裝式無凸緣（flange）氣罩，開口面積A為${n(p.A)} m²，使用公式 Q = V(10X²+A)，距氣罩開口中心線外${n(p.X)}公尺處之捕捉風速，是氣罩開口處中心線風速的幾分之一？（填分母，例如 1/11 填 11）`,
          ans, unit:"（幾分之一的分母）", dp:2, denom:true,
          steps:[`同一個氣罩 Q 相同 → 風速和 (10X²＋A) 成反比`, `開口處 X＝0：10×0²＋${n(p.A)} ＝ ${n(p.A)}`, `X＝${n(p.X)}：10×${n(p.X)}²＋${n(p.A)} ＝ ${n(r(k,4))}`, `比值 ＝ ${n(r(k,4))} ÷ ${n(p.A)} ＝ ${n(r(ans,3))} → 約 1/${n(r(ans,2))}`]}; }},
    {key:"vel", title:"全壓、靜壓求風速", src:["ch29-030"], base:{VP:4,SP:-12}, orig:8.08,
      rand:()=>{ const VP = R.pick([1,2,3,4,5,6,8,9,10,12,16,20,25]); return {VP, SP:-R.int(VP+2,VP+40)}; },
      make:p=>{ const TP = p.SP+p.VP, ans = 4.04*Math.sqrt(p.VP);
        return {text:`某局部排氣系統測得導管內某點全壓為 ${TP} mmH₂O，靜壓為 ${p.SP} mmH₂O，請計算導管內之空氣平均輸送風速為多少 m/s？（公式：V = 4.04√VP）`,
          ans, unit:"m/s", dp:2,
          steps:[`動壓 VP ＝ 全壓 − 靜壓 ＝ (${TP}) − (${p.SP}) ＝ ${p.VP} mmH₂O`, `V ＝ 4.04 × √${p.VP} ＝ 4.04 × ${n(r(Math.sqrt(p.VP),4))} ＝ ${n(r(ans,3))} m/s`]}; }},
    {key:"flow", title:"圓管風量 Q＝A×V", src:["ch29-031"], base:{VP:4,SP:-12,D:20}, orig:0.25,
      rand:()=>{ const VP = R.pick([1,2,4,6,9,12,16,20,25]); return {VP, SP:-R.int(VP+2,VP+40), D:R.pick([10,15,20,25,30,40,50])}; },
      make:p=>{ const TP = p.SP+p.VP, v = r(4.04*Math.sqrt(p.VP),2), rr = p.D/200, A = 3.14*rr*rr, ans = A*v;
        return {text:`某局部排氣系統測得導管內某點全壓為 ${TP} mmH₂O，靜壓為 ${p.SP} mmH₂O（風速公式：V = 4.04√VP）。若導管為圓管、直徑${p.D} cm，則導管內之空氣流率為多少 m³/s？（π取3.14）`,
          ans, unit:"m³/s", dp:3, tol:Math.max(0.0015, ans*0.015),
          steps:[`VP ＝ (${TP}) − (${p.SP}) ＝ ${p.VP} mmH₂O；V ＝ 4.04 × √${p.VP} ＝ ${v} m/s`,
            `直徑 ${p.D} cm → 半徑 ${n(p.D/2)} cm ＝ ${n(rr)} m；A ＝ 3.14 × ${n(rr)}² ＝ ${n(r(A,6))} m²`,
            `Q ＝ A × V ＝ ${n(r(A,6))} × ${v} ＝ ${n(r(ans,4))} m³/s`]}; }},
    {key:"vp", title:"風速求動壓", src:["ch29-032"], base:{V:14.6}, orig:13.06,
      rand:()=>({V:R.step(5,25,0.1)}),
      make:p=>{ const ans = Math.pow(p.V/4.04,2);
        return {text:`某局部排氣系統測得導管內風速為${n(p.V)} m/s，請問其動壓為多少 mmH₂O？（公式：VP = (V/4.04)²）`,
          ans, unit:"mmH₂O", dp:2,
          steps:[`VP ＝ (${n(p.V)} ÷ 4.04)² ＝ (${n(r(p.V/4.04,4))})² ＝ ${n(r(ans,3))} mmH₂O`]}; }},
    {key:"v", title:"動壓求風速", src:["ch29-033"], base:{VP:18}, orig:17.1,
      rand:()=>({VP:R.int(2,40)}),
      make:p=>{ const ans = 4.04*Math.sqrt(p.VP);
        return {text:`某局部排氣系統，動壓為${p.VP} mmH₂O，請問其風速為多少 m/s？（公式：V = 4.04√VP，四捨五入取小數點第一位）`,
          ans, unit:"m/s", dp:1,
          steps:[`V ＝ 4.04 × √${p.VP} ＝ 4.04 × ${n(r(Math.sqrt(p.VP),4))} ＝ ${n(r(ans,3))} → ${r(ans,1)} m/s`]}; }},
    {key:"tp", title:"全壓＝靜壓＋動壓", src:["examB-W03-398"], base:{m:"tp",SP:-30,VP:18}, orig:-12,
      rand:()=>({m:R.pick(["tp","tp","sp","vp"]), SP:-R.int(10,60), VP:R.int(2,30)}),
      make:p=>{ const TP = p.SP+p.VP;
        const ask = {tp:[`靜壓為${p.SP} mmH₂O，動壓為 ${p.VP} mmH₂O，則全壓`, TP, `TP ＝ SP ＋ VP ＝ (${p.SP}) ＋ ${p.VP} ＝ ${TP}`],
          sp:[`全壓為${TP} mmH₂O，動壓為 ${p.VP} mmH₂O，則靜壓`, p.SP, `SP ＝ TP − VP ＝ (${TP}) − ${p.VP} ＝ ${p.SP}`],
          vp:[`全壓為${TP} mmH₂O，靜壓為 ${p.SP} mmH₂O，則動壓`, p.VP, `VP ＝ TP − SP ＝ (${TP}) − (${p.SP}) ＝ ${p.VP}`]}[p.m];
        return {text:`通風系統內某點之${ask[0]}為多少 mmH₂O？`, ans:ask[1], unit:"mmH₂O", dp:0, exact:true,
          steps:[`全壓 TP ＝ 靜壓 SP ＋ 動壓 VP（抽氣側靜壓為負，動壓恆為正）`, ask[2]+` mmH₂O`]}; }},
    {key:"duct", title:"風量與壓力損失", src:["examB-W03-400"], base:{k:3}, orig:9,
      rand:()=>({k:R.pick([0.5,1.5,2,2.5,3,4])}),
      make:p=>({text:`通風系統中流經同一直管管段之風量如變為原來之 ${n(p.k)} 倍時，則其壓力損失約變為原來之幾倍？`,
          ans:p.k*p.k, unit:"倍", dp:2, steps:[`壓力損失與風速平方（風量平方）成正比`, `${n(p.k)}² ＝ ${n(p.k*p.k)} 倍`]})},
    {key:"fan", title:"排氣機定律", src:["examB-S10703-16"], base:{k:1.2,m:"power"}, orig:1.728,
      rand:()=>({k:R.pick([1.1,1.2,1.25,1.3,1.5,2]), m:R.pick(["power","power","press","flow"])}),
      make:p=>{ const [nm,e] = {power:["動力",3], press:["靜壓（風壓）",2], flow:["排氣量",1]}[p.m], ans = Math.pow(p.k,e);
        return {text:`依排氣機定律，增加轉速使氣罩表面風速增為原來${n(p.k)}倍，排氣機${nm}約增為原來之幾倍？`,
          ans, unit:"倍", dp:3, tol:0.011,
          steps:[`轉速比 ＝ 風速比 ＝ ${n(p.k)}`, `排氣量 ∝ 轉速、靜壓 ∝ 轉速²、動力 ∝ 轉速³`, `${nm}：${n(p.k)}${e===1?"":e===2?"²":"³"} ＝ ${n(r(ans,4))} 倍`]}; }},
    {key:"rope", title:"鋼索斷線根數", src:["ch34-015"], base:{a:6,b:24}, orig:15,
      rand:()=>({a:R.pick([6,6,8]), b:R.pick([7,12,19,24,37])}),
      make:p=>{ const all = p.a*p.b, ans = Math.ceil(all*0.1-1e-9);
        return {text:`一條規格為${p.a}×${p.b}之鋼索，其一撚間素線截斷幾根以上則不得使用？（不足整數者進一位）`,
          ans, unit:"根", dp:0, exact:true,
          steps:[`素線總數 ＝ ${p.a} × ${p.b} ＝ ${all} 根`, `一撚間素線截斷 10% 以上不得使用：${all} × 10% ＝ ${n(r(all*0.1,2))} → 進位 ${ans} 根`]}; }},
    {key:"anchor", title:"水平安全母索錨錠間距", src:["chN08-037"], base:{H:5}, orig:8,
      rand:()=>({H:R.pick([3.5,4,4.5,5,5.5,6,6.5,7,8])}),
      make:p=>{ const raw = 4*(p.H-3), ans = Math.min(raw,10);
        return {text:`水平安全母索相鄰二錨錠點間之最大間距計算式為L=4(H-3)，若垂直淨空高度H=${n(p.H)}公尺，L為多少公尺？`,
          ans, unit:"m", dp:1,
          steps:[`L ＝ 4 × (${n(p.H)} − 3) ＝ ${n(raw)} m`, raw>10?`超過 10 m 以 10 m 計 → ${ans} m`:`未超過 10 m → ${n(ans)} m`]}; }},
    {key:"wbgtout", title:"WBGT（戶外有日曬）", src:["chN15-012"], base:{db:31,nwb:28,g:34}, orig:29.5,
      rand:()=>{ const nwb = R.int(22,32), db = nwb+R.int(1,6); return {nwb, db, g:db+R.int(0,10)}; },
      make:p=>{ const ans = 0.7*p.nwb+0.2*p.g+0.1*p.db;
        return {text:`某戶外日曬燒窯作業，乾球溫度${p.db}℃、自然濕球溫度${p.nwb}℃、黑球溫度${p.g}℃，WBGT為多少℃？`,
          ans, unit:"℃", dp:2,
          steps:[`戶外有日曬：WBGT ＝ 0.7×自然濕球 ＋ 0.2×黑球 ＋ 0.1×乾球`, `＝ 0.7×${p.nwb} ＋ 0.2×${p.g} ＋ 0.1×${p.db} ＝ ${n(r(0.7*p.nwb,2))} ＋ ${n(r(0.2*p.g,2))} ＋ ${n(r(0.1*p.db,2))} ＝ ${n(r(ans,2))}℃`]}; }},
    {key:"wbgtin", title:"WBGT（室內／無日曬）", src:["chN15-013"], base:{nwb:30,g:36}, orig:31.8,
      rand:()=>{ const nwb = R.int(22,32); return {nwb, g:nwb+R.int(1,12)}; },
      make:p=>{ const ans = 0.7*p.nwb+0.3*p.g;
        return {text:`室內作業自然濕球溫度${p.nwb}℃、黑球溫度${p.g}℃，WBGT為多少℃？`,
          ans, unit:"℃", dp:2,
          steps:[`室內或戶外無日曬：WBGT ＝ 0.7×自然濕球 ＋ 0.3×黑球（不用乾球）`, `＝ 0.7×${p.nwb} ＋ 0.3×${p.g} ＝ ${n(r(0.7*p.nwb,2))} ＋ ${n(r(0.3*p.g,2))} ＝ ${n(r(ans,2))}℃`]}; }},
    {key:"grind", title:"研磨輪周速度", src:["chN22-023","chN22-024"], base:{D:200,N:3000}, orig:1885,
      rand:()=>({D:R.pick([100,150,180,200,205,250,255,305]), N:R.step(1200,3600,100)}),
      make:p=>{ const ans = Math.PI*p.D/1000*p.N;
        return {text:`研磨輪直徑${p.D}mm、轉速${p.N}rpm，其周速度約為多少m/min？`,
          ans, unit:"m/min", dp:0,
          steps:[`周速度 V ＝ π × D × N（D 用公尺，rpm＝每分鐘轉數）`, `D ＝ ${p.D} mm ＝ ${n(p.D/1000)} m`, `V ＝ 3.1416 × ${n(p.D/1000)} × ${p.N} ≈ ${c(r(ans,1))} m/min`]}; }},
    {key:"light", title:"光電式安全裝置安全距離", src:["chN22-053"], base:{Tl:120,Ts:150,C:300}, orig:732,
      rand:()=>({Tl:R.int(2,20)*10, Ts:R.int(5,30)*10, C:R.pick([0,200,300,400])}),
      make:p=>{ const w = {0:25,200:33,300:40,400:48}[p.C], ans = 1.6*(p.Tl+p.Ts)+p.C;
        return {text:`光電式安全裝置Tl=${p.Tl}ms、Ts=${p.Ts}ms、連續遮光幅${w}mm（追加距離${p.C}mm），其安全距離為多少mm？`,
          ans, unit:"mm", dp:1,
          steps:[`感應式（光電式）：D ＝ 1.6 × (Tl ＋ Ts) ＋ C`, `＝ 1.6 × (${p.Tl} ＋ ${p.Ts}) ＋ ${p.C} ＝ ${n(r(1.6*(p.Tl+p.Ts),2))} ＋ ${p.C} ＝ ${n(r(ans,2))} mm`]}; }},
    {key:"twohand", title:"雙手起動式安全距離", src:["chN22-055"], base:{N:2,T:0.5}, orig:80,
      rand:()=>({N:R.pick([1,2,3,4,6,8]), T:R.pick([0.3,0.4,0.5,0.6,0.8,1])}),
      make:p=>{ const Tm = (0.5+1/p.N)*p.T, ans = 1.6*Tm*100;
        return {text:`全轉式衝剪機械離合器嚙合處${p.N}個，曲柄軸旋轉一周${n(p.T)}秒，雙手起動式安全裝置按鈕與危險界限間之距離至少為多少公分？`,
          ans, unit:"公分", dp:1,
          steps:[`Tm ＝ (1/2 ＋ 1/嚙合處數) × 曲柄軸轉一周時間 ＝ (1/2 ＋ 1/${p.N}) × ${n(p.T)} ＝ ${n(r(Tm,4))} 秒`, `D ＝ 1.6 m/s × ${n(r(Tm,4))} s ＝ ${n(r(Tm*1.6,4))} m ＝ ${n(r(ans,2))} 公分`]}; }},
    {key:"nrc", title:"噪音降低係數 NRC", src:["chN30-026"], base:{a:[0.26,0.70,0.99,0.99]}, orig:0.75,
      rand:()=>{ for(;;){ const a = [0,0,0,0].map(()=>R.step(0.05,0.99,0.01)).sort((x,y)=>x-y);
        const q = (a[0]+a[1]+a[2]+a[3])/4/0.05; if(Math.abs(q-Math.floor(q)-0.5)>0.05) return {a}; } },
      make:p=>{ const avg = p.a.reduce((s,x)=>s+x,0)/4, ans = Math.round(avg/0.05)*0.05;
        return {text:`某材料在250、500、1000、2000Hz之吸音係數分別為${p.a.map(x=>x.toFixed(2)).join("、")}，其NRC為多少？（取最接近之0.05倍數）`,
          ans, unit:"", dp:2, tol:0.001,
          steps:[`NRC ＝ 250、500、1000、2000 Hz 四個吸音係數的平均，再取最接近的 0.05 倍數`, `平均 ＝ (${p.a.map(x=>x.toFixed(2)).join("＋")}) ÷ 4 ＝ ${n(r(avg,4))}`, `最接近的 0.05 倍數 → ${ans.toFixed(2)}`]}; }},
    {key:"mass", title:"質量律", src:["chN30-029"], base:{k:2}, orig:6,
      rand:()=>({k:R.pick([2,3,4,5,8,10])}),
      make:p=>{ const ans = 20*log10(p.k);
        return {text:`依質量律，牆面重量（面密度）變為原來的${p.k}倍，傳送損失(TL)約增加多少分貝？`,
          ans, unit:"dB", dp:1, tol:0.25,
          steps:[`質量律：TL 增加 ＝ 20 log(重量倍數)（重量加倍約 ＋6 dB）`, `20 × log ${p.k} ＝ 20 × ${n(r(log10(p.k),4))} ＝ ${n(r(ans,2))} dB`]}; }},
    {key:"tl", title:"穿透率求傳送損失", src:["chN30-031"], base:{t:0.0005}, orig:33,
      rand:()=>({t:R.pick([0.1,0.05,0.01,0.005,0.002,0.001,0.0005,0.0002,0.0001,0.00002])}),
      make:p=>{ const ans = 10*log10(1/p.t);
        return {text:`穿透率${n(p.t)}之隔板，其傳送損失約為多少分貝？`,
          ans, unit:"dB", dp:1, tol:0.25,
          steps:[`TL ＝ 10 log(1/穿透率)`, `＝ 10 × log(1/${n(p.t)}) ＝ 10 × log ${c(r(1/p.t,2))} ＝ ${n(r(ans,2))} dB`]}; }},
    {key:"hvl", title:"半值層求屏蔽厚度", src:["chN30-046"], base:{h:0.17,f:5}, orig:0.74,
      rand:()=>({h:R.step(0.1,0.5,0.01), f:R.pick([50,25,12.5,10,6.25,5,2,1])}),
      make:p=>{ const nn = Math.log(100/p.f)/Math.log(2), ans = nn*p.h;
        return {text:`鉛之半值層為${n(p.h)}mm，欲將輻射強度減至原來${n(p.f)}%，約需鉛板多厚（mm）？`,
          ans, unit:"mm", dp:3, tol:Math.max(0.006, ans*0.02),
          steps:[`(1/2)ⁿ ＝ ${n(p.f/100)} → n ＝ log(1/${n(p.f/100)}) ÷ log 2 ＝ ${n(r(nn,3))} 個半值層`, `厚度 ＝ ${n(r(nn,3))} × ${n(p.h)} ＝ ${n(r(ans,3))} mm`]}; }},
    {key:"hvl2", title:"幾個半值層剩多少", src:["chN30-047"], base:{k:2}, orig:4,
      rand:()=>({k:R.int(1,7)}),
      make:p=>({text:`鉛板厚度為${p.k}個半值層時，輻射強度剩下原來的幾分之一？（填分母，例如 1/4 填 4）`,
          ans:Math.pow(2,p.k), unit:"（幾分之一的分母）", dp:0, exact:true, denom:true,
          steps:[`每過一個半值層強度減半 → (1/2)^${p.k} ＝ 1/${Math.pow(2,p.k)}`]})},
    {key:"lead", title:"鉛作業整體換氣量", src:["examB-298"], base:{k:60}, orig:100,
      rand:()=>({k:R.int(5,120)}),
      make:p=>{ const ans = 1.67*p.k;
        return {text:`某一鉛作業場所鉛作業人數為 ${p.k} 人，均為軟焊作業，則本鉛作業場所整體換氣裝置之換氣量約為每分鐘多少立方公尺以上？`,
          ans, unit:"m³/min", dp:1,
          steps:[`軟焊作業整體換氣：每一鉛作業勞工平均每分鐘 1.67 m³ 以上`, `${p.k} × 1.67 ＝ ${n(r(ans,2))} m³/min`]}; }},
    {key:"head", title:"勞工總人數計算", src:["examB-S10707-12"], base:{own:380,a:30,b:10}, orig:390,
      rand:()=>({own:R.int(100,900), a:R.int(5,60), b:R.int(5,60)}),
      make:p=>({text:`某工廠僱用勞工${p.own}人，A公司派駐${p.a}人由A公司自行指揮，B公司派駐${p.b}人由該工廠工作場所負責人指揮，依勞工健康保護規則該工廠勞工總人數為多少人？`,
          ans:p.own+p.b, unit:"人", dp:0, exact:true,
          steps:[`勞工總人數包含「受該工作場所負責人指揮或監督從事勞動之人員」`, `A公司自行指揮 → 不計；B公司受工廠負責人指揮 → 計入`, `${p.own} ＋ ${p.b} ＝ ${p.own+p.b} 人`]})},
    {key:"dose", title:"噪音暴露總劑量", src:["examB-S10707-15","examB-S10807-10"], base:{seg:[[85,4],[95,2],[90,2]]}, orig:1,
      rand:()=>{ const k = R.int(2,4), lv = [78,80,85,90,95,100,105].sort(()=>Math.random()-0.5).slice(0,k), hrs = [];
        let left = 8; for(let i=0;i<k-1;i++){ const h = R.int(1, left-(k-1-i)); hrs.push(h); left -= h; } hrs.push(left);
        return {seg:lv.map((L,i)=>[L,hrs[i]])}; },
      make:p=>{ const parts = p.seg.map(([L,h])=>L<80 ? null : {L,h,T:noiseT(L)}), ans = parts.reduce((s,x)=>s+(x?x.h/x.T:0),0);
        return {text:`勞工噪音暴露${p.seg.map(([L,h])=>`${L}dBA ${h}小時`).join("、")}，其噪音暴露總劑量為多少？`,
          ans, unit:"", dp:3, tol:0.011,
          steps:[`容許時間 T ＝ 8 ÷ 2^((L−90)/5)；未達 80 dB 不列入`, ...p.seg.map(([L,h],i)=>parts[i]?`${L} dB：T ＝ ${n(r(parts[i].T,3))} 小時 → ${h} ÷ ${n(r(parts[i].T,3))} ＝ ${n(r(h/parts[i].T,4))}`:`${L} dB 未達 80 dB，不列入`),
            `總劑量 D ＝ ${n(r(ans,4))}${ans>1?`（＞1，超過規定）`:`（≦1，符合規定）`}`]}; }},
    {key:"twa", title:"劑量換算 TWA", src:["examB-W03-365"], base:{d:25,t:2}, orig:90,
      rand:()=>({d:R.int(5,80), t:R.pick([1,2,3,4])}),
      make:p=>{ const D8 = p.d/100*8/p.t, ans = 16.61*log10(D8)+90;
        return {text:`某勞工每日作業時間 8 小時暴露於穩定性噪音，戴用劑量計監測 ${p.t} 小時，其劑量為 ${p.d}%，則該勞工工作 8 小時日時量平均音壓級為多少分貝？`,
          ans, unit:"dB", dp:1, tol:0.15,
          steps:[`穩定性噪音 → 8 小時劑量 ＝ ${p.d}% × 8 ÷ ${p.t} ＝ ${n(r(D8*100,3))}% ＝ ${n(r(D8,4))}`, `TWA ＝ 16.61 × log D ＋ 90 ＝ 16.61 × log ${n(r(D8,4))} ＋ 90 ＝ ${n(r(ans,2))} dB`]}; }},
    {key:"noiseT", title:"噪音容許暴露時間", src:["ch16-008","ch16-028"], base:{L:115}, orig:0.25,
      rand:()=>({L:R.pick([90,95,100,105,110,115])}),
      make:p=>{ const ans = noiseT(p.L);
        return {text:`依法規噪音容許暴露時間，勞工暴露於噪音音壓級${p.L} dB（A）之環境中，工作日容許暴露時間為多少小時？`,
          ans, unit:"小時", dp:2, tol:0.001,
          steps:[`90 dB 容許 8 小時，每增加 5 dB 時間減半：T ＝ 8 ÷ 2^((L−90)/5)`, `T ＝ 8 ÷ 2^((${p.L}−90)/5) ＝ 8 ÷ 2^${(p.L-90)/5} ＝ ${n(ans)} 小時`]}; }},
    {key:"addL", title:"噪音合成", src:["examB-W03-262","ch16-037"], base:{m:"same",L:90,k:2}, orig:93,
      rand:()=>Math.random()<0.5 ? {m:"same", L:R.int(80,100), k:R.pick([2,3,4,10])} : {m:"two", L:R.int(80,100), L2:R.int(80,100)},
      make:p=>{ if(p.m==="same"){ const ans = p.L+10*log10(p.k);
          return {text:`距某機械 4 公尺處測得噪音為 ${p.L} 分貝，若另有噪音量相同之機械共 ${p.k} 部併置一起，於原測量處測量噪音量約為多少分貝？`,
            ans, unit:"dB", dp:1, tol:0.15,
            steps:[`n 部相同噪音合成：L ＝ L₁ ＋ 10 log n（2 部約 ＋3 dB）`, `＝ ${p.L} ＋ 10 × log ${p.k} ＝ ${p.L} ＋ ${n(r(10*log10(p.k),2))} ＝ ${n(r(ans,2))} dB`]}; }
        const ans = 10*log10(Math.pow(10,p.L/10)+Math.pow(10,p.L2/10));
        return {text:`作業場所有兩部機器，單獨運轉時分別為 ${p.L} 分貝及 ${p.L2} 分貝，兩部同時運轉時合成噪音約為多少分貝？`,
          ans, unit:"dB", dp:1, tol:0.15,
          steps:[`分貝是對數，不能直接相加：L ＝ 10 log(10^(L₁/10) ＋ 10^(L₂/10))`, `＝ 10 × log(10^${n(p.L/10)} ＋ 10^${n(p.L2/10)}) ＝ ${n(r(ans,2))} dB`]}; }},
    {key:"sample", title:"生物採樣時間", src:["examB-S10711-19"], base:{f:100,m:300,cc:500}, orig:6,
      rand:()=>({f:R.pick([10,20,25,50,100]), m:R.pick([100,200,250,300,400]), cc:R.int(2,40)*50}),
      make:p=>{ const vol = p.m/p.cc, ans = vol/(p.f/1000);
        return {text:`衝擊式採樣器流量${p.f} L/min，培養皿不超過${p.m} CFU，作業環境濃度${p.cc} CFU/m³，採樣時間不應超過幾分鐘？`,
          ans, unit:"分鐘", dp:1,
          steps:[`最多可採空氣量 ＝ ${p.m} ÷ ${p.cc} ＝ ${n(r(vol,4))} m³`, `流量 ${p.f} L/min ＝ ${n(p.f/1000)} m³/min`, `時間 ＝ ${n(r(vol,4))} ÷ ${n(p.f/1000)} ＝ ${n(r(ans,2))} 分鐘`]}; }},
    {key:"level", title:"暴露濃度分級管理", src:["examB-S10803-19","examB-S10803-20","chN13-033"], base:{P:100,C:120}, orig:3,
      rand:()=>{ const P = R.pick([10,20,25,50,100,200,500]); let C;
        do { C = Math.max(1, Math.round(P*R.pick([0.1,0.2,0.3,0.4,0.45,0.6,0.7,0.8,0.9,1.1,1.2,1.5,2]))); } while(C*2===P || C===P);
        return {P, C}; },
      make:p=>{ const ans = p.C>=p.P ? 3 : p.C*2>=p.P ? 2 : 1;
        return {text:`某有害物容許暴露標準為${p.P}ppm，某廠勞工8小時日時量平均暴露濃度為${p.C}ppm，依危害性化學品評估及分級管理辦法屬第幾級管理？（填數字）`,
          ans, unit:"級", dp:0, exact:true,
          steps:[`第一級：＜ 容許標準 1/2；第二級：≧ 1/2 但 ＜ 容許標準；第三級：≧ 容許標準`, `${p.C} ÷ ${p.P} ＝ ${n(r(p.C/p.P,3))} → 第${["","一","二","三"][ans]}級管理`]}; }},
    {key:"o2", title:"局限空間氧濃度下降時間", src:["examB-S10803-21"], base:{V:100,Q:0.5,C0:20,C1:18}, orig:21.1,
      rand:()=>({V:R.int(4,40)*5, Q:R.step(0.1,2,0.1), C0:R.pick([20,21]), C1:R.pick([16,18,19,19.5])}),
      make:p=>{ const ans = Math.log(p.C0/p.C1)/(p.Q/p.V);
        return {text:`局限空間氣積${p.V}m³，含氧${p.C0}%，CO以${n(p.Q)}m³/min產生且僅排出原本空氣（完全混合），約幾分鐘後氧濃度降至${n(p.C1)}%？`,
          ans, unit:"分鐘", dp:1,
          steps:[`C ＝ C₀ × e^(−Q·t/V) → t ＝ (V/Q) × ln(C₀/C)`, `＝ (${p.V} ÷ ${n(p.Q)}) × ln(${p.C0}/${n(p.C1)}) ＝ ${n(r(p.V/p.Q,3))} × ${n(r(Math.log(p.C0/p.C1),4))} ＝ ${n(r(ans,2))} 分鐘`]}; }},
    {key:"leak", title:"洩漏多少公克達容許濃度", src:["examB-S10811-14"], base:{V:244.5,M:50,P:100}, orig:50,
      rand:()=>({V:R.pick([24.45,48.9,100,122.25,200,244.5,489]), M:R.pick([32,46,58,60,72,78,86,92,106]), P:R.pick([10,20,25,50,100,200])}),
      make:p=>{ const mg = p.P*p.M/24.45, ans = mg*p.V/1000;
        return {text:`室內氣積${n(p.V)}m³（25℃、1atm），有機溶劑分子量${p.M}、容許濃度${p.P}ppm，洩漏完全蒸發且不流通，洩漏多少公克會使濃度達到容許濃度？`,
          ans, unit:"g", dp:2,
          steps:[`mg/m³ ＝ ppm × 分子量 ÷ 24.45 ＝ ${p.P} × ${p.M} ÷ 24.45 ＝ ${n(r(mg,3))} mg/m³`, `總量 ＝ ${n(r(mg,3))} × ${n(p.V)} ＝ ${c(r(mg*p.V,1))} mg ＝ ${n(r(ans,3))} g`]}; }},
    {key:"ppm", title:"ppm 與 mg/m³ 換算", src:["ch06-031"], base:null,
      rand:()=>({M:R.pick([32,46,58,72,78,92,106]), m:R.pick(["toppm","tomg"]), x:R.pick([5,10,20,50,100,150,200])}),
      make:p=>{ if(p.m==="toppm"){ const ans = p.x*24.45/p.M;
          return {text:`25℃、1atm 下，某氣體（分子量${p.M}）濃度為${p.x} mg/m³，相當於多少 ppm？`, ans, unit:"ppm", dp:2,
            steps:[`ppm ＝ mg/m³ × 24.45 ÷ 分子量`, `＝ ${p.x} × 24.45 ÷ ${p.M} ＝ ${n(r(ans,3))} ppm`]}; }
        const ans = p.x*p.M/24.45;
        return {text:`25℃、1atm 下，某氣體（分子量${p.M}）濃度為${p.x} ppm，相當於多少 mg/m³？`, ans, unit:"mg/m³", dp:2,
          steps:[`mg/m³ ＝ ppm × 分子量 ÷ 24.45`, `＝ ${p.x} × ${p.M} ÷ 24.45 ＝ ${n(r(ans,3))} mg/m³`]}; }},
    {key:"filter", title:"多層濾材總過濾效率", src:["examB-S10903-16"], base:{e:[30,60,30]}, orig:80.4,
      rand:()=>({e:Array.from({length:R.pick([2,3,3])},()=>R.int(2,18)*5)}),
      make:p=>{ const pass = p.e.reduce((s,x)=>s*(1-x/100),1), ans = (1-pass)*100;
        return {text:`口罩${p.e.length}層對粉塵過濾效率分別為${p.e.map(x=>x+"%").join("、")}，總過濾效率為多少%？`,
          ans, unit:"%", dp:2, tol:0.06,
          steps:[`各層「穿透率」相乘：${p.e.map(x=>`(1−${n(x/100)})`).join("×")} ＝ ${n(r(pass,5))}`, `總效率 ＝ 1 − ${n(r(pass,5))} ＝ ${n(r(ans,3))}%（不能把效率直接相加）`]}; }},
    {key:"stel", title:"變量係數與短時間容許濃度", src:["examB-W01-334","examB-W01-331"], base:{P:200,m:"stel"}, orig:250,
      rand:()=>({P:R.pick([0.5,2,5,10,25,50,100,150,200,400,1000,2000]), m:R.pick(["stel","factor"])}),
      make:p=>{ const f = vfactor(p.P), ans = p.m==="stel" ? p.P*f : f;
        return {text:`某物質之空氣中 8 小時日時量平均容許濃度為 ${n(p.P)}ppm，未註明「高」字，其${p.m==="stel"?"短時間時量平均容許濃度為多少 ppm":"變量係數為何"}？`,
          ans, unit:p.m==="stel"?"ppm":"", dp:2, exact:true,
          steps:[`變量係數：未滿1 → 3；1以上未滿10 → 2；10以上未滿100 → 1.5；100以上未滿1000 → 1.25；1000以上 → 1`, `${n(p.P)} ppm → 變量係數 ${f}`, ...(p.m==="stel"?[`STEL ＝ ${n(p.P)} × ${f} ＝ ${n(ans)} ppm`]:[])]}; }},
    {key:"nrr", title:"耳塞 NRR 選用", src:["examB-W03-219"], base:{d:5}, orig:17,
      rand:()=>({d:R.int(2,15)}),
      make:p=>({text:`若欲降低工作者實際暴露噪音量 ${p.d} 分貝，在考量 50%安全係數下，應選用 NRR 值多少分貝的耳塞？`,
          ans:2*p.d+7, unit:"dB", dp:0, exact:true,
          steps:[`實際降低量 ＝ (NRR − 7) × 50%`, `${p.d} ＝ (NRR − 7) × 0.5 → NRR ＝ ${p.d} × 2 ＋ 7 ＝ ${2*p.d+7}`]})},
    {key:"pf", title:"呼吸防護具防護係數", src:["examB-W03-221"], base:{PF:20,P:null}, orig:20,
      rand:()=>({PF:R.pick([5,10,20,25,50,100]), P:R.pick([1,5,10,20,50,100,200])}),
      make:p=>{ if(p.P===null) return {text:`呼吸防護具的濾清口罩防護係數為 ${p.PF}，表示該口罩能適用於空氣中有害物濃度在幾倍容許濃度值以下之作業環境？`,
          ans:p.PF, unit:"倍", dp:0, exact:true, steps:[`防護係數 PF ＝ 可使用的環境濃度上限 ÷ 容許濃度 → ${p.PF} 倍`]};
        return {text:`某有害物容許濃度為 ${p.P}ppm，使用防護係數為 ${p.PF} 的呼吸防護具，最高可用於環境濃度多少 ppm 以下之作業場所？`,
          ans:p.PF*p.P, unit:"ppm", dp:0, exact:true, steps:[`最高使用濃度 ＝ 防護係數 × 容許濃度 ＝ ${p.PF} × ${p.P} ＝ ${p.PF*p.P} ppm`]}; }},
    {key:"loss", title:"機能損失之損失日數", src:["examB-W03-347"], base:{X:200,pct:50}, orig:100,
      rand:()=>({X:R.pick([50,100,150,200,300,400,500,600,750,900,1200,1500,1800,2400,3000]), pct:R.int(1,9)*10}),
      make:p=>({text:`截斷某手指骨節之傷害損失日數為 ${p.X} 日，某事故使一位勞工該骨節發生機能損失，經醫生證明有 ${p.pct}％的僵直，則其傷害損失日數為多少日？`,
          ans:p.X*p.pct/100, unit:"日", dp:0, exact:true,
          steps:[`機能損失 ＝ 截斷損失日數 × 機能損失百分比`, `${p.X} × ${p.pct}% ＝ ${p.X*p.pct/100} 日`]})},
    {key:"bmi", title:"BMI", src:["ch32-013"], base:null,
      rand:()=>({kg:R.int(45,110), cm:R.int(150,190)}),
      make:p=>{ const m = p.cm/100, ans = p.kg/(m*m);
        return {text:`某勞工體重${p.kg}公斤、身高${p.cm}公分，其身體質量指數（BMI）為多少？`, ans, unit:"", dp:1, tol:0.06,
          steps:[`BMI ＝ 體重(kg) ÷ 身高(m)²；身高 ${p.cm} cm ＝ ${n(m)} m`, `＝ ${p.kg} ÷ ${n(m)}² ＝ ${p.kg} ÷ ${n(r(m*m,4))} ＝ ${n(r(ans,2))}（正常範圍 18.5～24）`]}; }},
    {key:"pension", title:"勞基法退休金基數", src:["chN01-021"], base:null,
      rand:()=>({Y:R.int(3,40)}),
      make:p=>{ const raw = p.Y<=15 ? 2*p.Y : 30+(p.Y-15), ans = Math.min(raw,45);
        return {text:`依勞動基準法規定（舊制），勞工工作年資滿${p.Y}年，其退休金基數為多少個？`, ans, unit:"個基數", dp:0, exact:true,
          steps:[`15 年以內每滿 1 年給 2 個基數；超過 15 年的部分每滿 1 年給 1 個基數；最高 45 個`,
            p.Y<=15 ? `${p.Y} × 2 ＝ ${raw} 個` : `15 × 2 ＋ (${p.Y} − 15) × 1 ＝ 30 ＋ ${p.Y-15} ＝ ${raw} 個${raw>45?` → 最高 45 個`:``}`]}; }},
  ];

  // 產生一題：回傳可直接放進 quizPool 的填空題
  function build(key, p){
    const v = V.find(x=>x.key===key); if(!v) return null;
    p = p || v.rand(R);
    const m = v.make(p);
    const ans = r(m.ans, m.dp);
    const tol = m.exact ? 1e-6 : (m.tol!=null ? m.tol : Math.max(0.6*Math.pow(10,-m.dp), Math.abs(m.ans)*0.01));
    const shown = (Math.abs(ans)>=10000 ? c(ans) : n(ans)) + (m.unit && !m.unit.startsWith("（") ? " "+m.unit : "");
    return {id:"cv:"+key, _cv:key, type:"fill", chapter:null, text:m.text, answer:shown, cvAns:m.ans, cvTol:tol, cvDenom:!!m.denom,
      cvUnit:m.unit, cvParams:p, cvTitle:v.title,
      note:`【數字變化題・${v.title}】\n`+m.steps.join("\n")+`\n（觀念同原題 ${v.src.join("、")}，數字每次不同）`};
  }
  window.CALC_VARIANTS = {list:V, build, R};
})();
