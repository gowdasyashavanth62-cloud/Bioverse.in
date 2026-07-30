
import React from "react";
const { useState, useEffect, useRef, useMemo } = React;


// ─── DATA ─────────────────────────────────────────────────────────────────────

const SYLLABUS = {
  "1st PU": {
    color: "#0A5C36", accent: "#10B981", icon: "🌱",
    units: [
      { id:"u1", title:"Unit I – Diversity in the Living World", chapters:[
        { id:"c1", title:"The Living World", concepts:8, videos:5, notes:3 },
        { id:"c2", title:"Biological Classification", concepts:12, videos:8, notes:4 },
        { id:"c3", title:"Plant Kingdom", concepts:15, videos:10, notes:5 },
        { id:"c4", title:"Animal Kingdom", concepts:14, videos:9, notes:5 },
      ]},
      { id:"u2", title:"Unit II – Structural Organisation", chapters:[
        { id:"c5", title:"Morphology of Flowering Plants", concepts:11, videos:7, notes:4 },
        { id:"c6", title:"Anatomy of Flowering Plants", concepts:9, videos:6, notes:3 },
        { id:"c7", title:"Structural Organisation in Animals", concepts:10, videos:6, notes:4 },
      ]},
      { id:"u3", title:"Unit III – Cell: Structure and Functions", chapters:[
        { id:"c8", title:"Cell: The Unit of Life", concepts:13, videos:8, notes:5 },
        { id:"c9", title:"Biomolecules", concepts:11, videos:7, notes:4 },
        { id:"c10", title:"Cell Cycle and Cell Division", concepts:9, videos:6, notes:3 },
      ]},
      { id:"u4", title:"Unit IV – Plant Physiology", chapters:[
        { id:"c11", title:"Photosynthesis in Higher Plants", concepts:12, videos:8, notes:4 },
        { id:"c12", title:"Respiration in Plants", concepts:10, videos:6, notes:3 },
        { id:"c13", title:"Plant Growth and Development", concepts:8, videos:5, notes:3 },
      ]},
      { id:"u5", title:"Unit V – Human Physiology", chapters:[
        { id:"c14", title:"Breathing and Exchange of Gases", concepts:10, videos:7, notes:4 },
        { id:"c15", title:"Body Fluids and Circulation", concepts:12, videos:8, notes:4 },
        { id:"c16", title:"Excretory Products and Elimination", concepts:9, videos:6, notes:3 },
        { id:"c17", title:"Locomotion and Movement", concepts:8, videos:5, notes:3 },
        { id:"c18", title:"Neural Control and Coordination", concepts:11, videos:7, notes:4 },
        { id:"c19", title:"Chemical Coordination and Integration", concepts:10, videos:6, notes:4 },
      ]},
    ]
  },
  "2nd PU": {
    color: "#065F46", accent: "#059669", icon: "🧬",
    units: [
      { id:"u6", title:"Unit VI – Reproduction", chapters:[
        { id:"c20", title:"Sexual Reproduction in Flowering Plants", concepts:13, videos:9, notes:5 },
        { id:"c21", title:"Human Reproduction", concepts:12, videos:8, notes:5 },
        { id:"c22", title:"Reproductive Health", concepts:8, videos:5, notes:3 },
      ]},
      { id:"u7", title:"Unit VII – Genetics and Evolution", chapters:[
        { id:"c23", title:"Principles of Inheritance and Variation", concepts:14, videos:10, notes:6 },
        { id:"c24", title:"Molecular Basis of Inheritance", concepts:16, videos:11, notes:6 },
        { id:"c25", title:"Evolution", concepts:11, videos:7, notes:4 },
      ]},
      { id:"u8", title:"Unit VIII – Biology in Human Welfare", chapters:[
        { id:"c26", title:"Human Health and Disease", concepts:13, videos:9, notes:5 },
        { id:"c27", title:"Microbes in Human Welfare", concepts:9, videos:6, notes:4 },
      ]},
      { id:"u9", title:"Unit IX – Biotechnology", chapters:[
        { id:"c28", title:"Biotechnology: Principles and Processes", concepts:14, videos:10, notes:5 },
        { id:"c29", title:"Biotechnology and its Applications", concepts:11, videos:8, notes:4 },
      ]},
      { id:"u10", title:"Unit X – Ecology and Environment", chapters:[
        { id:"c30", title:"Organisms and Populations", concepts:10, videos:7, notes:4 },
        { id:"c31", title:"Ecosystem", concepts:11, videos:7, notes:4 },
        { id:"c32", title:"Biodiversity and Conservation", concepts:9, videos:6, notes:3 },
      ]},
    ]
  }
};

const MOCK_QUESTIONS = [
  { id:1, text:"Which organelle is the 'powerhouse of the cell'?", options:["Nucleus","Mitochondria","Ribosome","Golgi body"], correct:1, difficulty:"Easy", type:"KCET", chapter:"Cell: The Unit of Life", year:"2022", explanation:"Mitochondria produce ATP through cellular respiration." },
  { id:2, text:"Photosynthesis occurs in which organelle?", options:["Mitochondria","Nucleus","Chloroplast","Endoplasmic Reticulum"], correct:2, difficulty:"Easy", type:"NEET", chapter:"Photosynthesis in Higher Plants", year:"2023", explanation:"Chloroplasts contain chlorophyll and are the site of photosynthesis." },
  { id:3, text:"Which is NOT a type of RNA?", options:["mRNA","tRNA","rRNA","dRNA"], correct:3, difficulty:"Medium", type:"KCET", chapter:"Molecular Basis of Inheritance", year:"2021", explanation:"dRNA does not exist. The three types are mRNA, tRNA, and rRNA." },
  { id:4, text:"The functional unit of kidney is:", options:["Neuron","Nephron","Axon","Glomerulus"], correct:1, difficulty:"Easy", type:"PU", chapter:"Excretory Products and Elimination", year:"2022", explanation:"Nephron is the structural and functional unit of the kidney." },
  { id:5, text:"In mitosis, chromosomes align at equator during:", options:["Prophase","Anaphase","Metaphase","Telophase"], correct:2, difficulty:"Medium", type:"NEET", chapter:"Cell Cycle and Cell Division", year:"2023", explanation:"During Metaphase, chromosomes line up along the metaphase plate." },
  { id:6, text:"F1 generation of Mendel's TT × tt cross is:", options:["tt (dwarf)","TT (tall)","Tt (tall)","Tt (dwarf)"], correct:2, difficulty:"Easy", type:"KCET", chapter:"Principles of Inheritance and Variation", year:"2020", explanation:"F1 is Tt — all tall, showing dominance." },
  { id:7, text:"'Molecular scissors' in recombinant DNA technology:", options:["DNA Ligase","Restriction Endonuclease","Polymerase","Helicase"], correct:1, difficulty:"Medium", type:"NEET", chapter:"Biotechnology: Principles and Processes", year:"2021", explanation:"Restriction endonucleases cut DNA at specific palindromic sequences." },
  { id:8, text:"Which is a biodegradable pollutant?", options:["DDT","Polythene","Sewage","Mercury"], correct:2, difficulty:"Easy", type:"PU", chapter:"Ecosystem", year:"2022", explanation:"Sewage is biodegradable; microorganisms decompose it." },
];

const MOCK_VIDEOS = [
  { id:1, title:"Introduction to Cell Biology", youtubeId:"URUJD5NEXC8", duration:"18:32", chapter:"Cell: The Unit of Life" },
  { id:2, title:"Photosynthesis – Light Reactions", youtubeId:"g78utcLQrJ4", duration:"22:14", chapter:"Photosynthesis in Higher Plants" },
  { id:3, title:"DNA Structure & Replication", youtubeId:"8kK2zwjRV0M", duration:"25:47", chapter:"Molecular Basis of Inheritance" },
];

const DIAGRAM_DATA = [
  { id:"dg1", category:"Cell", title:"Animal Cell Structure", emoji:"🔬", labels:["Cell Membrane","Nucleus","Mitochondria","Golgi Body","Ribosome","ER","Vacuole"], difficulty:"Easy" },
  { id:"dg2", category:"Human Anatomy", title:"Human Heart", emoji:"🫀", labels:["Left Ventricle","Right Ventricle","Left Atrium","Right Atrium","Aorta","Pulmonary Artery","Vena Cava"], difficulty:"Medium" },
  { id:"dg3", category:"Plant Anatomy", title:"Leaf Cross Section", emoji:"🌿", labels:["Epidermis","Palisade Layer","Spongy Layer","Vascular Bundle","Guard Cell","Stoma"], difficulty:"Easy" },
  { id:"dg4", category:"Genetics", title:"DNA Double Helix", emoji:"🧬", labels:["Adenine","Thymine","Guanine","Cytosine","Phosphate","Deoxyribose","Hydrogen Bond"], difficulty:"Medium" },
  { id:"dg5", category:"Reproduction", title:"Flower Structure", emoji:"🌸", labels:["Petal","Sepal","Stamen","Pistil","Anther","Ovary","Receptacle"], difficulty:"Easy" },
  { id:"dg6", category:"Ecology", title:"Ecosystem Pyramid", emoji:"🌍", labels:["Producers","Primary Consumers","Secondary Consumers","Tertiary Consumers","Decomposers"], difficulty:"Easy" },
];

const LEADERBOARD = [
  { rank:1, name:"Priya Sharma", xp:4820, avatar:"P", streak:45, badge:"🏆" },
  { rank:2, name:"Rahul Kumar", xp:4200, avatar:"R", streak:32, badge:"🥈" },
  { rank:3, name:"Ananya Reddy", xp:3950, avatar:"A", streak:28, badge:"🥉" },
  { rank:4, name:"Suresh Patil", xp:3400, avatar:"S", streak:21, badge:"" },
  { rank:5, name:"Kavitha Nair", xp:3100, avatar:"K", streak:19, badge:"" },
  { rank:6, name:"You", xp:2750, avatar:"Y", streak:12, badge:"", isUser:true },
];

// ─── TOKENS ───────────────────────────────────────────────────────────────────

const T = {
  g900:"#022C22", g800:"#064E3B", g700:"#065F46", g600:"#0A5C36",
  g500:"#059669", g400:"#10B981", g300:"#34D399", g200:"#6EE7B7",
  g100:"#A7F3D0", g50:"#ECFDF5", g25:"#F0FDF4",
  surface:"#FFFFFF", bg:"#F8FFFE",
  text:"#0D1F17", textMid:"#374151", textLight:"#6B7280", textFaint:"#9CA3AF",
  border:"#E5F7EF",
  purple:"#7C3AED", blue:"#2563EB", amber:"#D97706", red:"#DC2626", sky:"#0EA5E9",
};

// ─── STYLES ───────────────────────────────────────────────────────────────────

const S = {
  btn: { padding:"12px 22px", borderRadius:"12px", border:"none", cursor:"pointer", fontSize:"14px", fontWeight:"600", transition:"all 0.18s", display:"inline-flex", alignItems:"center", gap:"8px" },
  btnPrimary: { background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff", width:"100%", justifyContent:"center" },
  btnOutline: { background:"transparent", color:T.g600, border:`2px solid ${T.g600}` },
  btnGhost: { background:"transparent", color:T.textLight, border:"none" },
  btnSm: { padding:"7px 13px", fontSize:"12.5px", borderRadius:"9px" },
  input: { width:"100%", padding:"12px 15px", borderRadius:"11px", border:`1.5px solid ${T.border}`, fontSize:"14.5px", outline:"none", background:T.g25, color:T.text, boxSizing:"border-box", marginBottom:"13px" },
  label: { fontSize:"11px", fontWeight:"700", color:T.textMid, display:"block", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.07em" },
  card: { background:T.surface, borderRadius:"15px", padding:"20px", border:`1px solid ${T.border}`, boxShadow:"0 1px 5px rgba(0,0,0,0.04)", transition:"all 0.2s" },
  page: { padding:"26px 30px", maxWidth:"1220px" },
  sidebar: { width:"256px", background:`linear-gradient(180deg,${T.g600} 0%,${T.g800} 100%)`, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:100, overflowY:"auto", transition:"transform 0.28s ease" },
  topbar: { background:"rgba(255,255,255,0.93)", backdropFilter:"blur(16px)", borderBottom:`1px solid ${T.border}`, padding:"13px 28px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:50 },
  navItem: { display:"flex", alignItems:"center", gap:"10px", padding:"9px 11px", borderRadius:"9px", cursor:"pointer", color:"rgba(255,255,255,0.62)", fontSize:"13px", fontWeight:"500", border:"none", background:"transparent", width:"100%", textAlign:"left", transition:"all 0.18s" },
  navActive: { background:"rgba(255,255,255,0.16)", color:"#fff" },
  navSection: { fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.28)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"10px 11px 3px" },
  grid2: { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px" },
  grid3: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"13px" },
  flex: (g=12) => ({ display:"flex", alignItems:"center", gap:g }),
  flexB: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  flexCol: (g=10) => ({ display:"flex", flexDirection:"column", gap:g }),
  h1: { fontSize:"25px", fontWeight:"800", color:T.text, margin:0 },
  h2: { fontSize:"19px", fontWeight:"700", color:T.text, margin:0 },
  h3: { fontSize:"15px", fontWeight:"700", color:T.text, margin:0 },
  sub: { fontSize:"13.5px", color:T.textLight, margin:0, lineHeight:"1.55" },
  secTitle: { fontSize:"16px", fontWeight:"700", color:T.text, margin:"0 0 13px" },
  pBar: { height:"6px", background:"#E5F7EF", borderRadius:"99px", overflow:"hidden" },
  pFill: (p,c=T.g400) => ({ height:"100%", width:`${p}%`, background:`linear-gradient(90deg,${c},#34D399)`, borderRadius:"99px", transition:"width 0.8s ease" }),
  badge: (c=T.g400,bg=T.g50) => ({ background:bg, color:c, padding:"3px 9px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600", display:"inline-flex", alignItems:"center", gap:"3px" }),
  tag: (type) => {
    const m={KCET:{bg:"#EEF2FF",c:"#6366F1"},NEET:{bg:"#FEF3C7",c:"#D97706"},PU:{bg:T.g50,c:"#059669"},Easy:{bg:T.g50,c:"#059669"},Medium:{bg:"#FEF3C7",c:"#D97706"},Hard:{bg:"#FEF2F2",c:"#DC2626"}};
    const t=m[type]||m.PU;
    return { background:t.bg, color:t.c, padding:"3px 8px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600" };
  },
  divider: { height:"1px", background:T.border, margin:"14px 0" },
  authWrap: { minHeight:"100vh", background:`linear-gradient(135deg,${T.g600},${T.g700},${T.g900})`, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px", overflow:"hidden", position:"relative" },
  authCard: { background:"#fff", borderRadius:"22px", padding:"44px 38px", width:"100%", maxWidth:"430px", boxShadow:"0 24px 72px rgba(0,0,0,0.28)", position:"relative", zIndex:2 },
};

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────

const Icon = ({ name, size=17, color="currentColor" }) => {
  const ic = {
    home:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
    book:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
    notes:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    question:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    test:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>,
    chart:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    user:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
    logout:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
    play:<svg width={size} height={size} viewBox="0 0 24 24" fill={color} stroke="none"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
    menu:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
    close:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
    arrow:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    check:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
    calendar:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
    target:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
    trophy:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 21 16 21"/><line x1="12" y1="17" x2="12" y2="21"/><path d="M7 4H17V11C17 13.76 14.76 16 12 16C9.24 16 7 13.76 7 11V4Z"/><path d="M7 8H3C3 8 2 13 7 14"/><path d="M17 8H21C21 8 22 13 17 14"/></svg>,
    brain:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.14Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.14Z"/></svg>,
    image:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
    zap:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
    bookmark:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>,
    settings:<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  };
  return <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{ic[name]||null}</span>;
};

const XPBadge = ({ xp }) => (
  <span style={{ ...S.badge(T.amber,"#FEF3C7"), fontWeight:"700", fontSize:"12.5px" }}>⚡ {(xp||0).toLocaleString()} XP</span>
);

const CircleProgress = ({ pct, size=80, stroke=7, color=T.g400, bg="#E5F7EF", children }) => {
  const r=(size-stroke*2)/2, circ=2*Math.PI*r, dash=circ*(1-pct/100);
  return (
    <div style={{ position:"relative", width:size, height:size, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <svg width={size} height={size} style={{ position:"absolute", top:0, left:0, transform:"rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg} strokeWidth={stroke}/>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"
          style={{ transition:"stroke-dashoffset 1s ease" }}/>
      </svg>
      <div style={{ position:"relative", zIndex:1, textAlign:"center" }}>{children}</div>
    </div>
  );
};

const BarChart = ({ data, height=80, color=T.g400 }) => {
  const max=Math.max(...data.map(d=>d.val),1), w=100/data.length;
  return (
    <div style={{ width:"100%", height }}>
      <svg viewBox={`0 0 100 ${height}`} style={{ width:"100%", height:"100%" }} preserveAspectRatio="none">
        {data.map((d,i)=>{
          const bh=(d.val/max)*(height-16), x=i*w+w*0.15, bw=w*0.7;
          return (
            <g key={i}>
              <rect x={x} y={height-bh-14} width={bw} height={bh} rx="2" fill={color} opacity={d.highlight?1:0.42}/>
              <text x={x+bw/2} y={height-2} textAnchor="middle" fontSize="5.5" fill={T.textFaint}>{d.label}</text>
              {d.highlight&&<text x={x+bw/2} y={height-bh-17} textAnchor="middle" fontSize="5.5" fill={color} fontWeight="700">{d.val}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const LineChart = ({ data, height=60, color=T.g400 }) => {
  const max=Math.max(...data,1);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*100},${height-(v/max)*height*0.85-4}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width:"100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polyline points={pts+` 100,${height} 0,${height}`} fill="url(#lg)" stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// ─── LANDING ──────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════════
// BACKEND LAYER — Supabase client with CORS-safe fetch + demo fallback
// ═══════════════════════════════════════════════════════════════════════════════

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    "Missing Supabase config. Copy .env.example to .env and fill in " +
    "VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings."
  );
}

// ─── NETWORK CHECKER ─────────────────────────────────────────────────────────
let _sbReachable = null;

async function checkSupabaseReachable() {
  if (_sbReachable !== null) return _sbReachable;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 4000);
    const r = await fetch(`${SUPABASE_URL}/rest/v1/units?select=id&limit=1`, {
      headers: { apikey: SUPABASE_ANON, Authorization: `Bearer ${SUPABASE_ANON}` },
      signal: ctrl.signal,
    });
    clearTimeout(tid);
    _sbReachable = r.ok || r.status === 403; // 403 = reached but RLS; still reachable
    return _sbReachable;
  } catch {
    _sbReachable = false;
    return false;
  }
}

// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const sb = {
  _url: SUPABASE_URL,
  _key: SUPABASE_ANON,
  _session: null,

  _headers(extra = {}) {
    return {
      "Content-Type": "application/json",
      "apikey": this._key,
      "Authorization": `Bearer ${this._session?.access_token || this._key}`,
      ...extra,
    };
  },

  async _safeFetch(url, opts = {}, timeoutMs = 15000) {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await fetch(url, { ...opts, signal: ctrl.signal });
      clearTimeout(tid);
      return r;
    } catch (err) {
      clearTimeout(tid);
      if (err.name === "AbortError" || /abort/i.test(err.message || "")) {
        throw new Error("The request took too long and timed out. Check your connection and try again.");
      }
      throw err;
    }
  },

  // ── Auth ──────────────────────────────────────────────────────────────────
  async signUp({ email, password, full_name, phone, class: cls }) {
    const r = await this._safeFetch(`${this._url}/auth/v1/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": this._key },
      body: JSON.stringify({ email, password, data: { full_name, phone, class: cls } }),
    });
    const d = await r.json();
    if (d.access_token) {
      this._session = d;
      try { localStorage.setItem("bv_session", JSON.stringify(d)); } catch {}
    }
    return d;
  },

  async signIn({ email, password }) {
    const r = await this._safeFetch(`${this._url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": this._key },
      body: JSON.stringify({ email, password }),
    });
    const d = await r.json();
    if (d.access_token) {
      this._session = d;
      try { localStorage.setItem("bv_session", JSON.stringify(d)); } catch {}
    }
    return d;
  },

  async signOut() {
    try {
      if (this._session?.access_token) {
        await this._safeFetch(`${this._url}/auth/v1/logout`, { method: "POST", headers: this._headers() });
      }
    } catch {}
    this._session = null;
    try { localStorage.removeItem("bv_session"); } catch {}
  },

  async resetPassword(email) {
    return this._safeFetch(`${this._url}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": this._key },
      body: JSON.stringify({ email }),
    });
  },

  loadSession() {
    try {
      const s = localStorage.getItem("bv_session");
      if (s) { this._session = JSON.parse(s); }
    } catch {}
    return this._session;
  },

  get userId() { return this._session?.user?.id; },
  get userEmail() { return this._session?.user?.email; },

  // ── REST helpers ──────────────────────────────────────────────────────────
  async _get(table, params = "") {
    const r = await this._safeFetch(`${this._url}/rest/v1/${table}?${params}`, {
      headers: this._headers(),
    });
    if (!r.ok) return [];
    return r.json();
  },

  async _post(table, body) {
    const r = await this._safeFetch(`${this._url}/rest/v1/${table}`, {
      method: "POST",
      headers: this._headers({ "Prefer": "return=representation" }),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      let msg = `Save failed (HTTP ${r.status})`;
      try { const d = await r.json(); msg = d.message || d.hint || d.details || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },

  async _patch(table, match, body) {
    const r = await this._safeFetch(`${this._url}/rest/v1/${table}?${match}`, {
      method: "PATCH",
      headers: this._headers({ "Prefer": "return=representation" }),
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      let msg = `Update failed (HTTP ${r.status})`;
      try { const d = await r.json(); msg = d.message || d.hint || d.details || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },

  async _delete(table, match) {
    try {
      await this._safeFetch(`${this._url}/rest/v1/${table}?${match}`, {
        method: "DELETE",
        headers: this._headers(),
      });
    } catch {}
  },

  // ── Storage ────────────────────────────────────────────────────────────
  // Uploads a File/Blob to a bucket at `path` (object key WITHOUT the
  // bucket name prefixed — e.g. path="chapterId/1699999_notes.pdf" for
  // bucket="notes-pdfs"). Throws on failure so callers can show a real
  // error instead of silently swallowing it.
  async uploadFile(bucket, path, file) {
    if (!this._session?.access_token) throw new Error("You must be signed in to upload files.");
    // Uploads need much more time than a normal API call — scale the
    // timeout with file size (roughly 60s per 10MB) with a 30s floor,
    // instead of reusing the 15s default meant for small JSON requests.
    const timeoutMs = Math.max(30000, Math.ceil(file.size / (10 * 1024 * 1024)) * 60000);
    const r = await this._safeFetch(`${this._url}/storage/v1/object/${bucket}/${path}`, {
      method: "POST",
      headers: {
        "apikey": this._key,
        "Authorization": `Bearer ${this._session.access_token}`,
        "Content-Type": file.type || "application/octet-stream",
        "x-upsert": "true",
      },
      body: file,
    }, timeoutMs);
    if (!r.ok) {
      let msg = `Upload failed (HTTP ${r.status})`;
      try { const d = await r.json(); msg = d.message || d.error || msg; } catch {}
      throw new Error(msg);
    }
    return path; // store this path in the DB row; it's not a public URL
  },

  // Fetches a private file as an authenticated request and returns a
  // temporary blob: URL for viewing/downloading in the browser.
  async fetchFileBlobUrl(bucket, path) {
    if (!this._session?.access_token) throw new Error("You must be signed in to view this file.");
    const r = await this._safeFetch(`${this._url}/storage/v1/object/${bucket}/${path}`, {
      headers: { "apikey": this._key, "Authorization": `Bearer ${this._session.access_token}` },
    }, 60000);
    if (!r.ok) throw new Error(`Could not load file (HTTP ${r.status})`);
    const blob = await r.blob();
    return URL.createObjectURL(blob);
  },

  // ── Data helpers ──────────────────────────────────────────────────────────
  async getProfile() {
    if (!this.userId) return null;
    try {
      const rows = await this._get("users", `id=eq.${this.userId}&select=*`);
      return Array.isArray(rows) ? rows[0] : null;
    } catch { return null; }
  },
  async updateProfile(data) {
    if (!this.userId) return;
    try { return this._patch("users", `id=eq.${this.userId}`, data); } catch {}
  },

  async getUnits(level) {
    try {
      const f = level ? `level=eq.${encodeURIComponent(level)}&` : "";
      const rows = await this._get("units", `${f}order=order_number.asc&select=*,chapters(*)`);
      return Array.isArray(rows) && rows.length > 0 ? rows : null; // null = use fallback
    } catch { return null; }
  },
  async getAllChapters() {
    try {
      const rows = await this._get("chapters", `order=order_number.asc&select=*,units(name,level,icon)`);
      return Array.isArray(rows) ? rows : [];
    } catch { return []; }
  },

  async getVideos(chapterId) {
    try { return await this._get("videos", `chapter_id=eq.${chapterId}&is_published=neq.false&order=title.asc&select=*`); }
    catch { return []; }
  },
  async getAllVideos() {
    try { return await this._get("videos", `order=title.asc&select=*,chapters(chapter_name)`); }
    catch { return []; }
  },
  async addVideo(data) {
    const r = await this._post("videos", { is_published: true, view_count: 0, ...data });
    if (!Array.isArray(r) || r.length === 0) throw new Error("Could not save video. Check required fields and try again.");
    return r;
  },
  async updateVideo(id, data) {
    const r = await this._patch("videos", `id=eq.${id}`, data);
    if (!Array.isArray(r) || r.length === 0) throw new Error("Could not update video.");
    return r;
  },
  async deleteVideo(id) { return await this._delete("videos", `id=eq.${id}`); },

  // ── Gamification RPCs ─────────────────────────────────────────────────
  async _rpc(name, params = {}) {
    const r = await this._safeFetch(`${this._url}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: this._headers(),
      body: JSON.stringify(params),
    });
    if (!r.ok) {
      let msg = `${name} failed (HTTP ${r.status})`;
      try { const d = await r.json(); msg = d.message || d.hint || d.details || msg; } catch {}
      throw new Error(msg);
    }
    return r.json();
  },
  async startGameSession(mode, chapterId, numQuestions) {
    return await this._rpc("start_game_session", { p_mode: mode, p_chapter_id: chapterId || null, p_num_questions: numQuestions || 10 });
  },
  async submitGameSession(sessionId, answers) {
    return await this._rpc("submit_game_session", { p_session_id: sessionId, p_answers: answers });
  },
  async awardXp(sessionId) {
    return await this._rpc("award_xp", { p_session_id: sessionId });
  },
  async unlockAchievement(code) {
    const r = await this._rpc("unlock_achievement", { p_code: code });
    return r[0];
  },
  async getAchievements() {
    try { return await this._get("achievements", "order=xp_reward.asc&select=*"); }
    catch { return []; }
  },
  async getUserAchievements() {
    try { return await this._get("user_achievements", `student_id=eq.${this.userId}&select=achievement_id,unlocked_at`); }
    catch { return []; }
  },
  async getLeaderboard(limit) {
    try { return await this._get("leaderboard", `order=rank.asc&limit=${limit || 50}&select=*`); }
    catch { return []; }
  },
  async getMyRank() {
    try { const r = await this._get("leaderboard", `id=eq.${this.userId}&select=rank`); return r?.[0]?.rank ?? null; }
    catch { return null; }
  },

  async getNotes(chapterId) {
    try { return await this._get("notes", `chapter_id=eq.${chapterId}&is_published=eq.true&order=title.asc&select=*`); }
    catch { return []; }
  },
  async getAllNotes() {
    try { return await this._get("notes", `order=title.asc&select=*,chapters(chapter_name)`); }
    catch { return []; }
  },
  async addNote(data) {
    const r = await this._post("notes", data);
    if (!Array.isArray(r) || r.length === 0) throw new Error("Could not save note. Check required fields and try again.");
    return r;
  },
  async updateNote(id, data) { try { return await this._patch("notes", `id=eq.${id}`, data); } catch {} },
  async deleteNote(id) { try { return await this._delete("notes", `id=eq.${id}`); } catch {} },

  async getQuestions(chapterId, examType) {
    try {
      let q = `chapter_id=eq.${chapterId}&order=created_at.asc&select=*`;
      if (examType && examType !== "All") q += `&exam_type=eq.${examType}`;
      return await this._get("questions", q);
    } catch { return []; }
  },
  async getAllQuestions(filters = {}) {
    try {
      let q = `order=created_at.desc&select=*,chapters(chapter_name)`;
      if (filters.examType && filters.examType !== "All") q += `&exam_type=eq.${filters.examType}`;
      if (filters.difficulty && filters.difficulty !== "All") q += `&difficulty=eq.${filters.difficulty}`;
      return await this._get("questions", q);
    } catch { return []; }
  },
  async addQuestion(data) {
    const r = await this._post("questions", data);
    if (!Array.isArray(r) || r.length === 0) throw new Error("Could not save question. Check required fields and try again.");
    return r;
  },
  async updateQuestion(id, data) { try { return await this._patch("questions", `id=eq.${id}`, data); } catch {} },
  async deleteQuestion(id) { try { return await this._delete("questions", `id=eq.${id}`); } catch {} },

  async getTests(chapterId) {
    try { return await this._get("tests", `chapter_id=eq.${chapterId}&is_published=eq.true&order=created_at.asc&select=*`); }
    catch { return []; }
  },
  async getAllTests() {
    try { return await this._get("tests", `order=created_at.desc&select=*,chapters(chapter_name)`); }
    catch { return []; }
  },
  async addTest(data) { try { return await this._post("tests", data); } catch { return []; } },
  async updateTest(id, data) { try { return await this._patch("tests", `id=eq.${id}`, data); } catch {} },
  async deleteTest(id) { try { return await this._delete("tests", `id=eq.${id}`); } catch {} },

  async getProgress(chapterId) {
    if (!this.userId) return [];
    try {
      let q = `student_id=eq.${this.userId}&select=*`;
      if (chapterId) q += `&chapter_id=eq.${chapterId}`;
      return await this._get("progress", q);
    } catch { return []; }
  },
  async upsertProgress(data) {
    if (!this.userId) return;
    try {
      const body = { ...data, student_id: this.userId, updated_at: new Date().toISOString() };
      const r = await this._safeFetch(`${this._url}/rest/v1/progress`, {
        method: "POST",
        headers: this._headers({ "Prefer": "resolution=merge-duplicates,return=representation" }),
        body: JSON.stringify(body),
      });
      return r.json();
    } catch {}
  },

  async getResults() {
    if (!this.userId) return [];
    try { return await this._get("results", `student_id=eq.${this.userId}&order=created_at.desc&select=*,tests(title,chapters(chapter_name))`); }
    catch { return []; }
  },
  async submitResult(data) {
    if (!this.userId) return;
    try { return await this._post("results", { ...data, student_id: this.userId, created_at: new Date().toISOString() }); }
    catch {}
  },

  async getSubscription() {
    if (!this.userId) return null;
    try {
      const rows = await this._get("subscriptions", `student_id=eq.${this.userId}&status=eq.active&order=created_at.desc&limit=1&select=*`);
      return Array.isArray(rows) ? rows[0] : null;
    } catch { return null; }
  },

  async getStudents() {
    try { return await this._get("users", `role=eq.student&order=created_at.desc&select=*`); }
    catch { return []; }
  },
  async updateStudent(id, data) { try { return await this._patch("users", `id=eq.${id}`, data); } catch {} },

  async getNotifications() {
    if (!this.userId) return [];
    try { return await this._get("notifications", `or=(user_id.eq.${this.userId},user_id.is.null)&is_read=eq.false&order=created_at.desc&select=*`); }
    catch { return []; }
  },

  async getCommunityPosts(category) {
    try {
      let q = `order=created_at.desc&select=*,users(full_name,avatar_url)`;
      if (category && category !== "All") q += `&category=eq.${encodeURIComponent(category)}`;
      return await this._get("community_posts", q);
    } catch { return null; } // null = use fallback demo data
  },
  async addCommunityPost(data) {
    if (!this.userId) return;
    try { return await this._post("community_posts", { ...data, author_id: this.userId }); }
    catch {}
  },
  async getCommunityReplies(postId) {
    try { return await this._get("community_replies", `post_id=eq.${postId}&order=created_at.asc&select=*,users(full_name)`); }
    catch { return []; }
  },
  async addCommunityReply(postId, body) {
    if (!this.userId) return;
    try { return await this._post("community_replies", { post_id: postId, author_id: this.userId, body }); }
    catch {}
  },

  async addUnit(data) { try { return await this._post("units", data); } catch { return []; } },
  async updateUnit(id, d) { try { return await this._patch("units", `id=eq.${id}`, d); } catch {} },
  async deleteUnit(id) { try { return await this._delete("units", `id=eq.${id}`); } catch {} },
  async addChapter(data) { try { return await this._post("chapters", data); } catch { return []; } },
  async updateChapter(id, d) { try { return await this._patch("chapters", `id=eq.${id}`, d); } catch {} },
  async deleteChapter(id) { try { return await this._delete("chapters", `id=eq.${id}`); } catch {} },

  async adminStats() {
    try {
      const [users, videos, questions, tests, subs] = await Promise.all([
        this._get("users", `role=eq.student&select=id,subscription_plan,last_active_at`),
        this._get("videos", `select=id`),
        this._get("questions", `select=id`),
        this._get("tests", `select=id`),
        this._get("subscriptions", `status=eq.active&plan_name=neq.free&select=id,plan_name`),
      ]);
      const activeThreshold = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      return {
        totalStudents: Array.isArray(users) ? users.length : 0,
        activeStudents: Array.isArray(users) ? users.filter(u => u.last_active_at > activeThreshold).length : 0,
        premiumStudents: Array.isArray(users) ? users.filter(u => u.subscription_plan !== "free").length : 0,
        totalVideos: Array.isArray(videos) ? videos.length : 0,
        totalQuestions: Array.isArray(questions) ? questions.length : 0,
        totalTests: Array.isArray(tests) ? tests.length : 0,
        activeSubscriptions: Array.isArray(subs) ? subs.length : 0,
      };
    } catch {
      return { totalStudents: 0, activeStudents: 0, premiumStudents: 0, totalVideos: 0, totalQuestions: 0, totalTests: 0, activeSubscriptions: 0 };
    }
  },
};

// ─── RAZORPAY HELPER ─────────────────────────────────────────────────────────
const Razorpay = {
  KEY_ID: "rzp_test_BioVerseKey",
  openCheckout({ amount, name, description, email, onSuccess }) {
    const options = {
      key: this.KEY_ID, amount: amount * 100, currency: "INR",
      name: "BioVerse", description,
      prefill: { email },
      theme: { color: "#0A5C36" },
      handler: async (response) => {
        try {
          await sb._post("payments", {
            student_id: sb.userId,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id || "",
            amount, status: "success",
            created_at: new Date().toISOString(),
          });
        } catch {}
        onSuccess(response);
      },
    };
    const load = () => { const rzp = new window.Razorpay(options); rzp.open(); };
    if (window.Razorpay) { load(); }
    else {
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = load;
      document.head.appendChild(s);
    }
  }
};

// ─── GLOBAL AUTH HOOK ─────────────────────────────────────────────────────────
function useAuth() {
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const session = sb.loadSession();
    if (session?.user) {
      setAuthUser(session.user);
      sb.getProfile().then(p => { setProfile(p); setAuthLoading(false); }).catch(() => setAuthLoading(false));
    } else {
      setAuthLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const d = await sb.signIn({ email, password });
      if (d.access_token) {
        setAuthUser(d.user);
        const p = await sb.getProfile();
        setProfile(p);
        return { ok: true, user: d.user, profile: p };
      }
      return { ok: false, error: d.error_description || d.msg || "Login failed" };
    } catch (e) {
      return { ok: false, error: "Network error — check your connection and try again." };
    }
  };

  const signup = async (email, password, meta) => {
    try {
      const d = await sb.signUp({ email, password, ...meta });
      if (d.access_token) {
        setAuthUser(d.user);
        const p = await sb.getProfile();
        setProfile(p);
        return { ok: true };
      }
      return { ok: false, error: d.error_description || d.msg || "Signup failed" };
    } catch (e) {
      return { ok: false, error: "Network error — check your connection and try again." };
    }
  };

  const logout = async () => {
    await sb.signOut();
    setAuthUser(null);
    setProfile(null);
  };

  return { authUser, profile, authLoading, login, signup, logout };
}

// ─── AI CALL (uses artifact Anthropic proxy) ──────────────────────────────────
async function callBioAI(messages, systemPrompt) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      system: systemPrompt,
      messages,
    }),
  });
  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.content?.[0]?.text || "I couldn't generate a response. Please try again.";
}

function Landing({ onAuth }) {
  const [scroll, setScroll] = useState(0);
  useEffect(() => {
    const h = () => setScroll(window.scrollY);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const features = [
    { icon:"🎥", title:"HD Video Lectures", desc:"Expert-curated videos for every Karnataka PU concept" },
    { icon:"🧠", title:"AI-Powered Analytics", desc:"KCET & NEET readiness scores with chapter-level insights" },
    { icon:"🔥", title:"Daily Challenges", desc:"5 MCQs every day with XP rewards and leaderboard" },
    { icon:"📈", title:"Visual Progress", desc:"Circular indicators, heatmaps, and weekly graphs" },
    { icon:"🏆", title:"Achievement System", desc:"Earn badges and climb the leaderboard as you study" },
    { icon:"📅", title:"Smart Study Planner", desc:"Personalized daily targets based on your exam date" },
  ];

  return (
    <div style={{ fontFamily:"'Inter',sans-serif", overflowX:"hidden" }}>
      <nav style={{ position:"fixed", top:0, width:"100%", zIndex:100, background:scroll>20?"rgba(255,255,255,0.95)":"transparent", backdropFilter:scroll>20?"blur(16px)":"none", borderBottom:scroll>20?`1px solid ${T.border}`:"none", transition:"all 0.3s", padding:"0 32px", boxSizing:"border-box" }}>
        <div style={{ maxWidth:"1160px", margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 0" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"24px" }}>🧬</span>
            <span style={{ fontSize:"19px", fontWeight:"800", color:scroll>20?T.g600:"#fff" }}>BioVerse</span>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {["About","Pricing"].map(l=><span key={l} style={{ color:scroll>20?T.textMid:"rgba(255,255,255,0.8)", fontSize:"13.5px", cursor:"pointer", fontWeight:"500" }}>{l}</span>)}
            <button onClick={()=>onAuth("login")} style={{ ...S.btn, padding:"8px 18px", background:scroll>20?"transparent":"rgba(255,255,255,0.12)", color:scroll>20?T.g600:"#fff", border:scroll>20?`2px solid ${T.g600}`:"2px solid rgba(255,255,255,0.38)", fontSize:"13px" }}>Login</button>
            <button onClick={()=>onAuth("signup")} style={{ ...S.btn, padding:"8px 18px", background:"#fff", color:T.g600, fontSize:"13px" }}>Get Started</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ background:`linear-gradient(135deg,${T.g600},${T.g700},${T.g900})`, minHeight:"100vh", display:"flex", alignItems:"center", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", inset:0, overflow:"hidden", pointerEvents:"none" }}>
          {[...Array(5)].map((_,i)=><div key={i} style={{ position:"absolute", borderRadius:"50%", background:`rgba(16,185,129,${0.04+i*0.018})`, width:`${180+i*90}px`, height:`${180+i*90}px`, top:`${8+i*14}%`, left:`${58+Math.sin(i)*8}%`, animation:`float ${4+i*0.8}s ease-in-out infinite alternate` }}/>)}
          {[...Array(10)].map((_,i)=><div key={`d${i}`} style={{ position:"absolute", width:"7px", height:"7px", borderRadius:"50%", background:i%2===0?"rgba(52,211,153,0.55)":"rgba(16,185,129,0.35)", right:`${14+Math.sin(i*0.9)*9}%`, top:`${8+i*8}%`, animation:`pulse ${2+(i%3)*0.4}s ease-in-out infinite alternate` }}/>)}
        </div>
        <div style={{ maxWidth:"1160px", margin:"0 auto", padding:"120px 32px 80px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"52px", alignItems:"center", width:"100%" }}>
          <div>
            <div style={{ ...S.badge("#34D399","rgba(52,211,153,0.15)"), display:"inline-block", marginBottom:"16px", fontSize:"12px" }}>🌱 Karnataka PU Biology — Phase 2</div>
            <h1 style={{ fontSize:"clamp(32px,5vw,54px)", fontWeight:"900", color:"#fff", lineHeight:"1.1", margin:"0 0 16px", letterSpacing:"-0.02em" }}>
              Master Biology.<br/><span style={{ color:"#34D399" }}>Crack KCET</span><br/>& NEET.
            </h1>
            <p style={{ fontSize:"16px", color:"rgba(255,255,255,0.7)", lineHeight:"1.65", margin:"0 0 30px", maxWidth:"440px" }}>
              The most advanced Karnataka PU Biology platform — AI analytics, daily challenges, smart planner, and KCET/NEET readiness scores.
            </p>
            <div style={{ display:"flex", gap:13 }}>
              <button onClick={()=>onAuth("signup")} style={{ ...S.btn, padding:"14px 28px", fontSize:"14.5px", background:"#fff", color:T.g600 }}>
                Start Free <Icon name="arrow" size={15} color={T.g600}/>
              </button>
              <button style={{ ...S.btn, padding:"14px 20px", fontSize:"14.5px", background:"transparent", color:"rgba(255,255,255,0.85)", border:"2px solid rgba(255,255,255,0.28)" }}>
                <Icon name="play" size={14} color="#fff"/> Demo
              </button>
            </div>
            <div style={{ display:"flex", gap:20, marginTop:"32px" }}>
              {[["25","Chapters"],["1000+","Questions"],["50+","Mock Tests"],["AI","Analytics"]].map(([n,l],i)=>(
                <div key={i} style={{ textAlign:"center" }}>
                  <div style={{ fontSize:"20px", fontWeight:"800", color:"#fff" }}>{n}</div>
                  <div style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.5)" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Hero card */}
          <div style={{ background:"rgba(255,255,255,0.07)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.14)", borderRadius:"22px", padding:"24px", boxShadow:"0 40px 80px rgba(0,0,0,0.28)" }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"16px" }}>
              <span style={{ color:"#fff", fontWeight:"700", fontSize:"14px" }}>🧬 KCET Readiness</span>
              <XPBadge xp={2750}/>
            </div>
            {[{ch:"Cell Biology",pct:88,c:"#34D399"},{ch:"Genetics",pct:64,c:"#FCD34D"},{ch:"Ecology",pct:42,c:"#FCA5A5"}].map((item,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.08)", borderRadius:"11px", padding:"12px 14px", marginBottom:"9px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <span style={{ color:"#fff", fontSize:"13px", fontWeight:"500" }}>{item.ch}</span>
                  <span style={{ color:item.c, fontSize:"12.5px", fontWeight:"700" }}>{item.pct}%</span>
                </div>
                <div style={{ height:"4px", background:"rgba(255,255,255,0.12)", borderRadius:"99px" }}>
                  <div style={{ height:"100%", width:`${item.pct}%`, background:item.c, borderRadius:"99px" }}/>
                </div>
              </div>
            ))}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"8px", marginTop:"12px" }}>
              {[["🔥","12 Day","Streak"],["🏆","8","Tests"],["⚡","2750","XP"]].map(([ic,v,l],i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.1)", borderRadius:"9px", padding:"9px", textAlign:"center" }}>
                  <div style={{ fontSize:"17px" }}>{ic}</div>
                  <div style={{ color:"#fff", fontSize:"13px", fontWeight:"700" }}>{v}</div>
                  <div style={{ color:"rgba(255,255,255,0.48)", fontSize:"10.5px" }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding:"68px 32px", background:"#fff" }}>
        <div style={{ maxWidth:"1080px", margin:"0 auto", textAlign:"center" }}>
          <p style={{ color:T.g400, fontSize:"12px", fontWeight:"700", textTransform:"uppercase", letterSpacing:"0.12em", marginBottom:"9px" }}>Why BioVerse Phase 2</p>
          <h2 style={{ fontSize:"30px", fontWeight:"800", color:T.text, marginBottom:"5px" }}>Everything in One Platform</h2>
          <p style={{ color:T.textLight, fontSize:"15.5px", marginBottom:"40px" }}>Built exclusively for Karnataka PU students targeting KCET & NEET</p>
          <div style={S.grid3}>
            {features.map((f,i)=>(
              <div key={i} style={{ ...S.card, textAlign:"left", padding:"22px" }}>
                <span style={{ fontSize:"30px", display:"block", marginBottom:"12px" }}>{f.icon}</span>
                <h3 style={{ ...S.h3, marginBottom:"6px" }}>{f.title}</h3>
                <p style={S.sub}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section style={{ padding:"68px 32px", background:T.g25 }}>
        <div style={{ maxWidth:"780px", margin:"0 auto", textAlign:"center" }}>
          <h2 style={{ fontSize:"30px", fontWeight:"800", color:T.text, marginBottom:"40px" }}>Simple Pricing</h2>
          <div style={S.grid2}>
            <div style={{ ...S.card, textAlign:"left" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:T.textLight, textTransform:"uppercase", marginBottom:"9px" }}>Free</div>
              <div style={{ fontSize:"34px", fontWeight:"900", color:T.text, marginBottom:"2px" }}>₹0<span style={{ fontSize:"15px", fontWeight:"500" }}>/forever</span></div>
              {["Sample videos","Basic notes","10 Qs/chapter","Daily Challenge"].map((f,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"8px", marginTop:i===0?"16px":0 }}>
                  <span style={{ color:T.g400 }}>✓</span><span style={{ fontSize:"13px", color:T.textMid }}>{f}</span>
                </div>
              ))}
              <button onClick={()=>onAuth("signup")} style={{ ...S.btn, ...S.btnOutline, width:"100%", justifyContent:"center", marginTop:"18px" }}>Start Free</button>
            </div>
            <div style={{ background:`linear-gradient(135deg,${T.g600},${T.g700})`, borderRadius:"15px", padding:"22px", textAlign:"left", position:"relative", overflow:"hidden" }}>
              <div style={{ position:"absolute", top:"13px", right:"13px", background:"#FCD34D", color:"#78350F", padding:"3px 10px", borderRadius:"99px", fontSize:"11px", fontWeight:"700" }}>👑 POPULAR</div>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:"rgba(255,255,255,0.62)", textTransform:"uppercase", marginBottom:"9px" }}>Premium</div>
              <div style={{ fontSize:"34px", fontWeight:"900", color:"#fff", marginBottom:"2px" }}>₹999<span style={{ fontSize:"15px", fontWeight:"500" }}>/year</span></div>
              {["All HD Videos","Complete Notes","1000+ Questions","KCET & NEET Analytics","50+ Mock Tests","Progress Heatmaps","AI Tutor (soon)"].map((f,i)=>(
                <div key={i} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:"8px", marginTop:i===0?"16px":0 }}>
                  <span style={{ color:"#34D399" }}>✓</span><span style={{ fontSize:"13px", color:"rgba(255,255,255,0.88)" }}>{f}</span>
                </div>
              ))}
              <button onClick={()=>onAuth("signup")} style={{ ...S.btn, background:"#fff", color:T.g600, width:"100%", justifyContent:"center", marginTop:"18px" }}>Start Premium</button>
            </div>
          </div>
        </div>
      </section>

      <footer style={{ background:T.g900, padding:"40px 32px 20px" }}>
        <div style={{ maxWidth:"1080px", margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"24px", flexWrap:"wrap", gap:"14px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:9 }}><span style={{ fontSize:"20px" }}>🧬</span><span style={{ fontSize:"17px", fontWeight:"800", color:"#fff" }}>BioVerse</span></div>
            <div style={{ display:"flex", gap:20 }}>{["About","Contact","Privacy","Terms"].map(l=><span key={l} style={{ color:"rgba(255,255,255,0.5)", fontSize:"13px", cursor:"pointer" }}>{l}</span>)}</div>
          </div>
          <div style={{ borderTop:"1px solid rgba(255,255,255,0.1)", paddingTop:"14px", textAlign:"center", color:"rgba(255,255,255,0.33)", fontSize:"12px" }}>© 2025 BioVerse. All rights reserved.</div>
        </div>
      </footer>
      <style>{`@keyframes float{0%{transform:translateY(0) scale(1)}100%{transform:translateY(-18px) scale(1.05)}} @keyframes pulse{0%{opacity:0.4;transform:scale(1)}100%{opacity:1;transform:scale(1.35)}}`}</style>
    </div>
  );
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────


// ─── CONNECTED AUTH COMPONENT ─────────────────────────────────────────────────

function Auth({ mode, onSuccess, onToggle }) {
  const [form, setForm] = useState({ name:"", email:"", phone:"", password:"", class:"1st PU" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setError(""); setLoading(true);

    try {
      if (forgot) {
        // Try Supabase first, fall back gracefully
        try { await sb.resetPassword(form.email); } catch {}
        setForgotSent(true); setLoading(false); return;
      }

      if (mode === "signup") {
        if (!form.name || !form.email || !form.password) {
          setError("Please fill all fields."); setLoading(false); return;
        }
        if (form.password.length < 6) {
          setError("Password must be at least 6 characters."); setLoading(false); return;
        }
        // Real Supabase signup — no fallback. A DB trigger creates the
        // matching row in public.users with role='student' by default.
        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10000);
          const r = await sb.signUp({ email: form.email, password: form.password, full_name: form.name, phone: form.phone, class: form.class });
          clearTimeout(tid);
          if (r.access_token) {
            const profile = await sb.getProfile().catch(() => null);
            onSuccess(profile || { full_name: form.name, email: form.email, class: form.class, xp: 0, streak: 0, subscription_plan: "free", role: "student" });
            return;
          }
          if (r.msg && /confirm/i.test(r.msg)) {
            setError("Account created. Please check your email to confirm before logging in.");
            setLoading(false); return;
          }
          setError(r.error_description || r.msg || "Could not create account. Please try again.");
        } catch {
          setError("Could not reach the server. Check your connection and try again.");
        }

      } else {
        // LOGIN — real Supabase Auth only
        if (!form.email || !form.password) {
          setError("Please fill all fields."); setLoading(false); return;
        }

        try {
          const ctrl = new AbortController();
          const tid = setTimeout(() => ctrl.abort(), 10000);

          const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
            method: "POST",
            headers: { "Content-Type":"application/json", "apikey": SUPABASE_ANON },
            body: JSON.stringify({ email: form.email, password: form.password }),
            signal: ctrl.signal,
          });
          clearTimeout(tid);

          const d = await res.json();
          if (d.access_token) {
            sb._session = d;
            try { localStorage.setItem("bv_session", JSON.stringify(d)); } catch {}
            const profile = await sb.getProfile().catch(() => null);
            onSuccess(profile || { full_name: d.user?.email?.split("@")[0], email: d.user?.email, xp: 0, streak: 0, subscription_plan: "free", role: "student" });
            return;
          }
          setError(d.error_description || d.msg || "Invalid email or password.");

        } catch (netErr) {
          setError("Could not reach the server. Check your connection and try again.");
        }
      }
    } catch(e) {
      setError("Something went wrong. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div style={S.authWrap}>
      <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
        {[...Array(4)].map((_,i)=><div key={i} style={{ position:"absolute", borderRadius:"50%", border:`1px solid rgba(52,211,153,${0.07+i*0.04})`, width:`${200+i*100}px`, height:`${200+i*100}px`, top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}/>)}
      </div>
      <div style={S.authCard}>
        <div style={{ textAlign:"center", marginBottom:"26px" }}>
          <span style={{ fontSize:"36px" }}>🧬</span>
          <h1 style={{ fontSize:"22px", fontWeight:"800", color:T.text, margin:"7px 0 3px" }}>BioVerse</h1>
          <p style={{ color:T.textLight, fontSize:"13px" }}>
            {forgot ? "Reset your password" : mode==="login" ? "Welcome back!" : "Start your KCET/NEET journey"}
          </p>
        </div>
        {error && <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:"9px", padding:"10px 13px", color:"#DC2626", fontSize:"13px", marginBottom:"13px" }}>{error}</div>}

        {forgot ? (
          forgotSent ? (
            <div style={{ textAlign:"center", padding:"10px 0" }}>
              <div style={{ fontSize:"40px", marginBottom:"10px" }}>📧</div>
              <div style={{ fontSize:"14px", fontWeight:"700", color:T.g600, marginBottom:"6px" }}>Reset link sent!</div>
              <div style={{ fontSize:"12.5px", color:T.textLight, marginBottom:"16px" }}>Check your email to reset your password.</div>
              <button onClick={()=>{setForgot(false);setForgotSent(false);}} style={{ ...S.btn, ...S.btnOutline, width:"100%", justifyContent:"center" }}>← Back to Login</button>
            </div>
          ) : (
            <>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" placeholder="you@email.com" value={form.email} onChange={h("email")}/>
              <button onClick={submit} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, opacity:loading?0.7:1 }}>
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <p style={{ textAlign:"center", marginTop:"13px" }}><span style={{ color:T.g600, fontSize:"13px", cursor:"pointer", fontWeight:"600" }} onClick={()=>setForgot(false)}>← Back to Login</span></p>
            </>
          )
        ) : (
          <>
            {mode==="signup" && <>
              <label style={S.label}>Full Name</label><input style={S.input} placeholder="Your full name" value={form.name} onChange={h("name")}/>
              <label style={S.label}>Phone (optional)</label><input style={S.input} placeholder="+91 98765 43210" value={form.phone} onChange={h("phone")}/>
              <label style={S.label}>Class</label>
              <select style={S.input} value={form.class} onChange={h("class")}><option>1st PU</option><option>2nd PU</option></select>
            </>}
            <label style={S.label}>{mode==="login" ? "Email / Username" : "Email Address"}</label>
            <input style={S.input} type="text" placeholder={mode==="login" ? "you@email.com" : "you@email.com"} value={form.email} onChange={h("email")}/>
            <label style={S.label}>Password</label>
            <input style={S.input} type="password" placeholder="••••••••" value={form.password} onChange={h("password")}/>
            {mode==="login" && <div style={{ textAlign:"right", marginTop:"-6px", marginBottom:"13px" }}><span onClick={()=>setForgot(true)} style={{ fontSize:"12px", color:T.g600, cursor:"pointer", fontWeight:"600" }}>Forgot password?</span></div>}
            <button onClick={submit} disabled={loading} style={{ ...S.btn, ...S.btnPrimary, opacity:loading?0.7:1 }}>
              {loading ? (mode==="login"?"Verifying…":"Creating account…") : mode==="login" ? "Login to BioVerse" : "Create Account"}
            </button>
            <p style={{ textAlign:"center", marginTop:"13px", fontSize:"13px", color:T.textLight }}>
              {mode==="login"?"New here? ":"Have an account? "}
              <span onClick={onToggle} style={{ color:T.g600, fontWeight:"700", cursor:"pointer" }}>{mode==="login"?"Create account":"Login"}</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Sidebar({ active, onNav, user, isMobile, open, onClose }) {
  const sections = [
    { label:null, items:[{ key:"dashboard", label:"Dashboard", icon:"home" }]},
    { label:"Study", items:[
      { key:"1stPU", label:"1st PU Biology", icon:"book" },
      { key:"2ndPU", label:"2nd PU Biology", icon:"book" },
      { key:"notes", label:"Notes", icon:"notes" },
      { key:"diagrams", label:"Diagram Center", icon:"image" },
      { key:"pyq", label:"PYQ Center", icon:"bookmark" },
    ]},
    { label:"Practice", items:[
      { key:"questions", label:"Question Bank", icon:"question" },
      { key:"tests", label:"Tests", icon:"test" },
      { key:"gameHub", label:"Game Hub", icon:"zap" },
    ]},
    { label:"Insights", items:[
      { key:"progress", label:"Progress", icon:"chart" },
      { key:"planner", label:"Study Planner", icon:"calendar" },
      { key:"kcet", label:"KCET Analyzer", icon:"target" },
      { key:"neet", label:"NEET Analyzer", icon:"brain" },
    ]},
    { label:"Account", items:[
      { key:"achievements", label:"Achievements", icon:"trophy" },
      { key:"profile", label:"Profile", icon:"user" },
    ]},
  ];
  const st = { ...S.sidebar, ...(isMobile?{ transform:open?"translateX(0)":"translateX(-100%)", boxShadow:open?"4px 0 24px rgba(0,0,0,0.28)":"none" }:{}) };
  return (
    <>
      {isMobile&&open&&<div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.48)", zIndex:99 }}/>}
      <div style={st}>
        <div style={{ padding:"22px 18px 16px", borderBottom:"1px solid rgba(255,255,255,0.09)", display:"flex", alignItems:"center", gap:11 }}>
          <span style={{ fontSize:"22px" }}>🧬</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:"#fff" }}>BioVerse</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.42)", marginTop:"1px" }}>Karnataka PU Biology</div>
          </div>
          {isMobile&&<button onClick={onClose} style={{ ...S.btn, ...S.btnGhost, padding:"4px", color:"#fff" }}><Icon name="close" size={17} color="#fff"/></button>}
        </div>

        {/* User mini-card */}
        <div style={{ padding:"13px 16px 11px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:"linear-gradient(135deg,#34D399,#10B981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"14px", fontWeight:"700", color:"#fff", flexShrink:0 }}>
              {user.name?.[0]?.toUpperCase()||"S"}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"12.5px", fontWeight:"600", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <div style={{ fontSize:"10.5px", color:"rgba(255,255,255,0.42)", marginTop:"1px" }}>{user.class||"1st PU"}</div>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"7px", marginTop:"9px" }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"7px", padding:"6px 9px", textAlign:"center" }}>
              <div style={{ fontSize:"13px", fontWeight:"700", color:"#fff" }}>🔥 {user.streak||12}</div>
              <div style={{ fontSize:"9.5px", color:"rgba(255,255,255,0.42)" }}>Streak</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"7px", padding:"6px 9px", textAlign:"center" }}>
              <div style={{ fontSize:"13px", fontWeight:"700", color:"#FCD34D" }}>⚡{(user.xp||2750).toLocaleString()}</div>
              <div style={{ fontSize:"9.5px", color:"rgba(255,255,255,0.42)" }}>XP</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"10px 9px", display:"flex", flexDirection:"column", gap:1 }}>
          {sections.map((sec,si)=>(
            <div key={si}>
              {sec.label&&<div style={S.navSection}>{sec.label}</div>}
              {sec.items.map(item=>(
                <button key={item.key} onClick={()=>{onNav(item.key);if(isMobile)onClose();}}
                  style={{ ...S.navItem, ...(active===item.key?S.navActive:{}) }}>
                  <Icon name={item.icon} size={15} color={active===item.key?"#fff":"rgba(255,255,255,0.6)"}/>
                  {item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding:"10px 9px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={()=>onNav("admin")} style={{ ...S.navItem, color:"rgba(255,255,255,0.42)", fontSize:"12px" }}>
            <Icon name="settings" size={14} color="rgba(255,255,255,0.38)"/> Admin Panel
          </button>
          <button onClick={()=>onNav("logout")} style={{ ...S.navItem, color:"rgba(255,100,100,0.72)" }}>
            <Icon name="logout" size={15} color="rgba(255,100,100,0.72)"/> Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────

function Dashboard({ user, onNav }) {
  const [stats, setStats] = useState({ videos:0, tests:0, questions:0, results:[] });
  const [results, setResults] = useState([]);
  const [units, setUnits] = useState([]);
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, u, s] = await Promise.all([
          sb.getResults(),
          sb.getUnits(),
          sb.getSubscription(),
        ]);
        setResults(Array.isArray(r) ? r.slice(0,5) : []);
        setUnits(Array.isArray(u) ? u.slice(0,4) : []);
        setSub(s);
      } catch(e) { console.error("Dashboard load error:", e); }
      setLoading(false);
    }
    load();
  }, []);

  const avgScore = results.length > 0 ? Math.round(results.reduce((s,r)=>s+Math.round((r.score/r.total)*100),0)/results.length) : 0;
  const isPremium = sub?.plan_name === "premium_yearly" || sub?.plan_name === "premium_monthly" || user?.subscription_plan !== "free";
  const userXP = user?.xp || 0;
  const userLevel = getUserLevel(userXP);
  const nextLevel = getNextLevel(userXP);
  const levelPct = nextLevel ? Math.round((userXP - userLevel.minXP)/(nextLevel.minXP - userLevel.minXP)*100) : 100;

  const statCards = [
    { label:"Study Streak", value:`${user?.streak||0} days`, icon:"🔥", grad:"linear-gradient(135deg,#F97316,#EF4444)" },
    { label:"Tests Taken",  value:results.length,            icon:"🧪", grad:"linear-gradient(135deg,#7C3AED,#6366F1)" },
    { label:"Avg Score",    value:results.length?`${avgScore}%`:"—", icon:"📊", grad:"linear-gradient(135deg,#0EA5E9,#2563EB)" },
    { label:"Total XP",     value:userXP.toLocaleString(),   icon:"⚡", grad:`linear-gradient(135deg,${T.g600},${T.g400})` },
  ];

  if (loading) return (
    <div style={{ ...S.page, textAlign:"center", paddingTop:"60px" }}>
      <div style={{ fontSize:"40px", marginBottom:"12px" }}>🧬</div>
      <div style={{ fontSize:"15px", color:T.textLight }}>Loading your dashboard…</div>
    </div>
  );

  return (
    <div style={S.page}>
      {/* Welcome */}
      <div style={{ ...S.flexBetween, marginBottom:"22px", flexWrap:"wrap", gap:"11px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>Welcome back, {user?.full_name?.split(" ")[0] || user?.name?.split(" ")[0] || "Student"} 👋</h1>
          <p style={S.sub}>
            {isPremium ? <span style={{ color:T.amber, fontWeight:"600" }}>👑 Premium</span> : <span style={{ color:T.textFaint }}>Free Plan</span>}
            {" · "}{userLevel.icon} {userLevel.title}
          </p>
        </div>
        <XPBadge xp={userXP}/>
      </div>

      {/* Level progress */}
      <div style={{ ...S.card, padding:"16px 20px", marginBottom:"20px", background:`linear-gradient(135deg,${userLevel.bg},#fff)`, border:`1.5px solid ${userLevel.color}30` }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"8px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:"28px" }}>{userLevel.icon}</span>
            <div>
              <div style={{ fontSize:"15px", fontWeight:"700", color:userLevel.color }}>{userLevel.title}</div>
              <div style={{ fontSize:"12px", color:T.textFaint }}>Level {userLevel.level}</div>
            </div>
          </div>
          {nextLevel && <div style={{ fontSize:"12.5px", color:T.textFaint }}>{(nextLevel.minXP - userXP).toLocaleString()} XP to {nextLevel.title}</div>}
        </div>
        <div style={S.pBar}><div style={S.pFill(levelPct, userLevel.color)}/></div>
        <div style={{ fontSize:"11.5px", color:T.textFaint, marginTop:"4px" }}>{userXP.toLocaleString()} / {(nextLevel?.minXP||userXP).toLocaleString()} XP</div>
      </div>

      {/* KPI cards */}
      <div style={{ ...S.grid4, marginBottom:"22px" }}>
        {statCards.map((s,i)=>(
          <div key={i} style={{ background:s.grad, borderRadius:"15px", padding:"17px", color:"#fff", position:"relative", overflow:"hidden" }}>
            <div style={{ position:"absolute", right:"-8px", top:"-8px", fontSize:"46px", opacity:0.1 }}>{s.icon}</div>
            <div style={{ fontSize:"22px", marginBottom:"5px" }}>{s.icon}</div>
            <div style={{ fontSize:"26px", fontWeight:"800" }}>{s.value}</div>
            <div style={{ fontSize:"11.5px", opacity:0.73, marginTop:"1px" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Upgrade banner for free users */}
      {!isPremium && (
        <div style={{ background:"linear-gradient(135deg,#7C3AED,#6D28D9)", borderRadius:"14px", padding:"16px 20px", marginBottom:"20px", display:"flex", alignItems:"center", gap:"14px" }}>
          <span style={{ fontSize:"28px" }}>👑</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"14px", fontWeight:"700", color:"#fff" }}>Upgrade to Premium — ₹999/year</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>Unlock all videos, notes, mock tests, KCET/NEET analytics, and AI Tutor</div>
          </div>
          <button onClick={()=>{
            Razorpay.openCheckout({ amount:999, name:"BioVerse", description:"Premium Yearly Plan", email:user?.email||"", onSuccess:()=>alert("Payment successful! Premium activated.") });
          }} style={{ ...S.btn, background:"#fff", color:"#7C3AED", fontWeight:"700", fontSize:"13px", padding:"9px 18px", flexShrink:0 }}>
            Upgrade Now
          </button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"18px" }}>
        {/* Courses */}
        <div>
          <h2 style={S.secTitle}>Your Courses</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
            {units.length > 0 ? units.slice(0,4).map((u,i)=>(
              <div key={u.id} onClick={()=>onNav(u.level==="1st PU"?"1stPU":"2ndPU")}
                style={{ ...S.card, cursor:"pointer", display:"flex", gap:"12px", alignItems:"center", padding:"14px 16px" }}
                onMouseEnter={e=>{e.currentTarget.style.borderColor=T.g400;e.currentTarget.style.transform="translateY(-1px)";}}
                onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:T.g50, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"19px", flexShrink:0 }}>{u.icon||"📚"}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"600" }}>{u.name}</div>
                  <div style={{ fontSize:"11.5px", color:T.textFaint }}>{u.level} · {u.chapters?.length||0} chapters</div>
                </div>
                <Icon name="arrow" size={13} color={T.textFaint}/>
              </div>
            )) : [
              { key:"1stPU", icon:"🌱", title:"1st PU Biology", sub:"19 chapters" },
              { key:"2ndPU", icon:"🧬", title:"2nd PU Biology", sub:"13 chapters" },
              { key:"kcet",  icon:"🎯", title:"KCET Preparation", sub:"Chapter-wise" },
              { key:"neet",  icon:"🏆", title:"NEET Preparation", sub:"Unit-wise" },
            ].map((c,i)=>(
              <div key={c.key} onClick={()=>onNav(c.key)}
                style={{ ...S.card, cursor:"pointer", display:"flex", gap:"12px", alignItems:"center", padding:"14px 16px" }}>
                <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:T.g50, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"19px" }}>{c.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"600" }}>{c.title}</div>
                  <div style={{ fontSize:"11.5px", color:T.textFaint }}>{c.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Results */}
        <div>
          <h2 style={S.secTitle}>Recent Test Results</h2>
          {results.length === 0 ? (
            <div style={{ ...S.card, textAlign:"center", padding:"32px 20px" }}>
              <div style={{ fontSize:"36px", marginBottom:"10px" }}>🧪</div>
              <div style={{ fontSize:"14px", fontWeight:"600", color:T.text }}>No tests taken yet</div>
              <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px" }}>Start a chapter test to see your results here</div>
              <button onClick={()=>onNav("tests")} style={{ ...S.btn, ...S.btnPrimary, marginTop:"14px", width:"auto", padding:"9px 20px", fontSize:"13px" }}>Browse Tests</button>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
              {results.map((r,i)=>{
                const pct = Math.round((r.score/r.total)*100);
                return (
                  <div key={r.id} style={{ ...S.card, padding:"13px 15px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                      <div style={{ fontSize:"13px", fontWeight:"600" }}>{r.tests?.title || "Test"}</div>
                      <div style={{ fontSize:"14px", fontWeight:"800", color: pct>=75?T.g400:pct>=50?"#F59E0B":"#EF4444" }}>{pct}%</div>
                    </div>
                    <div style={{ fontSize:"11.5px", color:T.textFaint, marginBottom:"7px" }}>
                      {r.score}/{r.total} correct · {r.tests?.chapters?.chapter_name || ""}
                    </div>
                    <div style={S.pBar}><div style={S.pFill(pct, pct>=75?T.g400:pct>=50?"#F59E0B":"#EF4444")}/></div>
                  </div>
                );
              })}
              <button onClick={()=>onNav("progress")} style={{ ...S.btn, background:T.g25, color:T.g600, border:`1px solid ${T.border}`, justifyContent:"center", fontSize:"12.5px" }}>
                View Full Progress →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── CONNECTED SYLLABUS VIEW ──────────────────────────────────────────────────
function SyllabusView({ level, onChapter }) {
  const [units, setUnits] = useState([]);
  const [progress, setProgress] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [loading, setLoading] = useState(true);
  const data = SYLLABUS[level]; // fallback colors/icon

  useEffect(() => {
    async function load() {
      try {
        const [u, p] = await Promise.all([
          sb.getUnits(level),
          sb.getProgress(),
        ]);
        setUnits(Array.isArray(u) ? u : []);
        setProgress(Array.isArray(p) ? p : []);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [level]);

  const getChapterPct = (chapterId) => {
    const rows = progress.filter(p=>p.chapter_id===chapterId);
    if(!rows.length) return 0;
    return Math.round(rows.reduce((s,r)=>s+(r.progress_percentage||0),0)/rows.length);
  };

  // Use DB units (real UUIDs) when available so video/notes queries work correctly.
  // Static SYLLABUS fallback chapters have no DB UUID — tag them so ChapterPage
  // shows an informational message instead of an empty video list.
  const displayUnits = units.length > 0
    ? units
    : (data?.units || []).map(u => ({
        ...u,
        chapters: (u.chapters || []).map(ch => ({
          ...ch,
          _staticFallback: true,   // no real DB id — content not yet seeded
        })),
      }));

  if (loading) return <div style={{ ...S.page, paddingTop:"40px", textAlign:"center", color:T.textFaint }}>Loading syllabus…</div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:11, marginBottom:"5px" }}>
          <span style={{ fontSize:"28px" }}>{data?.icon||"📚"}</span>
          <h1 style={S.h1}>{level} Biology</h1>
        </div>
        <p style={S.sub}>{displayUnits.reduce((a,u)=>(a+(u.chapters?.length||0)),0)} chapters · Karnataka PU Syllabus</p>
      </div>

      {displayUnits.map((unit,ui)=>{
        const chapters = unit.chapters || [];
        return (
          <div key={unit.id||ui} style={{ marginBottom:"11px" }}>
            <div onClick={()=>setExpanded(expanded===unit.id?null:unit.id)}
              style={{ ...S.card, cursor:"pointer", padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between",
                background:expanded===unit.id?T.g50:T.surface, borderColor:expanded===unit.id?T.g400:T.border }}>
              <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                <div style={{ width:"32px", height:"32px", borderRadius:"8px", background:`linear-gradient(135deg,${data?.color||T.g600},${data?.accent||T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:"700" }}>{ui+1}</div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"700" }}>{unit.name||unit.title}</div>
                  <div style={{ fontSize:"11.5px", color:T.textLight }}>{chapters.length} chapters</div>
                </div>
              </div>
              <span style={{ color:T.textFaint, fontSize:"15px", transition:"transform 0.2s", display:"inline-block", transform:expanded===unit.id?"rotate(180deg)":"none" }}>▾</span>
            </div>
            {expanded===unit.id && (
              <div style={{ marginTop:"5px", display:"flex", flexDirection:"column", gap:"5px", paddingLeft:"13px" }}>
                {chapters.map(ch=>{
                  const pct = getChapterPct(ch.id);
                  return (
                    <div key={ch.id} onClick={()=>onChapter(ch,level)}
                      style={{ ...S.card, padding:"13px 15px", cursor:"pointer", display:"flex", alignItems:"center", gap:"13px" }}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=data?.color||T.g600;e.currentTarget.style.transform="translateX(4px)";}}
                      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
                      <span style={{ fontSize:"17px" }}>📖</span>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"5px" }}>
                          <span style={{ fontSize:"13px", fontWeight:"600" }}>{ch.chapter_name||ch.title}</span>
                          <span style={{ fontSize:"11.5px", color:pct>=100?"#10B981":T.textFaint, fontWeight:"600" }}>{pct>=100?"✅":pct>0?`${pct}%`:"—"}</span>
                        </div>
                        <div style={S.pBar}><div style={S.pFill(pct)}/></div>
                      </div>
                      <Icon name="arrow" size={13} color={T.textFaint}/>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── CONNECTED CHAPTER PAGE ───────────────────────────────────────────────────
function ChapterPage({ chapter, level, onBack }) {
  const [tab, setTab] = useState("videos");
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [tests, setTests] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  const chapterId = chapter?.id;
  const chapterName = chapter?.chapter_name || chapter?.title || "";
  const isStaticFallback = chapter?._staticFallback === true;

  useEffect(() => {
    // If this chapter came from the static SYLLABUS fallback (no real DB UUID),
    // show an info message instead of firing queries that will return nothing.
    if (isStaticFallback) { setLoading(false); return; }
    if (!chapterId) { setLoading(false); return; }

    setLoading(true);
    setVideos([]); setNotes([]); setQuestions([]); setTests([]);

    async function load() {
      try {
        const [v, n, q, t, p] = await Promise.all([
          sb.getVideos(chapterId),
          sb.getNotes(chapterId),
          sb.getQuestions(chapterId),
          sb.getTests(chapterId),
          sb.getProgress(chapterId),
        ]);
        setVideos(Array.isArray(v) ? v : []);
        setNotes(Array.isArray(n) ? n : []);
        setQuestions(Array.isArray(q) ? q : []);
        setTests(Array.isArray(t) ? t : []);
        const pRows = Array.isArray(p) ? p : [];
        const pct = pRows.length ? Math.round(pRows.reduce((s,r)=>s+(r.progress_percentage||0),0)/pRows.length) : 0;
        setProgress({ pct, rows: pRows });
      } catch(e) { console.error("ChapterPage load error:", e); }
      setLoading(false);
    }
    load();
  }, [chapterId, isStaticFallback]);

  const markVideoComplete = async (videoId) => {
    await sb.upsertProgress({ chapter_id: chapterId, concept_id: null, video_completed: true, progress_percentage: Math.min((progress?.pct||0)+20, 100) });
    await sb._patch("videos", `id=eq.${videoId}`, { view_count: (videos.find(v=>v.id===videoId)?.view_count||0)+1 });
  };

  const tabs = [{key:"videos",label:"🎥 Videos"},{key:"notes",label:"📝 Notes"},{key:"questions",label:"❓ Questions"},{key:"test",label:"🧪 Tests"}];

  const refreshChapter = () => {
    if (!chapterId || isStaticFallback) return;
    setLoading(true);
    setVideos([]); setNotes([]); setQuestions([]); setTests([]);
    Promise.all([
      sb.getVideos(chapterId),
      sb.getNotes(chapterId),
      sb.getQuestions(chapterId),
      sb.getTests(chapterId),
    ]).then(([v,n,q,t]) => {
      setVideos(Array.isArray(v)?v:[]);
      setNotes(Array.isArray(n)?n:[]);
      setQuestions(Array.isArray(q)?q:[]);
      setTests(Array.isArray(t)?t:[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  if (loading) return <div style={{ ...S.page, paddingTop:"40px", textAlign:"center", color:T.textFaint }}>Loading chapter…</div>;

  // Static fallback — chapter not in DB yet
  if (isStaticFallback) return (
    <div style={S.page}>
      <button onClick={onBack} style={{ ...S.btn, ...S.btnGhost, padding:"6px 0", marginBottom:"13px", fontSize:"13px", color:T.textLight }}>← Back</button>
      <div style={{ ...S.card, textAlign:"center", padding:"48px 32px" }}>
        <div style={{ fontSize:"48px", marginBottom:"14px" }}>📡</div>
        <div style={{ fontSize:"16px", fontWeight:"700", color:T.text, marginBottom:"8px" }}>Content coming soon for "{chapterName}"</div>
        <div style={{ fontSize:"13.5px", color:T.textLight, lineHeight:"1.6", maxWidth:"400px", margin:"0 auto 20px" }}>
          The Super Admin hasn't linked this chapter to the database yet.
          Once chapters are seeded in the Admin → Content CMS, videos, notes, and questions will appear here automatically.
        </div>
        <div style={{ background:T.g25, borderRadius:"11px", padding:"13px 16px", display:"inline-flex", gap:9, alignItems:"center", fontSize:"13px", color:T.g600 }}>
          <span>💡</span> Ask your admin to run the Content CMS seed or add this chapter via Admin Panel.
        </div>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <button onClick={onBack} style={{ ...S.btn, ...S.btnGhost, padding:"6px 0", marginBottom:"13px", fontSize:"13px", color:T.textLight }}>← Back</button>
      <div style={{ background:`linear-gradient(135deg,${T.g600},${T.g700})`, borderRadius:"16px", padding:"20px 24px", marginBottom:"20px" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"9px" }}>
          <h1 style={{ ...S.h2, color:"#fff", margin:0 }}>{chapterName}</h1>
          <span style={S.badge("#34D399","rgba(52,211,153,0.15)")}>{level}</span>
        </div>
        <div style={{ display:"flex", gap:16, marginBottom:"12px" }}>
          {[`🎥 ${videos.length} videos`,`📝 ${notes.length} notes`,`❓ ${questions.length} questions`].map((t,i)=>(
            <span key={i} style={{ color:"rgba(255,255,255,0.62)", fontSize:"12px" }}>{t}</span>
          ))}
        </div>
        <div style={{ height:"5px", background:"rgba(255,255,255,0.17)", borderRadius:"99px" }}>
          <div style={{ height:"100%", width:`${progress?.pct||0}%`, background:"#34D399", borderRadius:"99px" }}/>
        </div>
        <div style={{ color:"rgba(255,255,255,0.52)", fontSize:"11px", marginTop:"4px" }}>{progress?.pct||0}% complete</div>
      </div>
      <div style={{ display:"flex", gap:"7px", marginBottom:"18px", flexWrap:"wrap" }}>
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ ...S.btn, ...S.btnSm, background:tab===t.key?T.g600:"#fff", color:tab===t.key?"#fff":T.textMid, border:`1.5px solid ${tab===t.key?T.g600:T.border}` }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab==="videos" && <ConnectedVideosTab videos={videos} onComplete={markVideoComplete} onRefresh={refreshChapter}/>}
      {tab==="notes" && <ConnectedNotesTab notes={notes} chapterName={chapterName}/>}
      {tab==="questions" && <ConnectedQuestionsTab questions={questions}/>}
      {tab==="test" && <ConnectedTestsTab tests={tests} chapterId={chapterId}/>}
    </div>
  );
}

function ConnectedVideosTab({ videos, onComplete, onRefresh }) {
  const [playing, setPlaying] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [speed, setSpeed] = useState(1);

  if (videos.length === 0) return (
    <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
      <div style={{ fontSize:"36px", marginBottom:"10px" }}>🎥</div>
      <div style={{ fontSize:"14px", fontWeight:"600", color:T.text }}>No videos yet</div>
      <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px", marginBottom:"14px" }}>
        Videos for this chapter will appear here once uploaded by the admin
      </div>
      {onRefresh && (
        <button onClick={onRefresh}
          style={{ ...S.btn, ...S.btnOutline, ...S.btnSm, margin:"0 auto" }}>
          🔄 Refresh
        </button>
      )}
    </div>
  );

  const getYoutubeId = (url) => {
    const m = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : null;
  };

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
        <h2 style={S.secTitle}>Video Lectures</h2>
        <div style={{ display:"flex", gap:9, alignItems:"center" }}>
          <span style={{ fontSize:"12px", color:T.textFaint }}>{completed.length}/{videos.length} watched</span>
          {onRefresh && (
            <button onClick={onRefresh}
              style={{ ...S.btn, ...S.btnSm, background:T.g25, color:T.g600, border:`1px solid ${T.border}`, fontSize:"11.5px", padding:"5px 11px" }}>
              🔄 Refresh
            </button>
          )}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"13px" }}>
        {videos.map(v=>{
          const ytId = getYoutubeId(v.youtube_url||"");
          return (
            <div key={v.id} style={S.card}>
              {playing===v.id ? (
                <div>
                  <div style={{ borderRadius:"11px", overflow:"hidden", aspectRatio:"16/9", background:"#000" }}>
                    <iframe width="100%" height="100%" src={`https://www.youtube.com/embed/${ytId}?autoplay=1`}
                      frameBorder="0" allow="autoplay; fullscreen" allowFullScreen title={v.title} style={{ display:"block" }}/>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:"11px", flexWrap:"wrap" }}>
                    <span style={{ fontSize:"12.5px", color:T.textLight }}>Speed:</span>
                    {[0.75,1,1.25,1.5,2].map(s=>(
                      <button key={s} onClick={()=>setSpeed(s)}
                        style={{ ...S.btn, ...S.btnSm, padding:"4px 9px", fontSize:"11.5px", background:speed===s?T.g600:"#F3F4F6", color:speed===s?"#fff":T.textMid, border:"none" }}>
                        {s}×
                      </button>
                    ))}
                    <button onClick={()=>{setCompleted(c=>[...new Set([...c,v.id])]);setPlaying(null);onComplete(v.id);}}
                      style={{ ...S.btn, ...S.btnSm, background:T.g50, color:T.g600, marginLeft:"auto", fontSize:"12px", padding:"5px 11px" }}>
                      ✓ Mark Complete
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display:"flex", gap:"13px", alignItems:"center" }}>
                  <div onClick={()=>setPlaying(v.id)} style={{ width:"130px", height:"75px", borderRadius:"9px", overflow:"hidden", flexShrink:0, cursor:"pointer", position:"relative",
                    backgroundImage:ytId?`url(https://img.youtube.com/vi/${ytId}/mqdefault.jpg)`:"none",
                    backgroundSize:"cover", backgroundPosition:"center", background: ytId?"#000":T.g25 }}>
                    <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,0.33)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"rgba(255,255,255,0.9)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Icon name="play" size={13} color={T.g600}/>
                      </div>
                    </div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"3px" }}>
                      <div style={{ fontSize:"14px", fontWeight:"600" }}>{v.title}</div>
                      {completed.includes(v.id) && <span style={S.badge(T.g400,T.g50)}>✓ Done</span>}
                    </div>
                    {v.duration && <div style={{ fontSize:"12px", color:T.textFaint }}>⏱ {v.duration}</div>}
                    {v.description && <div style={{ fontSize:"12px", color:T.textLight, marginTop:"3px" }}>{v.description.slice(0,80)}…</div>}
                    <div style={{ display:"flex", gap:7, marginTop:"7px" }}>
                      <button onClick={()=>setPlaying(v.id)} style={{ ...S.btn, ...S.btnSm, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff", fontSize:"11.5px" }}>
                        <Icon name="play" size={11} color="#fff"/> Watch
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectedNotesTab({ notes, chapterName }) {
  if (notes.length === 0) return (
    <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
      <div style={{ fontSize:"36px", marginBottom:"10px" }}>📝</div>
      <div style={{ fontSize:"14px", fontWeight:"600", color:T.text }}>No notes uploaded yet</div>
      <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px" }}>Notes for this chapter will appear here once uploaded by admin</div>
    </div>
  );
  return (
    <div>
      <h2 style={S.secTitle}>Study Notes</h2>
      <div style={S.grid2}>
        {notes.map(n=>(
          <div key={n.id} style={S.card}>
            <div style={{ fontSize:"24px", marginBottom:"10px" }}>📄</div>
            <div style={{ fontSize:"14.5px", fontWeight:"700", marginBottom:"3px" }}>{n.title}</div>
            <div style={{ fontSize:"12px", color:T.textLight, marginBottom:"9px" }}>
              {n.note_type || "PDF"} · {n.download_count||0} downloads
            </div>
            {n.content && <div style={{ fontSize:"12.5px", color:T.textMid, lineHeight:"1.5", marginBottom:"10px" }}>{n.content.slice(0,120)}…</div>}
            {n.pdf_url && (
              <a href={n.pdf_url} target="_blank" rel="noopener noreferrer"
                style={{ ...S.btn, background:T.g25, color:T.g600, border:`1px solid ${T.g200}`, fontSize:"12.5px", display:"inline-flex", textDecoration:"none", padding:"7px 13px" }}>
                📥 Download PDF
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ConnectedQuestionsTab({ questions }) {
  const [filter, setFilter] = useState("All");
  const [shown, setShown] = useState({});

  const filtered = filter==="All" ? questions : questions.filter(q=>q.exam_type===filter);
  const optionKeys = ["A","B","C","D"];

  if (questions.length === 0) return (
    <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
      <div style={{ fontSize:"36px", marginBottom:"10px" }}>❓</div>
      <div style={{ fontSize:"14px", fontWeight:"600", color:T.text }}>No questions yet</div>
      <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px" }}>Questions for this chapter will appear here once added by admin</div>
    </div>
  );

  return (
    <div>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"14px" }}>
        <h2 style={S.secTitle}>Questions ({filtered.length})</h2>
        <div style={{ display:"flex", gap:6 }}>
          {["All","PU","KCET","NEET"].map(f=>(
            <button key={f} onClick={()=>setFilter(f)}
              style={{ ...S.btn, ...S.btnSm, background:filter===f?T.g600:"#fff", color:filter===f?"#fff":T.textMid, border:`1.5px solid ${filter===f?T.g600:T.border}`, fontSize:"12px" }}>{f}</button>
          ))}
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
        {filtered.map((q,qi)=>{
          const correctIdx = optionKeys.indexOf(q.correct_answer);
          const opts = [q.option_a,q.option_b,q.option_c,q.option_d];
          return (
            <div key={q.id} style={S.card}>
              <div style={{ display:"flex", gap:7, marginBottom:"9px" }}>
                <span style={{ fontSize:"12px", fontWeight:"700", color:T.textFaint }}>Q{qi+1}.</span>
                <span style={S.tag(q.exam_type)}>{q.exam_type}</span>
                <span style={S.tag(q.difficulty)}>{q.difficulty}</span>
                {q.year && <span style={S.badge(T.textFaint,"#F3F4F6")}>{q.year}</span>}
              </div>
              <p style={{ fontSize:"14px", fontWeight:"500", marginBottom:"11px", lineHeight:"1.55" }}>{q.question}</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"11px" }}>
                {opts.map((opt,oi)=>{
                  const rev=shown[q.id], ok=oi===correctIdx;
                  return (
                    <div key={oi} style={{ padding:"8px 12px", borderRadius:"8px", border:`1.5px solid ${rev?(ok?"#10B981":T.border):T.border}`, background:rev?(ok?T.g50:"#F9FAFB"):"#F9FAFB", fontSize:"13px", display:"flex", gap:6 }}>
                      <span style={{ fontWeight:"700", color:T.textFaint }}>{optionKeys[oi]}.</span>{opt}
                      {rev&&ok&&<span style={{ marginLeft:"auto", color:T.g400, fontWeight:"700" }}>✓</span>}
                    </div>
                  );
                })}
              </div>
              {shown[q.id]&&q.explanation&&<div style={{ background:T.g50, borderRadius:"8px", padding:"10px 12px", marginBottom:"9px", fontSize:"13px", color:T.g700 }}>💡 {q.explanation}</div>}
              <button onClick={()=>setShown(s=>({...s,[q.id]:!s[q.id]}))} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>
                {shown[q.id]?"Hide Answer":"Show Answer"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ConnectedTestsTab({ tests, chapterId }) {
  const [activeTest, setActiveTest] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loadingTest, setLoadingTest] = useState(false);

  useEffect(()=>{
    if(!activeTest)return;
    const t=setInterval(()=>setTimeLeft(tl=>tl>0?tl-1:0),1000);
    return()=>clearInterval(t);
  },[activeTest]);

  const startTest = async (test) => {
    setLoadingTest(true);
    try {
      // Get questions for this chapter that match this test
      const qs = await sb.getQuestions(chapterId);
      const selected = Array.isArray(qs) ? qs.slice(0, test.total_questions) : [];
      setTestQuestions(selected);
      setActiveTest(test);
      setAnswers({});
      setSubmitted(false);
      setTimeLeft(test.time_limit * 60);
    } catch(e) { alert("Failed to load test questions."); }
    setLoadingTest(false);
  };

  const submitTest = async () => {
    const optionKeys = ["A","B","C","D"];
    const score = testQuestions.filter(q=>answers[q.id]===optionKeys.indexOf(q.correct_answer)).length;
    const accuracy = Math.round((score/testQuestions.length)*100);
    await sb.submitResult({ test_id:activeTest.id, score, total:testQuestions.length, accuracy, time_taken:(activeTest.time_limit*60)-timeLeft, answers });
    await sb._patch("tests",`id=eq.${activeTest.id}`,{ attempt_count:(activeTest.attempt_count||0)+1 });
    setSubmitted(true);
  };

  if (tests.length === 0) return (
    <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
      <div style={{ fontSize:"36px", marginBottom:"10px" }}>🧪</div>
      <div style={{ fontSize:"14px", fontWeight:"600", color:T.text }}>No tests available</div>
      <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px" }}>Tests for this chapter will appear once created by admin</div>
    </div>
  );

  if (!activeTest) return (
    <div>
      <h2 style={S.secTitle}>Available Tests</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {tests.map(t=>(
          <div key={t.id} style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:T.g25, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px" }}>🧪</div>
              <div>
                <div style={{ fontSize:"14px", fontWeight:"600" }}>{t.title}</div>
                <div style={{ fontSize:"12px", color:T.textFaint }}>❓ {t.total_questions} Qs · ⏱ {t.time_limit} min · {t.difficulty}</div>
              </div>
            </div>
            <button onClick={()=>startTest(t)} disabled={loadingTest}
              style={{ ...S.btn, ...S.btnSm, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff" }}>
              {loadingTest?"Loading…":"Start Test"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    const score = testQuestions.filter(q=>answers[q.id]===["A","B","C","D"].indexOf(q.correct_answer)).length;
    const pct = Math.round(score/testQuestions.length*100);
    return (
      <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
        <div style={{ fontSize:"52px", marginBottom:"12px" }}>{pct>=80?"🏆":pct>=60?"😊":"📚"}</div>
        <div style={{ fontSize:"40px", fontWeight:"900", color:pct>=80?T.g400:pct>=60?"#F59E0B":"#EF4444" }}>{score}/{testQuestions.length}</div>
        <div style={{ fontSize:"16px", color:T.textMid, marginTop:"6px" }}>{pct}% accuracy</div>
        <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"4px" }}>Result saved to your progress!</div>
        <button onClick={()=>setActiveTest(null)} style={{ ...S.btn, ...S.btnPrimary, marginTop:"20px", width:"auto", padding:"11px 28px" }}>Back to Tests</button>
      </div>
    );
  }

  const m=Math.floor(timeLeft/60), sec=timeLeft%60;
  return (
    <div>
      <div style={{ ...S.card, background:`linear-gradient(135deg,${T.g600},${T.g700})`, padding:"14px 18px", marginBottom:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ color:"#fff", fontWeight:"700" }}>🧪 {activeTest.title}</span>
          <span style={{ color:timeLeft<60?"#FCA5A5":"#34D399", fontWeight:"800" }}>{m}:{sec.toString().padStart(2,"0")}</span>
        </div>
        <div style={{ height:"4px", background:"rgba(255,255,255,0.2)", borderRadius:"99px", marginTop:"9px" }}>
          <div style={{ height:"100%", width:`${Object.keys(answers).length/testQuestions.length*100}%`, background:"#34D399", borderRadius:"99px" }}/>
        </div>
      </div>
      {testQuestions.map((q,qi)=>(
        <div key={q.id} style={{ ...S.card, marginBottom:"12px" }}>
          <p style={{ fontSize:"14px", fontWeight:"600", marginBottom:"11px" }}><span style={{ color:T.textFaint,marginRight:"6px" }}>Q{qi+1}.</span>{q.question}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {[q.option_a,q.option_b,q.option_c,q.option_d].map((opt,oi)=>(
              <div key={oi} onClick={()=>setAnswers(a=>({...a,[q.id]:oi}))}
                style={{ padding:"8px 12px", borderRadius:"8px", border:`2px solid ${answers[q.id]===oi?T.g600:T.border}`, background:answers[q.id]===oi?T.g50:"#F9FAFB", cursor:"pointer", fontSize:"13px", display:"flex", gap:6, transition:"all 0.14s" }}>
                <span style={{ fontWeight:"700", color:answers[q.id]===oi?T.g600:T.textFaint }}>{["A","B","C","D"][oi]}.</span>{opt}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={submitTest} disabled={Object.keys(answers).length<testQuestions.length}
        style={{ ...S.btn, ...S.btnPrimary, padding:"12px 26px", width:"auto", opacity:Object.keys(answers).length<testQuestions.length?0.5:1 }}>
        Submit ({Object.keys(answers).length}/{testQuestions.length})
      </button>
    </div>
  );
}
// ─── SHARED QUIZ ENGINE (used by all 4 game modes) ─────────────────────────

const MODE_META = {
  daily_challenge: { label: "Daily Challenge", icon: "📅", color: T.g600,  timed: false },
  speed_quiz:      { label: "Speed Quiz",      icon: "⚡", color: T.amber, timed: true  },
  topic_battle:    { label: "Topic Battle",    icon: "⚔️", color: T.purple,timed: false },
  practice_arena:  { label: "Practice Arena",  icon: "🎯", color: T.blue,  timed: false },
};

function QuizPlayer({ mode, chapterId, chapterName, numQuestions, onExit, onFinished }) {
  const meta = MODE_META[mode];
  const [phase, setPhase] = useState("loading"); // loading | playing | submitting | results | error
  const [session, setSession] = useState(null);   // { session_id, questions: [...] }
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(60);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const load = () => {
    setPhase("loading"); setError(""); setIdx(0); setAnswers({}); setTimeLeft(60);
    sb.startGameSession(mode, chapterId, numQuestions || 10).then(rows => {
      if (!Array.isArray(rows) || rows.length === 0) throw new Error("No questions available for this selection.");
      // start_game_session returns rows shaped as:
      // { session_id, question_id, question, option_a..d, exam_type, difficulty }
      // Normalize question_id -> id explicitly here, once, so the rest
      // of this component has one consistent field to use. Also guard
      // against a row missing it entirely rather than silently
      // producing an "undefined" answer key later.
      const questions = rows.map(row => {
        if (!row.question_id) throw new Error("Server returned a question with no question_id.");
        return { ...row, id: row.question_id };
      });
      setSession({ session_id: rows[0].session_id, questions });
      setPhase("playing");
    }).catch(e => { setError(e.message || "Could not start this game."); setPhase("error"); });
  };
  useEffect(load, [mode, chapterId]);

  // Speed Quiz countdown
  useEffect(() => {
    if (phase !== "playing" || !meta.timed) return;
    if (timeLeft <= 0) { finish(); return; }
    const t = setTimeout(() => setTimeLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft, meta.timed]);

  const select = (qid, letter) => {
    if (!qid) throw new Error("Cannot record answer: question ID is undefined");
    setAnswers(a => ({ ...a, [qid]: letter }));
  };
  // Mirror of `answers` that's always synchronously current — closures
  // (like the Speed Quiz timer's setTimeout below) read this instead of
  // the `answers` state variable, so there is no possible window where
  // submission happens against a stale snapshot.
  const answersRef = useRef({});
  useEffect(() => { answersRef.current = answers; }, [answers]);

  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const finish = async () => {
    setPhase("submitting");
    const finalAnswers = answersRef.current;

    // Guard: every key going to the server must be a real question UUID,
    // never the literal string "undefined" — this is exactly the bug
    // that was happening before, so it's checked explicitly rather than
    // trusted.
    const badKeys = Object.keys(finalAnswers).filter(k => !UUID_RE.test(k));
    if (badKeys.length > 0) {
      const msg = `Cannot submit answer: question ID is undefined (bad keys: ${JSON.stringify(badKeys)})`;
      // eslint-disable-next-line no-console
      console.error("[QuizPlayer]", msg, finalAnswers);
      setError(msg);
      setPhase("error");
      return;
    }

    // eslint-disable-next-line no-console
    console.log("[QuizPlayer] submitting answers for session", session.session_id, finalAnswers);
    try {
      // submit_game_session is a `returns table(...)` Postgres function —
      // PostgREST always wraps that as a JSON array, even for one row.
      // Normalize explicitly rather than assuming the shape.
      const submitRaw = await sb.submitGameSession(session.session_id, finalAnswers);
      // eslint-disable-next-line no-console
      console.log("submit_game_session result:", submitRaw);
      const submitResult = Array.isArray(submitRaw) ? (submitRaw[0] || {}) : (submitRaw && typeof submitRaw === "object" ? submitRaw : {});

      const awardRaw = await sb.awardXp(session.session_id);
      // eslint-disable-next-line no-console
      console.log("award_xp result:", awardRaw);
      const awardResult = Array.isArray(awardRaw) ? (awardRaw[0] || {}) : (awardRaw && typeof awardRaw === "object" ? awardRaw : {});

      // Read exactly the fields the RPCs actually return — no fallback
      // to 0 here; if a field is genuinely missing the UI will show
      // "undefined" rather than silently pretending it's zero, so a
      // real mismatch stays visible instead of being hidden.
      const finalResult = {
        correct_answers: submitResult.correct_answers,
        total_questions: submitResult.total_questions,
        xp_earned: submitResult.xp_earned,
        new_xp: awardResult.new_xp,
        new_streak: awardResult.new_streak,
        xp_granted: awardResult.xp_granted,
      };
      setResult(finalResult);
      setPhase("results");
      onFinished && onFinished({ mode, chapterId, ...finalResult });
    } catch (e) {
      setError(e.message || "Could not submit your answers.");
      setPhase("error");
    }
  };

  if (phase === "loading") return <div style={{ ...S.card, textAlign:"center", padding:"50px" }}>Loading questions…</div>;

  if (phase === "error") return (
    <div style={{ ...S.card, textAlign:"center", padding:"36px" }}>
      <div style={{ color:T.red, fontWeight:700, marginBottom:14 }}>{error}</div>
      <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
        <button onClick={load} style={{ ...S.btn, ...S.btnPrimary }}>Try Again</button>
        <button onClick={onExit} style={{ ...S.btn, ...S.btnOutline }}>Back to Game Hub</button>
      </div>
    </div>
  );

  if (phase === "results") {
    const accuracy = result.total_questions ? Math.round((result.correct_answers / result.total_questions) * 100) : 0;
    return (
      <div style={{ ...S.card, textAlign:"center", padding:"36px" }}>
        <div style={{ fontSize:44, marginBottom:6 }}>{accuracy >= 80 ? "🏆" : accuracy >= 50 ? "🎉" : "📚"}</div>
        <h2 style={{ margin:"0 0 4px", color:T.text }}>{meta.label} Complete!</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:10, margin:"22px 0", textAlign:"left" }}>
          {[
            ["Score", `${result.correct_answers}/${result.total_questions}`],
            ["Accuracy", `${accuracy}%`],
            ["XP Earned", `+${result.xp_granted ?? result.xp_earned ?? 0}`],
            ["New Total XP", result.new_xp ?? "—"],
            ["Current Streak", `🔥 ${result.new_streak ?? "—"} days`],
          ].map(([l,v]) => (
            <div key={l} style={{ background:T.g25, borderRadius:10, padding:"12px 14px" }}>
              <div style={{ fontSize:11, color:T.textFaint, fontWeight:700, textTransform:"uppercase" }}>{l}</div>
              <div style={{ fontSize:20, fontWeight:800, color:T.g700 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ display:"flex", gap:8, justifyContent:"center" }}>
          <button onClick={load} style={{ ...S.btn, ...S.btnPrimary }}>Play Again</button>
          <button onClick={onExit} style={{ ...S.btn, ...S.btnOutline }}>Back to Game Hub</button>
        </div>
      </div>
    );
  }

  // playing / submitting
  const q = session.questions[idx];
  const isLast = idx === session.questions.length - 1;
  const options = [["A", q.option_a], ["B", q.option_b], ["C", q.option_c], ["D", q.option_d]];

  return (
    <div style={{ ...S.card, padding:"26px" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
        <div style={{ fontSize:13, fontWeight:700, color:T.textLight }}>
          {meta.icon} {meta.label}{chapterName ? ` · ${chapterName}` : ""} — Question {idx+1} of {session.questions.length}
        </div>
        {meta.timed && <div style={{ fontSize:14, fontWeight:800, color: timeLeft <= 10 ? T.red : T.amber }}>⏱ {timeLeft}s</div>}
      </div>
      <div style={{ height:6, background:T.g100, borderRadius:3, marginBottom:20 }}>
        <div style={{ height:"100%", width:`${((idx)/session.questions.length)*100}%`, background:T.g500, borderRadius:3 }}/>
      </div>
      <div style={{ fontSize:17, fontWeight:700, color:T.text, marginBottom:18 }}>{q.question}</div>
      <div style={{ display:"grid", gap:10, marginBottom:22 }}>
        {options.map(([letter, text]) => (
          <button key={letter} onClick={()=>select(q.id, letter)}
            style={{
              textAlign:"left", padding:"13px 16px", borderRadius:10, cursor:"pointer",
              border: answers[q.id]===letter ? `2px solid ${T.g600}` : `1.5px solid ${T.border}`,
              background: answers[q.id]===letter ? T.g25 : "#fff",
              fontSize:14, fontWeight: answers[q.id]===letter ? 700 : 500, color:T.text,
            }}>
            <span style={{ fontWeight:800, color:T.g600, marginRight:8 }}>{letter}.</span>{text}
          </button>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"flex-end" }}>
        <button
          disabled={!answers[q.id] || phase==="submitting"}
          onClick={()=> isLast ? finish() : setIdx(i=>i+1)}
          style={{ ...S.btn, ...S.btnPrimary, opacity: (!answers[q.id]||phase==="submitting") ? 0.5 : 1 }}>
          {phase==="submitting" ? "Submitting…" : isLast ? "Finish" : "Next →"}
        </button>
      </div>
    </div>
  );
}

// ─── GAME HUB ───────────────────────────────────────────────────────────────

function AchievementBadgeGrid({ achievements, unlockedIds, compact }) {
  return (
    <div style={{ display:"grid", gridTemplateColumns: compact ? "repeat(auto-fill,minmax(130px,1fr))" : "repeat(auto-fill,minmax(180px,1fr))", gap:12 }}>
      {achievements.map(a => {
        const unlocked = unlockedIds.has(a.id);
        return (
          <div key={a.id} style={{
            background: unlocked ? T.g25 : "#F3F4F6", border:`1.5px solid ${unlocked?T.g300:T.border}`,
            borderRadius:12, padding:"14px", textAlign:"center", opacity: unlocked ? 1 : 0.55,
          }}>
            <div style={{ fontSize:28, marginBottom:6, filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon || "🏅"}</div>
            <div style={{ fontSize:12.5, fontWeight:700, color:T.text }}>{a.title}</div>
            {!compact && <div style={{ fontSize:11, color:T.textFaint, marginTop:3 }}>{a.description}</div>}
            <div style={{ fontSize:11, fontWeight:700, color: unlocked ? T.g600 : T.textFaint, marginTop:5 }}>
              {unlocked ? "✓ Unlocked" : `🔒 +${a.xp_reward} XP`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function GameHub({ user, onNav }) {
  const [view, setView] = useState("hub");          // hub | pickChapter | pickCount | playing
  const [pendingMode, setPendingMode] = useState(null);
  const [pendingChapter, setPendingChapter] = useState(null);
  const [active, setActive] = useState(null);        // { mode, chapterId, chapterName, numQuestions }
  const [chapters, setChapters] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [leaderboard, setLeaderboard] = useState([]);
  const [rank, setRank] = useState(null);
  const [xp, setXp] = useState(user?.xp || 0);
  const [streak, setStreak] = useState(user?.streak || 0);
  const [toast, setToast] = useState("");

  useEffect(() => {
    sb.getAchievements().then(setAchievements);
    sb.getUserAchievements().then(rows => setUnlockedIds(new Set((rows||[]).map(r=>r.achievement_id))));
    sb.getLeaderboard(10).then(setLeaderboard);
    sb.getMyRank().then(setRank);
  }, []);

  const openMode = (mode) => {
    if (mode === "topic_battle" || mode === "practice_arena") {
      setPendingMode(mode);
      if (chapters.length === 0) sb.getAllChapters().then(setChapters);
      setView("pickChapter");
    } else {
      // Daily Challenge / Speed Quiz — unchanged, always 10 questions.
      setActive({ mode, chapterId: null, chapterName: null, numQuestions: 10 });
      setView("playing");
    }
  };

  const pickChapter = (chapter) => {
    if (pendingMode === "practice_arena") {
      // Practice Arena only: ask how many questions before starting.
      // Topic Battle is untouched — still goes straight to playing at 10.
      setPendingChapter(chapter);
      setView("pickCount");
    } else {
      setActive({ mode: pendingMode, chapterId: chapter.id, chapterName: chapter.chapter_name, numQuestions: 10 });
      setView("playing");
    }
  };

  const pickCount = (count) => {
    // "All Available" requests the safe maximum (50); start_game_session
    // itself returns min(available, requested) — so this naturally
    // becomes "however many exist, up to 50" with no separate count query.
    setActive({ mode: "practice_arena", chapterId: pendingChapter.id, chapterName: pendingChapter.chapter_name, numQuestions: count });
    setView("playing");
  };

  const backToHub = () => {
    setView("hub");
    sb.getLeaderboard(10).then(setLeaderboard);
    sb.getMyRank().then(setRank);
    sb.getUserAchievements().then(rows => setUnlockedIds(new Set((rows||[]).map(r=>r.achievement_id))));
  };

  const onGameFinished = async (info) => {
    setXp(info.new_xp ?? xp);
    setStreak(info.new_streak ?? streak);
    const candidates = ["first_challenge", "streak_7", "top_10"];
    if (info.mode === "speed_quiz") candidates.push("speed_demon");
    if (info.mode === "topic_battle" || info.mode === "practice_arena") candidates.push("bio_explorer");
    for (const code of candidates) {
      try {
        const r = await sb.unlockAchievement(code);
        if (r && r.unlocked) { setToast(`🎉 Achievement unlocked: ${code.replace(/_/g," ")} (+${r.xp_granted} XP)`); setTimeout(()=>setToast(""), 4000); }
      } catch {}
    }
  };

  if (view === "playing") {
    return <QuizPlayer mode={active.mode} chapterId={active.chapterId} chapterName={active.chapterName} numQuestions={active.numQuestions}
      onExit={backToHub} onFinished={onGameFinished} />;
  }

  if (view === "pickCount") {
    return (
      <div style={S.page}>
        <button onClick={()=>setView("pickChapter")} style={{ ...S.btn, ...S.btnOutline, marginBottom:16 }}>← Back</button>
        <h2 style={{ color:T.text }}>How many questions? — {pendingChapter?.chapter_name}</h2>
        <p style={{ color:T.textLight, marginTop:4 }}>Practice Arena has no time pressure — pick whatever amount suits your session.</p>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:12, marginTop:18, maxWidth:640 }}>
          {[10, 20, 30, "all"].map(opt => (
            <button key={opt} onClick={()=>pickCount(opt === "all" ? 50 : opt)}
              style={{ padding:"22px 16px", borderRadius:14, border:`1.5px solid ${T.border}`, background:"#fff", cursor:"pointer", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color:T.blue }}>{opt === "all" ? "All" : opt}</div>
              <div style={{ fontSize:12, color:T.textFaint, marginTop:4 }}>{opt === "all" ? "Available (up to 50)" : "questions"}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (view === "pickChapter") {
    return (
      <div style={S.page}>
        <button onClick={()=>setView("hub")} style={{ ...S.btn, ...S.btnOutline, marginBottom:16 }}>← Back</button>
        <h2 style={{ color:T.text }}>Choose a Chapter — {MODE_META[pendingMode].label}</h2>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:12, marginTop:14 }}>
          {chapters.length === 0 && <div style={{ color:T.textFaint }}>Loading chapters…</div>}
          {chapters.map(c => (
            <button key={c.id} onClick={()=>pickChapter(c)}
              style={{ textAlign:"left", padding:"16px", borderRadius:12, border:`1.5px solid ${T.border}`, background:"#fff", cursor:"pointer" }}>
              <div style={{ fontWeight:700, color:T.text, fontSize:14 }}>{c.chapter_name}</div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {toast && <div style={{ position:"fixed", bottom:24, right:24, background:T.g700, color:"#fff", padding:"12px 20px", borderRadius:10, fontSize:13, fontWeight:700, zIndex:500 }}>{toast}</div>}

      <div style={{ marginBottom:22 }}>
        <h1 style={{ margin:"0 0 4px", color:T.text }}>🎮 Game Hub</h1>
        <p style={{ margin:0, color:T.textLight }}>Learn Biology. Play. Compete. Master.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))", gap:12, marginBottom:26 }}>
        {[["⚡ XP", xp], ["🔥 Streak", `${streak}d`], ["🏆 Rank", rank ? `#${rank}` : "—"], ["🎖 Level", xpLevelLabel(xp)]].map(([l,v])=>(
          <div key={l} style={{ ...S.card, textAlign:"center", padding:"14px" }}>
            <div style={{ fontSize:11, color:T.textFaint, fontWeight:700 }}>{l}</div>
            <div style={{ fontSize:18, fontWeight:800, color:T.g700 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:14, marginBottom:30 }}>
        {Object.entries(MODE_META).map(([key, m]) => (
          <button key={key} onClick={()=>openMode(key)}
            style={{ textAlign:"left", padding:"20px", borderRadius:16, border:"none", cursor:"pointer",
              background:`linear-gradient(135deg, ${m.color}, ${m.color}CC)`, color:"#fff" }}>
            <div style={{ fontSize:30, marginBottom:8 }}>{m.icon}</div>
            <div style={{ fontSize:16, fontWeight:800 }}>{m.label}</div>
            <div style={{ fontSize:12.5, opacity:0.9, marginTop:4 }}>
              {key==="daily_challenge" && "10 questions · new set each time"}
              {key==="speed_quiz" && "10 questions · 60 second clock"}
              {key==="topic_battle" && "Pick a chapter · 10 questions"}
              {key==="practice_arena" && "Pick a chapter · no time pressure"}
            </div>
          </button>
        ))}
      </div>

      <h3 style={{ color:T.text }}>🏅 Achievements</h3>
      <div style={{ marginBottom:30 }}>
        <AchievementBadgeGrid achievements={achievements} unlockedIds={unlockedIds} compact />
      </div>

      <h3 style={{ color:T.text }}>🥇 Leaderboard</h3>
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        {leaderboard.map(row => (
          <div key={row.id} style={{
            display:"flex", alignItems:"center", gap:12, padding:"11px 16px",
            borderBottom:`1px solid ${T.border}`,
            background: row.id === user?.id ? T.g25 : "transparent",
          }}>
            <div style={{ width:26, fontWeight:800, color:T.g600 }}>#{row.rank}</div>
            <div style={{ flex:1, fontWeight: row.id===user?.id ? 800 : 500, color:T.text }}>{row.full_name}{row.id===user?.id ? " (you)" : ""}</div>
            <div style={{ fontSize:12, color:T.textFaint }}>{row.level_title}</div>
            <div style={{ fontWeight:700, color:T.g700 }}>⚡{row.xp}</div>
          </div>
        ))}
        {leaderboard.length===0 && <div style={{ padding:20, textAlign:"center", color:T.textFaint }}>No ranked students yet.</div>}
      </div>
    </div>
  );
}

function xpLevelLabel(xp) {
  if (xp >= 20000) return "Legend";
  if (xp >= 10000) return "Genetics Master";
  if (xp >= 5000)  return "Bio Scholar";
  if (xp >= 2000)  return "Life Learner";
  if (xp >= 500)   return "Cell Explorer";
  return "Beginner";
}

// ─── ACHIEVEMENTS ─────────────────────────────────────────────────────────────

function Achievements() {
  const [achievements, setAchievements] = useState([]);
  const [unlockedIds, setUnlockedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sb.getAchievements(), sb.getUserAchievements()]).then(([ach, mine]) => {
      setAchievements(Array.isArray(ach) ? ach : []);
      setUnlockedIds(new Set((mine||[]).map(r=>r.achievement_id)));
      setLoading(false);
    }).catch(()=>setLoading(false));
  }, []);

  const unlocked = achievements.filter(a=>unlockedIds.has(a.id));
  const locked = achievements.filter(a=>!unlockedIds.has(a.id));

  if (loading) return <div style={S.page}><div style={{ ...S.card, textAlign:"center", padding:40 }}>Loading achievements…</div></div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>🏆 Achievements</h1>
        <p style={S.sub}>Earn badges and XP by reaching milestones in your study journey</p>
      </div>
      <div style={{ background:`linear-gradient(135deg,${T.g600},${T.g700})`, borderRadius:"16px", padding:"20px", marginBottom:"20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
          {[["Badges",`${unlocked.length}/${achievements.length}`,"🏅"],["XP from Badges",unlocked.reduce((s,a)=>s+a.xp_reward,0)+"⚡","⚡"],["Locked",`${locked.length} to go`,"🔒"]].map(([l,v,ic],i)=>(
            <div key={i} style={{ textAlign:"center" }}>
              <div style={{ fontSize:"22px", marginBottom:"3px" }}>{ic}</div>
              <div style={{ fontSize:"18px", fontWeight:"800", color:"#fff" }}>{v}</div>
              <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <h2 style={S.secTitle}>✅ Unlocked ({unlocked.length})</h2>
      <div style={{ ...S.grid3, marginBottom:"22px" }}>
        {unlocked.length === 0 && <div style={{ color:T.textFaint, fontSize:13 }}>No badges unlocked yet — play a game in the Game Hub to earn your first one.</div>}
        {unlocked.map(a=>(
          <div key={a.id} style={{ ...S.card, textAlign:"center", padding:"20px 14px", border:`1.5px solid ${T.g200}`, background:T.g25 }}>
            <div style={{ fontSize:"38px", marginBottom:"9px" }}>{a.icon}</div>
            <div style={{ fontSize:"13.5px", fontWeight:"700", color:T.g600, marginBottom:"3px" }}>{a.title}</div>
            <div style={{ fontSize:"12px", color:T.textLight, marginBottom:"9px" }}>{a.description}</div>
            <XPBadge xp={a.xp_reward}/>
          </div>
        ))}
      </div>
      <h2 style={S.secTitle}>🔒 Locked ({locked.length})</h2>
      <div style={S.grid3}>
        {locked.map(a=>(
          <div key={a.id} style={{ ...S.card, textAlign:"center", padding:"20px 14px", opacity:0.65 }}>
            <div style={{ fontSize:"38px", marginBottom:"9px", filter:"grayscale(1)" }}>{a.icon}</div>
            <div style={{ fontSize:"13.5px", fontWeight:"700", marginBottom:"3px" }}>{a.title}</div>
            <div style={{ fontSize:"12px", color:T.textLight, marginBottom:"9px" }}>{a.description}</div>
            <span style={S.badge(T.textFaint,"#F3F4F6")}>🔒 +{a.xp_reward} XP</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── STUDY PLANNER ────────────────────────────────────────────────────────────

function StudyPlanner() {
  const [plan, setPlan] = useState({ exam:"KCET", hours:3, date:"2026-04-15" });
  const [generated, setGenerated] = useState(false);
  const today=new Date(), target=new Date(plan.date);
  const daysLeft=Math.max(1,Math.floor((target-today)/(86400000)));
  const weeklyPlan=[
    { week:"Week 1", focus:"Unit I & II – Diversity & Structure", chapters:["The Living World","Biological Classification","Plant Kingdom","Animal Kingdom"] },
    { week:"Week 2", focus:"Unit III – Cell Biology", chapters:["Cell: Unit of Life","Biomolecules","Cell Cycle & Division"] },
    { week:"Week 3", focus:"Unit IV & V – Physiology", chapters:["Photosynthesis","Respiration","Breathing & Exchange","Body Fluids"] },
    { week:"Week 4", focus:"Revision + Mock Tests", chapters:["Full Syllabus Revision","2 Mock Tests","PYQ Practice"] },
  ];
  const heatColors=["#F3F4F6","#A7F3D0","#6EE7B7","#34D399","#10B981"];
  const calData=[...Array(35)].map((_,i)=>({ day:i-2, study:[3,4,5,6,8,9,10,11,12,13,15,16,17,18,19,20,22,24,25,26,27,28,29,31,32].includes(i), today:i===23 }));
  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>📅 Smart Study Planner</h1>
        <p style={S.sub}>Create a personalized plan based on your exam date and availability</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr", gap:"18px" }}>
        <div>
          <div style={S.card}>
            <h2 style={{ ...S.h3, marginBottom:"14px" }}>⚙️ Plan Setup</h2>
            <label style={S.label}>Exam Type</label>
            <select style={S.input} value={plan.exam} onChange={e=>setPlan(p=>({...p,exam:e.target.value}))}><option>KCET</option><option>NEET</option><option>PU Board</option></select>
            <label style={S.label}>Daily Study Hours</label>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"5px", marginBottom:"13px" }}>
              {[1,2,3,4,5,6,7,8].map(h=>(
                <button key={h} onClick={()=>setPlan(p=>({...p,hours:h}))}
                  style={{ ...S.btn, padding:"9px 5px", fontSize:"13.5px", fontWeight:"700", background:plan.hours===h?T.g600:"#F3F4F6", color:plan.hours===h?"#fff":T.textMid, border:"none", justifyContent:"center" }}>
                  {h}h
                </button>
              ))}
            </div>
            <label style={S.label}>Target Exam Date</label>
            <input style={S.input} type="date" value={plan.date} onChange={e=>setPlan(p=>({...p,date:e.target.value}))}/>
            <button onClick={()=>setGenerated(true)} style={{ ...S.btn, ...S.btnPrimary }}>🚀 Generate My Plan</button>
          </div>
          {generated&&(
            <div style={{ ...S.card, marginTop:"13px" }}>
              <h3 style={{ ...S.h3, marginBottom:"12px" }}>📊 Plan Summary</h3>
              {[["Days Remaining",daysLeft+" days"],["Chapters/Day",(32/daysLeft).toFixed(2)],["Daily Questions","25–40 MCQs"],["Weekly Tests","1 chapter test"]].map(([l,v],i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"8px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                  <span style={{ fontSize:"12.5px", color:T.textMid }}>{l}</span>
                  <span style={{ fontSize:"12.5px", fontWeight:"700", color:T.g600 }}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <div style={{ ...S.card, marginBottom:"14px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"13px" }}>
              <h2 style={S.h3}>📆 June 2025</h2>
              <div style={{ display:"flex", gap:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:"11px", height:"11px", borderRadius:"2px", background:T.g400 }}/><span style={{ fontSize:"11px", color:T.textFaint }}>Study</span></div>
                <div style={{ display:"flex", alignItems:"center", gap:4 }}><div style={{ width:"11px", height:"11px", borderRadius:"2px", background:"#F3F4F6" }}/><span style={{ fontSize:"11px", color:T.textFaint }}>Off</span></div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:"4px" }}>
              {["S","M","T","W","T","F","S"].map((d,i)=><div key={i} style={{ textAlign:"center", fontSize:"11px", fontWeight:"600", color:T.textFaint, padding:"3px 0" }}>{d}</div>)}
              {calData.map((d,i)=>(
                <div key={i} style={{ aspectRatio:"1", borderRadius:"6px", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"11.5px", fontWeight:d.today?"800":"400", background:d.today?T.g600:d.study&&d.day>0?T.g100:"#F3F4F6", color:d.today?"#fff":d.study&&d.day>0?T.g700:T.textFaint, border:d.today?`2px solid ${T.g400}`:"2px solid transparent" }}>
                  {d.day>0&&d.day<=30?d.day:""}
                </div>
              ))}
            </div>
          </div>
          {generated&&(
            <div>
              <h2 style={S.secTitle}>📋 4-Week Study Schedule</h2>
              <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
                {weeklyPlan.map((w,i)=>(
                  <div key={i} style={S.card}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"9px" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                        <div style={{ width:"28px", height:"28px", borderRadius:"7px", background:T.g600, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11.5px", fontWeight:"700" }}>W{i+1}</div>
                        <div>
                          <div style={{ fontSize:"13.5px", fontWeight:"700" }}>{w.week}</div>
                          <div style={{ fontSize:"11.5px", color:T.textLight }}>{w.focus}</div>
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:"5px" }}>
                      {w.chapters.map((c,ci)=><span key={ci} style={S.badge(T.textMid,"#F3F4F6")}>📖 {c}</span>)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── KCET ANALYZER ────────────────────────────────────────────────────────────

function KcetAnalyzer() {
  const chapters=[
    { name:"Cell Biology", score:88, status:"🟢" },{ name:"Plant Kingdom", score:75, status:"🟢" },
    { name:"Genetics", score:64, status:"🟡" },{ name:"Human Physiology", score:58, status:"🟡" },
    { name:"Ecology", score:42, status:"🔴" },{ name:"Reproduction", score:38, status:"🔴" },
    { name:"Biotechnology", score:50, status:"🟡" },{ name:"Photosynthesis", score:82, status:"🟢" },
  ];
  const est=Math.round(chapters.reduce((s,c)=>s+c.score,0)/chapters.length*1.8);
  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>🎯 KCET Biology Readiness</h1>
        <p style={S.sub}>AI-powered analysis of your KCET preparation across all chapters</p>
      </div>
      <div style={{ background:`linear-gradient(135deg,${T.g600},${T.g700})`, borderRadius:"18px", padding:"24px", marginBottom:"20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"auto 1fr", gap:"28px", alignItems:"center" }}>
          <CircleProgress pct={Math.round(est/180*100)} size={106} stroke={9} color="#34D399" bg="rgba(255,255,255,0.14)">
            <div style={{ fontSize:"22px", fontWeight:"900", color:"#fff" }}>{est}</div>
            <div style={{ fontSize:"10.5px", color:"rgba(255,255,255,0.55)" }}>/ 180</div>
          </CircleProgress>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"11px" }}>
            {[
              { label:"Strong Chapters", value:`${chapters.filter(c=>c.score>=75).length}`, icon:"🟢" },
              { label:"Average Chapters", value:`${chapters.filter(c=>c.score>=50&&c.score<75).length}`, icon:"🟡" },
              { label:"Weak Chapters", value:`${chapters.filter(c=>c.score<50).length}`, icon:"🔴" },
              { label:"Overall Accuracy", value:"71%", icon:"🎯" },
            ].map((s,i)=>(
              <div key={i} style={{ background:"rgba(255,255,255,0.1)", borderRadius:"11px", padding:"13px" }}>
                <div style={{ fontSize:"20px" }}>{s.icon}</div>
                <div style={{ fontSize:"20px", fontWeight:"800", color:"#fff" }}>{s.value}</div>
                <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <h2 style={S.secTitle}>Chapter-wise Readiness</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
            {[...chapters].sort((a,b)=>b.score-a.score).map((c,i)=>(
              <div key={i} style={{ ...S.card, padding:"13px 15px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"7px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                    <span style={{ fontSize:"14px" }}>{c.status}</span>
                    <span style={{ fontSize:"13px", fontWeight:"600" }}>{c.name}</span>
                  </div>
                  <span style={{ fontSize:"12.5px", fontWeight:"700", color:c.score>=75?T.g400:c.score>=50?"#F59E0B":T.red }}>{c.score}%</span>
                </div>
                <div style={S.pBar}><div style={S.pFill(c.score,c.score>=75?T.g400:c.score>=50?"#F59E0B":T.red)}/></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 style={S.secTitle}>💡 Recommendations</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
            <div style={{ ...S.card, border:`1.5px solid #FCA5A5`, background:"#FEF2F2" }}>
              <h3 style={{ ...S.h3, color:T.red, marginBottom:"9px" }}>🔴 Priority Focus Areas</h3>
              {chapters.filter(c=>c.score<50).map((c,i)=>(
                <div key={i} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:i<chapters.filter(c=>c.score<50).length-1?"1px solid #FECACA":"none" }}>
                  <span style={{ fontSize:"12.5px", color:T.red }}>⚠️</span>
                  <span style={{ fontSize:"12.5px", color:"#991B1B" }}><strong>{c.name}</strong> — needs 3x more practice</span>
                </div>
              ))}
              <button style={{ ...S.btn, ...S.btnSm, background:T.red, color:"#fff", marginTop:"9px", fontSize:"12px" }}>Start Focused Practice →</button>
            </div>
            <div style={{ ...S.card, border:`1.5px solid ${T.g200}`, background:T.g25 }}>
              <h3 style={{ ...S.h3, color:T.g600, marginBottom:"9px" }}>🟢 Strong Chapters</h3>
              {chapters.filter(c=>c.score>=75).map((c,i)=>(
                <div key={i} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:i<chapters.filter(c=>c.score>=75).length-1?`1px solid ${T.g100}`:"none" }}>
                  <span>✅</span><span style={{ fontSize:"12.5px", color:T.g700 }}><strong>{c.name}</strong> — maintain weekly revision</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <h3 style={{ ...S.h3, marginBottom:"9px" }}>📅 KCET Exam Day Tips</h3>
              {["90 questions in 80 minutes","60 Biology questions total","No negative marking — attempt all","Revise diagrams the night before"].map((t,i)=>(
                <div key={i} style={{ display:"flex", gap:7, padding:"6px 0", borderBottom:i<3?`1px solid ${T.border}`:"none" }}>
                  <span style={{ fontSize:"11.5px", color:T.g400 }}>✓</span>
                  <span style={{ fontSize:"12.5px", color:T.textMid }}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NEET ANALYZER ────────────────────────────────────────────────────────────

function NeetAnalyzer() {
  const topics=[
    { name:"Diversity in Living World", pct:82, qs:15 },{ name:"Structural Organisation", pct:70, qs:12 },
    { name:"Cell Structure & Function", pct:88, qs:18 },{ name:"Plant Physiology", pct:55, qs:14 },
    { name:"Human Physiology", pct:65, qs:20 },{ name:"Reproduction", pct:45, qs:16 },
    { name:"Genetics & Evolution", pct:72, qs:18 },{ name:"Biology & Human Welfare", pct:40, qs:10 },
    { name:"Biotechnology", pct:35, qs:12 },{ name:"Ecology & Environment", pct:60, qs:14 },
  ];
  const predicted=Math.round(topics.reduce((s,t)=>s+t.pct,0)/topics.length*3.6);
  const accuracy=Math.round(topics.reduce((s,t)=>s+t.pct,0)/topics.length);
  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>🧠 NEET Biology Readiness</h1>
        <p style={S.sub}>Deep analysis of your NEET Biology preparation — unit & chapter level</p>
      </div>
      <div style={{ background:"linear-gradient(135deg,#1E1B4B,#3730A3)", borderRadius:"18px", padding:"24px", marginBottom:"20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"14px", textAlign:"center" }}>
          {[
            { label:"Predicted Score", el:<CircleProgress pct={Math.round(predicted/360*100)} size={84} stroke={8} color="#818CF8" bg="rgba(255,255,255,0.12)"><div style={{ fontSize:"17px", fontWeight:"900", color:"#fff" }}>{predicted}</div><div style={{ fontSize:"9.5px", color:"rgba(255,255,255,0.48)" }}>/360</div></CircleProgress> },
            { label:"Accuracy", el:<CircleProgress pct={accuracy} size={84} stroke={8} color="#F59E0B" bg="rgba(255,255,255,0.12)"><div style={{ fontSize:"17px", fontWeight:"900", color:"#fff" }}>{accuracy}%</div></CircleProgress> },
            { label:"Completion", el:<CircleProgress pct={65} size={84} stroke={8} color="#34D399" bg="rgba(255,255,255,0.12)"><div style={{ fontSize:"17px", fontWeight:"900", color:"#fff" }}>65%</div></CircleProgress> },
            { label:"Strong Units", el:<CircleProgress pct={Math.round(topics.filter(t=>t.pct>=70).length/topics.length*100)} size={84} stroke={8} color="#F472B6" bg="rgba(255,255,255,0.12)"><div style={{ fontSize:"17px", fontWeight:"900", color:"#fff" }}>{topics.filter(t=>t.pct>=70).length}/10</div></CircleProgress> },
          ].map((s,i)=>(
            <div key={i} style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:"7px" }}>
              {s.el}
              <div style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.55)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={S.grid2}>
        <div>
          <h2 style={S.secTitle}>Unit-wise Analysis (Biology: 90 Qs)</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
            {topics.map((t,i)=>(
              <div key={i} style={{ ...S.card, padding:"12px 14px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"6px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span>{t.pct>=70?"🟢":t.pct>=50?"🟡":"🔴"}</span>
                    <span style={{ fontSize:"12.5px", fontWeight:"600" }}>{t.name}</span>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"11px", color:T.textFaint }}>{t.qs} Qs</span>
                    <span style={{ fontSize:"12.5px", fontWeight:"700", color:t.pct>=70?T.g400:t.pct>=50?"#F59E0B":T.red }}>{t.pct}%</span>
                  </div>
                </div>
                <div style={S.pBar}><div style={S.pFill(t.pct,t.pct>=70?T.g400:t.pct>=50?"#F59E0B":T.red)}/></div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 style={S.secTitle}>🧠 AI Recommendations</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
            <div style={{ background:"linear-gradient(135deg,#1E1B4B,#312E81)", borderRadius:"14px", padding:"18px" }}>
              <div style={{ fontSize:"15px", fontWeight:"700", color:"#fff", marginBottom:"3px" }}>🎯 NEET Target: 300+</div>
              <div style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.62)", marginBottom:"13px" }}>Currently at {predicted}. Here's your plan:</div>
              {[{ area:"Reproduction", action:"Complete 16 Qs + 2 videos", gain:"+18 marks" },{ area:"Biotechnology", action:"Focus on rDNA technology", gain:"+12 marks" },{ area:"Human Welfare", action:"Disease chapter deep study", gain:"+10 marks" }].map((r,i)=>(
                <div key={i} style={{ background:"rgba(255,255,255,0.08)", borderRadius:"9px", padding:"11px", marginBottom:"7px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                    <span style={{ fontSize:"12.5px", fontWeight:"700", color:"#A5B4FC" }}>{r.area}</span>
                    <span style={S.badge("#6EE7B7","rgba(110,231,183,0.18)")}>{r.gain}</span>
                  </div>
                  <span style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.55)" }}>{r.action}</span>
                </div>
              ))}
            </div>
            <div style={S.card}>
              <h3 style={{ ...S.h3, marginBottom:"11px" }}>📊 Score Projection</h3>
              {[["Current trajectory",predicted+"/360"],["If weak areas improved","310–330/360"],["If all areas mastered","340–360/360"]].map(([l,v],i)=>(
                <div key={i} style={{ display:"flex", justifyContent:"space-between", padding:"9px 0", borderBottom:i<2?`1px solid ${T.border}`:"none" }}>
                  <span style={{ fontSize:"12.5px", color:T.textMid }}>{l}</span>
                  <span style={{ fontSize:"12.5px", fontWeight:"700", color:i===0?T.amber:i===1?T.g400:"#6366F1" }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ ...S.card, background:T.g25, border:`1.5px solid ${T.g200}` }}>
              <h3 style={{ ...S.h3, color:T.g600, marginBottom:"9px" }}>⏱ Time to Target: 300+</h3>
              <div style={{ fontSize:"30px", fontWeight:"900", color:T.g600, marginBottom:"3px" }}>~45 days</div>
              <p style={{ ...S.sub, fontSize:"12px" }}>At 3h/day with focused practice on weak areas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PYQ CENTER ───────────────────────────────────────────────────────────────

function PYQCenter() {
  const [activeType, setActiveType] = useState("KCET");
  const [chapterFilter, setChapterFilter] = useState("All");
  const [yearFilter, setYearFilter] = useState("All");
  const [showAns, setShowAns] = useState({});
  const years=["All","2023","2022","2021","2020"];
  const chapters=["All",...[...new Set(MOCK_QUESTIONS.map(q=>q.chapter))]];
  const filtered=MOCK_QUESTIONS
    .filter(q=>q.type===activeType)
    .filter(q=>chapterFilter==="All"||q.chapter===chapterFilter)
    .filter(q=>yearFilter==="All"||q.year===yearFilter);
  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>📄 PYQ Center</h1>
        <p style={S.sub}>Previous Year Questions from PU Board, KCET, and NEET with full solutions</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"12px", marginBottom:"18px" }}>
        {[{k:"PU",label:"PU Board",qs:"300+",icon:"📚",c:T.g600,bg:T.g50},{k:"KCET",label:"KCET",qs:"400+",icon:"🎯",c:T.purple,bg:"#EDE9FE"},{k:"NEET",label:"NEET",qs:"500+",icon:"🏆",c:T.red,bg:"#FEF2F2"}].map(t=>(
          <div key={t.k} onClick={()=>setActiveType(t.k)}
            style={{ ...S.card, cursor:"pointer", textAlign:"center", padding:"16px", border:`2px solid ${activeType===t.k?t.c:T.border}`, background:activeType===t.k?t.bg:T.surface }}>
            <div style={{ fontSize:"26px", marginBottom:"6px" }}>{t.icon}</div>
            <div style={{ fontSize:"17px", fontWeight:"800", color:t.c }}>{t.qs}</div>
            <div style={{ fontSize:"13px", fontWeight:"600" }}>{t.label} Questions</div>
          </div>
        ))}
      </div>
      <div style={{ ...S.card, padding:"13px 16px", marginBottom:"14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"13px" }}>
          <div>
            <label style={S.label}>Chapter</label>
            <select style={{ ...S.input, marginBottom:0 }} value={chapterFilter} onChange={e=>setChapterFilter(e.target.value)}>
              {chapters.map(c=><option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Year</label>
            <select style={{ ...S.input, marginBottom:0 }} value={yearFilter} onChange={e=>setYearFilter(e.target.value)}>
              {years.map(y=><option key={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"11px" }}>
        <span style={{ fontSize:"12.5px", color:T.textLight }}>{filtered.length} questions found</span>
        <span style={S.badge(T.g400,T.g50)}>Showing {activeType} PYQs</span>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
        {filtered.length===0&&<div style={{ ...S.card, textAlign:"center", padding:"32px", color:T.textLight }}>No questions match this filter. Try changing the year or chapter.</div>}
        {filtered.map((q,qi)=>(
          <div key={q.id} style={S.card}>
            <div style={{ display:"flex", gap:7, marginBottom:"9px", flexWrap:"wrap" }}>
              <span style={{ fontSize:"12px", fontWeight:"700", color:T.textFaint }}>Q{qi+1}.</span>
              <span style={S.tag(q.type)}>{q.type}</span>
              <span style={S.tag(q.difficulty)}>{q.difficulty}</span>
              {q.year&&<span style={S.badge(T.textFaint,"#F3F4F6")}>{q.year}</span>}
              {q.chapter&&<span style={{ fontSize:"11.5px", color:T.textFaint }}>📖 {q.chapter}</span>}
            </div>
            <p style={{ fontSize:"14px", fontWeight:"500", marginBottom:"11px", lineHeight:"1.55" }}>{q.text}</p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginBottom:"11px" }}>
              {q.options.map((opt,oi)=>{
                const rev=showAns[q.id], ok=oi===q.correct;
                return (
                  <div key={oi} style={{ padding:"8px 12px", borderRadius:"8px", border:`1.5px solid ${rev?(ok?"#10B981":T.border):T.border}`, background:rev?(ok?T.g50:"#F9FAFB"):"#F9FAFB", fontSize:"13px", display:"flex", gap:6, alignItems:"center" }}>
                    <span style={{ fontWeight:"700", color:T.textFaint }}>{String.fromCharCode(65+oi)}.</span>{opt}
                    {rev&&ok&&<span style={{ marginLeft:"auto", color:T.g400, fontWeight:"700" }}>✓</span>}
                  </div>
                );
              })}
            </div>
            {showAns[q.id]&&<div style={{ background:T.g50, borderRadius:"8px", padding:"10px 12px", marginBottom:"9px", fontSize:"13px", color:T.g700 }}>💡 <strong>Explanation:</strong> {q.explanation}</div>}
            <button onClick={()=>setShowAns(s=>({...s,[q.id]:!s[q.id]}))} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>
              {showAns[q.id]?"Hide Solution":"Show Solution"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── DIAGRAM CENTER ───────────────────────────────────────────────────────────

function DiagramCenter() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeDiagram, setActiveDiagram] = useState(null);
  const [quizMode, setQuizMode] = useState(false);
  const [guessed, setGuessed] = useState([]);
  const categories=["All",...[...new Set(DIAGRAM_DATA.map(d=>d.category))]];
  const filtered=activeCategory==="All"?DIAGRAM_DATA:DIAGRAM_DATA.filter(d=>d.category===activeCategory);

  if(activeDiagram) {
    const d=activeDiagram;
    return (
      <div style={S.page}>
        <button onClick={()=>{setActiveDiagram(null);setQuizMode(false);setGuessed([]);}} style={{ ...S.btn, ...S.btnGhost, padding:"6px 0", marginBottom:"13px", fontSize:"13px", color:T.textLight }}>← Back</button>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
          <div><h1 style={{ ...S.h1, marginBottom:"3px" }}>{d.emoji} {d.title}</h1><p style={S.sub}>{d.category} · {d.difficulty}</p></div>
          <div style={{ display:"flex", gap:7 }}>
            <button onClick={()=>{setQuizMode(false);setGuessed([]);}} style={{ ...S.btn, ...S.btnSm, background:!quizMode?T.g600:"#fff", color:!quizMode?"#fff":T.textMid, border:`1.5px solid ${T.border}` }}>Study Mode</button>
            <button onClick={()=>{setQuizMode(true);setGuessed([]);}} style={{ ...S.btn, ...S.btnSm, background:quizMode?T.purple:"#fff", color:quizMode?"#fff":T.textMid, border:`1.5px solid ${T.border}` }}>Quiz Mode</button>
          </div>
        </div>
        <div style={S.grid2}>
          <div style={{ ...S.card, display:"flex", alignItems:"center", justifyContent:"center", minHeight:"260px", background:T.g25, position:"relative" }}>
            <div style={{ fontSize:"110px" }}>{d.emoji}</div>
            <div style={{ position:"absolute", bottom:"13px", fontSize:"12px", color:T.textFaint, textAlign:"center" }}>
              {quizMode?"Click labels to identify":"Diagram representation"}
            </div>
          </div>
          <div>
            {!quizMode?(
              <div style={S.card}>
                <h3 style={{ ...S.h3, marginBottom:"11px" }}>📌 Structure Labels</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:"7px" }}>
                  {d.labels.map((l,i)=>(
                    <div key={i} style={{ display:"flex", alignItems:"center", gap:9, padding:"9px 11px", background:T.g25, borderRadius:"8px" }}>
                      <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:T.g600, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11px", fontWeight:"700", flexShrink:0 }}>{i+1}</div>
                      <span style={{ fontSize:"13px" }}>{l}</span>
                    </div>
                  ))}
                </div>
              </div>
            ):(
              <div style={S.card}>
                <h3 style={{ ...S.h3, marginBottom:"3px" }}>🎯 Label Quiz</h3>
                <p style={{ ...S.sub, fontSize:"12px", marginBottom:"13px" }}>Click each label to identify it</p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px" }}>
                  {d.labels.map((l,i)=>(
                    <button key={i} onClick={()=>setGuessed(g=>[...new Set([...g,i])])}
                      style={{ ...S.btn, ...S.btnSm, background:guessed.includes(i)?T.g50:"#F3F4F6", color:guessed.includes(i)?T.g600:T.textMid, border:`1.5px solid ${guessed.includes(i)?T.g400:T.border}`, fontSize:"12px", justifyContent:"flex-start" }}>
                      {guessed.includes(i)&&"✓ "}{l}
                    </button>
                  ))}
                </div>
                {guessed.length===d.labels.length&&(
                  <div style={{ ...S.card, background:T.g25, marginTop:"11px", textAlign:"center", padding:"14px" }}>
                    <div style={{ fontSize:"26px", marginBottom:"5px" }}>🎉</div>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:T.g600 }}>All {d.labels.length} labels identified!</div>
                    <div style={{ marginTop:"7px" }}><XPBadge xp={50}/></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>🖼 Diagram Learning Center</h1>
        <p style={S.sub}>Master Biology diagrams with interactive study and labelling practice</p>
      </div>
      <div style={{ display:"flex", gap:7, marginBottom:"18px", flexWrap:"wrap" }}>
        {categories.map(c=>(
          <button key={c} onClick={()=>setActiveCategory(c)}
            style={{ ...S.btn, ...S.btnSm, background:activeCategory===c?T.g600:"#fff", color:activeCategory===c?"#fff":T.textMid, border:`1.5px solid ${activeCategory===c?T.g600:T.border}`, fontSize:"12.5px" }}>
            {c}
          </button>
        ))}
      </div>
      <div style={S.grid3}>
        {filtered.map(d=>(
          <div key={d.id} onClick={()=>setActiveDiagram(d)}
            style={{ ...S.card, cursor:"pointer", textAlign:"center", padding:"22px" }}
            onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 11px 30px rgba(0,0,0,0.09)";e.currentTarget.style.borderColor=T.g400;}}
            onMouseLeave={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="";e.currentTarget.style.borderColor=T.border;}}>
            <div style={{ fontSize:"48px", marginBottom:"11px" }}>{d.emoji}</div>
            <div style={{ fontSize:"14.5px", fontWeight:"700", marginBottom:"3px" }}>{d.title}</div>
            <div style={{ fontSize:"12px", color:T.textLight, marginBottom:"9px" }}>{d.category} · {d.labels.length} labels</div>
            <div style={{ display:"flex", gap:6, justifyContent:"center" }}>
              <span style={S.tag(d.difficulty)}>{d.difficulty}</span>
              <span style={S.badge(T.purple,"#EDE9FE")}>+50 XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── NOTES VIEW ───────────────────────────────────────────────────────────────

function NotesView() {
  const [notes, setNotes] = useState([]);
  const [bookmarked, setBookmarked] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.getAllNotes().then(n => { setNotes(Array.isArray(n) ? n : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ ...S.page, paddingTop: "40px", textAlign: "center", color: T.textFaint }}>Loading notes…</div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ ...S.h1, marginBottom: "3px" }}>📝 Notes Library</h1>
        <p style={S.sub}>{notes.length} notes available · Download, bookmark, and annotate</p>
      </div>
      {notes.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>📝</div>
          <div style={{ fontSize: "14px", fontWeight: "600" }}>No notes published yet</div>
          <div style={{ fontSize: "12.5px", color: T.textFaint, marginTop: "4px" }}>Check back soon — admin is uploading content</div>
        </div>
      ) : (
        <div style={S.grid3}>
          {notes.map((n, i) => (
            <div key={n.id} style={{ ...S.card, position: "relative" }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 11px 30px rgba(0,0,0,0.07)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = ""; }}>
              <button onClick={() => setBookmarked(b => b.includes(n.id) ? b.filter(x => x !== n.id) : [...b, n.id])}
                style={{ position: "absolute", top: "13px", right: "13px", ...S.btn, padding: "4px", background: "transparent", border: "none" }}>
                <Icon name="bookmark" size={15} color={bookmarked.includes(n.id) ? T.amber : T.textFaint} />
              </button>
              <div style={{ fontSize: "34px", marginBottom: "11px" }}>📄</div>
              <div style={{ fontSize: "14.5px", fontWeight: "700", marginBottom: "2px" }}>{n.title}</div>
              <div style={{ fontSize: "12px", color: T.textLight, marginBottom: "9px" }}>{n.chapters?.chapter_name || ""}</div>
              <div style={{ display: "flex", gap: 6 }}>
                <span style={S.badge(T.red, "#FEF2F2")}>{n.note_type || "PDF"}</span>
                <span style={{ fontSize: "11.5px", color: T.textFaint }}>{n.download_count || 0} downloads</span>
                {bookmarked.includes(n.id) && <span style={S.badge(T.amber, "#FEF3C7")}>🔖 Saved</span>}
              </div>
              {n.pdf_url
                ? <a href={n.pdf_url} target="_blank" rel="noopener noreferrer" style={{ ...S.btn, width: "100%", justifyContent: "center", marginTop: "13px", background: T.g25, color: T.g600, fontWeight: "600", fontSize: "12.5px", border: `1px solid ${T.g200}`, textDecoration: "none", display: "flex" }}>📥 Download</a>
                : <div style={{ ...S.btn, width: "100%", justifyContent: "center", marginTop: "13px", background: "#F3F4F6", color: T.textFaint, fontWeight: "600", fontSize: "12.5px" }}>No file attached</div>
              }
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── QUESTIONS VIEW (connected) ───────────────────────────────────────────────

function QuestionsView() {
  const [questions, setQuestions] = useState([]);
  const [filter, setFilter] = useState("All");
  const [shown, setShown] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.getAllQuestions().then(q => { setQuestions(Array.isArray(q) ? q : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const filtered = filter === "All" ? questions : questions.filter(q => q.exam_type === filter);
  const counts = {
    PU: questions.filter(q => q.exam_type === "PU").length,
    KCET: questions.filter(q => q.exam_type === "KCET").length,
    NEET: questions.filter(q => q.exam_type === "NEET").length,
  };

  if (loading) return <div style={{ ...S.page, paddingTop: "40px", textAlign: "center", color: T.textFaint }}>Loading questions…</div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ ...S.h1, marginBottom: "3px" }}>❓ Question Bank</h1>
        <p style={S.sub}>{questions.length} questions available across PU, KCET & NEET</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "13px", marginBottom: "22px" }}>
        {[
          { title: "PU Board Questions", count: counts.PU, icon: "📚", c: T.g600, bg: T.g50, key: "PU" },
          { title: "KCET Questions", count: counts.KCET, icon: "🎯", c: T.purple, bg: "#EDE9FE", key: "KCET" },
          { title: "NEET Questions", count: counts.NEET, icon: "🏆", c: T.red, bg: "#FEF2F2", key: "NEET" },
        ].map((c, i) => (
          <div key={i} onClick={() => setFilter(c.key)} style={{ background: c.bg, borderRadius: "16px", padding: "24px", border: `1.5px solid ${filter === c.key ? c.c : c.c + "22"}`, cursor: "pointer" }}>
            <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>{c.icon}</span>
            <div style={{ fontSize: "24px", fontWeight: "800", color: c.c }}>{c.count}</div>
            <div style={{ fontSize: "14px", fontWeight: "600", marginTop: "3px" }}>{c.title}</div>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: "16px" }}>
        {["All", "PU", "KCET", "NEET"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ ...S.btn, ...S.btnSm, background: filter === f ? T.g600 : "#fff", color: filter === f ? "#fff" : T.textMid, border: `1.5px solid ${filter === f ? T.g600 : T.border}` }}>{f}</button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "40px", color: T.textFaint }}>No questions in this category yet</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {filtered.map((q, qi) => {
            const opts = [q.option_a, q.option_b, q.option_c, q.option_d];
            const correctIdx = ["A", "B", "C", "D"].indexOf(q.correct_answer);
            return (
              <div key={q.id} style={S.card}>
                <div style={{ display: "flex", gap: 7, marginBottom: "9px" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: "700", color: T.textFaint }}>Q{qi + 1}.</span>
                  <span style={S.tag(q.exam_type)}>{q.exam_type}</span>
                  <span style={S.tag(q.difficulty)}>{q.difficulty}</span>
                  {q.chapters?.chapter_name && <span style={{ fontSize: "12px", color: T.textFaint }}>📖 {q.chapters.chapter_name}</span>}
                </div>
                <p style={{ fontSize: "14.5px", fontWeight: "500", marginBottom: "12px", lineHeight: "1.55" }}>{q.question}</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginBottom: "12px" }}>
                  {opts.map((opt, oi) => {
                    const rev = shown[q.id], ok = oi === correctIdx;
                    return (
                      <div key={oi} style={{ padding: "9px 13px", borderRadius: "9px", border: `1.5px solid ${rev ? (ok ? "#10B981" : T.border) : T.border}`, background: rev ? (ok ? T.g50 : "#F9FAFB") : "#F9FAFB", fontSize: "13.5px", display: "flex", gap: 6 }}>
                        <span style={{ fontWeight: "700", color: T.textFaint }}>{["A", "B", "C", "D"][oi]}.</span>{opt}
                        {rev && ok && <span style={{ marginLeft: "auto", color: T.g400, fontWeight: "700" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
                {shown[q.id] && q.explanation && <div style={{ background: T.g50, borderRadius: "9px", padding: "11px 13px", marginBottom: "10px", fontSize: "13.5px", color: T.g700 }}>💡 {q.explanation}</div>}
                <button onClick={() => setShown(s => ({ ...s, [q.id]: !s[q.id] }))} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>{shown[q.id] ? "Hide Answer" : "Show Answer"}</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── TESTS VIEW (connected) ────────────────────────────────────────────────────

function TestsView() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([sb.getAllTests(), sb.getResults()]).then(([t, r]) => {
      setTests(Array.isArray(t) ? t : []);
      setResults(Array.isArray(r) ? r : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const getResultFor = (testId) => results.find(r => r.test_id === testId);
  const grouped = {
    Chapter: tests.filter(t => t.test_type === "Chapter"),
    Unit: tests.filter(t => t.test_type === "Unit"),
    Mock: tests.filter(t => t.test_type === "Mock"),
  };

  if (loading) return <div style={{ ...S.page, paddingTop: "40px", textAlign: "center", color: T.textFaint }}>Loading tests…</div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ ...S.h1, marginBottom: "3px" }}>🧪 Tests & Mock Exams</h1>
        <p style={S.sub}>{tests.length} tests available · Practice with exam-pattern questions</p>
      </div>
      {tests.length === 0 ? (
        <div style={{ ...S.card, textAlign: "center", padding: "48px" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🧪</div>
          <div style={{ fontSize: "14px", fontWeight: "600" }}>No tests published yet</div>
        </div>
      ) : (
        [["Chapter Tests", grouped.Chapter], ["Unit Tests", grouped.Unit], ["Full Mock Tests", grouped.Mock]].map(([label, list], si) => (
          list.length > 0 && (
            <div key={si} style={{ marginBottom: "28px" }}>
              <h2 style={S.secTitle}>{label}</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {list.map(t => {
                  const result = getResultFor(t.id);
                  const done = !!result;
                  const pct = done ? Math.round((result.score / result.total) * 100) : 0;
                  return (
                    <div key={t.id} style={{ ...S.card, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "13px" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: done ? T.g50 : T.g25, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>{done ? "✅" : "🧪"}</div>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: "2px" }}>
                            <span style={{ fontSize: "14px", fontWeight: "600" }}>{t.title}</span>
                            {t.is_premium && <span style={S.badge(T.amber, "#FEF3C7")}>👑 Premium</span>}
                            {done && <span style={S.badge(T.g400, T.g50)}>Score: {pct}%</span>}
                          </div>
                          <div style={{ display: "flex", gap: 13 }}>
                            <span style={{ fontSize: "12px", color: T.textFaint }}>❓ {t.total_questions} Qs</span>
                            <span style={{ fontSize: "12px", color: T.textFaint }}>⏱ {t.time_limit} min</span>
                            <span style={S.tag(t.difficulty)}>{t.difficulty}</span>
                          </div>
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: T.textFaint }}>{t.chapters?.chapter_name || ""}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )
        ))
      )}
    </div>
  );
}

function ProgressView() {
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [r, p] = await Promise.all([sb.getResults(), sb.getProgress()]);
        setResults(Array.isArray(r) ? r : []);
        setProgress(Array.isArray(p) ? p : []);
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, []);

  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.total) * 100), 0) / results.length) : 0;
  const videosWatched = progress.filter(p => p.video_completed).length;
  const notesRead = progress.filter(p => p.notes_completed).length;
  const testsCompleted = progress.filter(p => p.test_completed).length;
  const overallPct = progress.length > 0 ? Math.round(progress.reduce((s, p) => s + (p.progress_percentage || 0), 0) / progress.length) : 0;

  const heatColors = ["#F3F4F6", "#A7F3D0", "#6EE7B7", "#34D399", "#10B981"];
  const heatData = [...Array(28)].map((_, i) => ({ day: i + 1, intensity: Math.floor(Math.random() * 5) }));

  if (loading) return <div style={{ ...S.page, paddingTop: "40px", textAlign: "center", color: T.textFaint }}>Loading progress…</div>;

  return (
    <div style={S.page}>
      <div style={{ marginBottom: "22px" }}>
        <h1 style={{ ...S.h1, marginBottom: "3px" }}>📈 My Progress</h1>
        <p style={S.sub}>Track your learning journey across all chapters</p>
      </div>

      {/* Circular overview */}
      <div style={{ ...S.grid4, marginBottom: "20px" }}>
        {[
          { label: "Overall Syllabus", pct: overallPct, c: T.g400, icon: "📚" },
          { label: "Avg Test Score", pct: avgScore, c: T.purple, icon: "🧪" },
          { label: "Videos Watched", pct: videosWatched, c: T.sky, icon: "🎥" },
          { label: "Tests Taken", pct: results.length, c: T.amber, icon: "📊" },
        ].map((item, i) => (
          <div key={i} style={{ ...S.card, textAlign: "center", padding: "18px 14px" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "7px" }}>
              <CircleProgress pct={typeof item.pct === "number" ? Math.min(item.pct, 100) : 0} size={68} stroke={6} color={item.c}>
                <div style={{ fontSize: "13px", fontWeight: "800" }}>{item.pct}{i < 2 ? "%" : ""}</div>
              </CircleProgress>
            </div>
            <div style={{ fontSize: "12.5px", fontWeight: "600" }}>{item.label}</div>
            <div style={{ fontSize: "11px", color: T.textFaint, marginTop: "1px" }}>{item.icon}</div>
          </div>
        ))}
      </div>

      <div style={S.grid2}>
        {/* Recent test results */}
        <div>
          <h2 style={S.secTitle}>Test History</h2>
          {results.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "32px" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>🧪</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: T.text }}>No tests taken yet</div>
              <div style={{ fontSize: "12.5px", color: T.textFaint, marginTop: "4px" }}>Start a chapter test to track your progress</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              {results.map(r => {
                const pct = Math.round((r.score / r.total) * 100);
                return (
                  <div key={r.id} style={S.card}>
                    <div style={{ ...S.flexBetween, marginBottom: "5px" }}>
                      <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{r.tests?.title || "Test"}</div>
                      <div style={{ fontSize: "15px", fontWeight: "800", color: pct >= 75 ? T.g400 : pct >= 50 ? "#F59E0B" : "#EF4444" }}>{pct}%</div>
                    </div>
                    <div style={{ fontSize: "11.5px", color: T.textFaint, marginBottom: "7px" }}>
                      {r.score}/{r.total} correct · {r.time_taken ? `${Math.floor(r.time_taken / 60)}m ${r.time_taken % 60}s` : ""} · {new Date(r.created_at).toLocaleDateString("en-IN")}
                    </div>
                    <div style={S.pBar}><div style={S.pFill(pct, pct >= 75 ? T.g400 : pct >= 50 ? "#F59E0B" : "#EF4444")} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Heatmap */}
        <div>
          <h2 style={S.secTitle}>📅 Study Heatmap</h2>
          <div style={{ ...S.card, marginBottom: "14px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: "5px" }}>
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => <div key={i} style={{ textAlign: "center", fontSize: "10.5px", fontWeight: "600", color: T.textFaint, padding: "2px 0" }}>{d}</div>)}
              {[...Array(4)].map((_, i) => <div key={`p${i}`} />)}
              {heatData.map((d, i) => (
                <div key={i} title={`Day ${d.day}: ${d.intensity > 0 ? d.intensity * 30 + " min" : "No study"}`}
                  style={{ aspectRatio: "1", borderRadius: "4px", background: heatColors[d.intensity], cursor: "default", transition: "transform 0.1s" }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.3)"}
                  onMouseLeave={e => e.currentTarget.style.transform = ""} />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: "12px" }}>
              <span style={{ fontSize: "11px", color: T.textFaint }}>Less</span>
              {heatColors.map((c, i) => <div key={i} style={{ width: "12px", height: "12px", borderRadius: "3px", background: c }} />)}
              <span style={{ fontSize: "11px", color: T.textFaint }}>More</span>
            </div>
          </div>

          <h2 style={S.secTitle}>Concept Progress</h2>
          {progress.length === 0 ? (
            <div style={{ ...S.card, textAlign: "center", padding: "24px", color: T.textFaint }}>
              Start studying chapters to track concept progress here
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {progress.slice(0, 8).map((p, i) => (
                <div key={p.id} style={S.card}>
                  <div style={{ ...S.flexBetween, marginBottom: "5px" }}>
                    <span style={{ fontSize: "13px", fontWeight: "500" }}>{p.chapters?.chapter_name || `Concept ${i + 1}`}</span>
                    <span style={{ fontSize: "12.5px", fontWeight: "700", color: (p.progress_percentage || 0) >= 75 ? T.g400 : (p.progress_percentage || 0) >= 50 ? "#F59E0B" : "#EF4444" }}>
                      {p.progress_percentage || 0}%
                    </span>
                  </div>
                  <div style={S.pBar}><div style={S.pFill(p.progress_percentage || 0, (p.progress_percentage || 0) >= 75 ? T.g400 : "#F59E0B")} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FINAL ROOT APP ────────────────────────────────────────────────────────────
function ProfileView({ user }) {
  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: user?.full_name || user?.name || "", phone: user?.phone || "", class: user?.class || "1st PU" });
  const [results, setResults] = useState([]);
  const [sub, setSub] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const h = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => {
    async function load() {
      try {
        const [p, r, s] = await Promise.all([sb.getProfile(), sb.getResults(), sb.getSubscription()]);
        if (p) { setProfile(p); setForm({ full_name: p.full_name || "", phone: p.phone || "", class: p.class || "1st PU" }); }
        setResults(Array.isArray(r) ? r : []);
        setSub(s);
      } catch (e) { console.error(e); }
    }
    load();
  }, []);

  const saveProfile = async () => {
    try {
      await sb.updateProfile(form);
      setProfile(p => ({ ...p, ...form }));
      showToast("Profile updated!");
      setEditing(false);
    } catch { showToast("Error saving profile"); }
  };

  const xp = profile?.xp || 0;
  const level = getUserLevel(xp);
  const nextLevel = getNextLevel(xp);
  const levelPct = nextLevel ? Math.round((xp - level.minXP) / (nextLevel.minXP - level.minXP) * 100) : 100;
  const isPremium = sub?.plan_name !== "free" && sub !== null || profile?.subscription_plan !== "free";
  const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + Math.round((r.score / r.total) * 100), 0) / results.length) : 0;

  return (
    <div style={S.page}>
      {toast && <div style={{ position: "fixed", bottom: "24px", right: "24px", background: T.g800, color: "#fff", padding: "12px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "600", zIndex: 500 }}>✅ {toast}</div>}
      <h1 style={{ ...S.h1, marginBottom: "22px" }}>👤 My Profile</h1>
      <div style={{ display: "grid", gridTemplateColumns: "290px 1fr", gap: "18px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "13px" }}>
          <div style={{ ...S.card, textAlign: "center", padding: "26px 18px" }}>
            <div style={{ width: "76px", height: "76px", borderRadius: "50%", background: `linear-gradient(135deg,${T.g600},${T.g400})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", fontWeight: "800", color: "#fff", margin: "0 auto 13px" }}>
              {(profile?.full_name || profile?.email || "S")[0].toUpperCase()}
            </div>
            <div style={{ fontSize: "16px", fontWeight: "700" }}>{profile?.full_name || "Student"}</div>
            <div style={{ fontSize: "12.5px", color: T.textLight, marginTop: "2px" }}>{profile?.class || "1st PU"}</div>
            <div style={{ marginTop: "9px" }}>
              {isPremium ? <span style={S.badge(T.amber, "#FEF3C7")}>👑 Premium</span> : <span style={S.badge(T.textFaint, "#F3F4F6")}>🆓 Free Plan</span>}
            </div>
            <div style={{ marginTop: "11px" }}><XPBadge xp={xp} /></div>
            <div style={{ marginTop: "10px" }}><LevelBadge xp={xp} size="sm" /></div>
            {/* Level progress */}
            <div style={{ marginTop: "12px" }}>
              <div style={{ ...S.pBar }}><div style={S.pFill(levelPct, level.color)} /></div>
              <div style={{ fontSize: "11px", color: T.textFaint, marginTop: "4px" }}>
                {nextLevel ? `${(nextLevel.minXP - xp).toLocaleString()} XP to ${nextLevel.title}` : "Max Level!"}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px", marginTop: "13px" }}>
              {[["🔥", profile?.streak || 0, "Streak"], ["🧪", results.length, "Tests"], ["📊", avgScore + "%", "Avg Score"], ["📅", profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-IN", { month: "short", year: "numeric" }) : "—", "Joined"]].map(([ic, v, l], i) => (
                <div key={i} style={{ background: T.g25, borderRadius: "9px", padding: "9px 5px", textAlign: "center" }}>
                  <div style={{ fontSize: "15px" }}>{ic}</div>
                  <div style={{ fontSize: "14px", fontWeight: "800", color: T.g600 }}>{v}</div>
                  <div style={{ fontSize: "10px", color: T.textFaint }}>{l}</div>
                </div>
              ))}
            </div>
            {!isPremium && (
              <div style={{ marginTop: "14px", background: `linear-gradient(135deg,${T.g600},${T.g700})`, borderRadius: "11px", padding: "13px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#fff", marginBottom: "3px" }}>👑 Go Premium</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.62)", marginBottom: "9px" }}>Unlock all videos, notes, and AI analytics</div>
                <div style={{ fontSize: "20px", fontWeight: "900", color: "#fff" }}>₹999<span style={{ fontSize: "12px", fontWeight: "400" }}>/year</span></div>
                <button onClick={() => Razorpay.openCheckout({ amount: 999, name: "BioVerse", description: "Premium Yearly Plan", email: profile?.email || "", onSuccess: () => showToast("Payment successful! Premium activated.") })}
                  style={{ ...S.btn, background: "#fff", color: T.g600, width: "100%", justifyContent: "center", marginTop: "9px", fontSize: "12.5px", padding: "8px" }}>
                  Upgrade Now →
                </button>
              </div>
            )}
          </div>

          {/* Badges */}
          <div style={S.card}>
            <div style={{ fontSize: "13.5px", fontWeight: "700", marginBottom: "11px" }}>🏆 Achievements</div>
            {ALL_BADGES.filter(a => a.unlocked).map((a, i) => (
              <div key={a.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "7px 0", borderBottom: i < ALL_BADGES.filter(x => x.unlocked).length - 1 ? `1px solid ${T.border}` : "none" }}>
                <span style={{ fontSize: "19px" }}>{a.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontSize: "12px", fontWeight: "600" }}>{a.title}</div><div style={{ fontSize: "11px", color: T.textFaint }}>{a.desc}</div></div>
                <XPBadge xp={a.xp} />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h2 style={S.h3}>Personal Information</h2>
              {editing
                ? <button onClick={saveProfile} style={{ ...S.btn, background: `linear-gradient(135deg,${T.g600},${T.g400})`, color: "#fff", ...S.btnSm }}>Save Changes</button>
                : <button onClick={() => setEditing(true)} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>Edit Profile</button>}
            </div>
            {[
              { label: "Full Name", k: "full_name", type: "text" },
              { label: "Phone", k: "phone", type: "tel" },
            ].map(f => (
              <div key={f.k} style={{ marginBottom: "14px" }}>
                <label style={S.label}>{f.label}</label>
                {editing
                  ? <input style={S.input} type={f.type} value={form[f.k]} onChange={h(f.k)} />
                  : <div style={{ padding: "10px 13px", background: "#F9FAFB", borderRadius: "9px", fontSize: "14px", color: T.textMid }}>{profile?.[f.k] || "—"}</div>}
              </div>
            ))}
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Email</label>
              <div style={{ padding: "10px 13px", background: "#F9FAFB", borderRadius: "9px", fontSize: "14px", color: T.textFaint }}>{profile?.email || "—"}</div>
            </div>
            <div style={{ marginBottom: "14px" }}>
              <label style={S.label}>Class</label>
              {editing
                ? <select style={S.input} value={form.class} onChange={h("class")}><option>1st PU</option><option>2nd PU</option></select>
                : <div style={{ padding: "10px 13px", background: "#F9FAFB", borderRadius: "9px", fontSize: "14px", color: T.textMid }}>{profile?.class || "—"}</div>}
            </div>
          </div>

          {/* Recent Results */}
          <div style={{ ...S.card, marginTop: "14px" }}>
            <h2 style={{ ...S.h3, marginBottom: "14px" }}>📊 Recent Test Results</h2>
            {results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "20px", color: T.textFaint }}>No tests taken yet</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
                {results.slice(0, 5).map(r => {
                  const pct = Math.round((r.score / r.total) * 100);
                  return (
                    <div key={r.id} style={{ ...S.flexBetween }}>
                      <div>
                        <div style={{ fontSize: "13.5px", fontWeight: "600" }}>{r.tests?.title || "Test"}</div>
                        <div style={{ fontSize: "11.5px", color: T.textFaint }}>{r.score}/{r.total} · {new Date(r.created_at).toLocaleDateString("en-IN")}</div>
                      </div>
                      <span style={{ fontSize: "16px", fontWeight: "800", color: pct >= 75 ? T.g400 : pct >= 50 ? "#F59E0B" : "#EF4444" }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CONNECTED PROGRESS VIEW ──────────────────────────────────────────────────
function AdminPanel({ onBack }) {
  const [tab, setTab] = useState("overview");
  return (
    <div style={{ ...S.page, maxWidth:"100%" }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"18px" }}>
        <div><h1 style={S.h1}>⚙️ Admin Panel</h1><p style={S.sub}>Manage BioVerse content and students</p></div>
        <button onClick={onBack} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>← Exit Admin</button>
      </div>
      <div style={{ display:"flex", gap:6, marginBottom:"18px", flexWrap:"wrap" }}>
        {["overview","chapters","videos","questions","students"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{ ...S.btn, ...S.btnSm, background:tab===t?T.g600:"#fff", color:tab===t?"#fff":T.textMid, border:`1.5px solid ${tab===t?T.g600:T.border}`, textTransform:"capitalize" }}>{t}</button>
        ))}
      </div>
      {tab==="overview"&&(
        <div style={S.grid4}>
          {[["👥","1,247","Students"],["📚","32","Chapters"],["🎥","256","Videos"],["❓","1,089","Questions"]].map(([ic,v,l],i)=>(
            <div key={i} style={{ ...S.card, textAlign:"center" }}>
              <div style={{ fontSize:"26px", marginBottom:"5px" }}>{ic}</div>
              <div style={{ fontSize:"24px", fontWeight:"800", color:T.g600 }}>{v}</div>
              <div style={{ fontSize:"12px", color:T.textFaint }}>{l}</div>
            </div>
          ))}
        </div>
      )}
      {tab==="videos"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"13px" }}>
            <h2 style={S.h3}>Video Management</h2>
            <button style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>+ Add Video</button>
          </div>
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            {MOCK_VIDEOS.map((v,i)=>(
              <div key={v.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", borderBottom:i<MOCK_VIDEOS.length-1?`1px solid ${T.border}`:"none" }}>
                <span style={{ fontSize:"13px", fontWeight:"500" }}>{v.title}</span>
                <div style={{ display:"flex", gap:7 }}>
                  <span style={{ fontSize:"11.5px", color:T.textFaint }}>⏱ {v.duration}</span>
                  <button style={{ ...S.btn, ...S.btnSm, background:"#EEF2FF", color:T.purple, border:"none", padding:"4px 9px", fontSize:"11.5px" }}>Edit</button>
                  <button style={{ ...S.btn, ...S.btnSm, background:"#FEF2F2", color:T.red, border:"none", padding:"4px 9px", fontSize:"11.5px" }}>Del</button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, marginTop:"13px" }}>
            <h3 style={{ ...S.h3, marginBottom:"13px" }}>Add YouTube Video</h3>
            <label style={S.label}>Chapter</label>
            <select style={S.input}><option>Cell: The Unit of Life</option><option>Biomolecules</option></select>
            <label style={S.label}>Video Title</label><input style={S.input} placeholder="Enter video title..."/>
            <label style={S.label}>YouTube URL</label><input style={S.input} placeholder="https://www.youtube.com/watch?v=..."/>
            <button style={{ ...S.btn, ...S.btnPrimary, width:"auto", padding:"10px 20px" }}>Save Video</button>
          </div>
        </div>
      )}
      {tab==="questions"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"13px" }}>
            <h2 style={S.h3}>Question Management</h2>
            <button style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>+ Add Question</button>
          </div>
          <div style={S.card}>
            <h3 style={{ ...S.h3, marginBottom:"13px" }}>Add MCQ</h3>
            <div style={S.grid2}>
              <div><label style={S.label}>Chapter</label><select style={S.input}><option>Cell: The Unit of Life</option></select></div>
              <div><label style={S.label}>Type</label><select style={S.input}><option>KCET</option><option>NEET</option><option>PU</option></select></div>
            </div>
            <label style={S.label}>Question Text</label><textarea style={{ ...S.input, minHeight:"65px", resize:"vertical" }} placeholder="Enter question..."/>
            <div style={S.grid2}>
              {["A","B","C","D"].map(o=><div key={o}><label style={S.label}>Option {o}</label><input style={S.input} placeholder={`Option ${o}...`}/></div>)}
            </div>
            <div style={S.grid2}>
              <div><label style={S.label}>Correct Answer</label><select style={S.input}><option>A</option><option>B</option><option>C</option><option>D</option></select></div>
              <div><label style={S.label}>Difficulty</label><select style={S.input}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            </div>
            <label style={S.label}>Explanation</label><textarea style={{ ...S.input, minHeight:"55px" }} placeholder="Explain the answer..."/>
            <button style={{ ...S.btn, ...S.btnPrimary, width:"auto", padding:"10px 20px" }}>Save Question</button>
          </div>
        </div>
      )}
      {tab==="students"&&(
        <div>
          <h2 style={{ ...S.h3, marginBottom:"13px" }}>Student Management</h2>
          <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
            {[
              {name:"Priya Sharma",email:"priya@email.com",class:"2nd PU",plan:"Premium",progress:67,xp:4820},
              {name:"Rahul Kumar",email:"rahul@email.com",class:"1st PU",plan:"Free",progress:23,xp:1200},
              {name:"Ananya Reddy",email:"ananya@email.com",class:"2nd PU",plan:"Premium",progress:89,xp:3950},
              {name:"Suresh Patil",email:"suresh@email.com",class:"1st PU",plan:"Free",progress:12,xp:540},
            ].map((s,i)=>(
              <div key={i} style={{ display:"flex", alignItems:"center", gap:11, justifyContent:"space-between", padding:"13px 16px", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:"32px", height:"32px", borderRadius:"50%", background:`linear-gradient(135deg,${T.g600},${T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", flexShrink:0 }}>{s.name[0]}</div>
                  <div><div style={{ fontSize:"13px", fontWeight:"600" }}>{s.name}</div><div style={{ fontSize:"11.5px", color:T.textFaint }}>{s.email}</div></div>
                </div>
                <span style={{ fontSize:"12px", color:T.textFaint }}>{s.class}</span>
                <span style={S.badge(s.plan==="Premium"?T.amber:T.textFaint,s.plan==="Premium"?"#FEF3C7":"#F3F4F6")}>{s.plan==="Premium"?"👑 ":""}{s.plan}</span>
                <XPBadge xp={s.xp}/>
                <div style={{ fontSize:"12.5px", fontWeight:"700", color:T.g400 }}>{s.progress}%</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {tab==="chapters"&&(
        <div>
          <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"13px" }}>
            <h2 style={S.h3}>Chapter Management</h2>
            <button style={{ ...S.btn, ...S.btnPrimary, ...S.btnSm }}>+ Add Chapter</button>
          </div>
          {Object.entries(SYLLABUS).map(([level,data])=>(
            <div key={level} style={{ marginBottom:"18px" }}>
              <h3 style={{ ...S.h3, color:data.color, marginBottom:"9px" }}>{data.icon} {level}</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                {data.units.flatMap(u=>u.chapters).map((c,i)=>(
                  <div key={c.id} style={{ ...S.card, display:"flex", justifyContent:"space-between", alignItems:"center", padding:"11px 14px" }}>
                    <span style={{ fontSize:"13px", fontWeight:"500" }}>{c.title}</span>
                    <div style={{ display:"flex", gap:7 }}>
                      <span style={{ fontSize:"11.5px", color:T.textFaint }}>🎥 {c.videos} · 📝 {c.notes}</span>
                      <button style={{ ...S.btn, ...S.btnSm, background:"#EEF2FF", color:T.purple, border:"none", padding:"4px 9px", fontSize:"11.5px" }}>Edit</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 3 — ADMIN PANEL & CMS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── ADMIN DATA ───────────────────────────────────────────────────────────────

const ADMIN_USERS = [
  { id:"a1", name:"Dr. Ramesh Kumar", email:"admin@bioverse.in", role:"Super Admin", avatar:"R", lastLogin:"2025-06-24 09:12" },
  { id:"a2", name:"Priya Menon", email:"priya@bioverse.in", role:"Content Manager", avatar:"P", lastLogin:"2025-06-23 14:30" },
  { id:"a3", name:"Suresh Nair", email:"suresh@bioverse.in", role:"Teacher", avatar:"S", lastLogin:"2025-06-22 11:05" },
];

const ADMIN_ROLES = {
  "Super Admin":    { color:"#7C3AED", bg:"#EDE9FE", perms:["all"] },
  "Content Manager":{ color:"#0EA5E9", bg:"#E0F2FE", perms:["content","questions","notes","pyq"] },
  "Teacher":        { color:"#059669", bg:"#ECFDF5", perms:["videos","notes","tests"] },
};

const STUDENTS_DB = [
  { id:"s1", name:"Aisha Khan", email:"aisha@email.com", phone:"9876543210", class:"2nd PU", plan:"Premium", progress:78, tests:12, score:84, joined:"2025-01-15", lastLogin:"2025-06-24", status:"Active" },
  { id:"s2", name:"Ravi Sharma", email:"ravi@email.com", phone:"9123456789", class:"1st PU", plan:"Free", progress:23, tests:3, score:61, joined:"2025-02-20", lastLogin:"2025-06-22", status:"Active" },
  { id:"s3", name:"Meera Patil", email:"meera@email.com", phone:"9988776655", class:"2nd PU", plan:"Premium", progress:91, tests:18, score:92, joined:"2024-12-10", lastLogin:"2025-06-24", status:"Active" },
  { id:"s4", name:"Kiran Reddy", email:"kiran@email.com", phone:"8877665544", class:"1st PU", plan:"Free", progress:11, tests:1, score:45, joined:"2025-03-05", lastLogin:"2025-05-30", status:"Inactive" },
  { id:"s5", name:"Pooja Nair", email:"pooja@email.com", phone:"7766554433", class:"2nd PU", plan:"Premium", progress:65, tests:9, score:77, joined:"2025-01-28", lastLogin:"2025-06-23", status:"Active" },
  { id:"s6", name:"Arjun Menon", email:"arjun@email.com", phone:"6655443322", class:"1st PU", plan:"Free", progress:34, tests:5, score:58, joined:"2025-04-11", lastLogin:"2025-06-20", status:"Active" },
  { id:"s7", name:"Divya Singh", email:"divya@email.com", phone:"5544332211", class:"2nd PU", plan:"Premium", progress:88, tests:15, score:89, joined:"2024-11-20", lastLogin:"2025-06-24", status:"Active" },
  { id:"s8", name:"Rohit Kumar", email:"rohit@email.com", phone:"4433221100", class:"1st PU", plan:"Free", progress:5, tests:0, score:0, joined:"2025-06-01", lastLogin:"2025-06-02", status:"Inactive" },
];

const VIDEOS_DB = [
  { id:"v1", title:"Introduction to Cell Biology", chapter:"Cell: The Unit of Life", unit:"Unit III", youtubeId:"URUJD5NEXC8", duration:"18:32", views:1240, uploadedBy:"Suresh Nair", date:"2025-01-10", status:"Published" },
  { id:"v2", title:"Photosynthesis – Light Reactions", chapter:"Photosynthesis in Higher Plants", unit:"Unit IV", youtubeId:"g78utcLQrJ4", duration:"22:14", views:980, uploadedBy:"Suresh Nair", date:"2025-01-15", status:"Published" },
  { id:"v3", title:"DNA Structure & Replication", chapter:"Molecular Basis of Inheritance", unit:"Unit VII", youtubeId:"8kK2zwjRV0M", duration:"25:47", views:1560, uploadedBy:"Suresh Nair", date:"2025-01-20", status:"Published" },
  { id:"v4", title:"Meiosis vs Mitosis", chapter:"Cell Cycle and Cell Division", unit:"Unit III", youtubeId:"URUJD5NEXC8", duration:"20:11", views:870, uploadedBy:"Suresh Nair", date:"2025-02-05", status:"Published" },
  { id:"v5", title:"Ecosystem Energy Flow", chapter:"Ecosystem", unit:"Unit X", youtubeId:"g78utcLQrJ4", duration:"16:45", views:640, uploadedBy:"Priya Menon", date:"2025-02-18", status:"Draft" },
];

const NOTES_DB = [
  { id:"n1", title:"Cell Biology – Complete Notes", chapter:"Cell: The Unit of Life", pages:24, size:"2.4 MB", downloads:890, date:"2025-01-12", status:"Published", type:"PDF" },
  { id:"n2", title:"Genetics Quick Revision", chapter:"Principles of Inheritance", pages:14, size:"1.1 MB", downloads:1120, date:"2025-01-18", status:"Published", type:"PDF" },
  { id:"n3", title:"Photosynthesis Mind Map", chapter:"Photosynthesis in Higher Plants", pages:8, size:"0.8 MB", downloads:760, date:"2025-01-25", status:"Published", type:"PDF" },
  { id:"n4", title:"Human Physiology Diagrams", chapter:"Body Fluids and Circulation", pages:32, size:"3.2 MB", downloads:540, date:"2025-02-10", status:"Draft", type:"PDF" },
];

const QUESTIONS_DB = [
  { id:"q1", text:"Which organelle is the powerhouse of the cell?", options:["Nucleus","Mitochondria","Ribosome","Golgi"], correct:1, type:"KCET", difficulty:"Easy", chapter:"Cell: The Unit of Life", explanation:"Mitochondria produce ATP.", attempts:1240, correct_pct:88 },
  { id:"q2", text:"Photosynthesis occurs in:", options:["Mitochondria","Nucleus","Chloroplast","ER"], correct:2, type:"NEET", difficulty:"Easy", chapter:"Photosynthesis in Higher Plants", explanation:"Chloroplasts contain chlorophyll.", attempts:980, correct_pct:91 },
  { id:"q3", text:"Which is NOT a type of RNA?", options:["mRNA","tRNA","rRNA","dRNA"], correct:3, type:"KCET", difficulty:"Medium", chapter:"Molecular Basis of Inheritance", explanation:"dRNA does not exist.", attempts:760, correct_pct:72 },
  { id:"q4", text:"Functional unit of kidney:", options:["Neuron","Nephron","Axon","Glomerulus"], correct:1, type:"PU", difficulty:"Easy", chapter:"Excretory Products", explanation:"Nephron filters blood.", attempts:1100, correct_pct:85 },
  { id:"q5", text:"Chromosomes align at equator during:", options:["Prophase","Anaphase","Metaphase","Telophase"], correct:2, type:"NEET", difficulty:"Medium", chapter:"Cell Cycle and Cell Division", explanation:"Metaphase — chromosomes line up.", attempts:890, correct_pct:78 },
];

const TESTS_DB = [
  { id:"t1", title:"Cell Biology Chapter Test", type:"Chapter", questions:15, time:20, chapter:"Cell: The Unit of Life", difficulty:"Medium", attempts:234, avgScore:74, status:"Published" },
  { id:"t2", title:"Unit I – Diversity Mock", type:"Unit", questions:40, time:50, chapter:"Unit I", difficulty:"Medium", attempts:178, avgScore:68, status:"Published" },
  { id:"t3", title:"KCET Full Mock Test 1", type:"Mock", questions:60, time:80, chapter:"Full Syllabus", difficulty:"Hard", attempts:89, avgScore:61, status:"Published" },
  { id:"t4", title:"Genetics Quick Test", type:"Chapter", questions:10, time:15, chapter:"Principles of Inheritance", difficulty:"Easy", attempts:312, avgScore:81, status:"Published" },
  { id:"t5", title:"NEET Biology Mock 1", type:"Mock", questions:90, time:180, chapter:"Full Syllabus", difficulty:"Hard", attempts:45, avgScore:58, status:"Draft" },
];

const SUBSCRIPTIONS_DB = [
  { id:"p1", name:"Free", price:0, duration:"Forever", features:["Sample videos","Basic notes","10 Qs/chapter"], active:true, subscribers:1089 },
  { id:"p2", name:"Premium Monthly", price:149, duration:"1 Month", features:["All videos","Complete notes","All questions","Analytics"], active:true, subscribers:234 },
  { id:"p3", name:"Premium Yearly", price:999, duration:"1 Year", features:["Everything in Monthly","Priority support","Offline access"], active:true, subscribers:456 },
];

const NOTIFICATIONS_DB = [
  { id:"notif1", title:"New Chapter: Biotechnology Applications", body:"Chapter notes and 3 videos uploaded", type:"Content", sent:"2025-06-20", reach:1247 },
  { id:"notif2", title:"KCET Mock Test Available", body:"Full KCET Mock Test 2 is now live!", type:"Test", sent:"2025-06-18", reach:890 },
  { id:"notif3", title:"Exam Tip: Revision Strategy", body:"3 weeks to KCET — here's your plan", type:"Announcement", sent:"2025-06-15", reach:1247 },
];

const AUDIT_LOG = [
  { id:"al1", admin:"Dr. Ramesh Kumar", action:"Added video: DNA Replication", time:"2025-06-24 09:45", type:"Video" },
  { id:"al2", admin:"Priya Menon", action:"Uploaded notes: Genetics PDF", time:"2025-06-24 08:30", type:"Notes" },
  { id:"al3", admin:"Suresh Nair", action:"Created test: KCET Full Mock 2", time:"2025-06-23 16:20", type:"Test" },
  { id:"al4", admin:"Dr. Ramesh Kumar", action:"Suspended student: John Doe", time:"2025-06-23 14:10", type:"Student" },
  { id:"al5", admin:"Priya Menon", action:"Added 15 NEET questions (bulk)", time:"2025-06-22 11:35", type:"Question" },
];

// Monthly analytics data
const MONTHLY_STUDENTS = [120,180,240,310,390,480,560,680,780,920,1080,1247];
const MONTHLY_REVENUE  = [8000,14000,22000,31000,42000,54000,68000,82000,97000,115000,134000,156000];
const CHAPTER_VIEWS = [
  { name:"Cell: The Unit of Life", views:3240 },
  { name:"DNA & Inheritance", views:2980 },
  { name:"Photosynthesis", views:2760 },
  { name:"Human Physiology", views:2540 },
  { name:"Genetics", views:2310 },
  { name:"Ecosystem", views:1890 },
];


// ─── ADMIN DESIGN TOKENS ──────────────────────────────────────────────────────

const A = {
  navy:  "#0F172A", navyMid:"#1E293B", navyLight:"#334155",
  slate: "#475569", slateLight:"#94A3B8", slateFaint:"#CBD5E1",
  bg:    "#F1F5F9", surface:"#FFFFFF",
  border:"#E2E8F0",
  purple:"#7C3AED", purpleLight:"#EDE9FE",
  green: "#059669", greenLight:"#ECFDF5",
  blue:  "#2563EB", blueLight:"#EFF6FF",
  amber: "#D97706", amberLight:"#FEF3C7",
  red:   "#DC2626", redLight:"#FEF2F2",
  sky:   "#0EA5E9", skyLight:"#E0F2FE",
};

const AS = {
  sidebar: { width:"230px", background:A.navy, display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, height:"100vh", zIndex:200, overflowY:"auto" },
  topbar: { background:A.surface, borderBottom:`1px solid ${A.border}`, padding:"13px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", position:"sticky", top:0, zIndex:100 },
  card: { background:A.surface, borderRadius:"14px", padding:"20px", border:`1px solid ${A.border}`, boxShadow:"0 1px 4px rgba(0,0,0,0.05)" },
  page: { padding:"24px 28px", maxWidth:"1300px" },
  btn: { padding:"9px 18px", borderRadius:"9px", border:"none", cursor:"pointer", fontSize:"13px", fontWeight:"600", transition:"all 0.17s", display:"inline-flex", alignItems:"center", gap:"7px" },
  btnPrimary: { background:`linear-gradient(135deg,${A.purple},#6D28D9)`, color:"#fff" },
  btnOutline: { background:"transparent", border:`1.5px solid ${A.border}`, color:A.slate },
  btnDanger: { background:A.red, color:"#fff" },
  btnGhost: { background:"transparent", border:"none", color:A.slateLight },
  btnSm: { padding:"6px 12px", fontSize:"12px", borderRadius:"7px" },
  input: { width:"100%", padding:"9px 13px", borderRadius:"9px", border:`1.5px solid ${A.border}`, fontSize:"13.5px", outline:"none", background:"#F8FAFC", color:A.navyMid, boxSizing:"border-box", marginBottom:"12px" },
  label: { fontSize:"11px", fontWeight:"700", color:A.slate, display:"block", marginBottom:"5px", textTransform:"uppercase", letterSpacing:"0.07em" },
  navItem: { display:"flex", alignItems:"center", gap:"10px", padding:"9px 14px", borderRadius:"8px", cursor:"pointer", color:"rgba(255,255,255,0.58)", fontSize:"13px", fontWeight:"500", border:"none", background:"transparent", width:"100%", textAlign:"left", transition:"all 0.16s" },
  navActive: { background:"rgba(255,255,255,0.12)", color:"#fff" },
  navSection: { fontSize:"10px", fontWeight:"700", color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:"0.1em", padding:"10px 14px 3px" },
  grid2: { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"14px" },
  grid3: { display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" },
  grid4: { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"13px" },
  flex: (g=10) => ({ display:"flex", alignItems:"center", gap:g }),
  flexB: { display:"flex", alignItems:"center", justifyContent:"space-between" },
  flexCol: (g=10) => ({ display:"flex", flexDirection:"column", gap:g }),
  h1: { fontSize:"22px", fontWeight:"800", color:A.navy, margin:0 },
  h2: { fontSize:"17px", fontWeight:"700", color:A.navy, margin:0 },
  h3: { fontSize:"14px", fontWeight:"700", color:A.navy, margin:0 },
  sub: { fontSize:"12.5px", color:A.slateLight, margin:0 },
  secTitle: { fontSize:"15px", fontWeight:"700", color:A.navy, margin:"0 0 13px" },
  badge: (c,bg) => ({ background:bg, color:c, padding:"3px 9px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600" }),
  tag: (type) => {
    const m = { Published:{c:"#059669",bg:"#ECFDF5"}, Draft:{c:"#D97706",bg:"#FEF3C7"}, Active:{c:"#059669",bg:"#ECFDF5"}, Inactive:{c:"#DC2626",bg:"#FEF2F2"}, "Super Admin":{c:"#7C3AED",bg:"#EDE9FE"}, "Content Manager":{c:"#0EA5E9",bg:"#E0F2FE"}, Teacher:{c:"#059669",bg:"#ECFDF5"}, Premium:{c:"#D97706",bg:"#FEF3C7"}, Free:{c:"#94A3B8",bg:"#F1F5F9"}, Easy:{c:"#059669",bg:"#ECFDF5"}, Medium:{c:"#D97706",bg:"#FEF3C7"}, Hard:{c:"#DC2626",bg:"#FEF2F2"}, KCET:{c:"#6366F1",bg:"#EEF2FF"}, NEET:{c:"#D97706",bg:"#FEF3C7"}, PU:{c:"#059669",bg:"#ECFDF5"}, Chapter:{c:"#0EA5E9",bg:"#E0F2FE"}, Unit:{c:"#7C3AED",bg:"#EDE9FE"}, Mock:{c:"#DC2626",bg:"#FEF2F2"} };
    const t = m[type]||{c:A.slate,bg:A.border};
    return { background:t.bg, color:t.c, padding:"3px 8px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"600" };
  },
  pBar: { height:"5px", background:A.border, borderRadius:"99px", overflow:"hidden" },
  pFill: (p,c="#059669") => ({ height:"100%", width:`${p}%`, background:c, borderRadius:"99px" }),
  divider: { height:"1px", background:A.border, margin:"14px 0" },
  table: { width:"100%", borderCollapse:"collapse" },
  th: { padding:"10px 14px", textAlign:"left", fontSize:"11px", fontWeight:"700", color:A.slateLight, textTransform:"uppercase", letterSpacing:"0.06em", borderBottom:`1.5px solid ${A.border}`, background:"#F8FAFC" },
  td: { padding:"12px 14px", fontSize:"13px", color:A.navyMid, borderBottom:`1px solid ${A.border}` },
};

// Small admin bar chart (SVG)
const AdminBarChart = ({ data, height=70, color=A.purple }) => {
  const max = Math.max(...data.map(d=>d.val),1), w=100/data.length;
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width:"100%", height }} preserveAspectRatio="none">
      {data.map((d,i)=>{
        const bh=(d.val/max)*(height-12), x=i*w+w*0.18, bw=w*0.64;
        return <rect key={i} x={x} y={height-bh-10} width={bw} height={bh} rx="2" fill={color} opacity={0.7+(i/data.length)*0.3}/>;
      })}
    </svg>
  );
};

// Admin line sparkline
const AdminLine = ({ data, height=50, color=A.purple }) => {
  const max=Math.max(...data,1);
  const pts=data.map((v,i)=>`${(i/(data.length-1))*100},${height-(v/max)*height*0.85-3}`).join(" ");
  return (
    <svg viewBox={`0 0 100 ${height}`} style={{ width:"100%", height }} preserveAspectRatio="none">
      <defs><linearGradient id="alg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0"/></linearGradient></defs>
      <polyline points={pts+` 100,${height} 0,${height}`} fill="url(#alg)" stroke="none"/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
};

// Modal wrapper
function Modal({ title, onClose, children, width="540px" }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:A.surface, borderRadius:"16px", width:"100%", maxWidth:width, maxHeight:"88vh", overflowY:"auto", boxShadow:"0 24px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ ...AS.flexB, padding:"18px 22px", borderBottom:`1px solid ${A.border}` }}>
          <span style={{ fontSize:"16px", fontWeight:"700", color:A.navy }}>{title}</span>
          <button onClick={onClose} style={{ ...AS.btn, ...AS.btnGhost, padding:"5px" }}>✕</button>
        </div>
        <div style={{ padding:"22px" }}>{children}</div>
      </div>
    </div>
  );
}

// Confirm dialog
function Confirm({ message, onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:1100, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:A.surface, borderRadius:"14px", padding:"28px", maxWidth:"380px", width:"100%", textAlign:"center", boxShadow:"0 20px 50px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize:"36px", marginBottom:"12px" }}>⚠️</div>
        <div style={{ fontSize:"15px", fontWeight:"600", color:A.navy, marginBottom:"8px" }}>Are you sure?</div>
        <div style={{ fontSize:"13px", color:A.slateLight, marginBottom:"22px" }}>{message}</div>
        <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
          <button onClick={onCancel} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          <button onClick={onConfirm} style={{ ...AS.btn, ...AS.btnDanger }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}


// ─── ADMIN SIDEBAR ────────────────────────────────────────────────────────────

function AdminSidebar({ active, onNav, admin, isMobile, open, onClose }) {
  const allSections = [
    { label:null, items:[
      { key:"adminDash", label:"Dashboard", icon:"📊" },
    ]},
    { label:"Content", items:[
      { key:"cms", label:"Content CMS", icon:"📚", perms:["all","content"] },
      { key:"videos", label:"Videos", icon:"🎥", perms:["all","content","videos"] },
      { key:"notes", label:"Notes", icon:"📝", perms:["all","content","notes"] },
    ]},
    { label:"Assessment", items:[
      { key:"questions", label:"Question Bank", icon:"❓", perms:["all","content","questions"] },
      { key:"pyqAdmin", label:"PYQ Manager", icon:"📄", perms:["all","content","pyq"] },
      { key:"testBuilder", label:"Test Builder", icon:"🧪", perms:["all","content","tests"] },
    ]},
    { label:"Students", items:[
      { key:"students", label:"Students", icon:"👥", perms:["all"] },
      { key:"subscriptions", label:"Subscriptions", icon:"💳", perms:["all"] },
    ]},
    { label:"Platform", items:[
      { key:"analytics", label:"Analytics", icon:"📈", perms:["all"] },
      { key:"notifications", label:"Notifications", icon:"📢", perms:["all"] },
      { key:"bulkImport", label:"Bulk Import", icon:"📥", perms:["all"] },
      { key:"auditLog", label:"Audit Log", icon:"🛡️", perms:["all"] },
    ]},
    { label:"Settings", items:[
      { key:"adminSettings", label:"Settings", icon:"⚙️", perms:["all"] },
    ]},
  ];

  const rolePerms = ADMIN_ROLES[admin?.role]?.perms || [];
  const canSee = (perms) => perms.includes("all") || rolePerms.includes("all") || perms.some(p=>rolePerms.includes(p));

  const sidebarSt = { ...AS.sidebar, ...(isMobile?{ transform:open?"translateX(0)":"translateX(-100%)", boxShadow:open?"4px 0 24px rgba(0,0,0,0.4)":"none" }:{}) };

  return (
    <>
      {isMobile&&open&&<div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:199 }}/>}
      <div style={sidebarSt}>
        {/* Logo */}
        <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>⚙️</div>
            <div>
              <div style={{ fontSize:"14px", fontWeight:"800", color:"#fff" }}>BioVerse</div>
              <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.38)", marginTop:"1px" }}>Admin Panel</div>
            </div>
          </div>
        </div>
        {/* Admin mini-profile */}
        <div style={{ padding:"12px 14px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:9 }}>
            <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"13px", flexShrink:0 }}>{admin?.avatar||"A"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"12px", fontWeight:"600", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{admin?.name}</div>
              <div style={{ ...AS.badge(ADMIN_ROLES[admin?.role]?.color||"#fff", ADMIN_ROLES[admin?.role]?.bg||"rgba(255,255,255,0.1)"), fontSize:"10px", marginTop:"2px", display:"inline-flex" }}>{admin?.role}</div>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav style={{ flex:1, padding:"8px 8px", display:"flex", flexDirection:"column", gap:1 }}>
          {allSections.map((sec,si)=>(
            <div key={si}>
              {sec.label&&<div style={AS.navSection}>{sec.label}</div>}
              {sec.items.filter(item=>!item.perms||canSee(item.perms)).map(item=>(
                <button key={item.key} onClick={()=>{onNav(item.key);if(isMobile)onClose();}}
                  style={{ ...AS.navItem, ...(active===item.key?AS.navActive:{}) }}>
                  <span style={{ fontSize:"14px" }}>{item.icon}</span>{item.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <div style={{ padding:"10px 8px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={()=>onNav("exitAdmin")} style={{ ...AS.navItem, color:"rgba(255,100,100,0.72)", fontSize:"12px" }}>
            🚪 Exit Admin
          </button>
        </div>
      </div>
    </>
  );
}


// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────

function AdminDashboard({ admin }) {
  const [stats, setStats] = useState({ totalStudents:0, activeStudents:0, premiumStudents:0, totalVideos:0, totalQuestions:0, totalTests:0, activeSubscriptions:0 });
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    async function load() {
      try {
        const [s, students] = await Promise.all([sb.adminStats(), sb.getStudents()]);
        setStats(s||{});
        setRecentStudents(Array.isArray(students)?students.slice(0,5):[]);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[]);

  const kpiCards = [
    { label:"Total Students",    value:stats.totalStudents,        icon:"👥", c:"#7C3AED", bg:"#EDE9FE" },
    { label:"Active (7 days)",   value:stats.activeStudents,       icon:"🟢", c:"#059669", bg:"#ECFDF5" },
    { label:"Premium Students",  value:stats.premiumStudents,      icon:"👑", c:"#D97706", bg:"#FEF3C7" },
    { label:"Videos",            value:stats.totalVideos,          icon:"🎥", c:"#0EA5E9", bg:"#E0F2FE" },
    { label:"Questions",         value:stats.totalQuestions,       icon:"❓", c:"#7C3AED", bg:"#EDE9FE" },
    { label:"Tests",             value:stats.totalTests,           icon:"🧪", c:"#DC2626", bg:"#FEF2F2" },
    { label:"Active Subs",       value:stats.activeSubscriptions,  icon:"💳", c:"#059669", bg:"#ECFDF5" },
    { label:"Admin Role",        value:admin?.role||"—",           icon:"🛡️", c:"#475569", bg:"#F1F5F9" },
  ];

  if(loading) return <div style={{ ...AS.page, paddingTop:"40px", textAlign:"center", color:A.slateLight }}>Loading dashboard…</div>;

  return (
    <div style={AS.page}>
      <div style={{ ...AS.flexB, marginBottom:"22px" }}>
        <div>
          <h1 style={{ ...AS.h1, marginBottom:"3px" }}>Admin Dashboard</h1>
          <p style={AS.sub}>Welcome back, {admin?.name} · {new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long"})}</p>
        </div>
        <span style={AS.badge(A.green,A.greenLight)}>● Platform Live</span>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"13px", marginBottom:"22px" }}>
        {kpiCards.map((k,i)=>(
          <div key={i} style={{ ...AS.card, padding:"16px" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"10px" }}>
              <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:k.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px" }}>{k.icon}</div>
            </div>
            <div style={{ fontSize:"24px", fontWeight:"800", color:k.c }}>{k.value}</div>
            <div style={{ fontSize:"11.5px", color:A.slateLight, marginTop:"2px" }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={AS.card}>
        <h3 style={{ ...AS.h3, marginBottom:"14px" }}>👥 Recent Students</h3>
        {recentStudents.length === 0 ? (
          <div style={{ textAlign:"center", padding:"24px", color:A.slateLight }}>No students registered yet</div>
        ) : (
          <table style={AS.table}>
            <thead><tr>{["Name","Email","Class","Plan","XP","Joined"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
            <tbody>
              {recentStudents.map(s=>(
                <tr key={s.id}>
                  <td style={AS.td}><div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11px", fontWeight:"700" }}>{(s.full_name||s.email||"?")[0].toUpperCase()}</div>
                    {s.full_name||"—"}
                  </div></td>
                  <td style={AS.td}>{s.email}</td>
                  <td style={AS.td}>{s.class||"—"}</td>
                  <td style={AS.td}><span style={AS.tag(s.subscription_plan==="free"?"Free":"Premium")}>{s.subscription_plan==="free"?"Free":"👑 Premium"}</span></td>
                  <td style={AS.td}><span style={{ fontWeight:"700", color:A.purple }}>⚡{s.xp||0}</span></td>
                  <td style={{ ...AS.td, fontSize:"11.5px", color:A.slateLight }}>{s.created_at?new Date(s.created_at).toLocaleDateString("en-IN"):"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── CONNECTED VIDEO MANAGER ──────────────────────────────────────────────────
function ContentCMS() {
  const [level, setLevel] = useState("1st PU");
  const [expanded, setExpanded] = useState(null);
  const [modal, setModal] = useState(null); // {type, data}
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");

  const showToast = (msg) => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const data = SYLLABUS[level];

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500, boxShadow:"0 8px 24px rgba(0,0,0,0.2)" }}>✅ {toast}</div>}

      <div style={{ ...AS.flexB, marginBottom:"22px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>📚 Content CMS</h1><p style={AS.sub}>Manage units, chapters, and concepts for the full syllabus</p></div>
        <div style={AS.flex(8)}>
          {["1st PU","2nd PU"].map(l=>(
            <button key={l} onClick={()=>setLevel(l)} style={{ ...AS.btn, background:level===l?A.purple:"#fff", color:level===l?"#fff":A.slate, border:`1.5px solid ${level===l?A.purple:A.border}` }}>{l}</button>
          ))}
          <button onClick={()=>setModal({type:"addUnit"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Add Unit</button>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"11px" }}>
        {data.units.map((unit,ui)=>(
          <div key={unit.id}>
            {/* Unit row */}
            <div style={{ ...AS.card, padding:"14px 18px", display:"flex", alignItems:"center", justifyContent:"space-between", background: expanded===unit.id?"#F8F7FF":A.surface, borderColor: expanded===unit.id?A.purple:A.border, cursor:"pointer" }}
              onClick={()=>setExpanded(expanded===unit.id?null:unit.id)}>
              <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ width:"30px", height:"30px", borderRadius:"8px", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:"700" }}>{ui+1}</div>
                <div>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:A.navy }}>{unit.title}</div>
                  <div style={{ fontSize:"11.5px", color:A.slateLight }}>{unit.chapters.length} chapters</div>
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:7 }} onClick={e=>e.stopPropagation()}>
                <button onClick={()=>setModal({type:"editUnit",data:unit})} style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️ Edit</button>
                <button onClick={()=>setConfirm({msg:`Delete "${unit.title}"?`, onOk:()=>{showToast("Unit deleted.");setConfirm(null);}})} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑 Delete</button>
                <button onClick={()=>setModal({type:"addChapter",data:{unitId:unit.id,unitTitle:unit.title}})} style={{ ...AS.btn, ...AS.btnSm, ...AS.btnPrimary }}>+ Chapter</button>
                <span style={{ color:A.slateLight, fontSize:"16px", marginLeft:"4px" }}>{expanded===unit.id?"▲":"▼"}</span>
              </div>
            </div>

            {/* Chapters */}
            {expanded===unit.id&&(
              <div style={{ marginTop:"5px", display:"flex", flexDirection:"column", gap:"5px", paddingLeft:"16px" }}>
                {unit.chapters.map((ch,ci)=>(
                  <div key={ch.id} style={{ ...AS.card, padding:"12px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:11 }}>
                      <span style={{ fontSize:"10.5px", fontWeight:"700", color:A.slateLight, width:"22px", textAlign:"center" }}{...{}}>{ci+1}</span>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{ch.title}</div>
                        <div style={{ fontSize:"11.5px", color:A.slateLight }}>🎥 {ch.videos} videos · 📝 {ch.notes} notes · 💡 {ch.concepts} concepts</div>
                      </div>
                    </div>
                    <div style={{ display:"flex", gap:6 }}>
                      <button onClick={()=>setModal({type:"editChapter",data:ch})} style={{ ...AS.btn, ...AS.btnSm, background:A.blueLight, color:A.blue, border:"none" }}>✏️ Edit</button>
                      <button onClick={()=>setModal({type:"addConcept",data:{chapterId:ch.id}})} style={{ ...AS.btn, ...AS.btnSm, background:A.greenLight, color:A.green, border:"none" }}>+ Concept</button>
                      <button onClick={()=>setConfirm({msg:`Delete "${ch.title}"?`,onOk:()=>{showToast("Chapter deleted.");setConfirm(null);}})} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modals */}
      {modal?.type==="addUnit"&&(
        <Modal title="Add New Unit" onClose={()=>setModal(null)}>
          <label style={AS.label}>Unit Title</label><input style={AS.input} placeholder="e.g. Unit XI – New Topic"/>
          <label style={AS.label}>Level</label><select style={AS.input}><option>1st PU</option><option>2nd PU</option></select>
          <label style={AS.label}>Unit Number</label><input style={AS.input} type="number" placeholder="11"/>
          <div style={{ display:"flex", gap:8, marginTop:"4px" }}>
            <button onClick={()=>{showToast("Unit added!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Save Unit</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {modal?.type==="editUnit"&&(
        <Modal title="Edit Unit" onClose={()=>setModal(null)}>
          <label style={AS.label}>Unit Title</label><input style={AS.input} defaultValue={modal.data?.title}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Unit updated!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Save Changes</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {modal?.type==="addChapter"&&(
        <Modal title={`Add Chapter — ${modal.data?.unitTitle}`} onClose={()=>setModal(null)}>
          <label style={AS.label}>Chapter Title</label><input style={AS.input} placeholder="e.g. Biotechnology Tools"/>
          <label style={AS.label}>Expected Videos</label><input style={AS.input} type="number" defaultValue="5"/>
          <label style={AS.label}>Expected Notes</label><input style={AS.input} type="number" defaultValue="3"/>
          <label style={AS.label}>Expected Concepts</label><input style={AS.input} type="number" defaultValue="10"/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Chapter added!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Save Chapter</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {modal?.type==="editChapter"&&(
        <Modal title="Edit Chapter" onClose={()=>setModal(null)}>
          <label style={AS.label}>Chapter Title</label><input style={AS.input} defaultValue={modal.data?.title}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            <div><label style={AS.label}>Videos</label><input style={AS.input} type="number" defaultValue={modal.data?.videos}/></div>
            <div><label style={AS.label}>Notes</label><input style={AS.input} type="number" defaultValue={modal.data?.notes}/></div>
            <div><label style={AS.label}>Concepts</label><input style={AS.input} type="number" defaultValue={modal.data?.concepts}/></div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Chapter updated!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Save Changes</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {modal?.type==="addConcept"&&(
        <Modal title="Add Concept" onClose={()=>setModal(null)}>
          <label style={AS.label}>Concept Name</label><input style={AS.input} placeholder="e.g. Restriction Enzymes"/>
          <label style={AS.label}>Description</label><textarea style={{ ...AS.input, minHeight:"70px", resize:"vertical" }} placeholder="Brief description..."/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Concept added!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Save Concept</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {confirm&&<Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}


// ─── VIDEO MANAGEMENT ─────────────────────────────────────────────────────────

// ─── VIDEO MANAGER — hierarchical Unit → Chapter → Concept tree ───────────────

function VideoManager() {
  const [units,    setUnits]    = useState([]);
  const [videos,   setVideos]   = useState([]);   // all videos flat list
  const [modal,    setModal]    = useState(null);  // {type:"add"|"edit", chapterId, conceptId, unitName, chapterName, conceptName, data}
  const [confirm,  setConfirm]  = useState(null);
  const [toast,    setToast]    = useState("");
  const [saveError, setSaveError] = useState("");
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("tree"); // "tree" | "list"
  const [search,   setSearch]   = useState("");
  const [expanded, setExpanded] = useState({});   // {unitId: bool, chapterId: bool}
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2800); };

  // Load units (with chapters) + all videos
  useEffect(()=>{
    async function load() {
      try {
        const [u1, u2, v] = await Promise.all([
          sb.getUnits("1st PU"),
          sb.getUnits("2nd PU"),
          sb.getAllVideos(),
        ]);
        // Merge both PU levels; fall back to SYLLABUS static data if DB empty
        const dbUnits = [
          ...(Array.isArray(u1) && u1.length ? u1 : []),
          ...(Array.isArray(u2) && u2.length ? u2 : []),
        ];
        if (dbUnits.length > 0) {
          setUnits(dbUnits);
        } else {
          // Build fallback from SYLLABUS constant
          const fallback = [
            ...SYLLABUS["1st PU"].units.map(u=>({
              ...u, id: u.id||u.title, name: u.title, level:"1st PU",
              chapters: u.chapters.map(c=>({...c, id:c.id||c.title, chapter_name:c.title, concepts:[]}))
            })),
            ...SYLLABUS["2nd PU"].units.map(u=>({
              ...u, id: u.id||u.title, name: u.title, level:"2nd PU",
              chapters: u.chapters.map(c=>({...c, id:c.id||c.title, chapter_name:c.title, concepts:[]}))
            })),
          ];
          setUnits(fallback);
        }
        setVideos(Array.isArray(v) ? v : []);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[]);

  // Save (add or edit) video
  const saveVideo = async (formData) => {
    setSaveError("");
    try {
      if (modal.type === "edit") {
        await sb.updateVideo(modal.data.id, formData);
        setVideos(vs => vs.map(v => v.id === modal.data.id ? {...v,...formData} : v));
        showToast("Video updated successfully!");
      } else {
        const r = await sb.addVideo(formData);
        setVideos(vs => [{ ...r[0], chapters: { chapter_name: modal.chapterName||"" } }, ...vs]);
        showToast(`Video added to "${modal.chapterName}"!`);
      }
      setModal(null);
    } catch (e) {
      setSaveError(e.message || "Error saving video — try again.");
    }
  };

  const deleteVideo = async (id, title) => {
    await sb.deleteVideo(id);
    setVideos(vs => vs.filter(v => v.id !== id));
    showToast(`"${title}" deleted.`);
    setConfirm(null);
  };

  // Count videos belonging to a chapter
  const chapterVideoCount = (chapterId) =>
    videos.filter(v => v.chapter_id === chapterId || v.chapters?.id === chapterId).length;

  const getChapterVideos = (chapterId) =>
    videos.filter(v => v.chapter_id === chapterId || v.chapters?.id === chapterId);

  const toggle = (key) => setExpanded(e => ({...e, [key]: !e[key]}));

  // Filter for list view
  const filtered = videos.filter(v =>
    !search ||
    (v.title||"").toLowerCase().includes(search.toLowerCase()) ||
    (v.chapters?.chapter_name||"").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div style={{ ...AS.page, paddingTop:"60px", textAlign:"center" }}>
      <div style={{ fontSize:"36px", marginBottom:"12px" }}>🎥</div>
      <div style={{ fontSize:"14px", color:A.slateLight }}>Loading syllabus and videos…</div>
    </div>
  );

  return (
    <div style={AS.page}>
      {toast && (
        <div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 22px", borderRadius:"12px", fontSize:"13px", fontWeight:"600", zIndex:600, boxShadow:"0 8px 24px rgba(0,0,0,0.22)", display:"flex", alignItems:"center", gap:9 }}>
          ✅ {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div>
          <h1 style={{ ...AS.h1, marginBottom:"3px" }}>🎥 Video Library</h1>
          <p style={AS.sub}>{videos.length} videos · Browse by Unit → Chapter → Topic and add directly</p>
        </div>
        <div style={AS.flex(8)}>
          {/* View toggle */}
          <div style={{ display:"flex", border:`1.5px solid ${A.border}`, borderRadius:"9px", overflow:"hidden" }}>
            {[["tree","🌳 Hierarchy"],["list","📋 List"]].map(([k,l])=>(
              <button key={k} onClick={()=>setView(k)}
                style={{ ...AS.btn, borderRadius:0, border:"none", background:view===k?A.purple:"#fff", color:view===k?"#fff":A.slate, padding:"8px 14px", fontSize:"12.5px" }}>
                {l}
              </button>
            ))}
          </div>
          <button onClick={()=>setModal({ type:"add", chapterId:units[0]?.chapters?.[0]?.id||"", chapterName:"", unitName:"" })}
            style={{ ...AS.btn, ...AS.btnPrimary }}>
            + Add Video
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"11px", marginBottom:"20px" }}>
        {[
          { label:"Total Videos",   value:videos.length,                                         icon:"🎥", c:A.purple, bg:A.purpleLight },
          { label:"Published",       value:videos.filter(v=>v.is_published!==false).length,       icon:"✅", c:A.green,  bg:A.greenLight  },
          { label:"1st PU Videos",  value:videos.filter(v=>v.chapters?.units?.level==="1st PU").length, icon:"📗", c:A.blue, bg:A.blueLight },
          { label:"2nd PU Videos",  value:videos.filter(v=>v.chapters?.units?.level==="2nd PU").length, icon:"📘", c:A.amber, bg:A.amberLight },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.icon}</div>
            <div>
              <div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div>
              <div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TREE VIEW ─────────────────────────────────────────────────── */}
      {view === "tree" && (
        <div>
          {units.map(unit => (
            <div key={unit.id} style={{ marginBottom:"10px" }}>
              {/* Unit header */}
              <div
                onClick={()=>toggle(`u_${unit.id}`)}
                style={{ ...AS.card, padding:"13px 18px", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"space-between",
                  background: expanded[`u_${unit.id}`] ? "#F8F7FF" : A.surface,
                  borderColor: expanded[`u_${unit.id}`] ? A.purple : A.border }}>
                <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                  <div style={{ width:"34px", height:"34px", borderRadius:"9px", background:`linear-gradient(135deg,${A.purple},#6D28D9)`,
                    display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"13px", fontWeight:"800", flexShrink:0 }}>
                    {unit.icon||"📚"}
                  </div>
                  <div>
                    <div style={{ fontSize:"14px", fontWeight:"700", color:A.navy }}>{unit.name||unit.title}</div>
                    <div style={{ fontSize:"11.5px", color:A.slateLight }}>
                      {unit.level} · {unit.chapters?.length||0} chapters · {unit.chapters?.reduce((s,c)=>s+chapterVideoCount(c.id),0)||0} videos
                    </div>
                  </div>
                </div>
                <span style={{ color:A.slateLight, fontSize:"15px", transition:"transform 0.2s", display:"inline-block", transform:expanded[`u_${unit.id}`]?"rotate(180deg)":"none" }}>▾</span>
              </div>

              {/* Chapters */}
              {expanded[`u_${unit.id}`] && (
                <div style={{ marginTop:"5px", display:"flex", flexDirection:"column", gap:"5px", paddingLeft:"16px" }}>
                  {(unit.chapters||[]).map((ch,ci) => {
                    const chVids = getChapterVideos(ch.id);
                    const chExpanded = expanded[`c_${ch.id}`];
                    return (
                      <div key={ch.id}>
                        {/* Chapter row */}
                        <div style={{ ...AS.card, padding:"11px 15px", display:"flex", alignItems:"center", justifyContent:"space-between",
                          background: chExpanded ? "#F0FDF4" : A.surface,
                          borderColor: chExpanded ? A.green : A.border }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", flex:1 }}
                            onClick={()=>toggle(`c_${ch.id}`)}>
                            <div style={{ width:"26px", height:"26px", borderRadius:"7px", background:chExpanded?A.green:"#E5E7EB",
                              display:"flex", alignItems:"center", justifyContent:"center", color:chExpanded?"#fff":A.slate, fontSize:"11px", fontWeight:"700", flexShrink:0, transition:"all 0.2s" }}>
                              {ci+1}
                            </div>
                            <div>
                              <div style={{ fontSize:"13.5px", fontWeight:"600", color:A.navy }}>{ch.chapter_name||ch.title}</div>
                              <div style={{ fontSize:"11.5px", color:A.slateLight }}>
                                🎥 {chVids.length} video{chVids.length!==1?"s":""} uploaded
                                {chExpanded ? " · click to collapse" : " · click to expand"}
                              </div>
                            </div>
                          </div>
                          {/* Inline Add Video button */}
                          <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                            <button
                              onClick={e=>{ e.stopPropagation(); setModal({ type:"add", chapterId:ch.id, chapterName:ch.chapter_name||ch.title, unitName:unit.name||unit.title }); }}
                              style={{ ...AS.btn, ...AS.btnSm, ...AS.btnPrimary, gap:4, fontSize:"12px" }}>
                              + Add Video
                            </button>
                            <span style={{ color:A.slateLight, fontSize:"14px", alignSelf:"center", cursor:"pointer" }}
                              onClick={()=>toggle(`c_${ch.id}`)}>
                              {chExpanded?"▴":"▾"}
                            </span>
                          </div>
                        </div>

                        {/* Videos under chapter */}
                        {chExpanded && (
                          <div style={{ paddingLeft:"16px", marginTop:"4px", display:"flex", flexDirection:"column", gap:"4px" }}>
                            {chVids.length === 0 ? (
                              <div style={{ ...AS.card, padding:"14px 16px", textAlign:"center", background:"#FAFAFA", border:`1px dashed ${A.border}` }}>
                                <div style={{ fontSize:"22px", marginBottom:"6px" }}>🎬</div>
                                <div style={{ fontSize:"13px", color:A.slateLight, marginBottom:"9px" }}>No videos yet for this chapter</div>
                                <button onClick={()=>setModal({ type:"add", chapterId:ch.id, chapterName:ch.chapter_name||ch.title, unitName:unit.name||unit.title })}
                                  style={{ ...AS.btn, ...AS.btnSm, ...AS.btnPrimary }}>
                                  + Add First Video
                                </button>
                              </div>
                            ) : (
                              chVids.map(v=>(
                                <div key={v.id} style={{ ...AS.card, padding:"11px 15px", display:"flex", alignItems:"center", gap:12, background:"#FAFFFE" }}>
                                  {/* YouTube thumbnail */}
                                  {(()=>{
                                    const ytId = (v.youtube_url||"").match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
                                    return ytId ? (
                                      <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt=""
                                        style={{ width:"72px", height:"42px", borderRadius:"6px", objectFit:"cover", flexShrink:0, border:`1px solid ${A.border}` }}/>
                                    ) : (
                                      <div style={{ width:"72px", height:"42px", borderRadius:"6px", background:A.purpleLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>🎥</div>
                                    );
                                  })()}
                                  <div style={{ flex:1, minWidth:0 }}>
                                    <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
                                    <div style={{ fontSize:"11.5px", color:A.slateLight, marginTop:"2px" }}>
                                      {v.duration&&<span>⏱ {v.duration} · </span>}
                                      <span>👁 {v.view_count||0} views · </span>
                                      <span style={{ color:v.is_published!==false?A.green:A.amber }}>{v.is_published!==false?"● Published":"○ Draft"}</span>
                                    </div>
                                  </div>
                                  <div style={{ display:"flex", gap:5, flexShrink:0 }}>
                                    <button onClick={()=>setModal({ type:"edit", data:v, chapterId:v.chapter_id, chapterName:ch.chapter_name||ch.title, unitName:unit.name||unit.title })}
                                      style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️</button>
                                    <button onClick={()=>setConfirm({ msg:`Delete "${v.title}"?`, onOk:()=>deleteVideo(v.id, v.title) })}
                                      style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
                                  </div>
                                </div>
                              ))
                            )}

                            {/* Add more button when videos exist */}
                            {chVids.length > 0 && (
                              <button onClick={()=>setModal({ type:"add", chapterId:ch.id, chapterName:ch.chapter_name||ch.title, unitName:unit.name||unit.title })}
                                style={{ ...AS.btn, background:"#F8FAFC", color:A.slate, border:`1.5px dashed ${A.border}`, justifyContent:"center", fontSize:"12.5px", padding:"9px" }}>
                                + Add another video to this chapter
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── LIST VIEW ─────────────────────────────────────────────────── */}
      {view === "list" && (
        <div>
          <div style={{ ...AS.card, padding:"12px 16px", marginBottom:"14px" }}>
            <input style={{ ...AS.input, marginBottom:0 }} placeholder="🔍 Search by title or chapter…"
              value={search} onChange={e=>setSearch(e.target.value)}/>
          </div>
          <div style={{ ...AS.card, padding:0, overflow:"hidden" }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:"center", padding:"48px", color:A.slateLight }}>
                <div style={{ fontSize:"36px", marginBottom:"10px" }}>🎥</div>
                <div style={{ fontSize:"14px", fontWeight:"600" }}>{search ? "No videos match your search." : "No videos yet."}</div>
                {!search && <div style={{ fontSize:"12.5px", marginTop:"5px" }}>Switch to 🌳 Hierarchy view to add videos chapter-by-chapter.</div>}
              </div>
            ) : (
              <table style={AS.table}>
                <thead>
                  <tr>{["Thumbnail","Title","Chapter","Duration","Views","Status","Actions"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filtered.map(v=>{
                    const ytId = (v.youtube_url||"").match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/)?.[1];
                    return (
                      <tr key={v.id}>
                        <td style={{ ...AS.td, width:"80px" }}>
                          {ytId
                            ? <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="" style={{ width:"72px", height:"42px", borderRadius:"6px", objectFit:"cover", display:"block" }}/>
                            : <div style={{ width:"72px", height:"42px", borderRadius:"6px", background:A.purpleLight, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"20px" }}>🎥</div>
                          }
                        </td>
                        <td style={AS.td}>
                          <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy, maxWidth:"200px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v.title}</div>
                        </td>
                        <td style={AS.td}><span style={{ fontSize:"12.5px", color:A.slate }}>{v.chapters?.chapter_name||"—"}</span></td>
                        <td style={AS.td}>{v.duration||"—"}</td>
                        <td style={AS.td}><span style={{ fontWeight:"700", color:A.purple }}>{v.view_count||0}</span></td>
                        <td style={AS.td}><span style={AS.tag(v.is_published!==false?"Published":"Draft")}>{v.is_published!==false?"Published":"Draft"}</span></td>
                        <td style={AS.td}>
                          <div style={{ display:"flex", gap:5 }}>
                            <button onClick={()=>setModal({ type:"edit", data:v, chapterId:v.chapter_id, chapterName:v.chapters?.chapter_name||"" })}
                              style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️</button>
                            <button onClick={()=>setConfirm({ msg:`Delete "${v.title}"?`, onOk:()=>deleteVideo(v.id,v.title) })}
                              style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── VIDEO FORM MODAL ───────────────────────────────────────────── */}
      {(modal?.type==="add"||modal?.type==="edit") && (
        <VideoFormModal
          units={units}
          preselectedChapterId={modal.chapterId}
          preselectedChapterName={modal.chapterName}
          preselectedUnitName={modal.unitName}
          initial={modal.data}
          error={saveError}
          onSave={saveVideo}
          onClose={()=>{setModal(null);setSaveError("");}}
        />
      )}

      {confirm && <Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

// ─── VIDEO FORM MODAL — shows full Unit → Chapter tree for selection ──────────

function VideoFormModal({ units, preselectedChapterId, preselectedChapterName, preselectedUnitName, initial, error, onSave, onClose }) {
  // Flatten all chapters from units
  const allChapters = units.flatMap(u =>
    (u.chapters||[]).map(c => ({
      id: c.id,
      chapter_name: c.chapter_name || c.title || "",
      unit_name: u.name || u.title || "",
      level: u.level || "",
    }))
  );

  const [form, setForm] = useState({
    title:        initial?.title        || "",
    youtube_url:  initial?.youtube_url  || "",
    chapter_id:   initial?.chapter_id   || preselectedChapterId || allChapters[0]?.id || "",
    duration:     initial?.duration     || "",
    description:  initial?.description  || "",
    is_published: initial?.is_published !== false,
  });
  const [previewId, setPreviewId] = useState(null);
  const [busy, setBusy] = useState(false);
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setBusy(true);
    await onSave(form);
    setBusy(false);
  };

  // Live YouTube ID extraction for preview
  useEffect(()=>{
    const m = (form.youtube_url||"").match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    setPreviewId(m ? m[1] : null);
  }, [form.youtube_url]);

  // Group chapters by unit for the dropdown
  const byUnit = units.reduce((acc, u) => {
    const key = `${u.level} — ${u.name||u.title}`;
    acc[key] = (u.chapters||[]).map(c=>({ id:c.id, name:c.chapter_name||c.title }));
    return acc;
  }, {});

  const selectedChapter = allChapters.find(c=>c.id===form.chapter_id);

  return (
    <Modal title={initial ? "Edit Video" : "Add Video to Chapter"} onClose={onClose} width="600px">

      {/* Context breadcrumb */}
      {(preselectedUnitName || preselectedChapterName) && (
        <div style={{ background:A.purpleLight, borderRadius:"9px", padding:"9px 13px", marginBottom:"16px", display:"flex", alignItems:"center", gap:8, fontSize:"12.5px" }}>
          <span style={{ fontSize:"15px" }}>📍</span>
          <span style={{ color:A.purple, fontWeight:"600" }}>
            {preselectedUnitName && <span>{preselectedUnitName}</span>}
            {preselectedUnitName && preselectedChapterName && <span style={{ margin:"0 5px", opacity:0.5 }}>›</span>}
            {preselectedChapterName && <span>{preselectedChapterName}</span>}
          </span>
        </div>
      )}

      {/* YouTube URL + live preview side-by-side */}
      <label style={AS.label}>YouTube URL</label>
      <div style={{ display:"grid", gridTemplateColumns: previewId ? "1fr 130px" : "1fr", gap:"10px", marginBottom:"13px" }}>
        <input style={{ ...AS.input, marginBottom:0 }} value={form.youtube_url} onChange={h("youtube_url")}
          placeholder="https://www.youtube.com/watch?v=…"/>
        {previewId && (
          <img src={`https://img.youtube.com/vi/${previewId}/mqdefault.jpg`} alt="preview"
            style={{ width:"130px", height:"75px", borderRadius:"8px", objectFit:"cover", border:`1px solid ${A.border}` }}/>
        )}
      </div>

      {/* Video title */}
      <label style={AS.label}>Video Title</label>
      <input style={AS.input} value={form.title} onChange={h("title")} placeholder="e.g. Photosynthesis – Light Reactions Explained"/>

      {/* Chapter selector — grouped by Unit */}
      <label style={AS.label}>Chapter</label>
      <select style={AS.input} value={form.chapter_id} onChange={h("chapter_id")}>
        {Object.entries(byUnit).map(([unitLabel, chs]) => (
          chs.length > 0 && (
            <optgroup key={unitLabel} label={unitLabel}>
              {chs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </optgroup>
          )
        ))}
        {allChapters.length === 0 && (
          <option value="">No chapters found — add chapters in Content CMS first</option>
        )}
      </select>

      {/* Selected chapter badge */}
      {selectedChapter && (
        <div style={{ display:"flex", gap:7, alignItems:"center", marginTop:"-7px", marginBottom:"12px" }}>
          <span style={{ ...AS.badge(A.green, A.greenLight), fontSize:"11.5px" }}>
            ✓ {selectedChapter.chapter_name}
          </span>
          <span style={{ fontSize:"11.5px", color:A.slateLight }}>
            {selectedChapter.unit_name} · {selectedChapter.level}
          </span>
        </div>
      )}

      {/* Duration + Status */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        <div>
          <label style={AS.label}>Duration (mm:ss)</label>
          <input style={AS.input} value={form.duration} onChange={h("duration")} placeholder="18:32"/>
        </div>
        <div>
          <label style={AS.label}>Status</label>
          <select style={AS.input} value={form.is_published ? "Published" : "Draft"}
            onChange={e=>setForm(f=>({...f, is_published: e.target.value==="Published"}))}>
            <option>Published</option>
            <option>Draft</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <label style={AS.label}>Description (optional)</label>
      <textarea style={{ ...AS.input, minHeight:"65px", resize:"vertical" }} value={form.description} onChange={h("description")}
        placeholder="Brief description of what this video covers…"/>

      {error && <div style={{ background:A.redLight, border:`1px solid #FCA5A5`, borderRadius:"9px", padding:"10px 13px", color:A.red, fontSize:"13px", marginBottom:"13px" }}>{error}</div>}

      {/* Actions */}
      <div style={{ display:"flex", gap:8 }}>
        <button
          onClick={()=>{ if(!form.title||!form.youtube_url||!form.chapter_id){ alert("Please fill Title, YouTube URL, and Chapter."); return; } submit(); }}
          disabled={busy}
          style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center", padding:"12px", opacity:busy?0.7:1 }}>
          {busy ? "Saving…" : (initial ? "Save Changes" : "Add Video")}
        </button>
        <button onClick={onClose} disabled={busy} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
      </div>
    </Modal>
  );
}

function NotesManager() {
  const [notes, setNotes] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const load = async () => {
    setLoading(true); setLoadError("");
    try {
      const [n, c] = await Promise.all([sb.getAllNotes(), sb.getAllChapters()]);
      setNotes(Array.isArray(n) ? n : []);
      setChapters(Array.isArray(c) ? c : []);
    } catch (e) {
      setLoadError("Could not load notes from the server. Check your connection and try again.");
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const viewNote = async (note) => {
    try {
      const blobUrl = await sb.fetchFileBlobUrl("notes-pdfs", note.pdf_url);
      window.open(blobUrl, "_blank");
    } catch (e) {
      showToast("❌ " + e.message);
    }
  };

  const deleteNote = async (note) => {
    try {
      await sb._delete("notes", `id=eq.${note.id}`);
      setNotes(ns => ns.filter(x => x.id !== note.id));
      showToast("Note deleted.");
    } catch (e) {
      showToast("❌ Could not delete note.");
    }
    setConfirm(null);
  };

  const published = notes.filter(n => n.is_published).length;

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500, maxWidth:"360px" }}>{toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>📝 Notes Library</h1><p style={AS.sub}>{notes.length} notes · {published} published</p></div>
        <button onClick={()=>setModal({type:"add"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Upload Notes</button>
      </div>

      {loading && <div style={{ ...AS.card, textAlign:"center", padding:"40px", color:A.slateLight }}>Loading notes…</div>}

      {!loading && loadError && (
        <div style={{ ...AS.card, textAlign:"center", padding:"30px" }}>
          <div style={{ color:A.red, fontWeight:"600", marginBottom:"10px" }}>{loadError}</div>
          <button onClick={load} style={{ ...AS.btn, ...AS.btnOutline }}>Retry</button>
        </div>
      )}

      {!loading && !loadError && (
        <div style={{ ...AS.card, padding:0, overflow:"hidden" }}>
          <table style={AS.table}>
            <thead><tr>{["Title","Chapter","Status","Actions"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
            <tbody>
              {notes.length === 0 && (
                <tr><td colSpan={4} style={{ ...AS.td, textAlign:"center", padding:"30px", color:A.slateLight }}>No notes uploaded yet.</td></tr>
              )}
              {notes.map(n=>(
                <tr key={n.id}>
                  <td style={AS.td}><div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{n.title}</div></td>
                  <td style={AS.td}>{n.chapters?.chapter_name || "—"}</td>
                  <td style={AS.td}><span style={AS.tag(n.is_published ? "Published" : "Draft")}>{n.is_published ? "Published" : "Draft"}</span></td>
                  <td style={AS.td}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={()=>viewNote(n)} style={{ ...AS.btn, ...AS.btnSm, background:A.blueLight, color:A.blue, border:"none" }}>👁 View</button>
                      <button onClick={()=>setConfirm({msg:`Delete "${n.title}"? This removes the file permanently.`,onOk:()=>deleteNote(n)})} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type==="add" && (
        <UploadNoteModal
          chapters={chapters}
          onClose={()=>setModal(null)}
          onUploaded={(newNote)=>{ setNotes(ns=>[newNote, ...ns]); setModal(null); showToast("✅ Notes uploaded!"); }}
        />
      )}
      {confirm&&<Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

function UploadNoteModal({ chapters, onClose, onUploaded }) {
  const [title, setTitle] = useState("");
  const [chapterId, setChapterId] = useState(chapters[0]?.id || "");
  const [status, setStatus] = useState("Draft");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    if (!title.trim()) { setError("Please enter a note title."); return; }
    if (!chapterId) { setError("Please select a chapter. (No chapters exist yet — add one in Chapter Management first.)"); return; }
    if (!file) { setError("Please choose a PDF file."); return; }
    if (file.type !== "application/pdf") { setError("Only PDF files are allowed."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("File is larger than 20MB."); return; }

    setBusy(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${chapterId}/${Date.now()}_${safeName}`;
      await sb.uploadFile("notes-pdfs", path, file);
      const rows = await sb.addNote({
        chapter_id: chapterId,
        title: title.trim(),
        pdf_url: path,
        note_type: "PDF",
        is_published: status === "Published",
      });
      onUploaded({ ...rows[0], chapters: chapters.find(c => c.id === chapterId) });
    } catch (e) {
      setError(e.message || "Upload failed. Please try again.");
    }
    setBusy(false);
  };

  return (
    <Modal title="Upload Notes" onClose={onClose} width="520px">
      {error && <div style={{ background:A.redLight, border:`1px solid #FCA5A5`, borderRadius:"9px", padding:"10px 13px", color:A.red, fontSize:"13px", marginBottom:"13px" }}>{error}</div>}

      <label style={AS.label}>Note Title</label>
      <input style={AS.input} value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Cell Biology Complete Notes"/>

      <label style={AS.label}>Chapter</label>
      {chapters.length === 0 ? (
        <div style={{ fontSize:"12.5px", color:A.red, marginBottom:"12px" }}>No chapters found in the database yet. Add a chapter first, then come back here.</div>
      ) : (
        <select style={AS.input} value={chapterId} onChange={e=>setChapterId(e.target.value)}>
          {chapters.map(c=><option key={c.id} value={c.id}>{c.chapter_name}</option>)}
        </select>
      )}

      <label style={AS.label}>Status</label>
      <select style={AS.input} value={status} onChange={e=>setStatus(e.target.value)}>
        <option>Draft</option>
        <option>Published</option>
      </select>

      <label style={AS.label}>PDF File</label>
      <div style={{ border:`2px dashed ${A.border}`, borderRadius:"10px", padding:"18px", textAlign:"center", marginBottom:"12px", background:A.bg }}>
        <input type="file" accept="application/pdf" onChange={e=>setFile(e.target.files[0] || null)}
          style={{ width:"100%", fontSize:"13px" }}/>
        <div style={{ fontSize:"11.5px", color:A.slateLight, marginTop:"7px" }}>PDF only · Maximum file size: 20MB</div>
        {file && <div style={{ fontSize:"12.5px", color:A.green, marginTop:"6px", fontWeight:"600" }}>Selected: {file.name} ({(file.size/1024/1024).toFixed(1)} MB)</div>}
      </div>

      <div style={{ display:"flex", gap:8 }}>
        <button onClick={submit} disabled={busy}
          style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center", opacity:busy?0.7:1 }}>
          {busy ? "Uploading…" : "Upload Notes"}
        </button>
        <button onClick={onClose} disabled={busy} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
      </div>
    </Modal>
  );
}


// ─── QUESTION BANK MANAGER ────────────────────────────────────────────────────

function QuestionManager() {
  const [questions, setQuestions] = useState([]);
  const [chapters, setChapters] = useState([]);
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState({ search:"", chapterId:"All", type:"All", difficulty:"All" });
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | chapter_az | exam_type | difficulty
  const [pageSize, setPageSize] = useState(25);    // 25 | 50 | 100 | "all"
  const [currentPage, setCurrentPage] = useState(1);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  useEffect(()=>{
    async function load(){
      try {
        const [q,c] = await Promise.all([sb.getAllQuestions(), sb.getAllChapters()]);
        setQuestions(Array.isArray(q)?q:[]);
        setChapters(Array.isArray(c)?c:[]);
      } catch(e){ console.error(e); }
      setLoading(false);
    }
    load();
  },[]);

  const searchQuery = filter.search.trim().toLowerCase();
  const filtered = useMemo(() => questions.filter(q=>{
    const typeOk = filter.type==="All"||q.exam_type===filter.type;
    const diffOk = filter.difficulty==="All"||q.difficulty===filter.difficulty;
    const chapterOk = filter.chapterId==="All"||q.chapter_id===filter.chapterId;
    const searchOk = !searchQuery ||
      (q.question||"").toLowerCase().includes(searchQuery) ||
      (q.explanation||"").toLowerCase().includes(searchQuery);
    return typeOk&&diffOk&&chapterOk&&searchOk;
  }), [questions, filter.type, filter.difficulty, filter.chapterId, searchQuery]);

  // Reset to page 1 whenever the result set or its order changes —
  // otherwise a filter/sort change could leave you on a now-empty page.
  useEffect(() => { setCurrentPage(1); }, [filter.search, filter.chapterId, filter.type, filter.difficulty, sortBy, pageSize]);

  const DIFFICULTY_ORDER = { Easy:1, Medium:2, Hard:3 };
  // created_at may not exist on every deployment of this table — treat
  // missing dates as 0 so Newest/Oldest degrades to a harmless no-op
  // sort instead of throwing or producing garbage ordering.
  const dateVal = (q) => q.created_at ? new Date(q.created_at).getTime() : 0;

  const sorted = useMemo(() => {
    const arr = [...filtered];
    switch (sortBy) {
      case "oldest": arr.sort((a,b) => dateVal(a) - dateVal(b)); break;
      case "chapter_az": arr.sort((a,b) => (a.chapters?.chapter_name||"").localeCompare(b.chapters?.chapter_name||"")); break;
      case "exam_type": arr.sort((a,b) => (a.exam_type||"").localeCompare(b.exam_type||"")); break;
      case "difficulty": arr.sort((a,b) => (DIFFICULTY_ORDER[a.difficulty]||99) - (DIFFICULTY_ORDER[b.difficulty]||99)); break;
      case "newest": default: arr.sort((a,b) => dateVal(b) - dateVal(a));
    }
    return arr;
  }, [filtered, sortBy]);

  const totalPages = pageSize === "all" ? 1 : Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);
  const paginated = useMemo(() => {
    if (pageSize === "all") return sorted;
    const start = (safePage - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, pageSize, safePage]);

  // Windowed page-number list (first, last, current±1, with gaps) so
  // this stays cheap even with thousands of questions / hundreds of pages.
  const pageNumbers = useMemo(() => {
    const nums = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) nums.push(p);
      else if (nums[nums.length-1] !== "…") nums.push("…");
    }
    return nums;
  }, [totalPages, safePage]);

  // ── Selection (Phase 1.3A — foundation only, no bulk actions yet) ──────
  // Stores only question IDs, never full question objects. Persists
  // across page changes and filter changes — the only way to clear it
  // is the explicit "Clear Selection" action.
  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const currentPageIds = useMemo(() => paginated.map(q=>q.id), [paginated]);
  const currentPageSelectedCount = useMemo(() => currentPageIds.filter(id=>selectedIds.has(id)).length, [currentPageIds, selectedIds]);
  const allCurrentPageSelected = currentPageIds.length>0 && currentPageSelectedCount===currentPageIds.length;
  const someCurrentPageSelected = currentPageSelectedCount>0 && !allCurrentPageSelected;
  const toggleSelectCurrentPage = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allCurrentPageSelected) currentPageIds.forEach(id=>next.delete(id));
      else currentPageIds.forEach(id=>next.add(id));
      return next;
    });
  };

  const filteredIds = useMemo(() => sorted.map(q=>q.id), [sorted]);
  const filteredSelectedCount = useMemo(() => filteredIds.filter(id=>selectedIds.has(id)).length, [filteredIds, selectedIds]);
  const allFilteredSelected = filteredIds.length>0 && filteredSelectedCount===filteredIds.length;
  const someFilteredSelected = filteredSelectedCount>0 && !allFilteredSelected;
  const toggleSelectAllFiltered = () => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) filteredIds.forEach(id=>next.delete(id));
      else filteredIds.forEach(id=>next.add(id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  // React has no JSX prop for the native `indeterminate` checkbox state —
  // it must be set imperatively on the DOM node.
  const currentPageCheckboxRef = useRef(null);
  const filteredCheckboxRef = useRef(null);
  useEffect(() => {
    if (currentPageCheckboxRef.current) currentPageCheckboxRef.current.indeterminate = someCurrentPageSelected;
  }, [someCurrentPageSelected]);
  useEffect(() => {
    if (filteredCheckboxRef.current) filteredCheckboxRef.current.indeterminate = someFilteredSelected;
  }, [someFilteredSelected]);

  const saveQuestion = async (data) => {
    try {
      if(modal.type==="edit") {
        await sb.updateQuestion(modal.data.id, data);
        setQuestions(qs=>qs.map(q=>q.id===modal.data.id?{...q,...data}:q));
        showToast("Question updated!");
      } else {
        const r = await sb.addQuestion(data);
        if(Array.isArray(r)&&r[0]) setQuestions(qs=>[r[0],...qs]);
        showToast("Question added!");
      }
      setModal(null);
    } catch(e){ showToast("Error saving question"); }
  };

  const deleteQ = async (id) => {
    await sb.deleteQuestion(id);
    setQuestions(qs=>qs.filter(q=>q.id!==id));
    showToast("Question deleted."); setConfirm(null);
  };

  if(loading) return <div style={{ ...AS.page, paddingTop:"40px", textAlign:"center", color:A.slateLight }}>Loading questions…</div>;

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>❓ Question Bank</h1><p style={AS.sub}>{questions.length} questions in database</p></div>
        <button onClick={()=>setModal({type:"add"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Add Question</button>
      </div>

      <div style={{ ...AS.card, padding:"12px 16px", marginBottom:"14px" }}>
        <div style={{ marginBottom:11 }}>
          <label style={AS.label}>Search</label>
          <input
            type="text"
            placeholder="Search question text or explanation…"
            style={{ ...AS.input, marginBottom:0 }}
            value={filter.search}
            onChange={e=>setFilter(f=>({...f,search:e.target.value}))}
          />
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:11 }}>
          <div>
            <label style={AS.label}>Chapter</label>
            <select style={{ ...AS.input, marginBottom:0 }} value={filter.chapterId} onChange={e=>setFilter(f=>({...f,chapterId:e.target.value}))}>
              <option value="All">All Chapters</option>
              {chapters.map(c=><option key={c.id} value={c.id}>{c.chapter_name}</option>)}
            </select>
          </div>
          <div>
            <label style={AS.label}>Exam Type</label>
            <select style={{ ...AS.input, marginBottom:0 }} value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}>
              <option>All</option><option>KCET</option><option>NEET</option><option>PU</option>
            </select>
          </div>
          <div>
            <label style={AS.label}>Difficulty</label>
            <select style={{ ...AS.input, marginBottom:0 }} value={filter.difficulty} onChange={e=>setFilter(f=>({...f,difficulty:e.target.value}))}>
              <option>All</option><option>Easy</option><option>Medium</option><option>Hard</option>
            </select>
          </div>
          <div>
            <label style={AS.label}>Sort By</label>
            <select style={{ ...AS.input, marginBottom:0 }} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="chapter_az">Chapter Name (A-Z)</option>
              <option value="exam_type">Exam Type</option>
              <option value="difficulty">Difficulty</option>
            </select>
          </div>
          <div>
            <label style={AS.label}>Show</label>
            <select style={{ ...AS.input, marginBottom:0 }} value={pageSize} onChange={e=>setPageSize(e.target.value==="all"?"all":Number(e.target.value))}>
              <option value={25}>25 Questions</option>
              <option value={50}>50 Questions</option>
              <option value={100}>100 Questions</option>
              <option value="all">All Questions</option>
            </select>
          </div>
          <div style={{ display:"flex", alignItems:"flex-end" }}>
            <button
              onClick={()=>setFilter({ search:"", chapterId:"All", type:"All", difficulty:"All" })}
              style={{ ...AS.btn, ...AS.btnOutline, width:"100%", justifyContent:"center" }}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div style={{ position:"sticky", top:0, background:A.bg, zIndex:10, paddingBottom:"6px" }}>
        {selectedIds.size > 0 && (
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:14,
            background:A.purple, color:"#fff", borderRadius:"9px", padding:"10px 16px", marginBottom:"8px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:18, flexWrap:"wrap" }}>
              <span style={{ fontSize:"13.5px", fontWeight:"700" }}>{selectedIds.size} Question{selectedIds.size===1?"":"s"} Selected</span>
              <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.8)" }}>Current Page: {currentPageSelectedCount} selected</span>
              <span style={{ fontSize:"12px", color:"rgba(255,255,255,0.8)" }}>Filtered Results: {filteredSelectedCount} selected</span>
            </div>
            <button onClick={clearSelection}
              style={{ background:"rgba(255,255,255,0.18)", border:"none", color:"#fff", borderRadius:"7px", padding:"6px 14px", fontSize:"12.5px", fontWeight:"600", cursor:"pointer" }}>
              Clear Selection
            </button>
          </div>
        )}
        <div style={{ display:"flex", alignItems:"center", flexWrap:"wrap", gap:16, fontSize:"12.5px", color:A.slateLight, padding:"6px 0" }}>
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
            <input ref={currentPageCheckboxRef} type="checkbox" checked={allCurrentPageSelected} onChange={toggleSelectCurrentPage}/>
            Select Current Page
          </label>
          <label style={{ display:"flex", alignItems:"center", gap:6, cursor:"pointer" }}>
            <input ref={filteredCheckboxRef} type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAllFiltered}/>
            Select All Filtered Results
          </label>
          <span style={{ marginLeft:"auto" }}>
            Showing {paginated.length} of {sorted.length} Questions{pageSize!=="all" ? ` — Page ${safePage} of ${totalPages}` : ""}
          </span>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {paginated.length===0 ? (
          <div style={{ ...AS.card, textAlign:"center", padding:"40px", color:A.slateLight }}>
            No questions yet. Click '+ Add Question' to add your first MCQ.
          </div>
        ) : paginated.map((q,qi)=>(
          <div key={q.id} style={{ ...AS.card, ...(selectedIds.has(q.id) ? { border:`1.5px solid ${A.purple}`, background:"#FAF5FF" } : {}) }}>
            <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
              <input type="checkbox" checked={selectedIds.has(q.id)} onChange={()=>toggleSelect(q.id)} style={{ marginTop:4, flexShrink:0 }}/>
              <div style={{ flex:1, minWidth:0 }}>
            <div style={{ ...AS.flexB, marginBottom:"8px", flexWrap:"wrap", gap:6 }}>
              <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
                <span style={{ fontSize:"12px", fontWeight:"700", color:A.slateLight }}>Q{(safePage-1)*(pageSize==="all"?0:pageSize)+qi+1}</span>
                <span style={AS.tag(q.exam_type)}>{q.exam_type}</span>
                <span style={AS.tag(q.difficulty)}>{q.difficulty}</span>
                {q.chapters?.chapter_name&&<span style={{ fontSize:"11.5px", color:A.slateLight }}>📖 {q.chapters.chapter_name}</span>}
              </div>
              <div style={{ display:"flex", gap:5 }}>
                <button onClick={()=>setModal({type:"edit",data:q})} style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️</button>
                <button onClick={()=>setConfirm({msg:"Delete this question?",onOk:()=>deleteQ(q.id)})} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
              </div>
            </div>
            <p style={{ fontSize:"13.5px", fontWeight:"500", color:A.navy, marginBottom:"9px", lineHeight:"1.5" }}>{q.question}</p>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:6 }}>
              {[["A",q.option_a],["B",q.option_b],["C",q.option_c],["D",q.option_d]].map(([letter,opt])=>(
                <div key={letter} style={{ padding:"7px 11px", borderRadius:"7px", border:`1.5px solid ${q.correct_answer===letter?"#059669":A.border}`, background:q.correct_answer===letter?"#ECFDF5":"#F8FAFC", fontSize:"12.5px", display:"flex", gap:6 }}>
                  <span style={{ fontWeight:"700", color:A.slateLight }}>{letter}.</span>{opt}
                  {q.correct_answer===letter&&<span style={{ marginLeft:"auto", color:"#059669" }}>✓</span>}
                </div>
              ))}
            </div>
            {q.explanation&&<div style={{ background:"#F0FDF4", borderRadius:"7px", padding:"8px 11px", marginTop:"9px", fontSize:"12px", color:"#065F46" }}>💡 {q.explanation}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {pageSize!=="all" && totalPages>1 && (
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:6, flexWrap:"wrap", marginTop:"18px" }}>
          <button disabled={safePage<=1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}
            style={{ ...AS.btn, ...AS.btnOutline, opacity:safePage<=1?0.4:1 }}>
            ← Previous
          </button>
          {pageNumbers.map((p,i)=> p==="…" ? (
            <span key={"gap"+i} style={{ padding:"0 4px", color:A.slateLight }}>…</span>
          ) : (
            <button key={p} onClick={()=>setCurrentPage(p)}
              style={{ ...AS.btn, ...AS.btnSm, minWidth:"34px", justifyContent:"center", background:p===safePage?A.purple:"#fff", color:p===safePage?"#fff":A.slate, border:`1.5px solid ${p===safePage?A.purple:A.border}` }}>
              {p}
            </button>
          ))}
          <button disabled={safePage>=totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}
            style={{ ...AS.btn, ...AS.btnOutline, opacity:safePage>=totalPages?0.4:1 }}>
            Next →
          </button>
        </div>
      )}

      {(modal?.type==="add"||modal?.type==="edit")&&(
        <QuestionFormModal chapters={chapters} initial={modal.data} onSave={saveQuestion} onClose={()=>setModal(null)}/>
      )}
      {confirm&&<Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}

function QuestionFormModal({ chapters, initial, onSave, onClose }) {
  const [form, setForm] = useState({
    chapter_id: initial?.chapter_id||chapters[0]?.id||"",
    question: initial?.question||"",
    option_a: initial?.option_a||"", option_b: initial?.option_b||"",
    option_c: initial?.option_c||"", option_d: initial?.option_d||"",
    correct_answer: initial?.correct_answer||"A",
    explanation: initial?.explanation||"",
    exam_type: initial?.exam_type||"KCET",
    difficulty: initial?.difficulty||"Medium",
    year: initial?.year||"",
  });
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));
  return (
    <Modal title={initial?"Edit Question":"Add MCQ"} onClose={onClose} width="600px">
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
        <div><label style={AS.label}>Exam Type</label><select style={AS.input} value={form.exam_type} onChange={h("exam_type")}><option>KCET</option><option>NEET</option><option>PU</option></select></div>
        <div><label style={AS.label}>Difficulty</label><select style={AS.input} value={form.difficulty} onChange={h("difficulty")}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
        <div><label style={AS.label}>Year (optional)</label><input style={AS.input} value={form.year} onChange={h("year")} placeholder="2024"/></div>
      </div>
      <label style={AS.label}>Chapter</label>
      <select style={AS.input} value={form.chapter_id} onChange={h("chapter_id")}>{chapters.map(c=><option key={c.id} value={c.id}>{c.chapter_name}</option>)}</select>
      <label style={AS.label}>Question</label>
      <textarea style={{ ...AS.input, minHeight:"70px", resize:"vertical" }} value={form.question} onChange={h("question")} placeholder="Enter the question..."/>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
        {["A","B","C","D"].map(letter=>(
          <div key={letter}><label style={AS.label}>Option {letter}</label><input style={AS.input} value={form[`option_${letter.toLowerCase()}`]} onChange={h(`option_${letter.toLowerCase()}`)} placeholder={`Option ${letter}...`}/></div>
        ))}
      </div>
      <label style={AS.label}>Correct Answer</label>
      <select style={AS.input} value={form.correct_answer} onChange={h("correct_answer")}><option>A</option><option>B</option><option>C</option><option>D</option></select>
      <label style={AS.label}>Explanation</label>
      <textarea style={{ ...AS.input, minHeight:"55px" }} value={form.explanation} onChange={h("explanation")} placeholder="Explain the correct answer..."/>
      <div style={{ display:"flex", gap:8 }}>
        <button onClick={()=>onSave(form)} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>{initial?"Save Changes":"Add Question"}</button>
        <button onClick={onClose} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
      </div>
    </Modal>
  );
}

// ─── CONNECTED STUDENT MANAGER ────────────────────────────────────────────────
function TestBuilder() {
  const [tests, setTests] = useState(TESTS_DB);
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>🧪 Test Builder</h1><p style={AS.sub}>{tests.length} tests · Create chapter, unit, and mock tests</p></div>
        <button onClick={()=>setModal({type:"add"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Create Test</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"11px", marginBottom:"18px" }}>
        {[
          { label:"Chapter Tests", value:tests.filter(t=>t.type==="Chapter").length, c:A.blue, bg:A.blueLight, icon:"📖" },
          { label:"Unit Tests", value:tests.filter(t=>t.type==="Unit").length, c:A.purple, bg:A.purpleLight, icon:"📚" },
          { label:"Mock Tests", value:tests.filter(t=>t.type==="Mock").length, c:A.red, bg:A.redLight, icon:"🏆" },
          { label:"Total Attempts", value:tests.reduce((s,t)=>s+t.attempts,0).toLocaleString(), c:A.green, bg:A.greenLight, icon:"👥" },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.icon}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Tests table */}
      <div style={{ ...AS.card, padding:0, overflow:"hidden" }}>
        <table style={AS.table}>
          <thead><tr>{["Title","Type","Questions","Duration","Avg Score","Attempts","Status","Actions"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
          <tbody>
            {tests.map(t=>(
              <tr key={t.id}>
                <td style={AS.td}><div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{t.title}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{t.chapter}</div></td>
                <td style={AS.td}><span style={AS.tag(t.type)}>{t.type}</span></td>
                <td style={AS.td}>{t.questions}</td>
                <td style={AS.td}>{t.time} min</td>
                <td style={AS.td}><span style={{ fontWeight:"700", color:t.avgScore>=75?A.green:t.avgScore>=60?A.amber:A.red }}>{t.avgScore}%</span></td>
                <td style={AS.td}>{t.attempts.toLocaleString()}</td>
                <td style={AS.td}><span style={AS.tag(t.status)}>{t.status}</span></td>
                <td style={AS.td}>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={()=>setModal({type:"edit",data:t})} style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️</button>
                    <button onClick={()=>setConfirm({msg:`Delete "${t.title}"?`,onOk:()=>{setTests(ts=>ts.filter(x=>x.id!==t.id));showToast("Test deleted.");setConfirm(null);}})} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal?.type==="add"||modal?.type==="edit")&&(
        <Modal title={modal.type==="add"?"Create New Test":"Edit Test"} onClose={()=>setModal(null)} width="580px">
          <label style={AS.label}>Test Title</label>
          <input style={AS.input} defaultValue={modal.data?.title} placeholder="e.g. KCET Full Mock Test 2"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <div>
              <label style={AS.label}>Test Type</label>
              <select style={AS.input} defaultValue={modal.data?.type||"Chapter"}>
                <option>Chapter</option><option>Unit</option><option>Mock</option>
              </select>
            </div>
            <div>
              <label style={AS.label}>Chapter / Scope</label>
              <input style={AS.input} defaultValue={modal.data?.chapter} placeholder="Full Syllabus"/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            <div><label style={AS.label}>No. of Questions</label><input style={AS.input} type="number" defaultValue={modal.data?.questions||15}/></div>
            <div><label style={AS.label}>Time (minutes)</label><input style={AS.input} type="number" defaultValue={modal.data?.time||20}/></div>
            <div><label style={AS.label}>Passing %</label><input style={AS.input} type="number" defaultValue="60"/></div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <div><label style={AS.label}>Difficulty</label><select style={AS.input} defaultValue={modal.data?.difficulty||"Medium"}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
            <div><label style={AS.label}>Status</label><select style={AS.input} defaultValue={modal.data?.status||"Draft"}><option>Published</option><option>Draft</option></select></div>
          </div>
          <div style={{ background:A.purpleLight, borderRadius:"9px", padding:"12px", marginBottom:"12px" }}>
            <div style={{ fontSize:"12.5px", fontWeight:"700", color:A.purple, marginBottom:"5px" }}>🤖 Auto-generate from Question Bank</div>
            <div style={{ fontSize:"12px", color:A.slate }}>Click "Auto-Generate" to pull questions matching your settings from the Question Bank automatically.</div>
            <button style={{ ...AS.btn, ...AS.btnSm, background:A.purple, color:"#fff", marginTop:"8px", border:"none" }}>⚡ Auto-Generate Questions</button>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast(modal.type==="add"?"Test created!":"Test updated!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>
              {modal.type==="add"?"Create Test":"Save Changes"}
            </button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {confirm&&<Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}


// ─── STUDENT MANAGEMENT ───────────────────────────────────────────────────────

function StudentManager() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  useEffect(()=>{
    sb.getStudents().then(s=>{ setStudents(Array.isArray(s)?s:[]); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const filtered = students.filter(s=>(s.full_name||"").toLowerCase().includes(search.toLowerCase())||(s.email||"").toLowerCase().includes(search.toLowerCase()));

  const exportCSV = () => {
    const rows=[["Name","Email","Class","Plan","XP","Streak","Joined"]];
    students.forEach(s=>rows.push([s.full_name||"",s.email||"",s.class||"",s.subscription_plan||"free",s.xp||0,s.streak||0,s.created_at?new Date(s.created_at).toLocaleDateString("en-IN"):""]));
    const csv=rows.map(r=>r.join(",")).join("\n");
    const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="bioverse_students.csv"; a.click();
    showToast("CSV exported!");
  };

  const suspendStudent = async (s) => {
    await sb.updateStudent(s.id, { subscription_status:"cancelled" });
    setStudents(ss=>ss.map(x=>x.id===s.id?{...x,subscription_status:"cancelled"}:x));
    showToast("Student suspended."); setConfirm(null);
  };

  if(loading) return <div style={{ ...AS.page, paddingTop:"40px", textAlign:"center", color:A.slateLight }}>Loading students…</div>;

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>👥 Students</h1><p style={AS.sub}>{students.length} registered students</p></div>
        <div style={AS.flex(8)}>
          <button onClick={exportCSV} style={{ ...AS.btn, ...AS.btnOutline }}>📤 Export CSV</button>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"11px", marginBottom:"18px" }}>
        {[
          { label:"Total", v:students.length, c:A.purple, bg:A.purpleLight, ic:"👥" },
          { label:"Premium", v:students.filter(s=>s.subscription_plan!=="free").length, c:A.amber, bg:A.amberLight, ic:"👑" },
          { label:"Avg XP", v:students.length?Math.round(students.reduce((a,s)=>a+(s.xp||0),0)/students.length):0, c:A.green, bg:A.greenLight, ic:"⚡" },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.ic}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.v}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ ...AS.card, padding:"12px 16px", marginBottom:"14px" }}>
        <input style={{ ...AS.input, marginBottom:0 }} placeholder="🔍 Search students by name or email..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <div style={{ ...AS.card, padding:0, overflow:"hidden" }}>
        {filtered.length===0 ? (
          <div style={{ textAlign:"center", padding:"40px", color:A.slateLight }}>No students found.</div>
        ) : (
          <table style={AS.table}>
            <thead><tr>{["Student","Class","Plan","XP","Streak","Joined","Actions"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.id}>
                  <td style={AS.td}>
                    <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                      <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"12px", flexShrink:0 }}>
                        {(s.full_name||s.email||"?")[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{s.full_name||"—"}</div>
                        <div style={{ fontSize:"11px", color:A.slateLight }}>{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={AS.td}>{s.class||"—"}</td>
                  <td style={AS.td}><span style={AS.tag(s.subscription_plan==="free"?"Free":"Premium")}>{s.subscription_plan==="free"?"Free":"👑 Premium"}</span></td>
                  <td style={AS.td}><span style={{ fontWeight:"700", color:A.purple }}>⚡{s.xp||0}</span></td>
                  <td style={AS.td}>🔥{s.streak||0}</td>
                  <td style={{ ...AS.td, fontSize:"11.5px", color:A.slateLight }}>{s.created_at?new Date(s.created_at).toLocaleDateString("en-IN"):"—"}</td>
                  <td style={AS.td}>
                    <div style={{ display:"flex", gap:5 }}>
                      <button onClick={()=>setModal({type:"view",data:s})} style={{ ...AS.btn, ...AS.btnSm, background:A.blueLight, color:A.blue, border:"none" }}>👁</button>
                      <button onClick={()=>setConfirm({msg:`Suspend ${s.full_name||s.email}?`,onOk:()=>suspendStudent(s)})} style={{ ...AS.btn, ...AS.btnSm, background:A.amberLight, color:A.amber, border:"none" }}>🚫</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal?.type==="view"&&(
        <Modal title="Student Profile" onClose={()=>setModal(null)} width="480px">
          <div style={{ textAlign:"center", marginBottom:"18px" }}>
            <div style={{ width:"60px", height:"60px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"26px", fontWeight:"800", margin:"0 auto 10px" }}>
              {(modal.data.full_name||modal.data.email||"?")[0].toUpperCase()}
            </div>
            <div style={{ fontSize:"16px", fontWeight:"700", color:A.navy }}>{modal.data.full_name||"—"}</div>
            <div style={{ fontSize:"12.5px", color:A.slateLight }}>{modal.data.email}</div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"9px" }}>
            {[["Class",modal.data.class||"—"],["Plan",modal.data.subscription_plan],["XP","⚡"+(modal.data.xp||0)],["Streak","🔥"+(modal.data.streak||0)],["Role",modal.data.role],["Joined",modal.data.created_at?new Date(modal.data.created_at).toLocaleDateString("en-IN"):"—"]].map(([l,v],i)=>(
              <div key={i} style={{ background:A.bg, borderRadius:"9px", padding:"11px 13px" }}>
                <div style={{ fontSize:"10.5px", color:A.slateLight, fontWeight:"700", textTransform:"uppercase" }}>{l}</div>
                <div style={{ fontSize:"14px", fontWeight:"700", color:A.navy, marginTop:"3px" }}>{v}</div>
              </div>
            ))}
          </div>
        </Modal>
      )}
      {confirm&&<Confirm message={confirm.msg} onConfirm={confirm.onOk} onCancel={()=>setConfirm(null)}/>}
    </div>
  );
}
function SubscriptionManager() {
  const [plans, setPlans] = useState(SUBSCRIPTIONS_DB);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const totalRevenue = plans.reduce((s,p)=>s+p.price*p.subscribers,0);

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>💳 Subscriptions</h1><p style={AS.sub}>Manage plans and track revenue</p></div>
        <button onClick={()=>setModal({type:"add"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Create Plan</button>
      </div>

      {/* Revenue summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"11px", marginBottom:"20px" }}>
        {[
          { label:"Total Revenue", value:`₹${totalRevenue.toLocaleString()}`, c:A.green, bg:A.greenLight, icon:"💰" },
          { label:"Total Subscribers", value:plans.reduce((s,p)=>s+p.subscribers,0), c:A.purple, bg:A.purpleLight, icon:"👥" },
          { label:"Premium Monthly", value:plans.find(p=>p.name==="Premium Monthly")?.subscribers, c:A.blue, bg:A.blueLight, icon:"📅" },
          { label:"Premium Yearly", value:plans.find(p=>p.name==="Premium Yearly")?.subscribers, c:A.amber, bg:A.amberLight, icon:"🗓" },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"38px", height:"38px", borderRadius:"10px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>{s.icon}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Revenue chart */}
      <div style={{ ...AS.card, marginBottom:"18px" }}>
        <div style={{ ...AS.flexB, marginBottom:"13px" }}>
          <h3 style={AS.h3}>Revenue Growth (12 Months)</h3>
          <span style={AS.badge(A.green,A.greenLight)}>+₹{((MONTHLY_REVENUE[11]-MONTHLY_REVENUE[0])/1000).toFixed(0)}K this year</span>
        </div>
        <AdminLine data={MONTHLY_REVENUE} height={90} color={A.green}/>
        <div style={{ ...AS.flexB, marginTop:"8px" }}>
          <span style={{ fontSize:"11px", color:A.slateLight }}>Jul 2024</span>
          <span style={{ fontSize:"11px", color:A.slateLight }}>Jun 2025</span>
        </div>
      </div>

      {/* Plans */}
      <h2 style={AS.secTitle}>Subscription Plans</h2>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
        {plans.map(p=>(
          <div key={p.id} style={{ ...AS.card, border:`2px solid ${p.price===0?A.border:A.purple}` }}>
            <div style={{ ...AS.flexB, marginBottom:"12px" }}>
              <div style={{ fontSize:"16px", fontWeight:"800", color:A.navy }}>{p.name}</div>
              <span style={AS.badge(p.active?A.green:A.red,p.active?A.greenLight:A.redLight)}>{p.active?"Active":"Disabled"}</span>
            </div>
            <div style={{ fontSize:"28px", fontWeight:"900", color:p.price===0?A.slate:A.purple, marginBottom:"4px" }}>
              {p.price===0?"Free":`₹${p.price}`}
            </div>
            <div style={{ fontSize:"12px", color:A.slateLight, marginBottom:"13px" }}>{p.duration}</div>
            <div style={{ marginBottom:"13px" }}>
              {p.features.map((f,i)=>(
                <div key={i} style={{ display:"flex", gap:7, fontSize:"12.5px", color:A.navyMid, padding:"5px 0", borderBottom:i<p.features.length-1?`1px solid ${A.border}`:"none" }}>
                  <span style={{ color:A.green }}>✓</span>{f}
                </div>
              ))}
            </div>
            <div style={{ ...AS.card, background:A.bg, padding:"11px", marginBottom:"12px" }}>
              <div style={{ fontSize:"20px", fontWeight:"800", color:A.purple }}>{p.subscribers.toLocaleString()}</div>
              <div style={{ fontSize:"11px", color:A.slateLight }}>Active Subscribers</div>
              {p.price>0&&<div style={{ fontSize:"13px", fontWeight:"700", color:A.green, marginTop:"3px" }}>₹{(p.price*p.subscribers).toLocaleString()} revenue</div>}
            </div>
            <div style={{ display:"flex", gap:7 }}>
              <button onClick={()=>setModal({type:"edit",data:p})} style={{ ...AS.btn, ...AS.btnSm, ...AS.btnOutline, flex:1, justifyContent:"center" }}>✏️ Edit</button>
              <button onClick={()=>{setPlans(ps=>ps.map(x=>x.id===p.id?{...x,active:!x.active}:x));showToast(p.active?"Plan disabled.":"Plan activated.");}}
                style={{ ...AS.btn, ...AS.btnSm, background:p.active?A.redLight:A.greenLight, color:p.active?A.red:A.green, border:"none" }}>
                {p.active?"Disable":"Enable"}
              </button>
            </div>
          </div>
        ))}
      </div>

      {(modal?.type==="add"||modal?.type==="edit")&&(
        <Modal title={modal.type==="add"?"Create New Plan":"Edit Plan"} onClose={()=>setModal(null)} width="480px">
          <label style={AS.label}>Plan Name</label>
          <input style={AS.input} defaultValue={modal.data?.name} placeholder="e.g. Premium Yearly"/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            <div><label style={AS.label}>Price (₹)</label><input style={AS.input} type="number" defaultValue={modal.data?.price||999} placeholder="999"/></div>
            <div><label style={AS.label}>Duration</label><input style={AS.input} defaultValue={modal.data?.duration||"1 Year"} placeholder="1 Year"/></div>
          </div>
          <label style={AS.label}>Features (one per line)</label>
          <textarea style={{ ...AS.input, minHeight:"90px" }} defaultValue={modal.data?.features?.join("\n")||""} placeholder={"All HD Videos\nComplete Notes\n1000+ Questions"}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast(modal.type==="add"?"Plan created!":"Plan updated!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>
              {modal.type==="add"?"Create Plan":"Save Changes"}
            </button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}


// ─── ANALYTICS CENTER ─────────────────────────────────────────────────────────

function AnalyticsCenter() {
  const topStudents = [...STUDENTS_DB].sort((a,b)=>b.score-a.score).slice(0,5);
  const weakChapters = [
    { name:"Biotechnology Applications", completion:24 },
    { name:"Reproductive Health", completion:31 },
    { name:"Ecology & Conservation", completion:38 },
    { name:"Microbes in Human Welfare", completion:42 },
  ];
  const engagementData = [
    {label:"Mon",val:42},{label:"Tue",val:78},{label:"Wed",val:91},{label:"Thu",val:65},
    {label:"Fri",val:88},{label:"Sat",val:120},{label:"Sun",val:104},
  ];

  return (
    <div style={AS.page}>
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ ...AS.h1, marginBottom:"3px" }}>📈 Analytics Center</h1>
        <p style={AS.sub}>Platform insights, student engagement, and content performance</p>
      </div>

      {/* Summary row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"11px", marginBottom:"18px" }}>
        {[
          { label:"Avg Session Time", value:"34 min", icon:"⏱", c:A.purple, bg:A.purpleLight },
          { label:"Daily Active Users", value:"84", icon:"👥", c:A.green, bg:A.greenLight },
          { label:"Completion Rate", value:"38%", icon:"📊", c:A.blue, bg:A.blueLight },
          { label:"Student Satisfaction", value:"4.7★", icon:"⭐", c:A.amber, bg:A.amberLight },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.icon}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px", marginBottom:"16px" }}>
        {/* Chapter views */}
        <div style={AS.card}>
          <h3 style={{ ...AS.h3, marginBottom:"14px" }}>📚 Most Viewed Chapters</h3>
          {CHAPTER_VIEWS.map((c,i)=>(
            <div key={i} style={{ marginBottom:"10px" }}>
              <div style={{ ...AS.flexB, marginBottom:"3px" }}>
                <span style={{ fontSize:"12.5px", fontWeight:"500", color:A.navyMid }}>{i+1}. {c.name}</span>
                <span style={{ fontSize:"12px", fontWeight:"700", color:A.purple }}>{c.views.toLocaleString()} views</span>
              </div>
              <div style={AS.pBar}><div style={AS.pFill(Math.round(c.views/CHAPTER_VIEWS[0].views*100),A.purple)}/></div>
            </div>
          ))}
        </div>

        {/* Weak areas */}
        <div style={AS.card}>
          <h3 style={{ ...AS.h3, marginBottom:"14px" }}>⚠️ Lowest Completion Areas</h3>
          {weakChapters.map((c,i)=>(
            <div key={i} style={{ marginBottom:"11px" }}>
              <div style={{ ...AS.flexB, marginBottom:"3px" }}>
                <span style={{ fontSize:"12.5px", fontWeight:"500", color:A.navyMid }}>{c.name}</span>
                <span style={{ fontSize:"12px", fontWeight:"700", color:c.completion<35?A.red:A.amber }}>{c.completion}%</span>
              </div>
              <div style={AS.pBar}><div style={AS.pFill(c.completion,c.completion<35?A.red:A.amber)}/></div>
            </div>
          ))}
          <div style={{ background:A.redLight, borderRadius:"9px", padding:"11px 13px", marginTop:"13px" }}>
            <div style={{ fontSize:"12.5px", fontWeight:"700", color:A.red, marginBottom:"3px" }}>💡 Recommendation</div>
            <div style={{ fontSize:"12px", color:"#991B1B" }}>Add more short videos (5–8 min) for low-completion chapters to improve engagement.</div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"14px" }}>
        {/* Top scorers */}
        <div style={AS.card}>
          <h3 style={{ ...AS.h3, marginBottom:"14px" }}>🏆 Top Scoring Students</h3>
          {topStudents.map((s,i)=>(
            <div key={s.id} style={{ display:"flex", alignItems:"center", gap:11, padding:"9px 0", borderBottom:i<topStudents.length-1?`1px solid ${A.border}`:"none" }}>
              <div style={{ width:"24px", textAlign:"center", fontSize:"14px", fontWeight:"800", color:i===0?"#F59E0B":i===1?"#94A3B8":i===2?"#D97706":A.slateLight }}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</div>
              <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"12px", flexShrink:0 }}>{s.name[0]}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{s.name}</div>
                <div style={{ fontSize:"11px", color:A.slateLight }}>{s.class} · {s.tests} tests</div>
              </div>
              <span style={{ fontSize:"14px", fontWeight:"800", color:A.green }}>{s.score}%</span>
            </div>
          ))}
        </div>

        {/* Engagement */}
        <div style={AS.card}>
          <h3 style={{ ...AS.h3, marginBottom:"14px" }}>📅 Weekly Engagement</h3>
          <AdminBarChart data={engagementData} height={90} color={A.blue}/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"9px", marginTop:"12px" }}>
            {[["Peak Day","Saturday (120)"],["Lowest Day","Monday (42)"],["Avg Daily","84 students"],["Total This Week","588 sessions"]].map(([l,v],i)=>(
              <div key={i} style={{ background:A.bg, borderRadius:"8px", padding:"9px 11px" }}>
                <div style={{ fontSize:"10.5px", color:A.slateLight }}>{l}</div>
                <div style={{ fontSize:"12.5px", fontWeight:"700", color:A.navy, marginTop:"2px" }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── NOTIFICATION CENTER ──────────────────────────────────────────────────────

function NotificationCenter() {
  const [notifications, setNotifications] = useState(NOTIFICATIONS_DB);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const typeColors = { Content:{c:A.blue,bg:A.blueLight}, Test:{c:A.purple,bg:A.purpleLight}, Announcement:{c:A.amber,bg:A.amberLight} };

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>📢 Notification Center</h1><p style={AS.sub}>Send announcements and updates to all students</p></div>
        <button onClick={()=>setModal({type:"compose"})} style={{ ...AS.btn, ...AS.btnPrimary }}>✉️ Send Notification</button>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"11px", marginBottom:"18px" }}>
        {[
          { label:"Sent This Month", value:"12", icon:"📤", c:A.purple, bg:A.purpleLight },
          { label:"Total Reach", value:"14,823", icon:"👥", c:A.green, bg:A.greenLight },
          { label:"Avg Open Rate", value:"78%", icon:"📬", c:A.blue, bg:A.blueLight },
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.icon}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Notification list */}
      <div style={{ display:"flex", flexDirection:"column", gap:"10px" }}>
        {notifications.map(n=>{
          const tc = typeColors[n.type]||typeColors.Announcement;
          return (
            <div key={n.id} style={{ ...AS.card, display:"flex", gap:14, alignItems:"flex-start" }}>
              <div style={{ width:"40px", height:"40px", borderRadius:"10px", background:tc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"18px", flexShrink:0 }}>
                {n.type==="Content"?"📚":n.type==="Test"?"🧪":"📢"}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ ...AS.flexB, marginBottom:"4px" }}>
                  <div style={{ fontSize:"14px", fontWeight:"700", color:A.navy }}>{n.title}</div>
                  <span style={AS.badge(tc.c,tc.bg)}>{n.type}</span>
                </div>
                <div style={{ fontSize:"12.5px", color:A.slate, marginBottom:"7px" }}>{n.body}</div>
                <div style={{ display:"flex", gap:14 }}>
                  <span style={{ fontSize:"11.5px", color:A.slateLight }}>📅 Sent: {n.sent}</span>
                  <span style={{ fontSize:"11.5px", color:A.slateLight }}>👥 Reached: {n.reach.toLocaleString()} students</span>
                </div>
              </div>
              <button onClick={()=>setNotifications(ns=>ns.filter(x=>x.id!==n.id))} style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>🗑</button>
            </div>
          );
        })}
      </div>

      {modal?.type==="compose"&&(
        <Modal title="Send Notification" onClose={()=>setModal(null)} width="520px">
          <label style={AS.label}>Notification Type</label>
          <select style={AS.input}><option>Announcement</option><option>Content</option><option>Test</option></select>
          <label style={AS.label}>Title</label>
          <input style={AS.input} placeholder="e.g. New Chapter: Biotechnology Released!"/>
          <label style={AS.label}>Message</label>
          <textarea style={{ ...AS.input, minHeight:"90px", resize:"vertical" }} placeholder="Write your notification message..."/>
          <label style={AS.label}>Send To</label>
          <select style={AS.input}><option>All Students (1,247)</option><option>Premium Students (690)</option><option>Free Students (557)</option><option>1st PU Students</option><option>2nd PU Students</option></select>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"12px" }}>
            <div style={{ background:A.purpleLight, borderRadius:"9px", padding:"11px", display:"flex", alignItems:"center", gap:9 }}>
              <input type="checkbox" defaultChecked style={{ width:"15px", height:"15px", accentColor:A.purple }}/>
              <div><div style={{ fontSize:"12.5px", fontWeight:"600", color:A.purple }}>In-App Notification</div><div style={{ fontSize:"11px", color:A.slate }}>All logged-in students</div></div>
            </div>
            <div style={{ background:A.blueLight, borderRadius:"9px", padding:"11px", display:"flex", alignItems:"center", gap:9 }}>
              <input type="checkbox" defaultChecked style={{ width:"15px", height:"15px", accentColor:A.blue }}/>
              <div><div style={{ fontSize:"12.5px", fontWeight:"600", color:A.blue }}>Email Notification</div><div style={{ fontSize:"11px", color:A.slate }}>Via registered email</div></div>
            </div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Notification sent to 1,247 students!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>📤 Send Now</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── BULK IMPORT ──────────────────────────────────────────────────────────────

// ─── CSV PARSING (dependency-free — no external library) ──────────────────
function parseCSVText(text) {
  const rows = [];
  let row = [], field = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i], next = text[i + 1];
    if (inQuotes) {
      if (c === '"' && next === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\r") { /* skip, \n handles the line break */ }
      else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
      else field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(cell => (cell || "").trim() !== ""));
}

function csvToObjects(text) {
  const rows = parseCSVText(text);
  if (rows.length === 0) return [];
  const headers = rows[0].map(h => (h || "").trim());
  return rows.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (r[i] || "").trim(); });
    return obj;
  });
}

// Matches the real values used by the Admin "Add Question" form elsewhere
// in this app — the actual application/database convention, not invented.
const VALID_EXAM_TYPES = ["KCET", "NEET", "PU"];
const VALID_DIFFICULTIES = ["Easy", "Medium", "Hard"];

function validateImportRow(row, chapterByName) {
  const errors = [];
  if (!row.question || !row.question.trim()) errors.push("Empty question text");
  if (!row.option_a || !row.option_a.trim()) errors.push("Missing option_a");
  if (!row.option_b || !row.option_b.trim()) errors.push("Missing option_b");
  if (!row.option_c || !row.option_c.trim()) errors.push("Missing option_c");
  if (!row.option_d || !row.option_d.trim()) errors.push("Missing option_d");

  const ans = (row.correct_answer || "").trim().toUpperCase();
  if (!["A", "B", "C", "D"].includes(ans)) {
    errors.push(`Invalid correct_answer "${row.correct_answer || ""}" (must be A, B, C, or D)`);
  }

  const examType = (row.exam_type || "").trim();
  if (!VALID_EXAM_TYPES.includes(examType)) {
    errors.push(`Invalid exam_type "${row.exam_type || ""}" (must be ${VALID_EXAM_TYPES.join("/")})`);
  }

  const difficulty = (row.difficulty || "").trim();
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    errors.push(`Invalid difficulty "${row.difficulty || ""}" (must be ${VALID_DIFFICULTIES.join("/")})`);
  }

  const chapterKey = (row.chapter_name || "").trim().toLowerCase();
  const chapter = chapterKey ? chapterByName.get(chapterKey) : null;
  if (!chapter) {
    errors.push(`No matching chapter for "${row.chapter_name || ""}"`);
  }

  return {
    ...row,
    correct_answer: ans,
    exam_type: examType,
    difficulty: difficulty,
    chapter_id: chapter ? chapter.id : null,
    valid: errors.length === 0,
    errors,
  };
}

function BulkImport() {
  const [step, setStep] = useState("select"); // select, preview, done
  const [importType, setImportType] = useState("questions");
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),3500); };

  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState("");
  const [rows, setRows] = useState([]); // parsed + validated rows, real data only
  const [chapters, setChapters] = useState([]);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null); // { succeeded, failed, total }

  useEffect(() => { sb.getAllChapters().then(setChapters).catch(()=>setChapters([])); }, []);

  const processFile = async (file) => {
    if (!file) return;
    setParseError(""); setParsing(true); setRows([]);
    try {
      if (!/\.csv$/i.test(file.name)) {
        throw new Error("Only .csv files are supported right now.");
      }
      const text = await file.text();
      const objects = csvToObjects(text);
      if (objects.length === 0) throw new Error("No data rows found in this file.");

      const chapterByName = new Map(
        chapters.map(c => [(c.chapter_name || "").trim().toLowerCase(), c])
      );
      const validated = objects.map(r => validateImportRow(r, chapterByName));
      setRows(validated);
      setStep("preview");
    } catch (e) {
      setParseError(e.message || "Could not read this file.");
    }
    setParsing(false);
  };

  const onFileInputChange = (e) => {
    const file = e.target.files && e.target.files[0];
    processFile(file);
    e.target.value = ""; // allow re-selecting the same file later
  };

  const onDrop = (e) => {
    e.preventDefault(); setDragOver(false);
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    processFile(file);
  };

  const validRows = rows.filter(r => r.valid);
  const invalidRows = rows.filter(r => !r.valid);

  const runImport = async (rowsToImport) => {
    setImporting(true);
    const succeeded = [];
    const failed = [];
    for (const row of rowsToImport) {
      try {
        await sb.addQuestion({
          chapter_id: row.chapter_id,
          question: row.question.trim(),
          option_a: row.option_a.trim(),
          option_b: row.option_b.trim(),
          option_c: row.option_c.trim(),
          option_d: row.option_d.trim(),
          correct_answer: row.correct_answer,
          explanation: (row.explanation || "").trim() || null,
          exam_type: row.exam_type,
          difficulty: row.difficulty,
        });
        succeeded.push(row);
      } catch (e) {
        failed.push({ row, error: e.message || "Unknown error" });
      }
    }
    setImporting(false);
    setImportResult({ succeeded, failed, total: rowsToImport.length });
    setStep("done");
  };

  const retryFailed = () => {
    if (!importResult) return;
    runImport(importResult.failed.map(f => f.row));
  };

  const resetAll = () => {
    setStep("select"); setRows([]); setImportResult(null); setParseError("");
  };

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500, maxWidth:"360px" }}>{toast}</div>}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ ...AS.h1, marginBottom:"3px" }}>📥 Bulk Import</h1>
        <p style={AS.sub}>Upload a CSV file to add questions in bulk</p>
      </div>

      {/* Step indicator */}
      <div style={{ display:"flex", gap:0, marginBottom:"22px" }}>
        {[["1","Select Type"],["2","Upload File"],["3","Preview"],["4","Import"]].map(([n,l],i)=>{
          const steps = {select:0,preview:2,done:3};
          const cur = steps[step]||0;
          const done = i<cur, active = i===cur;
          return (
            <div key={i} style={{ display:"flex", alignItems:"center" }}>
              <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:done?A.green:active?A.purple:A.border, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"12px", fontWeight:"700" }}>{done?"✓":n}</div>
                <div style={{ fontSize:"11px", color:active?A.purple:A.slateLight, marginTop:"4px", fontWeight:active?"700":"400", whiteSpace:"nowrap" }}>{l}</div>
              </div>
              {i<3&&<div style={{ width:"60px", height:"2px", background:done?A.green:A.border, margin:"0 6px", marginBottom:"16px" }}/>}
            </div>
          );
        })}
      </div>

      {step==="select"&&(
        <div style={AS.grid2}>
          <div style={AS.card}>
            <h2 style={{ ...AS.h3, marginBottom:"14px" }}>Choose Import Type</h2>
            {[
              { key:"questions", icon:"❓", label:"Questions", desc:"Bulk upload MCQ questions from CSV" },
              { key:"videos", icon:"🎥", label:"Videos", desc:"Add multiple YouTube video links (coming soon)" },
              { key:"notes", icon:"📝", label:"Notes", desc:"Upload multiple PDF notes at once (coming soon)" },
              { key:"pyq", icon:"📄", label:"PYQ", desc:"Import previous year questions (coming soon)" },
            ].map(t=>(
              <div key={t.key} onClick={()=>setImportType(t.key)}
                style={{ display:"flex", gap:12, alignItems:"center", padding:"12px", borderRadius:"10px", border:`2px solid ${importType===t.key?A.purple:A.border}`, background:importType===t.key?A.purpleLight:"#F8FAFC", marginBottom:"8px", cursor:"pointer", opacity: t.key==="questions"?1:0.55 }}>
                <span style={{ fontSize:"22px" }}>{t.icon}</span>
                <div><div style={{ fontSize:"13.5px", fontWeight:"700", color:A.navy }}>{t.label}</div><div style={{ fontSize:"12px", color:A.slateLight }}>{t.desc}</div></div>
              </div>
            ))}
            {importType!=="questions" && (
              <div style={{ fontSize:"12px", color:A.amber, marginBottom:"8px" }}>This import type isn't implemented yet — only Questions currently does a real import.</div>
            )}
            <button disabled={importType!=="questions"} onClick={()=>setStep("upload")}
              style={{ ...AS.btn, ...AS.btnPrimary, width:"100%", justifyContent:"center", marginTop:"6px", opacity: importType!=="questions"?0.5:1 }}>
              Continue →
            </button>
          </div>
          <div style={AS.card}>
            <h2 style={{ ...AS.h3, marginBottom:"14px" }}>📋 File Requirements</h2>
            <div style={{ background:A.blueLight, borderRadius:"9px", padding:"13px", marginBottom:"13px" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:A.blue, marginBottom:"6px" }}>Required CSV Columns</div>
              <div style={{ fontSize:"12px", color:A.blue, lineHeight:1.7 }}>
                question, option_a, option_b, option_c, option_d, correct_answer (A/B/C/D), explanation (optional), exam_type ({VALID_EXAM_TYPES.join("/")}), difficulty ({VALID_DIFFICULTIES.join("/")}), chapter_name (must match an existing chapter)
              </div>
            </div>
            <div style={{ fontSize:"12px", color:A.slateLight, lineHeight:"1.6" }}>
              .csv only for now · Max file size 5MB · First row must be the header row.
            </div>
          </div>
        </div>
      )}

      {step==="upload"&&(
        <div style={AS.card}>
          <div
            onDragOver={e=>{e.preventDefault();setDragOver(true);}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={onDrop}
            style={{ border:`2px dashed ${dragOver?A.purple:A.border}`, borderRadius:"10px", padding:"40px", textAlign:"center", background:dragOver?A.purpleLight:A.bg }}>
            <div style={{ fontSize:"36px", marginBottom:"10px" }}>📤</div>
            <div style={{ fontSize:"14px", fontWeight:"600", color:A.navy }}>{parsing ? "Reading file…" : "Drop your CSV file here"}</div>
            <div style={{ fontSize:"12.5px", color:A.slateLight, margin:"6px 0 14px" }}>or</div>
            <input ref={fileInputRef} type="file" accept=".csv" onChange={onFileInputChange} style={{ display:"none" }}/>
            <button onClick={()=>fileInputRef.current && fileInputRef.current.click()} disabled={parsing} style={{ ...AS.btn, ...AS.btnOutline }}>Browse Files</button>
          </div>
          {parseError && <div style={{ marginTop:"14px", background:A.redLight, border:"1px solid #FCA5A5", borderRadius:"9px", padding:"11px 14px", color:A.red, fontSize:"13px" }}>{parseError}</div>}
          <button onClick={()=>setStep("select")} style={{ ...AS.btn, ...AS.btnOutline, marginTop:"14px" }}>← Back</button>
        </div>
      )}

      {step==="preview"&&(
        <div>
          <div style={AS.card}>
            <div style={{ ...AS.flexB, marginBottom:"13px" }}>
              <h3 style={AS.h3}>Preview — {rows.length} rows detected</h3>
              <div style={{ display:"flex", gap:8 }}>
                <span style={AS.badge(A.green,A.greenLight)}>✅ {validRows.length} valid</span>
                <span style={AS.badge(A.red,A.redLight)}>❌ {invalidRows.length} invalid</span>
              </div>
            </div>
            <table style={AS.table}>
              <thead><tr>{["Question","Exam Type","Difficulty","Chapter","Answer","Status"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} style={{ background:!r.valid?"#FEF2F2":"transparent" }}>
                    <td style={{ ...AS.td, maxWidth:"220px", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{r.question || "—"}</td>
                    <td style={AS.td}>{r.exam_type || "—"}</td>
                    <td style={AS.td}>{r.difficulty || "—"}</td>
                    <td style={AS.td}>{r.chapter_name || "—"}</td>
                    <td style={AS.td}>{r.correct_answer || "—"}</td>
                    <td style={AS.td}>{r.valid ? "✅ Valid" : `❌ ${r.errors.join("; ")}`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:"flex", gap:8, marginTop:"14px" }}>
              <button onClick={()=>setStep("upload")} style={{ ...AS.btn, ...AS.btnOutline }}>← Back</button>
              <button disabled={validRows.length===0 || importing} onClick={()=>runImport(validRows)}
                style={{ ...AS.btn, ...AS.btnPrimary, opacity:(validRows.length===0||importing)?0.5:1 }}>
                {importing ? "Importing…" : `Import ${validRows.length} Valid Row${validRows.length===1?"":"s"} →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {step==="done"&&importResult&&(
        <div style={{ ...AS.card, textAlign:"center", padding:"48px 24px" }}>
          <div style={{ fontSize:"60px", marginBottom:"14px" }}>{importResult.failed.length===0 ? "🎉" : "⚠️"}</div>
          <h2 style={{ ...AS.h1, marginBottom:"6px" }}>Import {importResult.failed.length===0 ? "Complete" : "Finished With Errors"}</h2>
          <p style={{ ...AS.sub, marginBottom:"22px" }}>
            {importResult.succeeded.length} question{importResult.succeeded.length===1?"":"s"} successfully imported into the Question Bank.
          </p>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"11px", maxWidth:"360px", margin:"0 auto 22px" }}>
            {[["Imported",importResult.succeeded.length],["Failed",importResult.failed.length],["Total",importResult.total]].map(([l,v],i)=>(
              <div key={i} style={{ background:A.bg, borderRadius:"10px", padding:"13px" }}>
                <div style={{ fontSize:"20px", fontWeight:"800", color:i===0?A.green:i===1?A.red:A.purple }}>{v}</div>
                <div style={{ fontSize:"11.5px", color:A.slateLight }}>{l}</div>
              </div>
            ))}
          </div>
          {importResult.failed.length > 0 && (
            <div style={{ textAlign:"left", maxWidth:"520px", margin:"0 auto 22px", background:A.redLight, borderRadius:"10px", padding:"14px" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:A.red, marginBottom:"8px" }}>Failed rows:</div>
              {importResult.failed.map((f,i)=>(
                <div key={i} style={{ fontSize:"12px", color:A.red, marginBottom:"5px" }}>
                  "{(f.row.question||"").slice(0,50)}" — {f.error}
                </div>
              ))}
              <button onClick={retryFailed} disabled={importing} style={{ ...AS.btn, ...AS.btnOutline, marginTop:"8px", fontSize:"12px" }}>
                {importing ? "Retrying…" : `Retry ${importResult.failed.length} Failed Row${importResult.failed.length===1?"":"s"}`}
              </button>
            </div>
          )}
          <button onClick={resetAll} style={{ ...AS.btn, ...AS.btnPrimary }}>Import More →</button>
        </div>
      )}
    </div>
  );
}

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────

function AuditLog() {
  const [filter, setFilter] = useState("All");
  const extendedLog = [
    ...AUDIT_LOG,
    { id:"al6", admin:"Suresh Nair", action:"Published video: Photosynthesis Part 2", time:"2025-06-22 09:15", type:"Video" },
    { id:"al7", admin:"Dr. Ramesh Kumar", action:"Updated subscription: Premium Yearly ₹999", time:"2025-06-21 16:40", type:"Settings" },
    { id:"al8", admin:"Priya Menon", action:"Deleted draft: Ecology Notes v1", time:"2025-06-21 11:20", type:"Notes" },
    { id:"al9", admin:"Dr. Ramesh Kumar", action:"Created admin user: Suresh Nair (Teacher)", time:"2025-06-20 14:00", type:"Settings" },
    { id:"al10", admin:"Suresh Nair", action:"Added 5 PU Board PYQs for 2023", time:"2025-06-19 10:30", type:"Question" },
  ];
  const types = ["All",...[...new Set(extendedLog.map(l=>l.type))]];
  const filtered = filter==="All"?extendedLog:extendedLog.filter(l=>l.type===filter);

  return (
    <div style={AS.page}>
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>🛡️ Audit Log</h1><p style={AS.sub}>Complete history of all admin actions on the platform</p></div>
        <button style={{ ...AS.btn, ...AS.btnOutline }}>📤 Export Log</button>
      </div>
      <div style={{ display:"flex", gap:7, marginBottom:"16px", flexWrap:"wrap" }}>
        {types.map(t=>(
          <button key={t} onClick={()=>setFilter(t)} style={{ ...AS.btn, ...AS.btnSm, background:filter===t?A.navy:"#fff", color:filter===t?"#fff":A.slate, border:`1.5px solid ${filter===t?A.navy:A.border}` }}>{t}</button>
        ))}
      </div>
      <div style={{ ...AS.card, padding:0, overflow:"hidden" }}>
        <table style={AS.table}>
          <thead><tr>{["Admin","Action","Type","Time"].map(h=><th key={h} style={AS.th}>{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(log=>(
              <tr key={log.id}>
                <td style={AS.td}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11px", fontWeight:"700" }}>{log.admin[0]}</div>
                    <span style={{ fontSize:"13px", fontWeight:"500" }}>{log.admin}</span>
                  </div>
                </td>
                <td style={{ ...AS.td, maxWidth:"300px" }}>{log.action}</td>
                <td style={AS.td}><span style={AS.tag(log.type)}>{log.type}</span></td>
                <td style={{ ...AS.td, fontSize:"12px", color:A.slateLight }}>{log.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── ADMIN SETTINGS ───────────────────────────────────────────────────────────

function AdminSettings({ admin }) {
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ marginBottom:"20px" }}>
        <h1 style={{ ...AS.h1, marginBottom:"3px" }}>⚙️ Admin Settings</h1>
        <p style={AS.sub}>Platform configuration and admin team management</p>
      </div>
      <div style={AS.grid2}>
        {/* Platform settings */}
        <div style={AS.flexCol(14)}>
          <div style={AS.card}>
            <h2 style={{ ...AS.h3, marginBottom:"14px" }}>🌐 Platform Settings</h2>
            <label style={AS.label}>Platform Name</label>
            <input style={AS.input} defaultValue="BioVerse"/>
            <label style={AS.label}>Tagline</label>
            <input style={AS.input} defaultValue="Karnataka PU Biology Learning Platform"/>
            <label style={AS.label}>Support Email</label>
            <input style={AS.input} defaultValue="support@bioverse.in"/>
            <label style={AS.label}>Primary Color</label>
            <input style={{ ...AS.input, height:"42px" }} type="color" defaultValue="#0A5C36"/>
            <button onClick={()=>showToast("Platform settings saved!")} style={{ ...AS.btn, ...AS.btnPrimary, width:"auto", padding:"9px 20px" }}>Save Settings</button>
          </div>
          <div style={AS.card}>
            <h2 style={{ ...AS.h3, marginBottom:"14px" }}>🔔 Notification Settings</h2>
            {[["Email Notifications","Send emails for new content",true],["SMS Alerts","Send SMS to premium students",false],["Push Notifications","Browser push notifications",true],["Weekly Digest","Send weekly progress summary",true]].map(([l,d,def],i)=>(
              <div key={i} style={{ ...AS.flexB, padding:"10px 0", borderBottom:i<3?`1px solid ${A.border}`:"none" }}>
                <div><div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{l}</div><div style={{ fontSize:"11.5px", color:A.slateLight }}>{d}</div></div>
                <div style={{ width:"42px", height:"22px", borderRadius:"99px", background:def?A.green:A.border, cursor:"pointer", position:"relative" }}>
                  <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"#fff", position:"absolute", top:"2px", left:def?"22px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Admin team */}
        <div style={AS.flexCol(14)}>
          <div style={AS.card}>
            <div style={{ ...AS.flexB, marginBottom:"14px" }}>
              <h2 style={AS.h3}>👥 Admin Team</h2>
              <button style={{ ...AS.btn, ...AS.btnSm, ...AS.btnPrimary }}>+ Add Admin</button>
            </div>
            {ADMIN_USERS.map((u,i)=>(
              <div key={u.id} style={{ display:"flex", alignItems:"center", gap:11, padding:"11px 0", borderBottom:i<ADMIN_USERS.length-1?`1px solid ${A.border}`:"none" }}>
                <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"14px", flexShrink:0 }}>{u.avatar}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{u.name}</div>
                  <div style={{ fontSize:"11.5px", color:A.slateLight }}>{u.email}</div>
                </div>
                <span style={AS.badge(ADMIN_ROLES[u.role]?.color||A.slate, ADMIN_ROLES[u.role]?.bg||A.bg)}>{u.role}</span>
                <button style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }}>Remove</button>
              </div>
            ))}
          </div>

          <div style={AS.card}>
            <h2 style={{ ...AS.h3, marginBottom:"14px" }}>🔐 Security Settings</h2>
            {[["Two-Factor Authentication","Require 2FA for all admins",true],["Session Timeout","Auto-logout after 60 minutes",true],["IP Whitelist","Restrict to specific IPs",false]].map(([l,d,def],i)=>(
              <div key={i} style={{ ...AS.flexB, padding:"10px 0", borderBottom:i<2?`1px solid ${A.border}`:"none" }}>
                <div><div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>{l}</div><div style={{ fontSize:"11.5px", color:A.slateLight }}>{d}</div></div>
                <div style={{ width:"42px", height:"22px", borderRadius:"99px", background:def?A.green:A.border, cursor:"pointer", position:"relative" }}>
                  <div style={{ width:"18px", height:"18px", borderRadius:"50%", background:"#fff", position:"absolute", top:"2px", left:def?"22px":"2px", transition:"left 0.2s", boxShadow:"0 1px 3px rgba(0,0,0,0.2)" }}/>
                </div>
              </div>
            ))}
            <div style={{ marginTop:"13px" }}>
              <label style={AS.label}>Change Admin Password</label>
              <input style={AS.input} type="password" placeholder="Current password"/>
              <input style={AS.input} type="password" placeholder="New password"/>
              <button onClick={()=>showToast("Password updated!")} style={{ ...AS.btn, background:A.redLight, color:A.red, border:"none", fontSize:"13px" }}>Update Password</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── PYQ ADMIN MANAGER ────────────────────────────────────────────────────────

function PYQManager() {
  const [modal, setModal] = useState(null);
  const [filter, setFilter] = useState({ type:"All", year:"All" });
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };
  const filtered = MOCK_QUESTIONS
    .filter(q=>filter.type==="All"||q.type===filter.type)
    .filter(q=>filter.year==="All"||q.year===filter.year);

  return (
    <div style={AS.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:A.navy, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...AS.flexB, marginBottom:"20px" }}>
        <div><h1 style={{ ...AS.h1, marginBottom:"3px" }}>📄 PYQ Manager</h1><p style={AS.sub}>Manage Previous Year Questions for PU, KCET, and NEET</p></div>
        <div style={AS.flex(8)}>
          <button onClick={()=>setModal({type:"bulk"})} style={{ ...AS.btn, ...AS.btnOutline }}>📥 Bulk Import</button>
          <button onClick={()=>setModal({type:"add"})} style={{ ...AS.btn, ...AS.btnPrimary }}>+ Add PYQ</button>
        </div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"11px", marginBottom:"16px" }}>
        {[{l:"PU Board PYQs",v:MOCK_QUESTIONS.filter(q=>q.type==="PU").length,c:A.green,bg:A.greenLight,ic:"📚"},
          {l:"KCET PYQs",v:MOCK_QUESTIONS.filter(q=>q.type==="KCET").length,c:"#6366F1",bg:"#EEF2FF",ic:"🎯"},
          {l:"NEET PYQs",v:MOCK_QUESTIONS.filter(q=>q.type==="NEET").length,c:A.amber,bg:A.amberLight,ic:"🏆"}
        ].map((s,i)=>(
          <div key={i} style={{ ...AS.card, display:"flex", gap:11, alignItems:"center" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"9px", background:s.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"17px", flexShrink:0 }}>{s.ic}</div>
            <div><div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.v}</div><div style={{ fontSize:"11px", color:A.slateLight }}>{s.l}</div></div>
          </div>
        ))}
      </div>
      <div style={{ ...AS.card, padding:"12px 16px", marginBottom:"14px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"11px", alignItems:"end" }}>
          <div><label style={AS.label}>Exam Type</label><select style={{ ...AS.input, marginBottom:0 }} value={filter.type} onChange={e=>setFilter(f=>({...f,type:e.target.value}))}><option>All</option><option>PU</option><option>KCET</option><option>NEET</option></select></div>
          <div><label style={AS.label}>Year</label><select style={{ ...AS.input, marginBottom:0 }} value={filter.year} onChange={e=>setFilter(f=>({...f,year:e.target.value}))}><option>All</option><option>2023</option><option>2022</option><option>2021</option><option>2020</option></select></div>
          <div><label style={AS.label}>&nbsp;</label><button onClick={()=>setFilter({type:"All",year:"All"})} style={{ ...AS.btn, ...AS.btnOutline, marginBottom:0, width:"100%", justifyContent:"center" }}>Clear Filters</button></div>
        </div>
      </div>
      <div style={{ display:"flex", flexDirection:"column", gap:"9px" }}>
        {filtered.map((q,qi)=>(
          <div key={q.id} style={{ ...AS.card, padding:"14px 16px" }}>
            <div style={{ ...AS.flexB }}>
              <div style={{ display:"flex", gap:7, alignItems:"center" }}>
                <span style={{ fontSize:"12px", fontWeight:"700", color:A.slateLight }}>Q{qi+1}</span>
                <span style={AS.tag(q.type)}>{q.type}</span>
                <span style={AS.badge(A.slateLight,"#F1F5F9")}>{q.year||"2022"}</span>
                <span style={{ fontSize:"11.5px", color:A.slateLight }}>{q.chapter}</span>
              </div>
              <div style={AS.flex(6)}>
                <button onClick={()=>setModal({type:"edit",data:q})} style={{ ...AS.btn, ...AS.btnSm, background:A.purpleLight, color:A.purple, border:"none" }}>✏️</button>
                <button style={{ ...AS.btn, ...AS.btnSm, background:A.redLight, color:A.red, border:"none" }} onClick={()=>showToast("PYQ deleted.")}>🗑</button>
              </div>
            </div>
            <p style={{ fontSize:"13px", color:A.navyMid, margin:"8px 0 0", lineHeight:"1.5" }}>{q.text}</p>
          </div>
        ))}
      </div>
      {(modal?.type==="add"||modal?.type==="edit")&&(
        <Modal title={modal.type==="add"?"Add PYQ":"Edit PYQ"} onClose={()=>setModal(null)} width="580px">
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:"10px" }}>
            <div><label style={AS.label}>Exam</label><select style={AS.input}><option>KCET</option><option>NEET</option><option>PU</option></select></div>
            <div><label style={AS.label}>Year</label><input style={AS.input} defaultValue={modal.data?.year||"2023"}/></div>
            <div><label style={AS.label}>Difficulty</label><select style={AS.input}><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          </div>
          <label style={AS.label}>Chapter</label>
          <select style={AS.input}>{SYLLABUS["1st PU"].units.concat(SYLLABUS["2nd PU"].units).flatMap(u=>u.chapters).map(c=><option key={c.id}>{c.title}</option>)}</select>
          <label style={AS.label}>Question</label>
          <textarea style={{ ...AS.input, minHeight:"70px" }} defaultValue={modal.data?.text} placeholder="Enter the question..."/>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px" }}>
            {["A","B","C","D"].map((opt,i)=>(
              <div key={opt}><label style={AS.label}>Option {opt}</label><input style={AS.input} defaultValue={modal.data?.options?.[i]}/></div>
            ))}
          </div>
          <label style={AS.label}>Correct Answer</label>
          <select style={AS.input}><option value={0}>A</option><option value={1}>B</option><option value={2}>C</option><option value={3}>D</option></select>
          <label style={AS.label}>Explanation</label>
          <textarea style={{ ...AS.input, minHeight:"55px" }} defaultValue={modal.data?.explanation}/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast(modal.type==="add"?"PYQ added!":"PYQ updated!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>
              {modal.type==="add"?"Add PYQ":"Save Changes"}
            </button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
      {modal?.type==="bulk"&&(
        <Modal title="Bulk Import PYQs" onClose={()=>setModal(null)} width="460px">
          <div style={{ border:`2px dashed ${A.border}`, borderRadius:"10px", padding:"28px", textAlign:"center", marginBottom:"12px", background:A.bg }}>
            <div style={{ fontSize:"32px", marginBottom:"8px" }}>📤</div>
            <div style={{ fontSize:"13px", fontWeight:"600", color:A.navy }}>Drop CSV file here</div>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("PYQs imported!");setModal(null);}} style={{ ...AS.btn, ...AS.btnPrimary, flex:1, justifyContent:"center" }}>Import PYQs</button>
            <button onClick={()=>setModal(null)} style={{ ...AS.btn, ...AS.btnOutline }}>Cancel</button>
          </div>
        </Modal>
      )}
    </div>
  );
}


// ─── ADMIN PANEL SHELL ────────────────────────────────────────────────────────

const AI_SUGGESTED_QUESTIONS = [
  "Explain Photosynthesis step by step",
  "What is DNA Replication?",
  "Difference between Mitosis and Meiosis",
  "Explain the Human Heart with diagram",
  "Give me a memory trick for Krebs Cycle",
  "What are the NEET important topics in Genetics?",
  "Summarize Cell Division for quick revision",
  "Why is ATP called energy currency?",
  "Explain Central Dogma of Molecular Biology",
  "What is the significance of meiosis?",
];

const AI_QUICK_ACTIONS = [
  { icon:"📖", label:"Explain Concept", prompt:"Explain the current concept in simple language with examples" },
  { icon:"❓", label:"Generate MCQs", prompt:"Generate 5 KCET-style MCQs on this topic with answers and explanations" },
  { icon:"📝", label:"Quick Notes", prompt:"Generate concise quick revision notes with key points" },
  { icon:"🧪", label:"Create Test", prompt:"Create a short 5-question test on this chapter with explanations" },
  { icon:"🧠", label:"Memory Tricks", prompt:"Give me mnemonics and memory tricks for this chapter" },
  { icon:"🗺", label:"Mind Map", prompt:"Create a structured mind map outline for this chapter" },
];

const CONCEPT_MASTERIES = [
  { chapter:"Cell: The Unit of Life", mastery:88, level:"Advanced", color:"#10B981" },
  { chapter:"Photosynthesis", mastery:72, level:"Intermediate", color:"#F59E0B" },
  { chapter:"DNA & Inheritance", mastery:91, level:"Mastered", color:"#059669" },
  { chapter:"Human Physiology", mastery:55, level:"Intermediate", color:"#F59E0B" },
  { chapter:"Ecology", mastery:34, level:"Beginner", color:"#DC2626" },
  { chapter:"Reproduction", mastery:47, level:"Beginner", color:"#EF4444" },
  { chapter:"Biotechnology", mastery:63, level:"Intermediate", color:"#F59E0B" },
  { chapter:"Evolution", mastery:79, level:"Advanced", color:"#10B981" },
];

const WEAK_AREA_RECOMMENDATIONS = [
  { chapter:"Ecology", type:"video", title:"Ecosystem Energy Flow Explained", icon:"🎥" },
  { chapter:"Reproduction", type:"notes", title:"Reproductive Health — Quick PDF", icon:"📄" },
  { chapter:"Biotechnology", type:"practice", title:"20 NEET MCQs — Biotech", icon:"❓" },
];

const KCET_CHAPTER_WEIGHTS = [
  { chapter:"Cell Biology", weight:12, myScore:88 },
  { chapter:"Genetics & Evolution", weight:18, myScore:71 },
  { chapter:"Plant Physiology", weight:14, myScore:65 },
  { chapter:"Human Physiology", weight:20, myScore:58 },
  { chapter:"Ecology", weight:10, myScore:34 },
  { chapter:"Reproduction", weight:12, myScore:47 },
  { chapter:"Biotechnology", weight:8, myScore:63 },
  { chapter:"Diversity", weight:6, myScore:82 },
];

const NEET_UNIT_WEIGHTS = [
  { unit:"Diversity in Living World", marks:14, myPct:82 },
  { unit:"Structural Organisation", marks:10, myPct:70 },
  { unit:"Cell Structure & Function", marks:15, myPct:88 },
  { unit:"Plant Physiology", marks:12, myPct:55 },
  { unit:"Human Physiology", marks:17, myPct:65 },
  { unit:"Reproduction", marks:14, myPct:45 },
  { unit:"Genetics & Evolution", marks:18, myPct:72 },
  { unit:"Biology in Human Welfare", marks:8, myPct:40 },
  { unit:"Biotechnology", marks:12, myPct:35 },
  { unit:"Ecology & Environment", marks:10, myPct:60 },
];

const WEEKLY_INSIGHTS = [
  { icon:"📈", insight:"Your Cell Biology accuracy improved by 12% this week — great work!", type:"positive" },
  { icon:"⚠️", insight:"You've skipped Ecology for 5 days. Allocate 30 min today.", type:"warning" },
  { icon:"🎯", insight:"Genetics MCQ accuracy: 71% → target 85% for KCET. Try 10 more questions.", type:"tip" },
  { icon:"🔥", insight:"12-day streak! You're in the top 15% of consistent learners.", type:"positive" },
];

const BIOLOGY_SYSTEM_PROMPT = `You are BioVerse AI — an expert Biology tutor for Karnataka PU students preparing for KCET and NEET exams.

Your role:
- Teach Biology concepts from the Karnataka PU syllabus (1st and 2nd PU)
- Explain concepts clearly, step-by-step, using exam-oriented language
- Generate KCET/NEET-style MCQs when asked, always with 4 options (A/B/C/D), the correct answer, and a clear explanation
- Provide memory tricks, mnemonics, and analogies to help students remember
- Generate concise revision notes in bullet-point format
- Stay strictly focused on Biology — if asked about other subjects, politely redirect to Biology
- When generating MCQs, format them clearly: Q1. [question] A) B) C) D) Answer: [letter] Explanation: [brief explanation]
- Keep language simple and student-friendly, appropriate for 16-18 year olds
- Reference the NCERT Biology textbook content where relevant
- For diagrams, describe them textually with clear structure (since you cannot draw)

Always end responses with a helpful follow-up suggestion like "Would you like me to generate practice questions on this?" or "Want a quick revision sheet on this topic?"`;


// ─── AI CHAT INTERFACE ────────────────────────────────────────────────────────

function AITutor({ currentChapter, currentLevel, user }) {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: `🧬 **Welcome to BioVerse AI Tutor!**\n\nI'm your personal Biology teacher for Karnataka PU, KCET, and NEET preparation.\n\nI can help you:\n• 📖 Explain any Biology concept\n• ❓ Generate KCET/NEET practice MCQs\n• 📝 Create quick revision notes\n• 🧠 Give memory tricks & mnemonics\n• 🗺 Build mind maps\n• 🧪 Create personalized tests\n\n${currentChapter ? `I can see you're studying **${currentChapter}** — ask me anything about it!` : "What would you like to learn today?"}`
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("English");
  const [activeTab, setActiveTab] = useState("chat");
  const [noteType, setNoteType] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteLoading, setNoteLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText) return;
    setInput("");

    const contextNote = currentChapter
      ? `\n[Student context: Currently studying "${currentChapter}" — ${currentLevel || "1st PU"} Biology. Tailor your response to this chapter when relevant.]`
      : "";
    const langNote = language === "Kannada"
      ? "\n[Please respond in simple Kannada language, mixing English biology terms where needed.]"
      : "";

    const newMessages = [...messages, { role: "user", content: userText }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      const reply = await callBioAI(apiMessages, BIOLOGY_SYSTEM_PROMPT + contextNote + langNote);
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "⚠️ I'm having trouble connecting right now. Please check your internet connection and try again."
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateNotes = async (type) => {
    setNoteType(type);
    setNoteLoading(true);
    setNoteContent("");
    const prompts = {
      quick: `Generate concise quick revision notes for "${currentChapter || "Cell Biology"}" in bullet-point format. Include: key definitions, important processes, diagrams description, and 3 KCET/NEET important points. Format clearly with emoji headers.`,
      summary: `Generate a one-page summary for "${currentChapter || "Cell Biology"}". Cover: Introduction, Key Concepts (5-7 points), Important Terms (5 terms with definitions), and Memory Trick. Keep it concise and exam-focused.`,
      lastminute: `Generate LAST MINUTE revision sheet for "${currentChapter || "Cell Biology"}" — only the most important points for KCET/NEET. Format as: Must-Know Facts (5 points), Common MCQ Traps (3 points), Important Numbers/Dates, Quick Mnemonics. Very concise.`,
    };
    try {
      const reply = await callBioAI(
        [{ role: "user", content: prompts[type] }],
        BIOLOGY_SYSTEM_PROMPT
      );
      setNoteContent(reply);
    } catch {
      setNoteContent("⚠️ Could not generate notes. Please try again.");
    } finally {
      setNoteLoading(false);
    }
  };

  // Format AI markdown-ish text for display
  const formatMessage = (text) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("**") && line.endsWith("**"))
        return <div key={i} style={{ fontWeight:"800", fontSize:"14.5px", marginBottom:"4px", color:"#0D1F17" }}>{line.replace(/\*\*/g,"")}</div>;
      if (line.startsWith("• ") || line.startsWith("- "))
        return <div key={i} style={{ display:"flex", gap:8, marginBottom:"3px", alignItems:"flex-start" }}><span style={{ color:T.g400, flexShrink:0, marginTop:"1px" }}>•</span><span style={{ fontSize:"13.5px", lineHeight:"1.55" }}>{line.slice(2)}</span></div>;
      if (/^Q\d+\./.test(line))
        return <div key={i} style={{ fontWeight:"700", fontSize:"13.5px", color:T.g600, marginTop:"10px", marginBottom:"4px" }}>{line}</div>;
      if (/^[A-D]\)/.test(line))
        return <div key={i} style={{ fontSize:"13px", color:T.textMid, paddingLeft:"12px", marginBottom:"2px" }}>{line}</div>;
      if (line.startsWith("Answer:"))
        return <div key={i} style={{ fontSize:"13px", fontWeight:"700", color:T.green || "#059669", marginTop:"4px" }}>{line}</div>;
      if (line.startsWith("Explanation:"))
        return <div key={i} style={{ fontSize:"12.5px", color:T.textLight, fontStyle:"italic", marginBottom:"8px" }}>{line}</div>;
      if (line.trim() === "")
        return <div key={i} style={{ height:"6px" }}/>;
      return <div key={i} style={{ fontSize:"13.5px", lineHeight:"1.6", color:T.textMid, marginBottom:"2px" }}>{line.replace(/\*\*/g,"")}</div>;
    });
  };

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"20px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🤖 AI Biology Tutor</h1>
          <p style={S.sub}>
            Your personal Biology teacher for Karnataka PU, KCET & NEET
            {currentChapter && <span style={{ color:T.g400, fontWeight:"600" }}> · Studying: {currentChapter}</span>}
          </p>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <select value={language} onChange={e=>setLanguage(e.target.value)}
            style={{ ...S.input, marginBottom:0, width:"auto", padding:"7px 12px", fontSize:"13px", borderRadius:"9px" }}>
            <option>English</option>
            <option>Kannada</option>
          </select>
        </div>
      </div>

      {/* Tab switcher */}
      <div style={{ display:"flex", gap:7, marginBottom:"18px" }}>
        {[
          { k:"chat", l:"💬 AI Chat" },
          { k:"notes", l:"📝 AI Notes Generator" },
          { k:"questions", l:"❓ AI Question Generator" },
          { k:"test", l:"🧪 AI Test Creator" },
        ].map(tab=>(
          <button key={tab.k} onClick={()=>setActiveTab(tab.k)}
            style={{ ...S.btn, ...S.btnSm, background:activeTab===tab.k?T.g600:"#fff", color:activeTab===tab.k?"#fff":T.textMid, border:`1.5px solid ${activeTab===tab.k?T.g600:T.border}` }}>
            {tab.l}
          </button>
        ))}
      </div>

      {/* CHAT TAB */}
      {activeTab==="chat" && (
        <div style={{ display:"grid", gridTemplateColumns:"1fr 300px", gap:"16px", alignItems:"start" }}>
          <div>
            {/* Chat window */}
            <div style={{ ...S.card, padding:0, overflow:"hidden", display:"flex", flexDirection:"column", height:"520px" }}>
              {/* Messages */}
              <div style={{ flex:1, overflowY:"auto", padding:"18px" }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display:"flex", gap:10, marginBottom:"16px", flexDirection: msg.role==="user"?"row-reverse":"row" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px",
                      background: msg.role==="user" ? `linear-gradient(135deg,${T.g600},${T.g400})` : "linear-gradient(135deg,#7C3AED,#6D28D9)" }}>
                      {msg.role==="user" ? (user?.name?.[0]?.toUpperCase()||"S") : "🤖"}
                    </div>
                    <div style={{ maxWidth:"82%", background: msg.role==="user" ? `linear-gradient(135deg,${T.g600},${T.g500})` : T.g25,
                      borderRadius: msg.role==="user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                      padding:"12px 16px", border: msg.role==="assistant"?`1px solid ${T.border}`:"none" }}>
                      <div style={{ color: msg.role==="user"?"#fff":T.textMid }}>
                        {msg.role==="assistant" ? formatMessage(msg.content) :
                          <span style={{ fontSize:"13.5px", lineHeight:"1.55" }}>{msg.content}</span>}
                      </div>
                    </div>
                  </div>
                ))}
                {loading && (
                  <div style={{ display:"flex", gap:10, marginBottom:"16px" }}>
                    <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:"linear-gradient(135deg,#7C3AED,#6D28D9)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"16px", flexShrink:0 }}>🤖</div>
                    <div style={{ background:T.g25, borderRadius:"4px 16px 16px 16px", padding:"14px 18px", border:`1px solid ${T.border}` }}>
                      <div style={{ display:"flex", gap:5, alignItems:"center" }}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{ width:"7px", height:"7px", borderRadius:"50%", background:T.g400, animation:`aiPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>
                        ))}
                        <span style={{ fontSize:"12px", color:T.textFaint, marginLeft:"6px" }}>BioVerse AI is thinking…</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef}/>
              </div>

              {/* Quick actions */}
              <div style={{ padding:"10px 16px", borderTop:`1px solid ${T.border}`, display:"flex", gap:6, overflowX:"auto" }}>
                {AI_QUICK_ACTIONS.map((a,i)=>(
                  <button key={i} onClick={()=>sendMessage(a.prompt)}
                    style={{ ...S.btn, ...S.btnSm, background:T.g25, color:T.g600, border:`1px solid ${T.border}`, whiteSpace:"nowrap", fontSize:"12px", padding:"6px 12px" }}>
                    {a.icon} {a.label}
                  </button>
                ))}
              </div>

              {/* Input row */}
              <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}`, display:"flex", gap:8 }}>
                <input value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&!loading&&sendMessage()}
                  placeholder="Ask anything about Biology… (Enter to send)"
                  style={{ ...S.input, marginBottom:0, flex:1, borderRadius:"99px", paddingLeft:"16px", fontSize:"13.5px" }}
                  disabled={loading}/>
                <button onClick={()=>sendMessage()} disabled={loading||!input.trim()}
                  style={{ ...S.btn, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff", padding:"10px 20px", fontSize:"13.5px", opacity:loading||!input.trim()?0.6:1 }}>
                  Send ↑
                </button>
              </div>
            </div>
          </div>

          {/* Sidebar suggestions */}
          <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
            <div style={S.card}>
              <h3 style={{ ...S.h3, marginBottom:"12px" }}>💡 Suggested Questions</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {AI_SUGGESTED_QUESTIONS.slice(0,7).map((q,i)=>(
                  <button key={i} onClick={()=>sendMessage(q)}
                    style={{ ...S.btn, background:T.g25, color:T.g700, border:`1px solid ${T.border}`, fontSize:"12px", padding:"8px 11px", textAlign:"left", justifyContent:"flex-start", lineHeight:"1.4" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ ...S.card, background:`linear-gradient(135deg,#7C3AED,#6D28D9)` }}>
              <div style={{ fontSize:"13px", fontWeight:"700", color:"#fff", marginBottom:"8px" }}>🏆 AI Coach Says</div>
              <div style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.82)", lineHeight:"1.6" }}>
                {currentChapter
                  ? `You're studying "${currentChapter}" — ask me to generate 5 exam questions to test yourself!`
                  : "Start by asking me to explain a chapter. I'll create custom notes and MCQs just for you!"}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NOTES GENERATOR TAB */}
      {activeTab==="notes" && (
        <div style={S.grid2}>
          <div>
            <div style={S.card}>
              <h2 style={{ ...S.h3, marginBottom:"14px" }}>📝 AI Notes Generator</h2>
              <p style={{ ...S.sub, marginBottom:"16px" }}>
                Generate AI-powered revision notes for <strong>{currentChapter || "any chapter"}</strong>
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {[
                  { type:"quick", icon:"⚡", label:"Quick Revision Notes", desc:"Bullet-point key concepts with exam tips" },
                  { type:"summary", icon:"📄", label:"One-Page Summary", desc:"Comprehensive yet concise chapter overview" },
                  { type:"lastminute", icon:"🔥", label:"Last Minute Sheet", desc:"Critical points only — for exam day revision" },
                ].map(n=>(
                  <button key={n.type} onClick={()=>generateNotes(n.type)} disabled={noteLoading}
                    style={{ ...S.btn, background: noteType===n.type ? `linear-gradient(135deg,${T.g600},${T.g400})` : T.g25,
                      color: noteType===n.type?"#fff":T.g600, border:`1.5px solid ${noteType===n.type?T.g600:T.border}`,
                      padding:"14px 16px", justifyContent:"flex-start", gap:12, width:"100%", opacity:noteLoading&&noteType!==n.type?0.5:1 }}>
                    <span style={{ fontSize:"22px" }}>{n.icon}</span>
                    <div style={{ textAlign:"left" }}>
                      <div style={{ fontSize:"14px", fontWeight:"700" }}>{n.label}</div>
                      <div style={{ fontSize:"12px", opacity:0.75 }}>{n.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ marginTop:"14px" }}>
                <label style={S.label}>Chapter (optional)</label>
                <select style={S.input}>
                  <option>{currentChapter || "Current Chapter"}</option>
                  {SYLLABUS["1st PU"].units.concat(SYLLABUS["2nd PU"].units).flatMap(u=>u.chapters).map(c=><option key={c.id}>{c.title}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"13px" }}>
              <h3 style={S.h3}>
                {noteType ? { quick:"⚡ Quick Revision Notes", summary:"📄 One-Page Summary", lastminute:"🔥 Last Minute Sheet" }[noteType] : "Generated Notes"}
              </h3>
              {noteContent && !noteLoading && (
                <button style={{ ...S.btn, ...S.btnSm, background:T.g50, color:T.g600, border:`1px solid ${T.border}`, fontSize:"12px" }}>
                  📥 Download PDF
                </button>
              )}
            </div>
            {noteLoading ? (
              <div style={{ textAlign:"center", padding:"48px 20px" }}>
                <div style={{ fontSize:"40px", marginBottom:"12px" }}>🤖</div>
                <div style={{ fontSize:"14px", fontWeight:"600", color:T.g600, marginBottom:"6px" }}>AI is generating your notes…</div>
                <div style={{ fontSize:"12.5px", color:T.textFaint }}>This takes 10–15 seconds</div>
                <div style={{ display:"flex", gap:5, justifyContent:"center", marginTop:"14px" }}>
                  {[0,1,2].map(i=><div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:T.g400, animation:`aiPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
                </div>
              </div>
            ) : noteContent ? (
              <div style={{ maxHeight:"420px", overflowY:"auto", fontSize:"13.5px", lineHeight:"1.65", color:T.textMid, whiteSpace:"pre-wrap" }}>
                {noteContent}
              </div>
            ) : (
              <div style={{ textAlign:"center", padding:"48px 20px", color:T.textFaint }}>
                <div style={{ fontSize:"40px", marginBottom:"10px" }}>📝</div>
                <div style={{ fontSize:"14px" }}>Select a note type to generate AI-powered revision content</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* QUESTION GENERATOR TAB */}
      {activeTab==="questions" && (
        <AIQuestionGenerator currentChapter={currentChapter} user={user}/>
      )}

      {/* TEST CREATOR TAB */}
      {activeTab==="test" && (
        <AITestCreator currentChapter={currentChapter} user={user}/>
      )}

      <style>{`
        @keyframes aiPulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}


// ─── AI QUESTION GENERATOR ────────────────────────────────────────────────────

function AIQuestionGenerator({ currentChapter, user }) {
  const [settings, setSettings] = useState({ chapter: currentChapter||"Cell: The Unit of Life", type:"KCET", difficulty:"Medium", count:5 });
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [shown, setShown] = useState({});

  const generate = async () => {
    setLoading(true);
    setQuestions([]);
    setShown({});
    const prompt = `Generate exactly ${settings.count} ${settings.type}-style Biology MCQs on "${settings.chapter}" at ${settings.difficulty} difficulty level.

Format STRICTLY as follows for each question:
Q[number]. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]
Explanation: [1-2 sentence explanation]

Make questions exam-realistic, syllabus-aligned, and at ${settings.difficulty} difficulty. No extra text before or after the questions.`;

    try {
      const reply = await callBioAI([{ role:"user", content:prompt }], BIOLOGY_SYSTEM_PROMPT);
      // Parse questions from the AI response
      const parsed = [];
      const blocks = reply.split(/(?=Q\d+\.)/).filter(b=>b.trim());
      blocks.forEach((block, idx) => {
        const lines = block.split("\n").map(l=>l.trim()).filter(Boolean);
        const qLine = lines.find(l=>/^Q\d+\./.test(l));
        const opts = ["A","B","C","D"].map(letter=>{
          const line = lines.find(l=>l.startsWith(`${letter})`));
          return line ? line.slice(2).trim() : "";
        });
        const ansLine = lines.find(l=>l.startsWith("Answer:"));
        const expLine = lines.find(l=>l.startsWith("Explanation:"));
        const ansLetter = ansLine ? ansLine.replace("Answer:","").trim() : "A";
        const correctIdx = ["A","B","C","D"].indexOf(ansLetter);
        if(qLine && opts[0]) {
          parsed.push({
            id: idx,
            text: qLine.replace(/^Q\d+\.\s*/,""),
            options: opts,
            correct: correctIdx >= 0 ? correctIdx : 0,
            explanation: expLine ? expLine.replace("Explanation:","").trim() : "",
          });
        }
      });
      setQuestions(parsed.length > 0 ? parsed : [{ id:0, text:"Could not parse questions. Try again.", options:["A","B","C","D"], correct:0, explanation:"" }]);
    } catch {
      setQuestions([{ id:0, text:"⚠️ Failed to generate questions. Please retry.", options:["—","—","—","—"], correct:0, explanation:"" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.grid2}>
      <div>
        <div style={S.card}>
          <h2 style={{ ...S.h3, marginBottom:"14px" }}>❓ AI Question Generator</h2>
          <label style={S.label}>Chapter</label>
          <select style={S.input} value={settings.chapter} onChange={e=>setSettings(s=>({...s,chapter:e.target.value}))}>
            {SYLLABUS["1st PU"].units.concat(SYLLABUS["2nd PU"].units).flatMap(u=>u.chapters).map(c=><option key={c.id}>{c.title}</option>)}
          </select>
          <label style={S.label}>Question Type</label>
          <select style={S.input} value={settings.type} onChange={e=>setSettings(s=>({...s,type:e.target.value}))}>
            <option>KCET</option><option>NEET</option><option>PU Board</option>
          </select>
          <label style={S.label}>Difficulty</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:"13px" }}>
            {["Easy","Medium","Hard"].map(d=>(
              <button key={d} onClick={()=>setSettings(s=>({...s,difficulty:d}))}
                style={{ ...S.btn, padding:"9px", justifyContent:"center", fontSize:"13px",
                  background: settings.difficulty===d?(d==="Easy"?T.g600:d==="Medium"?"#D97706":"#DC2626"):"#F9FAFB",
                  color: settings.difficulty===d?"#fff":T.textMid, border:`1.5px solid ${settings.difficulty===d?"transparent":T.border}` }}>
                {d}
              </button>
            ))}
          </div>
          <label style={S.label}>Number of Questions</label>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:"14px" }}>
            {[3,5,10,15].map(n=>(
              <button key={n} onClick={()=>setSettings(s=>({...s,count:n}))}
                style={{ ...S.btn, padding:"9px", justifyContent:"center", fontSize:"14px", fontWeight:"700",
                  background: settings.count===n?T.g600:"#F9FAFB",
                  color: settings.count===n?"#fff":T.textMid, border:`1.5px solid ${settings.count===n?T.g600:T.border}` }}>
                {n}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={loading}
            style={{ ...S.btn, ...S.btnPrimary, padding:"13px", fontSize:"14.5px", opacity:loading?0.7:1 }}>
            {loading ? "🤖 Generating…" : "⚡ Generate Questions"}
          </button>
        </div>
      </div>

      <div>
        {loading ? (
          <div style={{ ...S.card, textAlign:"center", padding:"48px 20px" }}>
            <div style={{ fontSize:"40px", marginBottom:"12px" }}>🤖</div>
            <div style={{ fontSize:"14px", fontWeight:"600", color:T.g600 }}>AI is creating your questions…</div>
            <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"5px" }}>Crafting {settings.count} {settings.difficulty} {settings.type} questions</div>
            <div style={{ display:"flex", gap:5, justifyContent:"center", marginTop:"14px" }}>
              {[0,1,2].map(i=><div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:T.g400, animation:`aiPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
            </div>
          </div>
        ) : questions.length > 0 ? (
          <div style={{ display:"flex", flexDirection:"column", gap:11 }}>
            {questions.map((q,qi)=>(
              <div key={q.id} style={S.card}>
                <p style={{ fontSize:"14px", fontWeight:"600", marginBottom:"11px", lineHeight:"1.5" }}>
                  <span style={{ color:T.textFaint, marginRight:"6px" }}>Q{qi+1}.</span>{q.text}
                </p>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginBottom:"10px" }}>
                  {q.options.map((opt,oi)=>{
                    const rev=shown[q.id]; const ok=oi===q.correct;
                    return (
                      <div key={oi} style={{ padding:"8px 12px", borderRadius:"8px",
                        border:`1.5px solid ${rev?(ok?"#10B981":T.border):T.border}`,
                        background:rev?(ok?T.g50:"#F9FAFB"):"#F9FAFB", fontSize:"13px", display:"flex", gap:6 }}>
                        <span style={{ fontWeight:"700", color:T.textFaint }}>{String.fromCharCode(65+oi)}.</span>{opt}
                        {rev&&ok&&<span style={{ marginLeft:"auto", color:T.g400, fontWeight:"700" }}>✓</span>}
                      </div>
                    );
                  })}
                </div>
                {shown[q.id] && q.explanation && (
                  <div style={{ background:T.g50, borderRadius:"8px", padding:"9px 12px", marginBottom:"9px", fontSize:"12.5px", color:T.g700 }}>
                    💡 {q.explanation}
                  </div>
                )}
                <button onClick={()=>setShown(s=>({...s,[q.id]:!s[q.id]}))}
                  style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>
                  {shown[q.id]?"Hide Answer":"Show Answer"}
                </button>
              </div>
            ))}
            <button onClick={()=>setShown(Object.fromEntries(questions.map(q=>[q.id,true])))}
              style={{ ...S.btn, background:T.g25, color:T.g600, border:`1px solid ${T.border}`, justifyContent:"center" }}>
              Show All Answers
            </button>
          </div>
        ) : (
          <div style={{ ...S.card, textAlign:"center", padding:"48px 20px", color:T.textFaint }}>
            <div style={{ fontSize:"40px", marginBottom:"10px" }}>🤖</div>
            <div style={{ fontSize:"14px" }}>Configure settings and click Generate to create AI-powered questions</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AI TEST CREATOR ──────────────────────────────────────────────────────────

function AITestCreator({ currentChapter, user }) {
  const [settings, setSettings] = useState({ chapter:currentChapter||"Cell: The Unit of Life", difficulty:"Medium", count:5 });
  const [phase, setPhase] = useState("setup"); // setup, test, result
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(300);

  useEffect(()=>{
    if(phase!=="test") return;
    const t = setInterval(()=>setTimeLeft(tl=>tl>0?tl-1:0),1000);
    return()=>clearInterval(t);
  },[phase]);

  const generateTest = async () => {
    setLoading(true);
    const prompt = `Generate exactly ${settings.count} ${settings.difficulty} Biology MCQs on "${settings.chapter}" for a timed test.

Format STRICTLY:
Q[number]. [Question]
A) [Option]
B) [Option]
C) [Option]
D) [Option]
Answer: [Letter]
Explanation: [Brief explanation]`;

    try {
      const reply = await callBioAI([{role:"user",content:prompt}], BIOLOGY_SYSTEM_PROMPT);
      const parsed = [];
      const blocks = reply.split(/(?=Q\d+\.)/).filter(b=>b.trim());
      blocks.forEach((block,idx)=>{
        const lines = block.split("\n").map(l=>l.trim()).filter(Boolean);
        const qLine = lines.find(l=>/^Q\d+\./.test(l));
        const opts = ["A","B","C","D"].map(letter=>{ const line=lines.find(l=>l.startsWith(`${letter})`)); return line?line.slice(2).trim():""; });
        const ansLine = lines.find(l=>l.startsWith("Answer:"));
        const expLine = lines.find(l=>l.startsWith("Explanation:"));
        const ansLetter = ansLine?ansLine.replace("Answer:","").trim():"A";
        if(qLine&&opts[0]) parsed.push({ id:idx, text:qLine.replace(/^Q\d+\.\s*/,""), options:opts, correct:["A","B","C","D"].indexOf(ansLetter), explanation:expLine?expLine.replace("Explanation:","").trim():"" });
      });
      setQuestions(parsed);
      setTimeLeft(settings.count*60);
      setAnswers({});
      setPhase("test");
    } catch {
      alert("Failed to generate test. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const score = Object.keys(answers).length > 0 ? questions.filter(q=>answers[q.id]===q.correct).length : 0;
  const m=Math.floor(timeLeft/60), sec=timeLeft%60;

  if(phase==="setup") return (
    <div style={{ maxWidth:"500px" }}>
      <div style={S.card}>
        <h2 style={{ ...S.h3, marginBottom:"14px" }}>🧪 AI-Powered Personalized Test</h2>
        <p style={{ ...S.sub, marginBottom:"16px" }}>AI creates a custom test based on your chapter and difficulty preference</p>
        <label style={S.label}>Chapter</label>
        <select style={S.input} value={settings.chapter} onChange={e=>setSettings(s=>({...s,chapter:e.target.value}))}>
          {SYLLABUS["1st PU"].units.concat(SYLLABUS["2nd PU"].units).flatMap(u=>u.chapters).map(c=><option key={c.id}>{c.title}</option>)}
        </select>
        <label style={S.label}>Difficulty</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:6, marginBottom:"13px" }}>
          {["Easy","Medium","Hard"].map(d=>(
            <button key={d} onClick={()=>setSettings(s=>({...s,difficulty:d}))}
              style={{ ...S.btn, padding:"9px", justifyContent:"center", fontSize:"13px",
                background:settings.difficulty===d?(d==="Easy"?T.g600:d==="Medium"?"#D97706":"#DC2626"):"#F9FAFB",
                color:settings.difficulty===d?"#fff":T.textMid, border:`1.5px solid ${settings.difficulty===d?"transparent":T.border}` }}>
              {d}
            </button>
          ))}
        </div>
        <label style={S.label}>Number of Questions</label>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:6, marginBottom:"16px" }}>
          {[3,5,10,15].map(n=>(
            <button key={n} onClick={()=>setSettings(s=>({...s,count:n}))}
              style={{ ...S.btn, padding:"9px", justifyContent:"center", fontSize:"14px", fontWeight:"700",
                background:settings.count===n?T.g600:"#F9FAFB", color:settings.count===n?"#fff":T.textMid, border:`1.5px solid ${settings.count===n?T.g600:T.border}` }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ background:T.g25, borderRadius:"10px", padding:"12px 14px", marginBottom:"14px" }}>
          <div style={{ fontSize:"12.5px", fontWeight:"600", color:T.g600 }}>
            ⏱ Time: ~{settings.count} min · 🎯 {settings.difficulty} · 📖 {settings.chapter}
          </div>
        </div>
        <button onClick={generateTest} disabled={loading}
          style={{ ...S.btn, ...S.btnPrimary, padding:"13px", fontSize:"14.5px", opacity:loading?0.7:1 }}>
          {loading?"🤖 Generating your test…":"⚡ Generate AI Test"}
        </button>
      </div>
    </div>
  );

  if(phase==="test") return (
    <div>
      <div style={{ ...S.card, background:`linear-gradient(135deg,${T.g600},${T.g700})`, padding:"14px 18px", marginBottom:"16px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontSize:"14px", fontWeight:"700", color:"#fff" }}>🧪 AI Test — {settings.chapter}</div>
            <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.65)" }}>{Object.keys(answers).length}/{questions.length} answered</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:"20px", fontWeight:"800", color: timeLeft<30?"#FCA5A5":"#34D399" }}>{m}:{sec.toString().padStart(2,"0")}</div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.55)" }}>Time remaining</div>
          </div>
        </div>
        <div style={{ height:"4px", background:"rgba(255,255,255,0.2)", borderRadius:"99px", marginTop:"10px" }}>
          <div style={{ height:"100%", width:`${Object.keys(answers).length/questions.length*100}%`, background:"#34D399", borderRadius:"99px" }}/>
        </div>
      </div>
      {questions.map((q,qi)=>(
        <div key={q.id} style={{ ...S.card, marginBottom:"12px" }}>
          <p style={{ fontSize:"14px", fontWeight:"600", marginBottom:"11px" }}><span style={{ color:T.textFaint,marginRight:"6px" }}>Q{qi+1}.</span>{q.text}</p>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6 }}>
            {q.options.map((opt,oi)=>(
              <div key={oi} onClick={()=>setAnswers(a=>({...a,[q.id]:oi}))}
                style={{ padding:"8px 12px", borderRadius:"8px", border:`2px solid ${answers[q.id]===oi?T.g600:T.border}`, background:answers[q.id]===oi?T.g50:"#F9FAFB", cursor:"pointer", fontSize:"13px", display:"flex", gap:6, transition:"all 0.14s" }}>
                <span style={{ fontWeight:"700", color:answers[q.id]===oi?T.g600:T.textFaint }}>{String.fromCharCode(65+oi)}.</span>{opt}
              </div>
            ))}
          </div>
        </div>
      ))}
      <button onClick={()=>setPhase("result")} disabled={Object.keys(answers).length<questions.length}
        style={{ ...S.btn, ...S.btnPrimary, padding:"13px 28px", fontSize:"14px", width:"auto", opacity:Object.keys(answers).length<questions.length?0.5:1 }}>
        Submit Test ({Object.keys(answers).length}/{questions.length})
      </button>
    </div>
  );

  // Results phase
  const pct = Math.round(score/questions.length*100);
  return (
    <div>
      <div style={{ ...S.card, textAlign:"center", padding:"36px 24px", marginBottom:"16px" }}>
        <div style={{ fontSize:"56px", marginBottom:"12px" }}>{pct>=80?"🏆":pct>=60?"😊":"📚"}</div>
        <div style={{ fontSize:"42px", fontWeight:"900", color:pct>=80?T.g400:pct>=60?"#F59E0B":"#EF4444" }}>{score}/{questions.length}</div>
        <div style={{ fontSize:"17px", color:T.textMid, marginTop:"6px" }}>{pct>=80?"Excellent! KCET-ready on this chapter!":pct>=60?"Good job! A bit more practice needed.":"Keep studying — you'll get there!"}</div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:11, maxWidth:"400px", margin:"22px auto 0" }}>
          {[["Score",`${pct}%`],["Correct",score],["Wrong",questions.length-score],["XP",score*15+"⚡"]].map(([l,v],i)=>(
            <div key={i} style={{ background:T.g25, borderRadius:"10px", padding:"12px 6px" }}>
              <div style={{ fontSize:"18px", fontWeight:"800", color:T.g600 }}>{v}</div>
              <div style={{ fontSize:"10.5px", color:T.textFaint }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Review wrong answers */}
      {questions.filter(q=>answers[q.id]!==q.correct).length>0&&(
        <div style={S.card}>
          <h3 style={{ ...S.h3, marginBottom:"13px", color:"#DC2626" }}>❌ Review Incorrect Answers</h3>
          {questions.filter(q=>answers[q.id]!==q.correct).map((q,qi)=>(
            <div key={q.id} style={{ padding:"12px 0", borderBottom:`1px dashed ${T.border}` }}>
              <div style={{ fontSize:"13.5px", fontWeight:"600", marginBottom:"5px" }}>{qi+1}. {q.text}</div>
              <div style={{ fontSize:"12.5px", color:"#DC2626" }}>Your answer: {q.options[answers[q.id]]} ✗</div>
              <div style={{ fontSize:"12.5px", color:T.g600 }}>Correct: {q.options[q.correct]} ✓</div>
              {q.explanation&&<div style={{ fontSize:"12px", color:T.textLight, marginTop:"4px", fontStyle:"italic" }}>💡 {q.explanation}</div>}
            </div>
          ))}
        </div>
      )}
      <div style={{ display:"flex", gap:10, marginTop:"14px" }}>
        <button onClick={()=>{setPhase("setup");setAnswers({});setQuestions([]);}} style={{ ...S.btn, ...S.btnPrimary, padding:"11px 24px" }}>New Test</button>
        <button onClick={()=>setPhase("test")} style={{ ...S.btn, ...S.btnOutline }}>Retry Same Test</button>
      </div>
    </div>
  );
}


// ─── CONCEPT MASTERY + AI COACH DASHBOARD ─────────────────────────────────────

function AIDashboard({ user, onNav }) {
  const kcetScore = Math.round(KCET_CHAPTER_WEIGHTS.reduce((s,c)=>s+c.myScore*c.weight/100,0));
  const neetScore = Math.round(NEET_UNIT_WEIGHTS.reduce((s,u)=>s+u.myPct*u.marks/100,0));
  const weeklyData = [30,65,80,55,90,120,95];
  const weekLabels = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

  return (
    <div style={S.page}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"22px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🧠 AI Learning Dashboard</h1>
          <p style={S.sub}>Mastery scores, exam readiness, and personalized AI recommendations</p>
        </div>
        <button onClick={()=>onNav("aiTutor")} style={{ ...S.btn, background:"linear-gradient(135deg,#7C3AED,#6D28D9)", color:"#fff", gap:8 }}>
          🤖 Open AI Tutor
        </button>
      </div>

      {/* AI Coach Banner */}
      <div style={{ background:"linear-gradient(135deg,#7C3AED,#4C1D95)", borderRadius:"18px", padding:"22px 26px", marginBottom:"20px", display:"grid", gridTemplateColumns:"1fr auto", gap:20, alignItems:"center" }}>
        <div>
          <div style={{ fontSize:"11px", fontWeight:"700", color:"rgba(255,255,255,0.55)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"6px" }}>🏆 AI Coach Today</div>
          <div style={{ fontSize:"18px", fontWeight:"800", color:"#fff", marginBottom:"8px" }}>
            {user?.name?.split(" ")[0]}, focus on Ecology & Reproduction today — your weakest chapters!
          </div>
          <div style={{ display:"flex", gap:9 }}>
            <button onClick={()=>onNav("aiTutor")} style={{ ...S.btn, background:"rgba(255,255,255,0.15)", color:"#fff", border:"1px solid rgba(255,255,255,0.25)", fontSize:"13px", padding:"8px 16px" }}>
              📖 Explain Ecology
            </button>
            <button onClick={()=>onNav("aiTutor")} style={{ ...S.btn, background:"#fff", color:"#7C3AED", fontSize:"13px", padding:"8px 16px" }}>
              ❓ Practice MCQs
            </button>
          </div>
        </div>
        <div style={{ textAlign:"center" }}>
          <CircleProgress pct={68} size={90} stroke={8} color="#A78BFA" bg="rgba(255,255,255,0.15)">
            <div style={{ fontSize:"18px", fontWeight:"900", color:"#fff" }}>68%</div>
            <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.55)" }}>Overall</div>
          </CircleProgress>
          <div style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.55)", marginTop:"6px" }}>Mastery Score</div>
        </div>
      </div>

      {/* KCET + NEET readiness cards */}
      <div style={{ ...S.grid2, marginBottom:"20px" }}>
        <div style={{ ...S.card, background:"linear-gradient(135deg,#6366F1,#4338CA)", padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>🎯 KCET Predicted Score</div>
              <div style={{ fontSize:"38px", fontWeight:"900", color:"#fff" }}>{kcetScore}<span style={{ fontSize:"18px", fontWeight:"500" }}>/90</span></div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", marginTop:"3px" }}>Biology section out of 90 marks</div>
            </div>
            <CircleProgress pct={Math.round(kcetScore/90*100)} size={70} stroke={7} color="#A5B4FC" bg="rgba(255,255,255,0.15)">
              <div style={{ fontSize:"14px", fontWeight:"800", color:"#fff" }}>{Math.round(kcetScore/90*100)}%</div>
            </CircleProgress>
          </div>
          <div style={{ marginTop:"14px" }}>
            <div style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.55)", marginBottom:"5px" }}>Improvement needed to score 75+</div>
            <div style={{ height:"4px", background:"rgba(255,255,255,0.2)", borderRadius:"99px" }}>
              <div style={{ height:"100%", width:`${Math.round(kcetScore/90*100)}%`, background:"#A5B4FC", borderRadius:"99px" }}/>
            </div>
          </div>
        </div>

        <div style={{ ...S.card, background:"linear-gradient(135deg,#D97706,#B45309)", padding:"20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
            <div>
              <div style={{ fontSize:"12px", fontWeight:"700", color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:"4px" }}>🏆 NEET Predicted Score</div>
              <div style={{ fontSize:"38px", fontWeight:"900", color:"#fff" }}>{neetScore}<span style={{ fontSize:"18px", fontWeight:"500" }}>/360</span></div>
              <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.6)", marginTop:"3px" }}>Biology marks out of 360</div>
            </div>
            <CircleProgress pct={Math.round(neetScore/360*100)} size={70} stroke={7} color="#FDE68A" bg="rgba(255,255,255,0.15)">
              <div style={{ fontSize:"14px", fontWeight:"800", color:"#fff" }}>{Math.round(neetScore/360*100)}%</div>
            </CircleProgress>
          </div>
          <div style={{ marginTop:"14px" }}>
            <div style={{ fontSize:"11.5px", color:"rgba(255,255,255,0.55)", marginBottom:"5px" }}>Target: 300+/360 for top colleges</div>
            <div style={{ height:"4px", background:"rgba(255,255,255,0.2)", borderRadius:"99px" }}>
              <div style={{ height:"100%", width:`${Math.round(neetScore/360*100)}%`, background:"#FDE68A", borderRadius:"99px" }}/>
            </div>
          </div>
        </div>
      </div>

      {/* Concept Mastery Grid */}
      <div style={{ ...S.grid2, marginBottom:"20px" }}>
        <div style={S.card}>
          <h2 style={{ ...S.secTitle }}>🧬 Concept Mastery Levels</h2>
          <div style={{ display:"flex", flexDirection:"column", gap:9 }}>
            {CONCEPT_MASTERIES.map((c,i)=>(
              <div key={i}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"4px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <span style={{ fontSize:"13px", fontWeight:"500", color:T.textMid }}>{c.chapter}</span>
                    <span style={{ background:c.mastery>=80?"#ECFDF5":c.mastery>=60?"#FEF3C7":c.mastery>=40?"#FEF2F2":"#F3F4F6",
                      color:c.mastery>=80?T.g600:c.mastery>=60?"#D97706":c.mastery>=40?"#DC2626":"#9CA3AF",
                      fontSize:"10.5px", fontWeight:"700", padding:"2px 7px", borderRadius:"99px" }}>
                      {c.level}
                    </span>
                  </div>
                  <span style={{ fontSize:"12.5px", fontWeight:"800", color:c.color }}>{c.mastery}%</span>
                </div>
                <div style={S.pBar}><div style={{ ...S.pFill(c.mastery,c.color) }}/></div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {/* AI Recommendations */}
          <div style={S.card}>
            <h2 style={{ ...S.secTitle }}>🤖 AI Recommendations</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {WEAK_AREA_RECOMMENDATIONS.map((r,i)=>(
                <div key={i} onClick={()=>onNav("aiTutor")}
                  style={{ display:"flex", gap:11, alignItems:"center", padding:"11px 13px", background:T.g25, borderRadius:"10px", cursor:"pointer", border:`1px solid ${T.border}` }}>
                  <span style={{ fontSize:"22px" }}>{r.icon}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:"12px", color:T.textFaint, marginBottom:"1px" }}>Weak: {r.chapter}</div>
                    <div style={{ fontSize:"13px", fontWeight:"600", color:T.text }}>{r.title}</div>
                  </div>
                  <span style={{ fontSize:"11.5px", color:T.g400 }}>→</span>
                </div>
              ))}
            </div>
          </div>

          {/* Weekly Insights */}
          <div style={S.card}>
            <h2 style={{ ...S.secTitle }}>📊 Weekly Insights</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {WEEKLY_INSIGHTS.map((w,i)=>(
                <div key={i} style={{ display:"flex", gap:10, padding:"9px 11px", borderRadius:"9px",
                  background:w.type==="positive"?T.g25:w.type==="warning"?"#FEF3C7":"#EFF6FF",
                  border:`1px solid ${w.type==="positive"?T.border:w.type==="warning"?"#FDE68A":"#BFDBFE"}` }}>
                  <span style={{ fontSize:"17px" }}>{w.icon}</span>
                  <span style={{ fontSize:"12.5px", color:T.textMid, lineHeight:"1.5" }}>{w.insight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* KCET Chapter weights */}
      <div style={{ ...S.grid2 }}>
        <div style={S.card}>
          <h2 style={{ ...S.secTitle }}>🎯 KCET Chapter Weightage vs Your Score</h2>
          {KCET_CHAPTER_WEIGHTS.map((c,i)=>(
            <div key={i} style={{ marginBottom:"11px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                <span style={{ fontSize:"12.5px", fontWeight:"500", color:T.textMid }}>{c.chapter}</span>
                <div style={{ display:"flex", gap:10 }}>
                  <span style={{ fontSize:"11.5px", color:T.textFaint }}>{c.weight}% weight</span>
                  <span style={{ fontSize:"12px", fontWeight:"700", color:c.myScore>=75?T.g400:c.myScore>=50?"#F59E0B":"#DC2626" }}>{c.myScore}%</span>
                </div>
              </div>
              <div style={{ position:"relative", height:"6px", background:"#E5F7EF", borderRadius:"99px", overflow:"hidden" }}>
                <div style={{ position:"absolute", height:"100%", width:`${c.weight*5}%`, background:"#E5E7EB", borderRadius:"99px" }}/>
                <div style={{ position:"absolute", height:"100%", width:`${c.myScore*c.weight*5/100}%`, background:c.myScore>=75?T.g400:c.myScore>=50?"#F59E0B":"#DC2626", borderRadius:"99px" }}/>
              </div>
            </div>
          ))}
        </div>

        <div style={S.card}>
          <h2 style={{ ...S.secTitle }}>🏆 NEET Unit-wise Analysis</h2>
          {NEET_UNIT_WEIGHTS.map((u,i)=>(
            <div key={i} style={{ marginBottom:"10px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"3px" }}>
                <span style={{ fontSize:"12px", fontWeight:"500", color:T.textMid }}>{u.unit}</span>
                <div style={{ display:"flex", gap:9 }}>
                  <span style={{ fontSize:"11px", color:T.textFaint }}>{u.marks}m</span>
                  <span style={{ fontSize:"11.5px", fontWeight:"700", color:u.myPct>=70?T.g400:u.myPct>=50?"#F59E0B":"#DC2626" }}>
                    {u.myPct>=70?"🟢":u.myPct>=50?"🟡":"🔴"} {u.myPct}%
                  </span>
                </div>
              </div>
              <div style={S.pBar}><div style={S.pFill(u.myPct,u.myPct>=70?T.g400:u.myPct>=50?"#F59E0B":"#DC2626")}/></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING AI BUTTON ───────────────────────────────────────────────────────

function FloatingAIButton({ onClick }) {
  const [pulse, setPulse] = useState(true);
  useEffect(()=>{
    const t=setTimeout(()=>setPulse(false),3000);
    return()=>clearTimeout(t);
  },[]);
  return (
    <div style={{ position:"fixed", bottom:"28px", right:"28px", zIndex:200 }}>
      {pulse&&(
        <div style={{ position:"absolute", inset:"-6px", borderRadius:"50%", background:"rgba(124,58,237,0.2)", animation:"aiRipple 1.5s ease-out infinite" }}/>
      )}
      <button onClick={onClick}
        style={{ width:"58px", height:"58px", borderRadius:"50%", background:"linear-gradient(135deg,#7C3AED,#6D28D9)", border:"none", cursor:"pointer", fontSize:"24px", boxShadow:"0 6px 20px rgba(124,58,237,0.45)", display:"flex", alignItems:"center", justifyContent:"center", transition:"transform 0.2s" }}
        onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"}
        onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
        🤖
      </button>
      <style>{`@keyframes aiRipple{0%{transform:scale(1);opacity:1}100%{transform:scale(1.5);opacity:0}}`}</style>
    </div>
  );
}


// ─── UPDATED ADMIN LOGIN WITH CREDENTIAL GATE ────────────────────────────────

function AdminLoginGated({ onSuccess }) {
  const [form, setForm] = useState({ email:"", password:"" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setError("");
    if (!form.email || !form.password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(()=>ctrl.abort(), 10000);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "apikey":SUPABASE_ANON },
        body: JSON.stringify({ email: form.email, password: form.password }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const d = await res.json();
      if (!d.access_token) {
        setError(d.error_description || d.msg || "Invalid email or password.");
        setLoading(false); return;
      }
      // Authenticated — now verify the role stored server-side in public.users.
      // This is a UX check only; real enforcement happens via RLS policies
      // on every table (a non-admin JWT simply can't write to admin-only rows).
      sb._session = d;
      try { localStorage.setItem("bv_session", JSON.stringify(d)); } catch {}
      const profile = await sb.getProfile().catch(()=>null);
      if (!profile || profile.role !== "admin") {
        setError("❌ This account does not have Super Admin access.");
        sb.signOut();
        setLoading(false); return;
      }
      onSuccess({ name: profile.full_name || "Admin", email: profile.email, role: "admin", avatar: (profile.full_name||"A")[0].toUpperCase() });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:`linear-gradient(135deg,${A.navy},${A.navyMid})`, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
      <div style={{ background:A.surface, borderRadius:"20px", padding:"44px 38px", width:"100%", maxWidth:"420px", boxShadow:"0 24px 72px rgba(0,0,0,0.35)" }}>
        <div style={{ textAlign:"center", marginBottom:"28px" }}>
          <div style={{ width:"56px", height:"56px", borderRadius:"14px", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px", margin:"0 auto 12px" }}>⚙️</div>
          <h1 style={{ fontSize:"22px", fontWeight:"800", color:A.navy, margin:"0 0 4px" }}>BioVerse Admin</h1>
          <p style={{ fontSize:"13px", color:A.slateLight, margin:0 }}>Secure Content Management System</p>
        </div>

        {error && (
          <div style={{ background:"#FEF2F2", border:`1px solid #FCA5A5`, borderRadius:"9px", padding:"10px 13px", color:"#DC2626", fontSize:"13px", marginBottom:"14px", fontWeight:"500" }}>
            {error}
          </div>
        )}

        <div style={{ background:"#FEF3C7", border:"1px solid #FDE68A", borderRadius:"9px", padding:"9px 12px", marginBottom:"12px", fontSize:"12px", color:"#92400E" }}>
          🔒 Super Admin access requires a verified account with admin role.
        </div>

        <label style={AS.label}>Email</label>
        <input style={AS.input} type="email" placeholder="admin@bioverse.in" value={form.email} onChange={h("email")}/>

        <label style={AS.label}>Password</label>
        <input style={AS.input} type="password" placeholder="••••••••" value={form.password} onChange={h("password")}/>

        <button onClick={submit} disabled={loading}
          style={{ ...AS.btn, ...AS.btnPrimary, width:"100%", justifyContent:"center", padding:"12px", fontSize:"14px", opacity:loading?0.7:1 }}>
          {loading?"Authenticating…":"Login to Admin Panel"}
        </button>
        <p style={{ textAlign:"center", marginTop:"16px", fontSize:"12.5px", color:A.slateLight }}>
          ← <span style={{ color:A.purple, cursor:"pointer", fontWeight:"600" }} onClick={()=>onSuccess(null)}>Back to Portal Selection</span>
        </p>
      </div>
    </div>
  );
}

// ─── UPDATED ADMIN PANEL FULL (with gated login) ─────────────────────────────

function AdminPanelFull({ onExitAdmin }) {
  const [adminUser, setAdminUser] = useState(null);
  const [adminPage, setAdminPage] = useState("adminDash");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window!=="undefined"&&window.innerWidth<768);
  const [globalSearch, setGlobalSearch] = useState("");
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(()=>{
    const h=()=>setIsMobile(window.innerWidth<768);
    window.addEventListener("resize",h);
    return()=>window.removeEventListener("resize",h);
  },[]);

  const handleAdminNav = (key) => {
    if(key==="exitAdmin"){ onExitAdmin(); return; }
    setAdminPage(key);
  };

  if(!adminUser) return <AdminLoginGated onSuccess={u=>{ if(!u){onExitAdmin();return;} setAdminUser(u); }}/>;

  const pageTitles = {
    adminDash:"Dashboard", cms:"Content CMS", videos:"Video Library",
    notes:"Notes Library", questions:"Question Bank", pyqAdmin:"PYQ Manager",
    testBuilder:"Test Builder", students:"Student Management",
    subscriptions:"Subscriptions", analytics:"Analytics Center",
    notifications:"Notification Center", bulkImport:"Bulk Import",
    auditLog:"Audit Log", adminSettings:"Settings",
  };

  const searchResults = globalSearch.length>1 ? [
    ...STUDENTS_DB.filter(s=>s.name.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,3).map(s=>({type:"Student",label:s.name,sub:s.email,page:"students"})),
    ...VIDEOS_DB.filter(v=>v.title.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,2).map(v=>({type:"Video",label:v.title,sub:v.chapter,page:"videos"})),
    ...MOCK_QUESTIONS.filter(q=>q.text.toLowerCase().includes(globalSearch.toLowerCase())).slice(0,2).map(q=>({type:"Question",label:q.text.slice(0,50)+"…",sub:q.chapter,page:"questions"})),
  ] : [];

  return (
    <div style={{ fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif", minHeight:"100vh", background:A.bg, color:A.navyMid, display:"flex" }}>
      <AdminSidebar active={adminPage} onNav={handleAdminNav} admin={adminUser} isMobile={isMobile} open={sidebarOpen} onClose={()=>setSidebarOpen(false)}/>
      <div style={{ flex:1, paddingLeft:isMobile?0:"230px", minHeight:"100vh" }}>
        <div style={{ ...AS.topbar }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{ ...AS.btn, ...AS.btnGhost, padding:"5px" }}>☰</button>}
            <div>
              <div style={{ fontSize:"14px", fontWeight:"700", color:A.navy }}>{pageTitles[adminPage]||adminPage}</div>
              <div style={{ fontSize:"11px", color:A.slateLight }}>BioVerse Admin Panel</div>
            </div>
          </div>
          <div style={{ position:"relative", flex:1, maxWidth:"380px", margin:"0 20px" }}>
            <input style={{ ...AS.input, marginBottom:0, paddingLeft:"36px", borderRadius:"99px", background:"#F8FAFC" }}
              placeholder="🔍 Search students, videos, questions..."
              value={globalSearch} onChange={e=>setGlobalSearch(e.target.value)}
              onFocus={()=>setSearchFocus(true)} onBlur={()=>setTimeout(()=>setSearchFocus(false),200)}/>
            {searchFocus && searchResults.length>0 && (
              <div style={{ position:"absolute", top:"100%", left:0, right:0, background:A.surface, border:`1px solid ${A.border}`, borderRadius:"12px", boxShadow:"0 8px 24px rgba(0,0,0,0.12)", zIndex:300, marginTop:"4px", overflow:"hidden" }}>
                {searchResults.map((r,i)=>(
                  <div key={i} onClick={()=>{setAdminPage(r.page);setGlobalSearch("");}}
                    style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", cursor:"pointer", borderBottom:i<searchResults.length-1?`1px solid ${A.border}`:"none" }}
                    onMouseEnter={e=>e.currentTarget.style.background=A.bg}
                    onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                    <span style={{ ...AS.badge(A.purple,A.purpleLight), fontSize:"10.5px" }}>{r.type}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:"13px", fontWeight:"500", color:A.navy }}>{r.label}</div>
                      <div style={{ fontSize:"11px", color:A.slateLight }}>{r.sub}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 12px", background:A.bg, borderRadius:"99px", cursor:"pointer" }}>
              <div style={{ width:"28px", height:"28px", borderRadius:"50%", background:`linear-gradient(135deg,${A.purple},#6D28D9)`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"12px" }}>{adminUser.avatar}</div>
              <div>
                <div style={{ fontSize:"12.5px", fontWeight:"600", color:A.navy }}>{adminUser.name?.split(" ")[0]}</div>
                <div style={{ fontSize:"10.5px", color:A.slateLight }}>{adminUser.role}</div>
              </div>
            </div>
          </div>
        </div>

        {adminPage==="adminDash"     && <AdminDashboard admin={adminUser}/>}
        {adminPage==="cms"           && <ContentCMS/>}
        {adminPage==="videos"        && <VideoManager/>}
        {adminPage==="notes"         && <NotesManager/>}
        {adminPage==="questions"     && <QuestionManager/>}
        {adminPage==="pyqAdmin"      && <PYQManager/>}
        {adminPage==="testBuilder"   && <TestBuilder/>}
        {adminPage==="students"      && <StudentManager/>}
        {adminPage==="subscriptions" && <SubscriptionManager/>}
        {adminPage==="analytics"     && <AnalyticsCenter/>}
        {adminPage==="notifications" && <NotificationCenter/>}
        {adminPage==="bulkImport"    && <BulkImport/>}
        {adminPage==="auditLog"      && <AuditLog/>}
        {adminPage==="adminSettings" && <AdminSettings admin={adminUser}/>}
      </div>
      <style>{`
        *{box-sizing:border-box;}
        input:focus,select:focus,textarea:focus{border-color:${A.purple}!important;box-shadow:0 0 0 3px rgba(124,58,237,0.1);}
        button:hover{filter:brightness(0.93);}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-track{background:#F1F5F9;}
        ::-webkit-scrollbar-thumb{background:#CBD5E1;border-radius:99px;}
      `}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP — Student Portal + Admin Panel + AI Tutor
// ═══════════════════════════════════════════════════════════════════════════════


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 6 — GAMIFICATION + COMMUNITY + MOBILE ECOSYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GAMIFICATION DATA ────────────────────────────────────────────────────────

const XP_LEVELS = [
  { level:1, title:"Biology Beginner",  icon:"🌱", minXP:0,     color:"#6B7280", bg:"#F3F4F6" },
  { level:2, title:"Biology Learner",   icon:"📗", minXP:500,   color:"#059669", bg:"#ECFDF5" },
  { level:3, title:"Biology Explorer",  icon:"🔬", minXP:1500,  color:"#2563EB", bg:"#EFF6FF" },
  { level:4, title:"Biology Scholar",   icon:"🧬", minXP:3000,  color:"#7C3AED", bg:"#EDE9FE" },
  { level:5, title:"Biology Master",    icon:"🏆", minXP:5000,  color:"#D97706", bg:"#FEF3C7" },
];

const XP_REWARDS = [
  { action:"Watch a video",           xp:10,  icon:"🎥" },
  { action:"Read notes",              xp:5,   icon:"📖" },
  { action:"Complete a test",         xp:50,  icon:"🧪" },
  { action:"Daily challenge",         xp:150, icon:"🔥" },
  { action:"Perfect test score",      xp:100, icon:"💯" },
  { action:"7-day streak",            xp:200, icon:"🔥" },
  { action:"30-day streak",           xp:500, icon:"⚡" },
  { action:"Solve 10 MCQs",          xp:30,  icon:"❓" },
  { action:"Share a note",            xp:20,  icon:"📤" },
];

const ALL_BADGES = [
  { id:"b1",  icon:"🌱", title:"First Step",         desc:"Complete first chapter",           xp:50,   unlocked:true,  category:"Progress" },
  { id:"b2",  icon:"🔥", title:"7-Day Warrior",      desc:"7 consecutive study days",         xp:100,  unlocked:true,  category:"Streak" },
  { id:"b3",  icon:"⚡", title:"30-Day Legend",      desc:"30 consecutive study days",        xp:500,  unlocked:false, category:"Streak" },
  { id:"b4",  icon:"💯", title:"Perfect Score",      desc:"100% in any test",                 xp:150,  unlocked:false, category:"Tests" },
  { id:"b5",  icon:"🎯", title:"KCET Champion",      desc:"Score 80+ in KCET mock",           xp:300,  unlocked:false, category:"Exam" },
  { id:"b6",  icon:"🏆", title:"NEET Warrior",       desc:"Score 280+ in NEET mock",          xp:400,  unlocked:false, category:"Exam" },
  { id:"b7",  icon:"📖", title:"Note Taker",         desc:"Read notes for 10 chapters",       xp:150,  unlocked:true,  category:"Content" },
  { id:"b8",  icon:"🔬", title:"Biology Expert",     desc:"Complete full syllabus",           xp:1000, unlocked:false, category:"Progress" },
  { id:"b9",  icon:"🧬", title:"Genetics Guru",      desc:"90%+ in all Genetics tests",       xp:200,  unlocked:false, category:"Chapter" },
  { id:"b10", icon:"🌿", title:"Plant Pro",          desc:"Complete all Plant chapters",      xp:180,  unlocked:false, category:"Chapter" },
  { id:"b11", icon:"🫀", title:"Physiology Expert",  desc:"Master Human Physiology unit",     xp:200,  unlocked:false, category:"Chapter" },
  { id:"b12", icon:"⚗️", title:"Biotech Pioneer",   desc:"Complete Biotechnology unit",      xp:200,  unlocked:false, category:"Chapter" },
  { id:"b13", icon:"💬", title:"Community Helper",   desc:"Answer 10 community questions",    xp:100,  unlocked:false, category:"Community" },
  { id:"b14", icon:"🃏", title:"Flashcard Master",   desc:"Review 100 flashcards",            xp:80,   unlocked:false, category:"Tools" },
  { id:"b15", icon:"🎮", title:"Game Champion",      desc:"Win 5 Biology Memory Games",       xp:120,  unlocked:false, category:"Games" },
  { id:"b16", icon:"📅", title:"100-Day Streak",     desc:"100 consecutive study days",       xp:2000, unlocked:false, category:"Streak" },
];

const COMMUNITY_POSTS = [
  { id:"p1", author:"Meera Patil", avatar:"M", category:"NEET Biology", chapter:"Molecular Basis of Inheritance", title:"Confused about semi-conservative replication — can someone explain?", body:"I understand that DNA replication is semi-conservative but I'm confused about which strand is which. Can someone draw it out or explain step by step?", likes:24, replies:8, time:"2h ago", tags:["DNA","Replication","NEET"], solved:true },
  { id:"p2", author:"Arjun Reddy", avatar:"A", category:"KCET Biology", chapter:"Cell Cycle and Cell Division", title:"Memory trick for phases of mitosis?", body:"I always mix up Prophase, Metaphase, Anaphase, Telophase. Anyone have a good mnemonic? I've tried PMAT but I forget the details.", likes:31, replies:12, time:"4h ago", tags:["Mitosis","Memory","KCET"], solved:true },
  { id:"p3", author:"Priya Sharma", avatar:"P", category:"1st PU Biology", chapter:"Photosynthesis in Higher Plants", title:"Sharing: One-page Photosynthesis summary I made", body:"Hey everyone! I spent 2 hours making this summary. Sharing it here — covers Z-scheme, Calvin cycle, and C4 plants. Hope it helps for KCET!", likes:87, replies:15, time:"6h ago", tags:["Photosynthesis","Notes","Sharing"], solved:false },
  { id:"p4", author:"Kiran Nair", avatar:"K", category:"NEET Biology", chapter:"Principles of Inheritance", title:"Dihybrid cross ratio — when does 9:3:3:1 change?", body:"I know the standard ratio is 9:3:3:1 but in my test it showed 9:7 and 12:3:1. When do these special ratios appear? I'm totally lost.", likes:19, replies:6, time:"8h ago", tags:["Genetics","Dihybrid","NEET"], solved:false },
  { id:"p5", author:"Divya Singh", avatar:"D", category:"2nd PU Biology", chapter:"Human Health and Disease", title:"Important diseases for NEET — complete list?", body:"Can someone share the complete list of diseases, their pathogens, and transmission routes that are important for NEET? I want to make sure I'm not missing anything.", likes:42, replies:9, time:"12h ago", tags:["Diseases","NEET","Health"], solved:false },
];

const FLASHCARDS_DATA = [
  { id:"f1", front:"What is the powerhouse of the cell?", back:"Mitochondria — produces ATP via cellular respiration (Krebs cycle + ETC)", chapter:"Cell: The Unit of Life", difficulty:"Easy" },
  { id:"f2", front:"Central Dogma of Molecular Biology", back:"DNA → RNA → Protein\n(Transcription then Translation)", chapter:"Molecular Basis of Inheritance", difficulty:"Medium" },
  { id:"f3", front:"What is the functional unit of kidney?", back:"Nephron — filters blood, reabsorbs nutrients, produces urine", chapter:"Excretory Products", difficulty:"Easy" },
  { id:"f4", front:"F1 cross between TT × tt produces?", back:"All Tt (tall phenotype) — shows dominance of T allele", chapter:"Principles of Inheritance", difficulty:"Easy" },
  { id:"f5", front:"Restriction enzymes are called?", back:"'Molecular scissors' — cut DNA at specific palindromic sequences", chapter:"Biotechnology", difficulty:"Medium" },
  { id:"f6", front:"Z-scheme is related to?", back:"Light reactions of Photosynthesis — involves PS-II and PS-I", chapter:"Photosynthesis in Higher Plants", difficulty:"Medium" },
  { id:"f7", front:"Universal donor blood group?", back:"O Rh-negative — no antigens on RBCs", chapter:"Body Fluids and Circulation", difficulty:"Easy" },
  { id:"f8", front:"Okazaki fragments are formed during?", back:"DNA replication — on the lagging strand (3'→5' template)", chapter:"Molecular Basis of Inheritance", difficulty:"Hard" },
  { id:"f9", front:"Calvin cycle produces?", back:"G3P (Glyceraldehyde-3-phosphate) — uses CO₂, ATP, and NADPH", chapter:"Photosynthesis in Higher Plants", difficulty:"Medium" },
  { id:"f10", front:"Which enzyme unwinds DNA helix?", back:"Helicase — breaks hydrogen bonds between base pairs at replication fork", chapter:"Molecular Basis of Inheritance", difficulty:"Medium" },
];

const WEEKLY_CHALLENGES = [
  { id:"wc1", title:"Genetics Sprint",       desc:"Complete all Genetics chapter notes + 30 MCQs", xp:300, deadline:"3 days", progress:60, icon:"🧬", completed:false },
  { id:"wc2", title:"Video Binge",           desc:"Watch 10 videos this week",                    xp:150, deadline:"5 days", progress:70, icon:"🎥", completed:false },
  { id:"wc3", title:"Mock Test Warrior",     desc:"Take 2 full mock tests",                       xp:400, deadline:"7 days", progress:50, icon:"🧪", completed:false },
  { id:"wc4", title:"Community Contributor", desc:"Answer 3 questions in the community",          xp:100, deadline:"7 days", progress:33, icon:"💬", completed:false },
];

const LIVE_CLASSES = [
  { id:"lc1", title:"KCET Biology Strategy 2025",       teacher:"Dr. Ramesh Kumar",  date:"Jun 28, 2025", time:"4:00 PM", duration:"90 min", registered:234, category:"KCET",  icon:"🎯", live:false },
  { id:"lc2", title:"Genetics & Evolution Master Class", teacher:"Priya Menon",       date:"Jun 30, 2025", time:"5:00 PM", duration:"60 min", registered:189, category:"NEET",  icon:"🧬", live:false },
  { id:"lc3", title:"LIVE: Cell Biology Doubts Session", teacher:"Suresh Nair",       date:"TODAY",        time:"6:00 PM", duration:"45 min", registered:312, category:"1st PU", icon:"🔬", live:true },
  { id:"lc4", title:"NEET Biology 2026 Roadmap",        teacher:"Dr. Ramesh Kumar",  date:"Jul 5, 2025",  time:"3:00 PM", duration:"120 min",registered:156, category:"NEET",  icon:"🏆", live:false },
];

const MEMORY_GAME_PAIRS = [
  { id:"mg1", term:"Mitochondria",       match:"Powerhouse of the cell — ATP production" },
  { id:"mg2", term:"Ribosome",           match:"Site of protein synthesis" },
  { id:"mg3", term:"Chloroplast",        match:"Site of photosynthesis — contains chlorophyll" },
  { id:"mg4", term:"Nucleus",            match:"Control centre — contains DNA" },
  { id:"mg5", term:"Golgi Apparatus",    match:"Post office of the cell — packages proteins" },
  { id:"mg6", term:"Lysosome",          match:"Suicidal bag — contains hydrolytic enzymes" },
];

const REWARDS_STORE = [
  { id:"r1", title:"1 Month Premium",     cost:500,  icon:"👑", desc:"Unlock all premium features for 30 days",   category:"Premium" },
  { id:"r2", title:"Exclusive Notes PDF", cost:150,  icon:"📄", desc:"AI-generated last-minute revision sheet",    category:"Content" },
  { id:"r3", title:"Special Badge",       cost:100,  icon:"🏅", desc:"Exclusive 'XP Legend' badge for your profile",category:"Badge" },
  { id:"r4", title:"3 Month Premium",     cost:1200, icon:"🌟", desc:"Unlock all premium features for 90 days",   category:"Premium" },
  { id:"r5", title:"AI Test Pack",        cost:200,  icon:"🤖", desc:"50 AI-generated personalized test questions", category:"Content" },
  { id:"r6", title:"Mock Test Bundle",    cost:300,  icon:"🧪", desc:"Access to 5 exclusive full mock tests",      category:"Tests" },
];

const getUserLevel = (xp) => XP_LEVELS.slice().reverse().find(l => xp >= l.minXP) || XP_LEVELS[0];
const getNextLevel = (xp) => XP_LEVELS.find(l => xp < l.minXP) || null;


// ─── XP LEVEL DISPLAY ─────────────────────────────────────────────────────────

function LevelBadge({ xp, size="sm" }) {
  const level = getUserLevel(xp);
  const next  = getNextLevel(xp);
  const pct   = next ? Math.round((xp - level.minXP) / (next.minXP - level.minXP) * 100) : 100;
  if (size === "sm") return (
    <span style={{ background:level.bg, color:level.color, padding:"3px 9px", borderRadius:"99px", fontSize:"11.5px", fontWeight:"700", display:"inline-flex", alignItems:"center", gap:"4px" }}>
      {level.icon} {level.title}
    </span>
  );
  return (
    <div style={{ ...S.card, textAlign:"center", padding:"22px" }}>
      <div style={{ fontSize:"44px", marginBottom:"8px" }}>{level.icon}</div>
      <div style={{ fontSize:"18px", fontWeight:"800", color:level.color }}>{level.title}</div>
      <div style={{ fontSize:"12.5px", color:T.textFaint, marginTop:"3px" }}>Level {level.level}</div>
      <div style={{ marginTop:"13px" }}>
        <div style={{ display:"flex", justifyContent:"space-between", fontSize:"11.5px", color:T.textFaint, marginBottom:"5px" }}>
          <span>{xp.toLocaleString()} XP</span>
          {next && <span>Next: {next.minXP.toLocaleString()} XP</span>}
        </div>
        <div style={S.pBar}><div style={S.pFill(pct, level.color)}/></div>
        {next && <div style={{ fontSize:"11px", color:T.textFaint, marginTop:"4px" }}>{(next.minXP - xp).toLocaleString()} XP to {next.title}</div>}
      </div>
    </div>
  );
}

// ─── LEADERBOARD VIEW ─────────────────────────────────────────────────────────

function LeaderboardView({ user }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sb.getLeaderboard(50).then(r => { setRows(Array.isArray(r) ? r : []); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  if (loading) return <div style={S.page}><div style={{ ...S.card, textAlign:"center", padding:40 }}>Loading leaderboard…</div></div>;

  const myRow = rows.find(r => r.id === user?.id);
  const myIndex = rows.findIndex(r => r.id === user?.id);
  const aboveMe = myIndex > 0 ? rows[myIndex - 1] : null;
  const podium = [rows[1], rows[0], rows[2]]; // 2nd, 1st, 3rd for the podium layout

  return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>🥇 Leaderboard</h1>
        <p style={S.sub}>See how you rank among all BioVerse students</p>
      </div>

      {rows.length === 0 && (
        <div style={{ ...S.card, textAlign:"center", padding:30, color:T.textFaint }}>No ranked students yet — be the first to earn XP!</div>
      )}

      {rows.length > 0 && (
      <>
      {/* Top 3 podium */}
      <div style={{ background:`linear-gradient(135deg,${T.g600},${T.g800})`, borderRadius:"18px", padding:"28px 22px", marginBottom:"20px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr 1fr", gap:"12px", alignItems:"flex-end" }}>
          {[["🥈", 56, 22, "2nd Place", "linear-gradient(135deg,#94A3B8,#64748B)"],
            ["👑", 68, 26, "🏆 Champion", "linear-gradient(135deg,#F59E0B,#D97706)"],
            ["🥉", 52, 20, "3rd Place", "linear-gradient(135deg,#D97706,#B45309)"]].map(([medal,size,fs,label,bg], i) => {
            const s = podium[i];
            if (!s) return <div key={i}/>;
            return (
              <div key={i} style={{ textAlign:"center" }}>
                <div style={{ fontSize: i===1?38:32, marginBottom:"6px" }}>{medal}</div>
                <div style={{ width:size, height:size, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:fs, fontWeight:"800", color:"#fff", margin:"0 auto 8px" }}>
                  {(s.full_name||"?")[0].toUpperCase()}
                </div>
                <div style={{ fontSize: i===1?"15px":"13px", fontWeight:"700", color:"#fff" }}>{s.full_name}</div>
                <div style={{ fontSize:"12px", color: i===1?"#FCD34D":"rgba(255,255,255,0.6)", marginTop:"2px" }}>⚡{s.xp}</div>
                <div style={{ background: i===1?"rgba(252,211,77,0.2)":"rgba(255,255,255,0.12)", borderRadius:"99px", padding:"2px 0", marginTop:"8px", fontSize:"11px", color: i===1?"#FCD34D":"rgba(255,255,255,0.7)", fontWeight: i===1?"700":"400" }}>{label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full rankings table */}
      <div style={{ ...S.card, padding:0, overflow:"hidden" }}>
        {rows.map((s,i)=>(
          <div key={s.id} style={{ display:"flex", alignItems:"center", gap:"13px", padding:"14px 18px",
            borderBottom:`1px solid ${T.border}`,
            background: s.id===user?.id ? T.g25 : "transparent",
            borderLeft: s.id===user?.id ? `3px solid ${T.g400}` : "3px solid transparent" }}>
            <div style={{ width:"28px", textAlign:"center", fontSize:"15px", fontWeight:"800",
              color:i===0?"#F59E0B":i===1?"#9CA3AF":i===2?"#D97706":T.textFaint }}>
              {i===0?"🏆":i===1?"🥈":i===2?"🥉":s.rank}
            </div>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg,${T.g600},${T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:"700", color:"#fff", fontSize:"14px", flexShrink:0 }}>
              {(s.full_name||"?")[0].toUpperCase()}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"13.5px", fontWeight: s.id===user?.id?"700":"500", color:T.text }}>
                {s.full_name}{s.id===user?.id?" (You)":""}
              </div>
              <div style={{ fontSize:"11.5px", color:T.textFaint }}>
                {s.level_title} · 🔥 {s.streak} day streak
              </div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"15px", fontWeight:"800", color:T.amber }}>⚡{Number(s.xp).toLocaleString()}</div>
              <div style={{ fontSize:"11px", color:T.textFaint }}>XP</div>
            </div>
          </div>
        ))}
      </div>

      {/* Your position call-out */}
      {myRow && (
        <div style={{ ...S.card, marginTop:"14px", background:`linear-gradient(135deg,${T.g600},${T.g700})`, padding:"18px 22px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
            <div style={{ fontSize:"28px" }}>📈</div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:"14px", fontWeight:"700", color:"#fff" }}>You're ranked #{myRow.rank}!</div>
              <div style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>
                {aboveMe ? `Earn ${aboveMe.xp - myRow.xp} more XP to pass ${aboveMe.full_name}.` : "You're at the top of the leaderboard!"}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}

// ─── WEEKLY CHALLENGES ────────────────────────────────────────────────────────

function WeeklyChallenges({ onNav }) {
  const [claimed, setClaimed] = useState([]);

  return (
    <div style={S.page}>
      <div style={{ ...S.flexBetween, marginBottom:"22px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🎯 Weekly Challenges</h1>
          <p style={S.sub}>Complete challenges to earn bonus XP, badges, and premium rewards</p>
        </div>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"18px", fontWeight:"800", color:T.amber }}>⚡ 780 XP</div>
          <div style={{ fontSize:"11.5px", color:T.textFaint }}>Resets in 4d 12h</div>
        </div>
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"13px", marginBottom:"22px" }}>
        {WEEKLY_CHALLENGES.map(ch=>(
          <div key={ch.id} style={{ ...S.card, padding:"18px 20px" }}>
            <div style={{ display:"flex", gap:"14px", alignItems:"flex-start" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"13px", background:T.g50, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>
                {ch.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"4px" }}>
                  <div style={{ fontSize:"14.5px", fontWeight:"700", color:T.text }}>{ch.title}</div>
                  <span style={{ ...S.badge(T.amber,"#FEF3C7"), fontSize:"12px" }}>⚡+{ch.xp} XP</span>
                </div>
                <div style={{ fontSize:"13px", color:T.textLight, marginBottom:"10px" }}>{ch.desc}</div>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"6px" }}>
                  <div style={{ fontSize:"12px", color:T.textFaint }}>Progress: {ch.progress}%</div>
                  <div style={{ fontSize:"12px", color:T.textFaint }}>⏰ {ch.deadline} left</div>
                </div>
                <div style={S.pBar}><div style={S.pFill(ch.progress, ch.progress>=100?T.g400:T.g600)}/></div>
              </div>
              {ch.progress >= 100 ? (
                <button onClick={()=>setClaimed(c=>[...c,ch.id])} disabled={claimed.includes(ch.id)}
                  style={{ ...S.btn, ...S.btnSm, background:claimed.includes(ch.id)?T.g50:`linear-gradient(135deg,${T.g600},${T.g400})`, color:claimed.includes(ch.id)?T.g600:"#fff", flexShrink:0 }}>
                  {claimed.includes(ch.id)?"✓ Claimed":"Claim XP"}
                </button>
              ) : (
                <button onClick={()=>onNav("dashboard")} style={{ ...S.btn, ...S.btnSm, ...S.btnOutline, flexShrink:0, fontSize:"12px" }}>
                  Continue
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Rewards Store teaser */}
      <div style={{ ...S.card, background:"linear-gradient(135deg,#7C3AED,#6D28D9)", padding:"20px 24px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ fontSize:"36px" }}>🎁</div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"15px", fontWeight:"700", color:"#fff" }}>Rewards Store</div>
            <div style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.65)", marginTop:"2px" }}>
              Spend your XP on Premium days, exclusive notes, and special badges!
            </div>
          </div>
          <button onClick={()=>onNav("rewardsStore")} style={{ ...S.btn, background:"#fff", color:"#7C3AED", fontSize:"13px", padding:"9px 18px", flexShrink:0 }}>
            Open Store
          </button>
        </div>
      </div>
    </div>
  );
}


// ─── COMMUNITY FORUM ──────────────────────────────────────────────────────────

function CommunityForum({ user }) {
  const [category, setCategory] = useState("All");
  const [view, setView] = useState("feed"); // feed | post
  const [activePost, setActivePost] = useState(null);
  const [newPostModal, setNewPostModal] = useState(false);
  const [liked, setLiked] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const categories = ["All","1st PU Biology","2nd PU Biology","KCET Biology","NEET Biology"];
  const filtered = category==="All" ? COMMUNITY_POSTS : COMMUNITY_POSTS.filter(p=>p.category===category);

  const catColors = {
    "1st PU Biology":  { c:T.g600, bg:T.g50 },
    "2nd PU Biology":  { c:T.g700, bg:"#D1FAE5" },
    "KCET Biology":    { c:"#6366F1", bg:"#EEF2FF" },
    "NEET Biology":    { c:T.amber, bg:"#FEF3C7" },
  };

  if(view==="post" && activePost) {
    const p = activePost;
    const cc = catColors[p.category]||catColors["1st PU Biology"];
    return (
      <div style={S.page}>
        {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:T.g800, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
        <button onClick={()=>setView("feed")} style={{ ...S.btn, ...S.btnGhost, padding:"6px 0", marginBottom:"14px", fontSize:"13px", color:T.textLight }}>← Back to Community</button>
        <div style={{ ...S.card, padding:"22px 26px", marginBottom:"16px" }}>
          <div style={{ display:"flex", gap:8, marginBottom:"12px", flexWrap:"wrap" }}>
            <span style={{ ...S.badge(cc.c,cc.bg) }}>{p.category}</span>
            <span style={{ ...S.badge(T.textFaint,"#F3F4F6") }}>📖 {p.chapter}</span>
            {p.tags.map(tag=><span key={tag} style={{ ...S.badge(T.purple,"#EDE9FE"), fontSize:"11px" }}>#{tag}</span>)}
            {p.solved&&<span style={{ ...S.badge(T.g400,T.g50) }}>✅ Solved</span>}
          </div>
          <h1 style={{ fontSize:"20px", fontWeight:"800", color:T.text, marginBottom:"12px", lineHeight:"1.3" }}>{p.title}</h1>
          <div style={{ display:"flex", gap:11, alignItems:"center", marginBottom:"16px" }}>
            <div style={{ width:"36px", height:"36px", borderRadius:"50%", background:`linear-gradient(135deg,${T.g600},${T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:"700", fontSize:"14px" }}>{p.avatar}</div>
            <div>
              <div style={{ fontSize:"13.5px", fontWeight:"600" }}>{p.author}</div>
              <div style={{ fontSize:"12px", color:T.textFaint }}>{p.time}</div>
            </div>
          </div>
          <p style={{ fontSize:"14.5px", color:T.textMid, lineHeight:"1.65", marginBottom:"18px" }}>{p.body}</p>
          <div style={{ display:"flex", gap:14 }}>
            <button onClick={()=>setLiked(l=>l.includes(p.id)?l.filter(x=>x!==p.id):[...l,p.id])}
              style={{ ...S.btn, ...S.btnSm, background:liked.includes(p.id)?T.g50:"#F9FAFB", color:liked.includes(p.id)?T.g600:T.textMid, border:`1.5px solid ${liked.includes(p.id)?T.g400:T.border}` }}>
              👍 {p.likes + (liked.includes(p.id)?1:0)} Helpful
            </button>
            <span style={{ fontSize:"12.5px", color:T.textFaint, alignSelf:"center" }}>💬 {p.replies} replies</span>
          </div>
        </div>

        {/* Replies section */}
        <div style={{ ...S.card, marginBottom:"14px" }}>
          <h3 style={{ ...S.h3, marginBottom:"14px" }}>💬 Replies ({p.replies})</h3>
          {[
            { author:"AI Biology Tutor 🤖", avatar:"🤖", text:"Great question! In semi-conservative replication, the DNA double helix unwinds and each original strand acts as a template for a new complementary strand. So each daughter molecule has one original + one new strand. This was proved by Meselson & Stahl's experiment using N¹⁵ and N¹⁴ isotopes.", time:"1h ago", isAI:true },
            { author:"Meera Patil", avatar:"M", text:"I was confused too! The key thing to remember: both strands are templates. So you get 2 new DNA molecules, each with 1 old + 1 new strand. Hope that helps!", time:"45m ago", isAI:false },
            { author:"Kiran Nair", avatar:"K", text:"Check out the BioVerse notes on this chapter — there's a really clear diagram that shows each step!", time:"30m ago", isAI:false },
          ].map((reply, i)=>(
            <div key={i} style={{ display:"flex", gap:11, marginBottom:"14px", padding:"13px", borderRadius:"11px", background:reply.isAI?"linear-gradient(135deg,rgba(124,58,237,0.05),rgba(109,40,217,0.08))":T.g25, border:`1px solid ${reply.isAI?"rgba(124,58,237,0.2)":T.border}` }}>
              <div style={{ width:"34px", height:"34px", borderRadius:"50%", background:reply.isAI?"linear-gradient(135deg,#7C3AED,#6D28D9)":`linear-gradient(135deg,${T.g600},${T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"14px", fontWeight:"700", flexShrink:0 }}>
                {reply.avatar}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:"5px" }}>
                  <span style={{ fontSize:"13px", fontWeight:"700" }}>{reply.author}</span>
                  {reply.isAI&&<span style={{ ...S.badge("#7C3AED","#EDE9FE"), fontSize:"10px" }}>AI Tutor</span>}
                  <span style={{ fontSize:"11.5px", color:T.textFaint }}>{reply.time}</span>
                </div>
                <p style={{ fontSize:"13.5px", color:T.textMid, lineHeight:"1.6", margin:0 }}>{reply.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reply box */}
        <div style={S.card}>
          <h3 style={{ ...S.h3, marginBottom:"12px" }}>Add Your Reply</h3>
          <textarea value={replyText} onChange={e=>setReplyText(e.target.value)}
            style={{ ...S.input, minHeight:"90px", resize:"vertical" }} placeholder="Share your knowledge or doubt..."/>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={()=>{showToast("Reply posted! +20 XP earned");setReplyText("");}} disabled={!replyText.trim()}
              style={{ ...S.btn, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff", opacity:!replyText.trim()?0.5:1 }}>
              Post Reply +20 XP
            </button>
            <button style={{ ...S.btn, ...S.btnSm, background:"linear-gradient(135deg,#7C3AED,#6D28D9)", color:"#fff", fontSize:"12.5px" }}
              onClick={()=>setReplyText("Ask AI: "+p.title)}>
              🤖 Ask AI to Answer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={S.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:T.g800, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...S.flexBetween, marginBottom:"20px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>👥 Student Community</h1>
          <p style={S.sub}>Ask doubts, share notes, and discuss with fellow students</p>
        </div>
        <button onClick={()=>setNewPostModal(true)} style={{ ...S.btn, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff" }}>
          ✍️ Ask Question
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display:"flex", gap:7, marginBottom:"16px", flexWrap:"wrap" }}>
        {categories.map(c=>{
          const cc = catColors[c];
          return (
            <button key={c} onClick={()=>setCategory(c)}
              style={{ ...S.btn, ...S.btnSm, background:category===c?(cc?cc.c:T.g600):"#fff", color:category===c?"#fff":T.textMid, border:`1.5px solid ${category===c?"transparent":T.border}`, fontSize:"12.5px" }}>
              {c}
            </button>
          );
        })}
      </div>

      {/* Community stats */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"11px", marginBottom:"18px" }}>
        {[
          { label:"Posts This Week", value:"47", icon:"📝", c:T.g600 },
          { label:"Active Students", value:"312", icon:"👥", c:T.purple },
          { label:"Questions Solved", value:"89%", icon:"✅", c:T.sky },
          { label:"Avg Response Time", value:"23 min", icon:"⏱", c:T.amber },
        ].map((s,i)=>(
          <div key={i} style={{ ...S.card, textAlign:"center", padding:"14px" }}>
            <div style={{ fontSize:"22px", marginBottom:"5px" }}>{s.icon}</div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:s.c }}>{s.value}</div>
            <div style={{ fontSize:"11px", color:T.textFaint }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Posts feed */}
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {filtered.map(p=>{
          const cc = catColors[p.category]||catColors["1st PU Biology"];
          return (
            <div key={p.id} onClick={()=>{setActivePost(p);setView("post");}}
              style={{ ...S.card, cursor:"pointer", transition:"all 0.2s" }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=T.g400;e.currentTarget.style.transform="translateY(-1px)";}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.transform="";}}>
              <div style={{ display:"flex", gap:8, marginBottom:"9px", flexWrap:"wrap" }}>
                <span style={{ ...S.badge(cc.c,cc.bg), fontSize:"11.5px" }}>{p.category}</span>
                <span style={{ ...S.badge(T.textFaint,"#F3F4F6"), fontSize:"11px" }}>📖 {p.chapter}</span>
                {p.solved&&<span style={{ ...S.badge(T.g400,T.g50), fontSize:"11px" }}>✅ Solved</span>}
              </div>
              <h3 style={{ fontSize:"15px", fontWeight:"700", color:T.text, marginBottom:"7px", lineHeight:"1.4" }}>{p.title}</h3>
              <p style={{ fontSize:"13px", color:T.textLight, marginBottom:"12px", lineHeight:"1.5", overflow:"hidden", display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical" }}>{p.body}</p>
              <div style={{ display:"flex", alignItems:"center", gap:"14px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:"24px", height:"24px", borderRadius:"50%", background:`linear-gradient(135deg,${T.g600},${T.g400})`, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"10px", fontWeight:"700" }}>{p.avatar}</div>
                  <span style={{ fontSize:"12px", fontWeight:"600", color:T.textMid }}>{p.author}</span>
                </div>
                <span style={{ fontSize:"12px", color:T.textFaint }}>{p.time}</span>
                <span style={{ fontSize:"12px", color:T.textFaint }}>👍 {p.likes + (liked.includes(p.id)?1:0)}</span>
                <span style={{ fontSize:"12px", color:T.textFaint }}>💬 {p.replies}</span>
                <div style={{ marginLeft:"auto", display:"flex", gap:5 }}>
                  {p.tags.slice(0,2).map(tag=><span key={tag} style={{ ...S.badge(T.purple,"#EDE9FE"), fontSize:"10.5px" }}>#{tag}</span>)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* New post modal */}
      {newPostModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center", padding:"20px" }}>
          <div style={{ background:"#fff", borderRadius:"18px", padding:"26px", width:"100%", maxWidth:"520px", boxShadow:"0 24px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ ...S.flexBetween, marginBottom:"18px" }}>
              <h2 style={S.h2}>✍️ Ask a Question</h2>
              <button onClick={()=>setNewPostModal(false)} style={{ ...S.btn, ...S.btnGhost, padding:"4px" }}>✕</button>
            </div>
            <label style={S.label}>Category</label>
            <select style={S.input}><option>KCET Biology</option><option>NEET Biology</option><option>1st PU Biology</option><option>2nd PU Biology</option></select>
            <label style={S.label}>Chapter</label>
            <select style={S.input}>{SYLLABUS["1st PU"].units.concat(SYLLABUS["2nd PU"].units).flatMap(u=>u.chapters).map(c=><option key={c.id}>{c.title}</option>)}</select>
            <label style={S.label}>Your Question</label>
            <input style={S.input} placeholder="Write a clear, specific question title..."/>
            <label style={S.label}>Details</label>
            <textarea style={{ ...S.input, minHeight:"90px", resize:"vertical" }} placeholder="Describe your doubt in detail — what you tried, what's confusing you..."/>
            <label style={S.label}>Tags (comma separated)</label>
            <input style={S.input} placeholder="e.g. DNA, Replication, NEET"/>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={()=>{showToast("Question posted! +10 XP earned");setNewPostModal(false);}} style={{ ...S.btn, ...S.btnPrimary, flex:1 }}>
                Post Question +10 XP
              </button>
              <button onClick={()=>setNewPostModal(false)} style={{ ...S.btn, ...S.btnOutline }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


// ─── FLASHCARD SYSTEM ─────────────────────────────────────────────────────────

function FlashcardSystem() {
  const [mode, setMode] = useState("browse"); // browse | learn | quiz
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState([]);
  const [unknown, setUnknown] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [filter, setFilter] = useState("All");

  const filtered = filter === "All" ? FLASHCARDS_DATA : FLASHCARDS_DATA.filter(f => f.difficulty === filter);
  const card = filtered[current] || filtered[0];

  const next = () => { setFlipped(false); setTimeout(()=>setCurrent(c=>(c+1)%filtered.length),150); };
  const prev = () => { setFlipped(false); setTimeout(()=>setCurrent(c=>(c-1+filtered.length)%filtered.length),150); };

  const markKnown   = () => { setKnown(k=>[...new Set([...k,card.id])]); next(); };
  const markUnknown = () => { setUnknown(k=>[...new Set([...k,card.id])]); next(); };

  return (
    <div style={S.page}>
      <div style={{ ...S.flexBetween, marginBottom:"20px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🃏 Flashcard System</h1>
          <p style={S.sub}>Master Biology concepts one card at a time</p>
        </div>
        <div style={{ display:"flex", gap:7 }}>
          {["browse","learn","quiz"].map(m=>(
            <button key={m} onClick={()=>{setMode(m);setCurrent(0);setFlipped(false);setKnown([]);setUnknown([]);setQuizAnswers({});setQuizSubmitted(false);}}
              style={{ ...S.btn, ...S.btnSm, background:mode===m?T.g600:"#fff", color:mode===m?"#fff":T.textMid, border:`1.5px solid ${mode===m?T.g600:T.border}`, textTransform:"capitalize", fontSize:"12.5px" }}>
              {m === "browse" ? "📖 Browse" : m === "learn" ? "🧠 Learn" : "⚡ Quiz"}
            </button>
          ))}
        </div>
      </div>

      {/* Difficulty filter */}
      <div style={{ display:"flex", gap:7, marginBottom:"18px" }}>
        {["All","Easy","Medium","Hard"].map(d=>(
          <button key={d} onClick={()=>{setFilter(d);setCurrent(0);setFlipped(false);}}
            style={{ ...S.btn, ...S.btnSm, background:filter===d?(d==="Easy"?T.g600:d==="Medium"?T.amber:d==="Hard"?"#DC2626":T.g600):"#fff", color:filter===d?"#fff":T.textMid, border:`1.5px solid ${filter===d?"transparent":T.border}`, fontSize:"12px" }}>
            {d}
          </button>
        ))}
        <span style={{ marginLeft:"auto", fontSize:"12.5px", color:T.textFaint, alignSelf:"center" }}>
          {known.length} known · {unknown.length} review · {filtered.length - known.length - unknown.length} unseen
        </span>
      </div>

      {mode === "browse" && (
        <div style={{ maxWidth:"600px", margin:"0 auto" }}>
          {/* Progress */}
          <div style={{ ...S.flexBetween, marginBottom:"12px" }}>
            <span style={{ fontSize:"13px", color:T.textFaint }}>Card {current+1} of {filtered.length}</span>
            <span style={{ ...S.badge(T.textFaint,"#F3F4F6") }}>📖 {card.chapter}</span>
          </div>

          {/* Flip card */}
          <div onClick={()=>setFlipped(f=>!f)} style={{ cursor:"pointer", marginBottom:"16px" }}>
            <div style={{ background:flipped?`linear-gradient(135deg,${T.g600},${T.g700})`:`linear-gradient(135deg,${T.g800},${T.g900})`, borderRadius:"20px", padding:"48px 32px", textAlign:"center", minHeight:"220px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", boxShadow:`0 12px 36px rgba(10,92,54,0.25)`, transition:"all 0.35s ease" }}>
              <div style={{ fontSize:"13px", fontWeight:"600", color:"rgba(255,255,255,0.5)", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:"14px" }}>
                {flipped ? "ANSWER" : "QUESTION — tap to reveal"}
              </div>
              <div style={{ fontSize:flipped?"16px":"18px", fontWeight:"700", color:"#fff", lineHeight:"1.6", whiteSpace:"pre-line" }}>
                {flipped ? card.back : card.front}
              </div>
              {!flipped && <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.4)", marginTop:"14px" }}>👆 Tap to flip</div>}
            </div>
          </div>

          {/* Action buttons */}
          {flipped ? (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"10px", marginBottom:"14px" }}>
              <button onClick={markUnknown} style={{ ...S.btn, background:"#FEF2F2", color:"#DC2626", border:"2px solid #FECACA", justifyContent:"center", padding:"13px" }}>
                😕 Need More Review
              </button>
              <button onClick={markKnown} style={{ ...S.btn, background:T.g50, color:T.g600, border:`2px solid ${T.g200}`, justifyContent:"center", padding:"13px" }}>
                ✅ Got It!
              </button>
            </div>
          ) : (
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginBottom:"14px" }}>
              <button onClick={prev} style={{ ...S.btn, ...S.btnOutline, padding:"11px 28px" }}>← Prev</button>
              <button onClick={next} style={{ ...S.btn, background:`linear-gradient(135deg,${T.g600},${T.g400})`, color:"#fff", padding:"11px 28px" }}>Next →</button>
            </div>
          )}

          {/* Mini stats */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"9px" }}>
            {[["✅ Known",known.length,T.g400],[" 🔄 Review",unknown.length,"#F59E0B"],["📚 Total",filtered.length,T.purple]].map(([l,v,c],i)=>(
              <div key={i} style={{ ...S.card, textAlign:"center", padding:"12px" }}>
                <div style={{ fontSize:"20px", fontWeight:"800", color:c }}>{v}</div>
                <div style={{ fontSize:"11px", color:T.textFaint }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {mode === "learn" && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"13px" }}>
          {filtered.map((card,i)=>(
            <div key={card.id} style={{ ...S.card, cursor:"pointer" }} onClick={()=>{setCurrent(i);setMode("browse");}}>
              <div style={{ ...S.flexBetween, marginBottom:"8px" }}>
                <span style={{ ...S.badge(T.textFaint,"#F3F4F6"), fontSize:"11px" }}>📖 {card.chapter}</span>
                <span style={S.tag(card.difficulty)}>{card.difficulty}</span>
              </div>
              <div style={{ fontSize:"14px", fontWeight:"600", color:T.text, marginBottom:"6px" }}>{card.front}</div>
              <div style={{ fontSize:"12.5px", color:T.textLight, lineHeight:"1.5" }}>{card.back.split("\n")[0]}</div>
              {known.includes(card.id) && <div style={{ ...S.badge(T.g400,T.g50), marginTop:"9px", display:"inline-flex" }}>✅ Known</div>}
              {unknown.includes(card.id) && <div style={{ ...S.badge("#F59E0B","#FEF3C7"), marginTop:"9px", display:"inline-flex" }}>🔄 Review</div>}
            </div>
          ))}
        </div>
      )}

      {mode === "quiz" && !quizSubmitted && (
        <div style={{ maxWidth:"600px", margin:"0 auto" }}>
          <p style={{ ...S.sub, marginBottom:"18px" }}>Match each term to its correct definition. One attempt only!</p>
          {filtered.slice(0,5).map((card,i)=>(
            <div key={card.id} style={{ ...S.card, marginBottom:"12px" }}>
              <div style={{ fontSize:"14px", fontWeight:"600", marginBottom:"11px" }}>Q{i+1}. {card.front}</div>
              <textarea value={quizAnswers[card.id]||""} onChange={e=>setQuizAnswers(a=>({...a,[card.id]:e.target.value}))}
                style={{ ...S.input, minHeight:"60px", resize:"none", marginBottom:0 }} placeholder="Write your answer..."/>
            </div>
          ))}
          <button onClick={()=>setQuizSubmitted(true)} disabled={Object.keys(quizAnswers).length < Math.min(5,filtered.length)}
            style={{ ...S.btn, ...S.btnPrimary, padding:"13px 28px", width:"auto", opacity:Object.keys(quizAnswers).length<Math.min(5,filtered.length)?0.5:1 }}>
            Submit Answers
          </button>
        </div>
      )}

      {mode === "quiz" && quizSubmitted && (
        <div style={{ maxWidth:"600px", margin:"0 auto" }}>
          <div style={{ ...S.card, textAlign:"center", padding:"32px", marginBottom:"14px" }}>
            <div style={{ fontSize:"48px", marginBottom:"12px" }}>🎉</div>
            <div style={{ fontSize:"24px", fontWeight:"800", color:T.g600 }}>Quiz Complete!</div>
            <div style={{ fontSize:"13.5px", color:T.textLight, marginTop:"6px" }}>Your answers have been submitted · +40 XP earned</div>
          </div>
          {filtered.slice(0,5).map((card,i)=>(
            <div key={card.id} style={{ ...S.card, marginBottom:"10px", borderLeft:`3px solid ${T.g400}` }}>
              <div style={{ fontSize:"13.5px", fontWeight:"600", marginBottom:"6px" }}>Q{i+1}. {card.front}</div>
              <div style={{ fontSize:"12.5px", color:T.textLight, marginBottom:"5px" }}>Your answer: {quizAnswers[card.id]}</div>
              <div style={{ fontSize:"12.5px", color:T.g600, background:T.g25, padding:"7px 10px", borderRadius:"7px" }}>✅ Model answer: {card.back.split("\n")[0]}</div>
            </div>
          ))}
          <button onClick={()=>{setQuizSubmitted(false);setQuizAnswers({});}} style={{ ...S.btn, ...S.btnPrimary, padding:"11px 26px", width:"auto" }}>New Quiz</button>
        </div>
      )}
    </div>
  );
}

// ─── BIOLOGY MEMORY GAME ─────────────────────────────────────────────────────

function MemoryGame() {
  const pairs = MEMORY_GAME_PAIRS;
  const allCards = [...pairs.map(p=>({id:`t_${p.id}`,text:p.term,pairId:p.id,type:"term"})),
                    ...pairs.map(p=>({id:`m_${p.id}`,text:p.match,pairId:p.id,type:"match"}))];
  const [cards] = useState(()=>[...allCards].sort(()=>Math.random()-0.5));
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [checking, setChecking] = useState(false);

  const flip = (card) => {
    if(checking||flipped.length===2||flipped.find(f=>f.id===card.id)||matched.includes(card.pairId)) return;
    const newFlipped = [...flipped, card];
    setFlipped(newFlipped);
    if(newFlipped.length===2) {
      setMoves(m=>m+1);
      setChecking(true);
      if(newFlipped[0].pairId===newFlipped[1].pairId && newFlipped[0].type!==newFlipped[1].type) {
        setTimeout(()=>{
          const newMatched=[...matched,newFlipped[0].pairId];
          setMatched(newMatched);
          setFlipped([]);
          setChecking(false);
          if(newMatched.length===pairs.length) setGameWon(true);
        },600);
      } else {
        setTimeout(()=>{setFlipped([]);setChecking(false);},900);
      }
    }
  };

  const reset = () => { setFlipped([]); setMatched([]); setMoves(0); setGameWon(false); setChecking(false); };

  return (
    <div style={S.page}>
      <div style={{ ...S.flexBetween, marginBottom:"20px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🧩 Biology Memory Game</h1>
          <p style={S.sub}>Match each Biology term to its correct definition</p>
        </div>
        <div style={{ display:"flex", gap:11, alignItems:"center" }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", fontWeight:"800", color:T.g600 }}>{matched.length}/{pairs.length}</div>
            <div style={{ fontSize:"11px", color:T.textFaint }}>Matched</div>
          </div>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:"22px", fontWeight:"800", color:T.purple }}>{moves}</div>
            <div style={{ fontSize:"11px", color:T.textFaint }}>Moves</div>
          </div>
          <button onClick={reset} style={{ ...S.btn, ...S.btnOutline, ...S.btnSm }}>🔄 Reset</button>
        </div>
      </div>

      {gameWon && (
        <div style={{ ...S.card, textAlign:"center", padding:"28px", marginBottom:"16px", background:`linear-gradient(135deg,${T.g600},${T.g700})` }}>
          <div style={{ fontSize:"48px", marginBottom:"10px" }}>🎉</div>
          <div style={{ fontSize:"22px", fontWeight:"800", color:"#fff" }}>You Won! Completed in {moves} moves</div>
          <div style={{ fontSize:"13.5px", color:"rgba(255,255,255,0.7)", marginTop:"4px" }}>+120 XP Earned!</div>
          <button onClick={reset} style={{ ...S.btn, background:"#fff", color:T.g600, marginTop:"14px" }}>Play Again</button>
        </div>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"10px" }}>
        {cards.map(card=>{
          const isFlipped = flipped.find(f=>f.id===card.id);
          const isMatched = matched.includes(card.pairId);
          return (
            <div key={card.id} onClick={()=>flip(card)}
              style={{ borderRadius:"12px", padding:"14px 11px", textAlign:"center", cursor:isMatched?"default":"pointer", minHeight:"90px", display:"flex", alignItems:"center", justifyContent:"center", transition:"all 0.3s",
                background: isMatched?`linear-gradient(135deg,${T.g600},${T.g400})`:isFlipped?"linear-gradient(135deg,#7C3AED,#6D28D9)":"linear-gradient(135deg,#1E293B,#334155)",
                boxShadow: isMatched?"0 4px 14px rgba(16,185,129,0.3)":isFlipped?"0 4px 14px rgba(124,58,237,0.3)":"0 2px 8px rgba(0,0,0,0.15)",
                transform: isFlipped||isMatched?"scale(1.03)":"scale(1)" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"600", color: isMatched||isFlipped?"#fff":"rgba(255,255,255,0.3)", lineHeight:"1.4" }}>
                {isFlipped||isMatched ? card.text : "?"}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ ...S.card, marginTop:"18px", padding:"14px 18px", display:"flex", gap:"14px", alignItems:"center" }}>
        <span style={{ fontSize:"18px" }}>💡</span>
        <div style={{ fontSize:"13px", color:T.textMid }}>
          <strong>How to play:</strong> Tap a card to reveal it. Find the matching term-definition pair. Match all {pairs.length} pairs to win!
        </div>
      </div>
    </div>
  );
}

// ─── QUICK REVISION MODE ──────────────────────────────────────────────────────

function QuickRevision() {
  const [duration, setDuration] = useState(null); // 15, 30, 60
  const [timeLeft, setTimeLeft] = useState(0);
  const [started, setStarted] = useState(false);
  const [section, setSection] = useState(0);

  useEffect(()=>{
    if(!started||timeLeft<=0) return;
    const t = setInterval(()=>setTimeLeft(tl=>tl-1),1000);
    return()=>clearInterval(t);
  },[started,timeLeft]);

  const revisionSections = [
    { title:"⚡ Must-Know Facts", icon:"⚡", content:[
      "Mitochondria → ATP (Powerhouse); Ribosome → Protein synthesis; Chloroplast → Photosynthesis",
      "DNA is double-stranded; RNA is single-stranded; mRNA carries genetic code from DNA to ribosome",
      "Nephron is functional unit of kidney; Neuron is functional unit of nervous system",
      "Enzyme = biological catalyst; Lock and Key model → Fischer; Induced Fit → Koshland",
      "Mitosis → somatic cells (2n→2n); Meiosis → germ cells (2n→n)"
    ]},
    { title:"🎯 High-Weightage KCET Topics", icon:"🎯", content:[
      "Cell Biology (12%): organelle functions, cell membrane, cell cycle phases",
      "Genetics (18%): Mendel's laws, dihybrid ratios, DNA replication enzymes",
      "Human Physiology (20%): nephron, cardiac cycle, neurotransmitters, hormones",
      "Plant Physiology (14%): Z-scheme, Calvin cycle, phytohormones",
      "Ecology (10%): food chains, energy flow pyramids, biodiversity hotspots"
    ]},
    { title:"🧠 Memory Tricks", icon:"🧠", content:[
      "PMAT for Mitosis: Prophase, Metaphase, Anaphase, Telophase",
      "DNA bases: Pure As Gold (Purines: Adenine, Guanine) • CUT (Pyrimidines: Cytosine, Uracil, Thymine)",
      "Krebs cycle = TCA cycle = Citric Acid cycle — all same! 8 steps, 3 NADH, 1 FADH₂ per turn",
      "Hormone source memory: 'PAT the TOAD' — Pituitary, Adrenal, Thyroid, Ovary, Adrenal, Duodenum",
      "9:3:3:1 ratio → Independent assortment; 1:2:1 → Incomplete dominance"
    ]},
    { title:"📊 Important Numbers", icon:"📊", content:[
      "Human chromosomes: 46 (23 pairs) | Genes: ~25,000 | Blood pH: 7.35–7.45",
      "Heart rate: 72 beats/min | Cardiac output: 5L/min | Blood volume: 5–6L",
      "Ribosome: 70S (prokaryotes) = 50S + 30S | 80S (eukaryotes) = 60S + 40S",
      "Nitrogen bases: A=T (2 H-bonds) | G≡C (3 H-bonds) — G-C stronger!",
      "Calvin cycle: 3CO₂ → 1G3P uses 9 ATP + 6 NADPH"
    ]},
    { title:"🔥 Common MCQ Traps", icon:"🔥", content:[
      "Plasma membrane is NOT just lipid — it's a lipid BILAYER with proteins (fluid mosaic)",
      "Mitochondria and Chloroplasts have their OWN DNA (semi-autonomous organelles)",
      "All enzymes are proteins — but NOT all proteins are enzymes",
      "Crossing over occurs in PACHYTENE (Prophase I of Meiosis) — NOT Metaphase",
      "Restriction enzymes cut at PALINDROMIC sequences — read same forwards & backwards"
    ]},
  ];

  if(!started) return (
    <div style={S.page}>
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>⚡ Quick Revision Mode</h1>
        <p style={S.sub}>Exam-day revision — key concepts, memory tricks, and high-weightage topics</p>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px", marginBottom:"22px" }}>
        {[
          { mins:15, label:"15 Min Revision", desc:"Critical facts only", icon:"⚡", c:"#DC2626", bg:"#FEF2F2" },
          { mins:30, label:"30 Min Revision", desc:"Key concepts + tricks", icon:"🎯", c:T.g600, bg:T.g50 },
          { mins:60, label:"60 Min Revision", desc:"Full revision sweep", icon:"📚", c:T.purple, bg:"#EDE9FE" },
        ].map(opt=>(
          <div key={opt.mins} onClick={()=>setDuration(opt.mins)}
            style={{ ...S.card, cursor:"pointer", textAlign:"center", padding:"28px 20px", border:`2px solid ${duration===opt.mins?opt.c:T.border}`, background:duration===opt.mins?opt.bg:T.surface }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=opt.c;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=duration===opt.mins?opt.c:T.border;}}>
            <div style={{ fontSize:"38px", marginBottom:"10px" }}>{opt.icon}</div>
            <div style={{ fontSize:"15px", fontWeight:"700", color:duration===opt.mins?opt.c:T.text }}>{opt.label}</div>
            <div style={{ fontSize:"12.5px", color:T.textLight, marginTop:"4px" }}>{opt.desc}</div>
          </div>
        ))}
      </div>
      {duration && (
        <button onClick={()=>{setStarted(true);setTimeLeft(duration*60);setSection(0);}}
          style={{ ...S.btn, ...S.btnPrimary, padding:"14px 36px", fontSize:"15px", width:"auto" }}>
          ⚡ Start {duration}-Minute Revision
        </button>
      )}
    </div>
  );

  const m = Math.floor(timeLeft/60), sec = timeLeft%60;
  const pct = Math.round((1-timeLeft/(duration*60))*100);

  return (
    <div style={S.page}>
      {/* Timer bar */}
      <div style={{ ...S.card, background:`linear-gradient(135deg,${timeLeft<60?"#DC2626":T.g600},${timeLeft<60?"#B91C1C":T.g700})`, padding:"16px 20px", marginBottom:"18px" }}>
        <div style={{ ...S.flexBetween, marginBottom:"9px" }}>
          <span style={{ color:"#fff", fontWeight:"700", fontSize:"14px" }}>⚡ Quick Revision — {duration} Min Mode</span>
          <span style={{ fontSize:"20px", fontWeight:"800", color: timeLeft<60?"#FCA5A5":"#34D399" }}>{m}:{sec.toString().padStart(2,"0")}</span>
        </div>
        <div style={{ height:"5px", background:"rgba(255,255,255,0.2)", borderRadius:"99px" }}>
          <div style={{ height:"100%", width:`${pct}%`, background:"#34D399", borderRadius:"99px", transition:"width 1s linear" }}/>
        </div>
      </div>

      {timeLeft===0 ? (
        <div style={{ ...S.card, textAlign:"center", padding:"40px" }}>
          <div style={{ fontSize:"52px", marginBottom:"12px" }}>✅</div>
          <div style={{ fontSize:"22px", fontWeight:"800", color:T.g600 }}>Revision Complete!</div>
          <div style={{ fontSize:"13.5px", color:T.textLight, marginTop:"6px" }}>+80 XP earned · Great preparation!</div>
          <button onClick={()=>{setStarted(false);setDuration(null);}} style={{ ...S.btn, ...S.btnPrimary, marginTop:"18px", width:"auto", padding:"11px 28px" }}>Back to Menu</button>
        </div>
      ) : (
        <div>
          {/* Section nav */}
          <div style={{ display:"flex", gap:6, marginBottom:"16px", overflowX:"auto" }}>
            {revisionSections.map((s,i)=>(
              <button key={i} onClick={()=>setSection(i)}
                style={{ ...S.btn, ...S.btnSm, background:section===i?T.g600:"#fff", color:section===i?"#fff":T.textMid, border:`1.5px solid ${section===i?T.g600:T.border}`, whiteSpace:"nowrap", fontSize:"12px" }}>
                {s.icon} {s.title.replace(/^[^ ]+ /,"")}
              </button>
            ))}
          </div>
          <div style={{ ...S.card }}>
            <h2 style={{ ...S.h2, marginBottom:"14px" }}>{revisionSections[section].title}</h2>
            {revisionSections[section].content.map((line,i)=>(
              <div key={i} style={{ display:"flex", gap:11, padding:"10px 12px", borderRadius:"9px", background: i%2===0?T.g25:"#fff", marginBottom:"6px" }}>
                <div style={{ width:"22px", height:"22px", borderRadius:"50%", background:T.g600, display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:"11px", fontWeight:"700", flexShrink:0, marginTop:"1px" }}>{i+1}</div>
                <span style={{ fontSize:"13.5px", color:T.textMid, lineHeight:"1.6" }}>{line}</span>
              </div>
            ))}
          </div>
          <div style={{ display:"flex", gap:9, marginTop:"14px" }}>
            <button onClick={()=>setSection(s=>Math.max(0,s-1))} disabled={section===0} style={{ ...S.btn, ...S.btnOutline, opacity:section===0?0.4:1 }}>← Prev Section</button>
            <button onClick={()=>setSection(s=>Math.min(revisionSections.length-1,s+1))} disabled={section===revisionSections.length-1} style={{ ...S.btn, ...S.btnPrimary, width:"auto", opacity:section===revisionSections.length-1?0.4:1 }}>Next Section →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LIVE CLASSES ─────────────────────────────────────────────────────────────

function LiveClasses() {
  const [registered, setRegistered] = useState([]);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };

  const catColors = { KCET:{ c:"#6366F1",bg:"#EEF2FF" }, NEET:{ c:T.amber,bg:"#FEF3C7" }, "1st PU":{ c:T.g600,bg:T.g50 }, "2nd PU":{ c:T.g700,bg:"#D1FAE5" } };

  return (
    <div style={S.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:T.g800, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ marginBottom:"22px" }}>
        <h1 style={{ ...S.h1, marginBottom:"3px" }}>📺 Live Classes & Events</h1>
        <p style={S.sub}>Expert-led live sessions, doubt clearing, and KCET/NEET strategy classes</p>
      </div>

      {/* Live now banner */}
      {LIVE_CLASSES.filter(c=>c.live).map(cls=>(
        <div key={cls.id} style={{ background:"linear-gradient(135deg,#DC2626,#B91C1C)", borderRadius:"16px", padding:"20px 24px", marginBottom:"18px", display:"flex", gap:"16px", alignItems:"center" }}>
          <div style={{ width:"52px", height:"52px", borderRadius:"50%", background:"rgba(255,255,255,0.15)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px", flexShrink:0 }}>
            {cls.icon}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ display:"flex", gap:9, alignItems:"center", marginBottom:"4px" }}>
              <span style={{ background:"#fff", color:"#DC2626", fontSize:"11px", fontWeight:"800", padding:"2px 10px", borderRadius:"99px", animation:"livePulse 1.5s ease-in-out infinite" }}>● LIVE NOW</span>
              <span style={{ color:"rgba(255,255,255,0.7)", fontSize:"12px" }}>{cls.registered} registered</span>
            </div>
            <div style={{ fontSize:"17px", fontWeight:"800", color:"#fff" }}>{cls.title}</div>
            <div style={{ fontSize:"12.5px", color:"rgba(255,255,255,0.7)", marginTop:"2px" }}>with {cls.teacher} · {cls.duration}</div>
          </div>
          <button style={{ ...S.btn, background:"#fff", color:"#DC2626", fontWeight:"700", padding:"11px 22px", flexShrink:0, fontSize:"14px" }}>
            Join Now →
          </button>
        </div>
      ))}

      {/* Upcoming classes */}
      <h2 style={S.secTitle}>Upcoming Sessions</h2>
      <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
        {LIVE_CLASSES.filter(c=>!c.live).map(cls=>{
          const cc = catColors[cls.category]||catColors["1st PU"];
          return (
            <div key={cls.id} style={{ ...S.card, display:"flex", gap:"14px", alignItems:"center" }}>
              <div style={{ width:"48px", height:"48px", borderRadius:"13px", background:cc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"22px", flexShrink:0 }}>
                {cls.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ ...S.flexBetween, marginBottom:"3px" }}>
                  <div style={{ fontSize:"14.5px", fontWeight:"700", color:T.text }}>{cls.title}</div>
                  <span style={{ ...S.badge(cc.c,cc.bg) }}>{cls.category}</span>
                </div>
                <div style={{ fontSize:"12.5px", color:T.textLight }}>with {cls.teacher}</div>
                <div style={{ display:"flex", gap:"14px", marginTop:"5px" }}>
                  <span style={{ fontSize:"12px", color:T.textFaint }}>📅 {cls.date} · ⏰ {cls.time}</span>
                  <span style={{ fontSize:"12px", color:T.textFaint }}>⏱ {cls.duration}</span>
                  <span style={{ fontSize:"12px", color:T.textFaint }}>👥 {cls.registered} registered</span>
                </div>
              </div>
              <button onClick={()=>{ setRegistered(r=>[...new Set([...r,cls.id])]); showToast(`Registered for "${cls.title}"! Reminder set.`); }}
                disabled={registered.includes(cls.id)}
                style={{ ...S.btn, ...S.btnSm, background:registered.includes(cls.id)?T.g50:`linear-gradient(135deg,${T.g600},${T.g400})`, color:registered.includes(cls.id)?T.g600:"#fff", flexShrink:0, fontSize:"12.5px" }}>
                {registered.includes(cls.id)?"✓ Registered":"Register Free"}
              </button>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.5}}`}</style>
    </div>
  );
}

// ─── REWARDS STORE ────────────────────────────────────────────────────────────

function RewardsStore({ userXP = 2750 }) {
  const [purchased, setPurchased] = useState([]);
  const [toast, setToast] = useState("");
  const showToast = msg => { setToast(msg); setTimeout(()=>setToast(""),2500); };
  const [xp, setXP] = useState(userXP);

  const buy = (item) => {
    if(xp < item.cost || purchased.includes(item.id)) return;
    setXP(x=>x-item.cost);
    setPurchased(p=>[...p,item.id]);
    showToast(`${item.title} redeemed! Enjoy 🎉`);
  };

  const catColors = { Premium:{ c:T.amber,bg:"#FEF3C7" }, Content:{ c:T.purple,bg:"#EDE9FE" }, Badge:{ c:T.sky,bg:"#E0F2FE" }, Tests:{ c:T.g600,bg:T.g50 } };

  return (
    <div style={S.page}>
      {toast&&<div style={{ position:"fixed", bottom:"24px", right:"24px", background:T.g800, color:"#fff", padding:"12px 20px", borderRadius:"10px", fontSize:"13px", fontWeight:"600", zIndex:500 }}>✅ {toast}</div>}
      <div style={{ ...S.flexBetween, marginBottom:"22px" }}>
        <div>
          <h1 style={{ ...S.h1, marginBottom:"3px" }}>🎁 Rewards Store</h1>
          <p style={S.sub}>Redeem your XP for premium rewards and exclusive content</p>
        </div>
        <div style={{ ...S.card, padding:"12px 18px", display:"flex", gap:10, alignItems:"center" }}>
          <span style={{ fontSize:"20px" }}>⚡</span>
          <div>
            <div style={{ fontSize:"20px", fontWeight:"800", color:T.amber }}>{xp.toLocaleString()} XP</div>
            <div style={{ fontSize:"11px", color:T.textFaint }}>Available to spend</div>
          </div>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"14px" }}>
        {REWARDS_STORE.map(item=>{
          const cc = catColors[item.category]||catColors.Content;
          const canAfford = xp >= item.cost;
          const owned = purchased.includes(item.id);
          return (
            <div key={item.id} style={{ ...S.card, opacity: owned ? 0.85 : 1 }}>
              <div style={{ ...S.flexBetween, marginBottom:"12px" }}>
                <div style={{ width:"48px", height:"48px", borderRadius:"13px", background:cc.bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:"24px" }}>{item.icon}</div>
                <span style={{ ...S.badge(cc.c,cc.bg), fontSize:"11.5px" }}>{item.category}</span>
              </div>
              <div style={{ fontSize:"15px", fontWeight:"700", marginBottom:"5px" }}>{item.title}</div>
              <div style={{ fontSize:"12.5px", color:T.textLight, marginBottom:"14px", lineHeight:"1.5" }}>{item.desc}</div>
              <div style={{ ...S.flexBetween }}>
                <div style={{ fontSize:"16px", fontWeight:"800", color:canAfford?T.amber:"#9CA3AF" }}>⚡ {item.cost} XP</div>
                <button onClick={()=>buy(item)} disabled={!canAfford||owned}
                  style={{ ...S.btn, ...S.btnSm, background:owned?T.g50:canAfford?`linear-gradient(135deg,${T.g600},${T.g400})`:"#F3F4F6", color:owned?T.g600:canAfford?"#fff":"#9CA3AF", fontSize:"12.5px" }}>
                  {owned?"✓ Owned":canAfford?"Redeem":"Need More XP"}
                </button>
              </div>
              {!canAfford&&!owned&&(
                <div style={{ fontSize:"11px", color:"#9CA3AF", marginTop:"6px" }}>Need {(item.cost-xp).toLocaleString()} more XP</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ─── PHASE 6 SIDEBAR WITH ALL NEW SECTIONS ────────────────────────────────────

function SidebarWithAI({ active, onNav, user, isMobile, open, onClose }) {
  const sections = [
    { label:null, items:[{ key:"dashboard", label:"Dashboard", icon:"home" }]},
    { label:"🤖 AI Tools", items:[
      { key:"aiTutor", label:"AI Biology Tutor", icon:"🤖", emoji:true, badge:"AI" },
      { key:"aiDash", label:"AI Dashboard", icon:"🧠", emoji:true },
    ]},
    { label:"Study", items:[
      { key:"1stPU", label:"1st PU Biology", icon:"book" },
      { key:"2ndPU", label:"2nd PU Biology", icon:"book" },
      { key:"notes", label:"Notes", icon:"notes" },
      { key:"diagrams", label:"Diagram Center", icon:"image" },
      { key:"pyq", label:"PYQ Center", icon:"bookmark" },
      { key:"flashcards", label:"Flashcards", icon:"🃏", emoji:true },
      { key:"quickRevision", label:"Quick Revision", icon:"⚡", emoji:true },
    ]},
    { label:"Practice", items:[
      { key:"questions", label:"Question Bank", icon:"question" },
      { key:"tests", label:"Tests", icon:"test" },
      { key:"gameHub", label:"Game Hub", icon:"zap" },
      { key:"memoryGame", label:"Memory Game", icon:"🧩", emoji:true },
    ]},
    { label:"Community", items:[
      { key:"community", label:"Community Forum", icon:"💬", emoji:true },
      { key:"liveClasses", label:"Live Classes", icon:"📺", emoji:true, badge:"LIVE" },
    ]},
    { label:"Insights", items:[
      { key:"progress", label:"Progress", icon:"chart" },
      { key:"planner", label:"Study Planner", icon:"calendar" },
      { key:"kcet", label:"KCET Analyzer", icon:"target" },
      { key:"neet", label:"NEET Analyzer", icon:"brain" },
    ]},
    { label:"Rewards", items:[
      { key:"leaderboard", label:"Leaderboard", icon:"🥇", emoji:true },
      { key:"weeklyChallenges", label:"Weekly Challenges", icon:"🎯", emoji:true },
      { key:"achievements", label:"Achievements", icon:"trophy" },
      { key:"rewardsStore", label:"Rewards Store", icon:"🎁", emoji:true },
    ]},
    { label:"Account", items:[
      { key:"profile", label:"Profile", icon:"user" },
    ]},
  ];

  const st = { ...S.sidebar, ...(isMobile?{ transform:open?"translateX(0)":"translateX(-100%)", boxShadow:open?"4px 0 24px rgba(0,0,0,0.28)":"none" }:{}) };

  return (
    <>
      {isMobile&&open&&<div onClick={onClose} style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.48)", zIndex:99 }}/>}
      <div style={st}>
        <div style={{ padding:"20px 16px 14px", borderBottom:"1px solid rgba(255,255,255,0.09)", display:"flex", alignItems:"center", gap:10 }}>
          <span style={{ fontSize:"22px" }}>🧬</span>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:"16px", fontWeight:"800", color:"#fff" }}>BioVerse</div>
            <div style={{ fontSize:"10px", color:"rgba(255,255,255,0.4)", marginTop:"1px" }}>Karnataka PU · AI + Community</div>
          </div>
          {isMobile&&<button onClick={onClose} style={{ ...S.btn, ...S.btnGhost, padding:"4px" }}><Icon name="close" size={16} color="#fff"/></button>}
        </div>

        {/* User card */}
        <div style={{ padding:"11px 14px 10px", borderBottom:"1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <div style={{ width:"30px", height:"30px", borderRadius:"50%", background:"linear-gradient(135deg,#34D399,#10B981)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"13px", fontWeight:"700", color:"#fff", flexShrink:0 }}>{user.name?.[0]?.toUpperCase()||"S"}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:"12px", fontWeight:"600", color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{user.name}</div>
              <LevelBadge xp={user.xp||2750} size="sm"/>
            </div>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"6px", marginTop:"8px" }}>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"7px", padding:"5px 8px", textAlign:"center" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:"#fff" }}>🔥 {user.streak||12}</div>
              <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.42)" }}>Streak</div>
            </div>
            <div style={{ background:"rgba(255,255,255,0.07)", borderRadius:"7px", padding:"5px 8px", textAlign:"center" }}>
              <div style={{ fontSize:"12.5px", fontWeight:"700", color:"#FCD34D" }}>⚡{(user.xp||2750).toLocaleString()}</div>
              <div style={{ fontSize:"9px", color:"rgba(255,255,255,0.42)" }}>XP</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:"8px 8px", display:"flex", flexDirection:"column", gap:1, overflowY:"auto" }}>
          {sections.map((sec,si)=>(
            <div key={si}>
              {sec.label&&<div style={S.navSection}>{sec.label}</div>}
              {sec.items.map(item=>(
                <button key={item.key} onClick={()=>{onNav(item.key);if(isMobile)onClose();}}
                  style={{ ...S.navItem, ...(active===item.key?S.navActive:{}),
                    background: active===item.key
                      ? (item.key==="aiTutor"||item.key==="aiDash"?"rgba(124,58,237,0.35)":"rgba(255,255,255,0.16)")
                      : "transparent" }}>
                  {item.emoji
                    ? <span style={{ fontSize:"14px", flexShrink:0 }}>{item.icon}</span>
                    : <Icon name={item.icon} size={15} color={active===item.key?"#fff":"rgba(255,255,255,0.6)"}/>}
                  <span style={{ flex:1, fontSize:"12.5px" }}>{item.label}</span>
                  {item.badge && (
                    <span style={{ background: item.badge==="LIVE"?"#DC2626":item.badge==="AI"?"#7C3AED":"rgba(255,255,255,0.2)", color:"#fff", fontSize:"8.5px", fontWeight:"700", padding:"2px 5px", borderRadius:"4px" }}>
                      {item.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div style={{ padding:"8px 8px", borderTop:"1px solid rgba(255,255,255,0.07)" }}>
          <button onClick={()=>onNav("admin")} style={{ ...S.navItem, color:"rgba(255,255,255,0.38)", fontSize:"12px" }}>
            <Icon name="settings" size={13} color="rgba(255,255,255,0.35)"/> Admin Panel
          </button>
          <button onClick={()=>onNav("logout")} style={{ ...S.navItem, color:"rgba(255,100,100,0.7)" }}>
            <Icon name="logout" size={14} color="rgba(255,100,100,0.7)"/> Logout
          </button>
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SELECTION SCREEN — first screen users see when opening BioVerse
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// ROLE SELECTION + PORTAL AUTH SCREENS
// Uses existing BioVerse T / S theme system throughout
// ═══════════════════════════════════════════════════════════════════════════════

function RoleSelect({ onRole }) {
  const [hovered, setHovered] = useState(null);
  const [pressed,  setPressed]  = useState(null);

  const roles = [
    {
      key:      "student",
      icon:     "🎓",
      title:    "Student Portal",
      subtitle: "Continue as Student",
      desc:     "Access your Biology courses, AI tutor, tests, daily challenges, progress analytics, and community.",
      grad:     `linear-gradient(135deg,${T.g600},${T.g400})`,
      border:   T.g400,
      glow:     "rgba(16,185,129,0.22)",
      accent:   T.g600,
      chip_bg:  T.g50,
      chip_c:   T.g600,
      features: ["📚 1st & 2nd PU Syllabus","🤖 AI Biology Tutor","📊 KCET / NEET Analytics","🏆 Leaderboard & XP"],
    },
    {
      key:      "teacher",
      icon:     "👨‍🏫",
      title:    "Teacher Portal",
      subtitle: "Continue as Teacher",
      desc:     "Manage content, upload videos and notes, create question papers, and track student progress.",
      grad:     `linear-gradient(135deg,${T.purple},#6D28D9)`,
      border:   T.purple,
      glow:     "rgba(124,58,237,0.22)",
      accent:   T.purple,
      chip_bg:  "#EDE9FE",
      chip_c:   T.purple,
      features: ["📝 Content Management","👥 Student Tracking","❓ Question Bank","📈 Class Analytics"],
    },
    {
      key:      "admin",
      icon:     "👑",
      title:    "Super Admin Portal",
      subtitle: "Continue as Super Admin",
      desc:     "Full platform control — manage users, subscriptions, permissions, analytics, and system settings.",
      grad:     `linear-gradient(135deg,${T.amber},#B45309)`,
      border:   T.amber,
      glow:     "rgba(217,119,6,0.22)",
      accent:   T.amber,
      chip_bg:  "#FEF3C7",
      chip_c:   "#92400E",
      features: ["🛡️ Role Management","💳 Subscriptions","📊 Platform Analytics","⚙️ System Settings"],
    },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: `linear-gradient(160deg,${T.g900} 0%,${T.g800} 55%,${T.g700} 100%)`,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "32px 20px", position: "relative", overflow: "hidden",
      fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif",
    }}>

      {/* Background circles — same pattern as S.authWrap */}
      <div style={{ position:"absolute", inset:0, pointerEvents:"none" }}>
        {[180,300,440,580].map((sz,i)=>(
          <div key={i} style={{ position:"absolute", borderRadius:"50%",
            border:`1px solid rgba(52,211,153,${0.06+i*0.03})`,
            width:`${sz}px`, height:`${sz}px`,
            top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}/>
        ))}
        {/* soft radial highlight */}
        <div style={{ position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)", width:"700px", height:"500px", borderRadius:"50%", background:"radial-gradient(ellipse, rgba(52,211,153,0.09) 0%, transparent 70%)", pointerEvents:"none" }}/>
      </div>

      {/* BioVerse header */}
      <div style={{ textAlign:"center", marginBottom:"44px", position:"relative", zIndex:1 }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:13, marginBottom:"18px" }}>
          <div style={{ width:"52px", height:"52px", borderRadius:"14px",
            background:`linear-gradient(135deg,${T.g400},${T.g600})`,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:"26px",
            boxShadow:`0 8px 28px rgba(16,185,129,0.38)` }}>
            🧬
          </div>
          <div style={{ textAlign:"left" }}>
            <div style={{ fontSize:"28px", fontWeight:"900", color:"#fff", letterSpacing:"-0.5px", lineHeight:1.1 }}>BioVerse</div>
            <div style={{ fontSize:"11px", color:"rgba(255,255,255,0.42)", fontWeight:"600", letterSpacing:"0.1em", textTransform:"uppercase" }}>Karnataka PU · KCET · NEET</div>
          </div>
        </div>
        <h1 style={{ fontSize:"clamp(20px,3.5vw,32px)", fontWeight:"800", color:"#fff", margin:"0 0 9px", letterSpacing:"-0.4px" }}>
          Welcome to BioVerse
        </h1>
        <p style={{ fontSize:"14.5px", color:"rgba(255,255,255,0.52)", margin:0, fontWeight:"400" }}>
          Select your portal to continue
        </p>
      </div>

      {/* Role cards */}
      <div style={{
        display:"grid",
        gridTemplateColumns:"repeat(auto-fit,minmax(min(100%,288px),1fr))",
        gap:"18px",
        width:"100%", maxWidth:"960px",
        position:"relative", zIndex:1,
      }}>
        {roles.map(role => {
          const isHov  = hovered === role.key;
          const isPress = pressed === role.key;
          return (
            <button
              key={role.key}
              aria-label={role.subtitle}
              tabIndex={0}
              onMouseEnter={()=>setHovered(role.key)}
              onMouseLeave={()=>{setHovered(null);setPressed(null);}}
              onMouseDown={()=>setPressed(role.key)}
              onMouseUp={()=>setPressed(null)}
              onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();onRole(role.key);}}}
              onClick={()=>onRole(role.key)}
              style={{
                background: isHov ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                border: `1.5px solid ${isHov ? role.border : "rgba(255,255,255,0.12)"}`,
                borderRadius: "18px",
                padding: "26px 24px",
                cursor: "pointer",
                textAlign: "left",
                transition: "all 0.25s cubic-bezier(0.34,1.4,0.64,1)",
                transform: isPress ? "scale(0.975)" : isHov ? "translateY(-7px) scale(1.01)" : "translateY(0) scale(1)",
                boxShadow: isHov ? `0 20px 56px ${role.glow}` : "0 4px 18px rgba(0,0,0,0.22)",
                outline: "none",
                fontFamily: "'Inter',-apple-system,sans-serif",
              }}
            >
              {/* Icon + arrow row */}
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:"16px" }}>
                <div style={{
                  width:"52px", height:"52px", borderRadius:"14px",
                  background: role.grad,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"24px", flexShrink:0,
                  boxShadow: isHov ? `0 6px 20px ${role.glow}` : "none",
                  transition:"box-shadow 0.25s",
                }}>
                  {role.icon}
                </div>
                <div style={{
                  width:"26px", height:"26px", borderRadius:"8px",
                  background: "rgba(255,255,255,0.09)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:"rgba(255,255,255,0.5)", fontSize:"13px",
                  transition:"transform 0.2s",
                  transform: isHov ? "translateX(3px)" : "translateX(0)",
                }}>→</div>
              </div>

              {/* Title */}
              <div style={{ fontSize:"17px", fontWeight:"800", color:"#fff", marginBottom:"6px", letterSpacing:"-0.2px" }}>
                {role.title}
              </div>

              {/* Description */}
              <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.52)", lineHeight:"1.6", marginBottom:"18px" }}>
                {role.desc}
              </div>

              {/* Feature chips */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:"5px", marginBottom:"20px" }}>
                {role.features.map((f,fi)=>(
                  <span key={fi} style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius:"99px", padding:"3px 10px",
                    fontSize:"11px", color:"rgba(255,255,255,0.62)", fontWeight:"500",
                  }}>{f}</span>
                ))}
              </div>

              {/* CTA */}
              <div style={{
                background: isHov ? role.grad : "rgba(255,255,255,0.09)",
                border: `1px solid ${isHov ? "transparent" : "rgba(255,255,255,0.13)"}`,
                borderRadius:"11px", padding:"11px 16px",
                display:"flex", alignItems:"center", justifyContent:"space-between",
                transition:"all 0.22s",
              }}>
                <span style={{ fontSize:"13.5px", fontWeight:"700", color:"#fff" }}>
                  {role.subtitle}
                </span>
                <span style={{
                  fontSize:"15px", color:"rgba(255,255,255,0.85)",
                  transition:"transform 0.18s", display:"inline-block",
                  transform: isHov ? "translateX(4px)" : "none",
                }}>→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ marginTop:"36px", textAlign:"center", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:"12px", color:"rgba(255,255,255,0.22)" }}>
          Karnataka PU Biology · KCET · NEET Preparation Platform
        </div>
      </div>

      <style>{`
        button:focus-visible { outline: 2px solid ${T.g300} !important; outline-offset: 3px !important; }
      `}</style>
    </div>
  );
}

// ─── TEACHER AUTH — uses purple accent, same S.authWrap / S.authCard pattern ──

function TeacherAuth({ onSuccess, onBack }) {
  const [form, setForm]       = useState({ email:"", password:"" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const h = k => e => setForm(f=>({...f,[k]:e.target.value}));

  const submit = async () => {
    setError(""); setLoading(true);
    if (!form.email || !form.password) { setError("Please fill all fields."); setLoading(false); return; }
    try {
      const ctrl = new AbortController();
      const tid = setTimeout(()=>ctrl.abort(), 10000);
      const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method:"POST",
        headers:{ "Content-Type":"application/json", "apikey":SUPABASE_ANON },
        body: JSON.stringify({ email:form.email, password:form.password }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);
      const d = await res.json();
      if (d.access_token) {
        sb._session = d;
        try { localStorage.setItem("bv_session", JSON.stringify(d)); } catch {}
        const profile = await sb.getProfile().catch(()=>null);
        if (!profile || profile.role !== "teacher") {
          setError("This account doesn't have teacher access.");
          sb.signOut();
          setLoading(false); return;
        }
        onSuccess(profile);
        return;
      }
      setError(d.error_description || d.msg || "Invalid email or password.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setLoading(false);
  };

  return (
    <div style={{ ...S.authWrap, background:`linear-gradient(135deg,${T.g800},#4C1D95,${T.g900})` }}>
      {/* Same background circles as student auth */}
      <div style={{ position:"absolute", inset:0, overflow:"hidden" }}>
        {[...Array(4)].map((_,i)=>(
          <div key={i} style={{ position:"absolute", borderRadius:"50%",
            border:`1px solid rgba(167,139,250,${0.06+i*0.04})`,
            width:`${200+i*100}px`, height:`${200+i*100}px`,
            top:"50%", left:"50%", transform:"translate(-50%,-50%)" }}/>
        ))}
      </div>

      <div style={S.authCard}>
        {/* Back link */}
        <button onClick={onBack}
          style={{ background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", gap:6, fontSize:"12.5px", color:T.purple, fontWeight:"600", marginBottom:"20px", padding:0, fontFamily:"inherit" }}>
          ← Back to Portal Selection
        </button>

        <div style={{ textAlign:"center", marginBottom:"26px" }}>
          <div style={{ width:"54px", height:"54px", borderRadius:"14px",
            background:`linear-gradient(135deg,${T.purple},#6D28D9)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"26px", margin:"0 auto 11px",
            boxShadow:"0 8px 24px rgba(124,58,237,0.35)" }}>
            👨‍🏫
          </div>
          <h1 style={{ fontSize:"22px", fontWeight:"800", color:T.text, margin:"0 0 4px" }}>Teacher Portal</h1>
          <p style={{ fontSize:"13px", color:T.textFaint, margin:0 }}>Sign in with your teacher credentials</p>
        </div>

        {error && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:"9px", padding:"10px 13px", color:"#DC2626", fontSize:"13px", marginBottom:"13px", fontWeight:"500" }}>
            {error}
          </div>
        )}

        <label style={S.label}>Email Address</label>
        <input style={{ ...S.input, borderColor: T.purple+"40" }} type="email" placeholder="teacher@bioverse.in"
          value={form.email} onChange={h("email")} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <label style={S.label}>Password</label>
        <input style={{ ...S.input, borderColor: T.purple+"40" }} type="password" placeholder="••••••••"
          value={form.password} onChange={h("password")} onKeyDown={e=>e.key==="Enter"&&submit()}/>

        <button onClick={submit} disabled={loading}
          style={{ ...S.btn, background:`linear-gradient(135deg,${T.purple},#6D28D9)`, color:"#fff", width:"100%", justifyContent:"center", padding:"13px", fontSize:"14.5px", opacity:loading?0.7:1, fontFamily:"inherit" }}>
          {loading ? "Signing in…" : "Sign in to Teacher Portal"}
        </button>
      </div>
    </div>
  );
}

// ─── STUDENT AUTH WRAPPER — wraps existing Auth with back button ──────────────

function StudentAuth({ onSuccess, onBack }) {
  const [authMode, setAuthMode] = useState("login");
  return (
    <div style={{ position:"relative" }}>
      {/* Floating back pill — styled with BioVerse green to match sidebar */}
      <div style={{ position:"fixed", top:"18px", left:"20px", zIndex:200 }}>
        <button onClick={onBack}
          style={{ display:"flex", alignItems:"center", gap:7,
            background:"rgba(255,255,255,0.94)", backdropFilter:"blur(12px)",
            border:`1.5px solid ${T.border}`,
            borderRadius:"99px", padding:"8px 16px",
            fontSize:"13px", fontWeight:"600", color:T.g700,
            cursor:"pointer",
            boxShadow:"0 2px 14px rgba(0,0,0,0.1)",
            fontFamily:"'Inter',-apple-system,sans-serif",
            transition:"all 0.18s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.background=T.g50;e.currentTarget.style.borderColor=T.g400;}}
          onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,0.94)";e.currentTarget.style.borderColor=T.border;}}>
          ← Portal Selection
        </button>
      </div>
      <Auth mode={authMode} onSuccess={onSuccess} onToggle={()=>setAuthMode(m=>m==="login"?"signup":"login")}/>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("student");
  // screen: "loading" | "role" | "studentAuth" | "teacherAuth" | "dashboard"
  const [screen, setScreen] = useState("loading");
  const [user, setUser] = useState(null);
  const [page, setPage] = useState("dashboard");
  const [chapter, setChapter] = useState(null);
  const [syllabusLevel, setSyllabusLevel] = useState("1st PU");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== "undefined" && window.innerWidth < 768);

  // On mount: restore session
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", h);

    // Try to restore Supabase session
    const session = sb.loadSession();
    if (session?.user) {
      const timeout = setTimeout(() => setScreen("role"), 5000);
      sb.getProfile().then(p => {
        clearTimeout(timeout);
        setUser(p || { full_name: session.user.email?.split("@")[0], email: session.user.email, xp: 0, streak: 0, subscription_plan: "free" });
        setScreen("dashboard");
      }).catch(() => { clearTimeout(timeout); setScreen("role"); });
    } else {
      setScreen("role");
    }
    return () => window.removeEventListener("resize", h);
  }, []);

  const handleLoginSuccess = (u) => {
    if (!u) return;
    if (u.role === "admin") {
      setMode("admin");
      setScreen("dashboard");
      return;
    }
    setUser(u);
    setScreen("dashboard");
  };

  const handleRoleSelect = (role) => {
    if (role === "admin") { setMode("admin"); return; }
    if (role === "teacher") { setScreen("teacherAuth"); return; }
    setScreen("studentAuth");
  };

  if (mode === "admin") return <AdminPanelFull onExitAdmin={() => { setMode("student"); setScreen("role"); }} />;

  const handleNav = (key) => {
    if (key === "logout") {
      sb.signOut();
      setUser(null); setScreen("role"); setPage("dashboard");
      return;
    }
    if (key === "admin") { setMode("admin"); return; }
    if (key === "1stPU") { setSyllabusLevel("1st PU"); setChapter(null); setPage("syllabus"); return; }
    if (key === "2ndPU") { setSyllabusLevel("2nd PU"); setChapter(null); setPage("syllabus"); return; }
    setChapter(null);
    setPage(key);
  };

  const pageTitles = {
    dashboard: "Dashboard", syllabus: `${syllabusLevel} Biology`,
    notes: "Notes", questions: "Question Bank", tests: "Tests & Mocks",
    progress: "Progress", profile: "Profile", gameHub: "🎮 Game Hub",
    achievements: "Achievements", planner: "Study Planner",
    kcet: "KCET Analyzer", neet: "NEET Analyzer",
    pyq: "PYQ Center", diagrams: "Diagram Center",
    aiTutor: "🤖 AI Biology Tutor", aiDash: "🧠 AI Dashboard",
    leaderboard: "🥇 Leaderboard", weeklyChallenges: "🎯 Weekly Challenges",
    community: "👥 Community", liveClasses: "📺 Live Classes",
    flashcards: "🃏 Flashcards", quickRevision: "⚡ Quick Revision",
    memoryGame: "🧩 Memory Game", rewardsStore: "🎁 Rewards Store",
  };

  const sidebarActive = page === "syllabus" ? (syllabusLevel === "1st PU" ? "1stPU" : "2ndPU") : page;

  // ── Screens ──────────────────────────────────────────────────────────────────

  if (screen === "loading") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(160deg,#0A1628,#0D2137)", display:"flex", alignItems:"center", justifyContent:"center", flexDirection:"column", gap:16, fontFamily:"'Inter',-apple-system,sans-serif" }}>
      <div style={{ width:"64px", height:"64px", borderRadius:"18px", background:"linear-gradient(135deg,#10B981,#059669)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:"32px", boxShadow:"0 8px 32px rgba(16,185,129,0.4)", marginBottom:4 }}>🧬</div>
      <div style={{ fontSize:"24px", fontWeight:"800", color:"#fff" }}>BioVerse</div>
      <div style={{ fontSize:"13px", color:"rgba(255,255,255,0.45)" }}>Initialising your portal…</div>
      <div style={{ display:"flex", gap:6, marginTop:4 }}>
        {[0,1,2].map(i => <div key={i} style={{ width:"8px", height:"8px", borderRadius:"50%", background:"#34D399", animation:`aiPulse 1.2s ease-in-out ${i*0.2}s infinite` }}/>)}
      </div>
    </div>
  );

  if (screen === "role")        return <RoleSelect onRole={handleRoleSelect} />;
  if (screen === "studentAuth") return <StudentAuth onSuccess={handleLoginSuccess} onBack={() => setScreen("role")} />;
  if (screen === "teacherAuth") return <TeacherAuth onSuccess={handleLoginSuccess} onBack={() => setScreen("role")} />;

  return (
    <div style={{ fontFamily: "'Inter',-apple-system,BlinkMacSystemFont,sans-serif", minHeight: "100vh", background: "#F8FFFE", color: "#0D1F17", display: "flex" }}>
      <SidebarWithAI active={sidebarActive} onNav={handleNav} user={user || {}} isMobile={isMobile} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, paddingLeft: isMobile ? 0 : "256px", minHeight: "100vh" }}>
        {/* Topbar */}
        <div style={{ background: "rgba(255,255,255,0.93)", backdropFilter: "blur(16px)", borderBottom: `1px solid #E5F7EF`, padding: "12px 26px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            {isMobile && <button onClick={() => setSidebarOpen(true)} style={{ padding: "5px", background: "transparent", border: "none", cursor: "pointer" }}><Icon name="menu" size={20} color="#374151" /></button>}
            <div>
              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#0D1F17" }}>{pageTitles[page] || page}</div>
              <div style={{ fontSize: "10.5px", color: "#9CA3AF", display:"flex", alignItems:"center", gap:5 }}>
                BioVerse · Karnataka PU Biology
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => handleNav("aiTutor")} style={{ padding: "7px 13px", borderRadius: "9px", background: "linear-gradient(135deg,#7C3AED,#6D28D9)", color: "#fff", border: "none", cursor: "pointer", fontSize: "12px", fontWeight: "600" }}>🤖 Ask AI</button>
            <button onClick={() => handleNav("challenge")} style={{ padding: "6px 12px", borderRadius: "9px", background: "#FEF3C7", color: "#D97706", border: "none", cursor: "pointer", fontSize: "11.5px", fontWeight: "600" }}>🔥 Daily</button>
            <XPBadge xp={user?.xp || 0} />
            <button onClick={() => setMode("admin")} style={{ padding: "5px 10px", borderRadius: "8px", background: "#EDE9FE", color: "#7C3AED", border: "none", cursor: "pointer", fontSize: "11px", fontWeight: "600" }}>⚙️</button>
            <div onClick={() => handleNav("profile")} style={{ width: "30px", height: "30px", borderRadius: "50%", background: `linear-gradient(135deg,${T.g600},${T.g400})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: "700", cursor: "pointer", fontSize: "12px" }}>
              {(user?.full_name || user?.name || user?.email || "S")[0].toUpperCase()}
            </div>
          </div>
        </div>

        {/* All page routes */}
        {page === "dashboard"        && <Dashboard user={user || {}} onNav={handleNav} />}
        {page === "syllabus"         && (chapter
          ? <ChapterPage chapter={chapter} level={syllabusLevel} onBack={() => setChapter(null)} />
          : <SyllabusView level={syllabusLevel} onChapter={(c, l) => { setChapter(c); setSyllabusLevel(l); }} />)}
        {page === "notes"            && <NotesView />}
        {page === "questions"        && <QuestionsView />}
        {page === "tests"            && <TestsView />}
        {page === "progress"         && <ProgressView />}
        {page === "profile"          && <ProfileView user={user || {}} />}
        {page === "gameHub"          && <GameHub user={user || {}} onNav={handleNav} />}
        {page === "achievements"     && <Achievements />}
        {page === "planner"          && <StudyPlanner />}
        {page === "kcet"             && <KcetAnalyzer />}
        {page === "neet"             && <NeetAnalyzer />}
        {page === "pyq"              && <PYQCenter />}
        {page === "diagrams"         && <DiagramCenter />}
        {page === "aiTutor"          && <AITutor currentChapter={chapter?.chapter_name || chapter?.title} currentLevel={syllabusLevel} user={user || {}} />}
        {page === "aiDash"           && <AIDashboard user={user || {}} onNav={handleNav} />}
        {page === "leaderboard"      && <LeaderboardView user={user || {}} />}
        {page === "weeklyChallenges" && <WeeklyChallenges onNav={handleNav} />}
        {page === "community"        && <CommunityForum user={user || {}} />}
        {page === "liveClasses"      && <LiveClasses />}
        {page === "flashcards"       && <FlashcardSystem />}
        {page === "quickRevision"    && <QuickRevision />}
        {page === "memoryGame"       && <MemoryGame />}
        {page === "rewardsStore"     && <RewardsStore userXP={user?.xp || 0} />}
      </div>

      {!["aiTutor", "aiDash"].includes(page) && <FloatingAIButton onClick={() => handleNav("aiTutor")} />}

      <style>{`
        * { box-sizing: border-box; } body { margin: 0; }
        input:focus, select:focus, textarea:focus { border-color: #10B981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.11); }
        button { transition: all 0.17s; } button:hover { filter: brightness(0.93); }
        ::-webkit-scrollbar { width: 5px; } ::-webkit-scrollbar-track { background: #F0FDF4; }
        ::-webkit-scrollbar-thumb { background: #A7F3D0; border-radius: 99px; }
        @keyframes float { 0% { transform: translateY(0) scale(1); } 100% { transform: translateY(-18px) scale(1.05); } }
        @keyframes pulse { 0% { opacity: 0.4; transform: scale(1); } 100% { opacity: 1; transform: scale(1.35); } }
        @keyframes aiPulse { 0%, 100% { opacity: 0.3; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }
        @keyframes aiRipple { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes livePulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
      `}</style>
    </div>
  );
}
