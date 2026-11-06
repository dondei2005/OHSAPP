// 看圖填空（2026-11-07）：圖用 SVG 重畫，不放原投影片。svg 裡的 {n} 是第 n 格，作答中顯示編號或已選的答案，提交後顯示正確答案。
// 題目 id（sk-fig-…）不可改，成績記在 topicStats.prac；格子格式同 practical_blanks.js。
(function(){
  function pill(cx, cy, label){
    return `<rect x="${cx-58}" y="${cy-20}" width="116" height="40" rx="6" fill="#FFF8EA" stroke="#A8631F" stroke-width="2"/>`
      + `<text x="${cx}" y="${cy+9}" text-anchor="middle" font-size="26" font-weight="700" fill="#8A3F16">${label}</text>`;
  }
  function crane(L){
    const line = (a,b,c,d)=>`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" stroke="#7E9B3D" stroke-width="2.5"/>`;
    return `<svg viewBox="0 0 640 425" role="img" aria-label="架空式起重機構造圖" style="display:block;width:100%;height:auto;background:#fff;border-radius:8px;">
      <path d="M125 360V14H515V360" fill="none" stroke="#A9A9A9" stroke-width="3"/>
      <rect x="130" y="205" width="40" height="155" fill="#D9D9D9" stroke="#777" stroke-width="2"/>
      <rect x="470" y="205" width="40" height="155" fill="#D9D9D9" stroke="#777" stroke-width="2"/>
      <rect x="142" y="192" width="16" height="13" fill="#444"/>
      <rect x="482" y="192" width="16" height="13" fill="#444"/>
      <rect x="128" y="168" width="44" height="24" fill="#8C8C8C" stroke="#444" stroke-width="2"/>
      <rect x="468" y="168" width="44" height="24" fill="#8C8C8C" stroke="#444" stroke-width="2"/>
      <polygon points="135,140 505,140 505,168 440,205 200,205 135,168" fill="#C9CED6" stroke="#444" stroke-width="2.5"/>
      <rect x="270" y="104" width="100" height="20" fill="#AEB7C2" stroke="#444" stroke-width="2"/>
      <circle cx="320" cy="94" r="13" fill="#fff" stroke="#444" stroke-width="2"/>
      <circle cx="290" cy="132" r="8" fill="#fff" stroke="#444" stroke-width="2"/>
      <circle cx="350" cy="132" r="8" fill="#fff" stroke="#444" stroke-width="2"/>
      <line x1="308" y1="124" x2="308" y2="275" stroke="#444" stroke-width="2"/>
      <line x1="332" y1="124" x2="332" y2="275" stroke="#444" stroke-width="2"/>
      <rect x="300" y="275" width="40" height="23" rx="4" fill="#fff" stroke="#444" stroke-width="2"/>
      <path d="M320 298V312C320 322 332 322 334 330C336 342 314 344 308 332" fill="none" stroke="#444" stroke-width="4" stroke-linecap="round"/>
      <line x1="150" y1="205" x2="150" y2="404" stroke="#7E9B3D" stroke-width="1.5" stroke-dasharray="5 4"/>
      <line x1="490" y1="205" x2="490" y2="404" stroke="#7E9B3D" stroke-width="1.5" stroke-dasharray="5 4"/>
      <path d="M150 392H490M150 392L166 384M150 392L166 400M490 392L474 384M490 392L474 400" fill="none" stroke="#7E9B3D" stroke-width="3"/>
      ${line(215,78,240,175)}${line(420,78,368,112)}
      ${line(118,148,134,176)}${line(522,148,506,176)}
      ${line(118,240,144,199)}${line(522,240,496,199)}
      ${pill(215,60,L[0])}${pill(450,60,L[1])}
      ${pill(62,130,L[2])}${pill(578,130,L[2])}
      ${pill(62,245,L[3])}${pill(578,245,L[3])}
      ${pill(320,392,L[4])}
    </svg>`;
  }
  const PART_OPTS = ["桁架","吊運車","鞍座","軌道","跨距","伸臂","外伸撐座"];
  const part = t=>({t, o:PART_OPTS});
  window.PRACTICAL_FIG = [
    {id:"sk-fig-crane-01", topic:"架空式起重機", code:"圖-01",
      q:"下圖為架空式起重機，請填出圖中各編號的構件名稱（左右兩側相同編號為同一構件）。",
      svg:crane(["{1}","{2}","{3}","{4}","{5}"]),
      ans:"① 桁架　② 吊運車　③ 鞍座　④ 軌道　⑤ 跨距",
      sol:"桁架是橫跨廠房的主樑，吊運車在桁架上橫向移動並帶動吊鉤升降；桁架兩端由鞍座支撐，鞍座沿軌道行走；跨距（span）是兩側軌道中心之間的距離。"},
    {id:"sk-fig-crane-02", topic:"架空式起重機", code:"圖-02",
      q:"請看圖完成「原設計吊升能力」的說明：\n桁架、鞍座等（1）件（2）前所能承受之最大（3）。",
      svg:crane(["桁架","吊運車","鞍座","軌道","跨距"]),
      ans:"（1）結構　（2）破壞　（3）載重",
      sol:"原設計吊升能力：桁架、鞍座等結構件破壞前所能承受之最大載重。\n這個說法出自投影片（中國勞工安全衛生管理學會）。法規用語「吊升荷重」是依構造及材質所能吊升之最大荷重，「額定荷重」是再扣除吊鉤、抓斗等吊具重量，兩者不要混用。"}
  ];
  const B = window.PRAC_BLANKS = window.PRAC_BLANKS || {};
  B["sk-fig-crane-01"] = [
    {l:"①", ...part("桁架")}, {l:"②", ...part("吊運車")}, {l:"③", ...part("鞍座")}, {l:"④", ...part("軌道")}, {l:"⑤", ...part("跨距")}
  ];
  B["sk-fig-crane-02"] = [
    {l:"（1）", t:"結構", o:["結構","傳動","電氣"]},
    {l:"（2）", t:"破壞", o:["試車","變形","破壞"]},
    {l:"（3）", t:"載重", o:["速度","載重","跨距"]}
  ];
})();
