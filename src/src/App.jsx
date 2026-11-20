import {useEffect,useState,useCallback} from 'react'
import {supabase} from './supabase'
import {ResponsiveContainer,BarChart,Bar,XAxis,YAxis,Tooltip,Legend,CartesianGrid} from 'recharts'
import {fm,fd,sum,inR,byType,byDay,today,addD,mon,addM,dim} from './utils'

const MN=['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec']
const DN=['Po','Út','St','Čt','Pá','So','Ne']
const NAV=[['dash','Přehled'],['add','Přidat aktivitu'],['week','Týden'],['month','Měsíc'],['hist','Historie'],['set','Nastavení']]
const hrs=v=>+(v/60).toFixed(2)
const tip=v=>fm(v*60)

function Auth({recovery,onDone}){
  const [mode,setMode]=useState('in'),[email,setE]=useState(''),[pw,setP]=useState(''),[msg,setM]=useState(''),[busy,setB]=useState(false)
  async function go(e){
    e.preventDefault();setB(true);setM('')
    let r
    if(recovery)r=await supabase.auth.updateUser({password:pw})
    else if(mode==='in')r=await supabase.auth.signInWithPassword({email,password:pw})
    else if(mode==='up')r=await supabase.auth.signUp({email,password:pw})
    else r=await supabase.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin})
    setB(false)
    if(r.error)return setM(r.error.message)
    if(recovery)return onDone()
    if(mode==='up'&&!r.data.session)setM('Zkontrolujte e-mail a registraci potvrďte odkazem.')
    if(mode==='reset')setM('Odkaz pro obnovení hesla byl odeslán na váš e-mail.')
  }
  return <div className="min-h-screen grid place-items-center p-4"><form onSubmit={go} className="card w-full max-w-sm space-y-3">
    <h1 className="text-xl font-bold">{recovery?'Nové heslo':mode==='in'?'Přihlášení':mode==='up'?'Registrace':'Obnovení hesla'}</h1>
    {!recovery&&<input className="inp" type="email" required placeholder="E-mail" value={email} onChange={e=>setE(e.target.value)}/>}
    {mode!=='reset'&&<input className="inp" type="password" required minLength={8} placeholder="Heslo (min. 8 znaků)" value={pw} onChange={e=>setP(e.target.value)}/>}
    {msg&&<p className="mu">{msg}</p>}
    <button className="btn w-full" disabled={busy}>{busy?'Čekejte…':recovery?'Uložit heslo':mode==='in'?'Přihlásit se':mode==='up'?'Vytvořit účet':'Poslat odkaz'}</button>
    {!recovery&&<div className="mu flex justify-between"><button type="button" onClick={()=>setMode(mode==='in'?'up':'in')}>{mode==='in'?'Nemám účet':'Mám účet'}</button>
    <button type="button" onClick={()=>setMode('reset')}>Zapomenuté heslo</button></div>}
  </form></div>
}

export default function App(){
  const [session,setS]=useState(null),[ready,setR]=useState(false),[rec,setRec]=useState(false)
  useEffect(()=>{
    supabase.auth.getSession().then(({data})=>{setS(data.session);setR(true)})
    const {data:{subscription}}=supabase.auth.onAuthStateChange((ev,s)=>{setS(s);if(ev==='PASSWORD_RECOVERY')setRec(true)})
    return()=>subscription.unsubscribe()
  },[])
  if(!ready)return <p className="p-6 mu">Načítám…</p>
  if(!session||rec)return <Auth recovery={rec} onDone={()=>setRec(false)}/>
  return <Main session={session}/>
}

function Main({session}){
  const [v,setV]=useState('dash'),[cats,setC]=useState([]),[acts,setA]=useState([]),[goal,setG]=useState({w:30,m:120}),
    [err,setErr]=useState(''),[load,setL]=useState(true),[modal,setMo]=useState(null),[toast,setT]=useState('')
  const say=t=>{setT(t);setTimeout(()=>setT(''),2500)}
  const reload=useCallback(async()=>{
    const [c,a,g]=await Promise.all([
      supabase.from('categories').select('*').order('created_at'),
      supabase.from('activities').select('*').order('activity_date',{ascending:false}).limit(20000),
      supabase.from('goals').select('*').maybeSingle()])
    const e=c.error||a.error||g.error
    if(e){setErr('Data se nepodařilo načíst: '+e.message);setL(false);return false}
    setErr('');setC(c.data)
    setA(a.data.map(x=>({id:x.id,type:x.category_id,date:x.activity_date,min:x.minutes,note:x.note})))
    if(g.data)setG({w:g.data.weekly_hours,m:g.data.monthly_hours})
    setL(false);return true
  },[])
  useEffect(()=>{reload()},[reload])
  // Úspěch se hlásí až po potvrzení databáze a následném načtení čerstvých dat
  async function run(p,ok){
    const {error}=await p
    if(error){say('Chyba ukládání: '+error.message);return false}
    await reload();say(ok);return true
  }
  const C=id=>cats.find(c=>c.id===id)||{name:'?',color:'#999'}
  const ctx={cats,acts,goal,C,run,setMo,session}
  return <div className="max-w-5xl mx-auto p-4 pb-24 md:pb-8">
    <nav className="fixed bottom-0 inset-x-0 z-10 flex bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 md:static md:border-0 md:bg-transparent md:dark:bg-transparent md:gap-2 md:mb-4">
      {NAV.map(([k,l])=><button key={k} onClick={()=>k==='add'?setMo({}):setV(k)} className={`flex-1 md:flex-none py-3 md:py-2 md:px-4 text-xs md:text-sm md:rounded-lg ${v===k?'text-blue-600 font-semibold md:bg-white md:dark:bg-slate-900':'text-slate-500'}`}>{l}</button>)}
    </nav>
    {err&&<div className="card mb-3 text-red-600">{err} <button className="btn2 ml-2" onClick={reload}>Zkusit znovu</button></div>}
    {load?<p className="mu">Načítám data…</p>:<>
      {v==='dash'&&<Dash {...ctx}/>}{v==='week'&&<Stats mode="week" {...ctx}/>}{v==='month'&&<Stats mode="month" {...ctx}/>}
      {v==='hist'&&<Hist {...ctx}/>}{v==='set'&&<Settings {...ctx}/>}</>}
    {modal&&<Form x={modal} {...ctx}/>}
    {toast&&<div className="fixed top-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-4 py-2 rounded-lg z-30">{toast}</div>}
  </div>
}

const Card=({k,v})=><div className="card"><div className="mu">{k}</div><div className="text-2xl font-bold">{v}</div></div>
function Goal({l,cur,g}){const pc=g?Math.min(100,Math.round(cur/60/g*100)):0
  return <div className="card"><div className="flex justify-between"><b>{l}</b><span>{pc} %</span></div>
  <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full my-2 overflow-hidden"><div className="h-full bg-green-600" style={{width:pc+'%'}}/></div>
  <span className="mu">{fm(cur)} z {g} h · zbývá {fm(Math.max(0,g*60-cur))}</span></div>}
function Row({x,C,edit}){return <div className="flex justify-between items-center gap-2 py-2 border-b border-slate-200 dark:border-slate-800 last:border-0">
  <div><i className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{background:C(x.type).color}}/><b>{C(x.type).name}</b> · {fm(x.min)}<div className="mu">{fd(x.date)}{x.note&&' · '+x.note}</div></div>{edit}</div>}

function Dash({acts,goal,C,setMo}){
  const t=today(),w=mon(t),m=t.slice(0,7)
  const wa=inR(acts,w,addD(w,6)),ma=inR(acts,m+'-01',m+'-31'),days=new Set(ma.map(x=>x.date)).size,top=byType(ma)[0]
  const from=addD(t,-13),r=inR(acts,from,t),used=[...new Set(r.map(x=>x.type))]
  const d=Array.from({length:14},(_,i)=>{const dd=addD(from,i),o={l:dd.slice(8)+'.'+dd.slice(5,7)+'.'}
    used.forEach(id=>{const v=sum(r.filter(x=>x.date===dd&&x.type===id));o[id]=v?hrs(v):undefined});return o})
  return <><h1 className="text-2xl font-bold mb-3">Přehled</h1>
  <button className="btn w-full py-4 text-lg mb-3" onClick={()=>setMo({})}>+ Přidat aktivitu</button>
  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-3"><Card k="Tento týden" v={fm(sum(wa))}/><Card k="Tento měsíc" v={fm(sum(ma))}/><Card k="Aktivit (měsíc)" v={ma.length}/>
    <Card k="Nejvíce času" v={<span className="text-base">{top?C(top[0]).name:'—'}</span>}/><Card k="Průměr/pracovní den" v={days?fm(sum(ma)/days):'—'}/></div>
  <div className="grid md:grid-cols-2 gap-3 mb-3"><Goal l="Týdenní cíl" cur={sum(wa)} g={goal.w}/><Goal l="Měsíční cíl" cur={sum(ma)} g={goal.m}/></div>
  <div className="card mb-3"><h2 className="font-semibold mb-2">Vývoj za 14 dní (hodiny podle aktivit)</h2><div className="h-60"><ResponsiveContainer><BarChart data={d}><CartesianGrid strokeDasharray="3 3" opacity={.3}/><XAxis dataKey="l" fontSize={11}/><YAxis fontSize={11}/><Tooltip formatter={(v,n)=>[tip(v),n]}/><Legend wrapperStyle={{fontSize:12}}/>{used.map(id=><Bar key={id} dataKey={id} name={C(id).name} stackId="a" fill={C(id).color}/>)}</BarChart></ResponsiveContainer></div></div>
  <div className="card"><h2 className="font-semibold mb-1">Poslední aktivity</h2>{acts.slice(0,5).map(x=><Row key={x.id} x={x} C={C}/>)}{!acts.length&&<p className="mu">Zatím nic.</p>}</div></>
}

function Stats({mode,acts,goal,C}){
  const [off,setOff]=useState(0),t=today(),wk=mode==='week'
  let from,days,pf,pd
  if(wk){from=addD(mon(t),off*7);days=7;pf=addD(from,-7);pd=7}
  else{const m=addM(t.slice(0,7),off),pm=addM(m,-1);from=m+'-01';days=dim(m);pf=pm+'-01';pd=dim(pm)}
  const to=addD(from,days-1),a=inR(acts,from,to),pa=inR(acts,pf,addD(pf,pd-1)),tot=sum(a),ptot=sum(pa),act=new Set(a.map(x=>x.date)).size
  const d=byDay(a,from,days).map((x,i)=>({l:wk?DN[i]:i+1,h:hrs(x.v),d:x.d}))
  const wsum={};if(!wk)byDay(a,from,days).forEach(x=>{const k=mon(x.d);wsum[k]=(wsum[k]||0)+x.v})
  const bt=byType(a),diff=tot-ptot,title=wk?`${fd(from)} – ${fd(to)}`:`${MN[+from.slice(5,7)-1]} ${from.slice(0,4)}`
  return <><h1 className="text-2xl font-bold mb-3">{wk?'Týden':'Měsíc'}</h1>
  <div className="card mb-3 flex items-center justify-between"><button className="btn2" onClick={()=>setOff(off-1)}>‹</button><b>{title}</b><button className="btn2" onClick={()=>setOff(off+1)}>›</button></div>
  <div className="grid grid-cols-3 gap-3 mb-3"><Card k="Celkem" v={fm(tot)}/><Card k="Aktivit" v={a.length}/><Card k={wk?'Průměr/den (7 dní)':'Průměr/pracovní den'} v={wk?fm(tot/7):act?fm(tot/act):'—'}/></div>
  <div className="card mb-3"><h2 className="font-semibold mb-2">Čas podle dnů (hodiny)</h2><div className="h-52"><ResponsiveContainer><BarChart data={d}><CartesianGrid strokeDasharray="3 3" opacity={.3}/><XAxis dataKey="l" fontSize={11}/><YAxis fontSize={11}/><Tooltip formatter={tip}/><Bar dataKey="h" fill="#2563eb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></div>
  <div className="grid md:grid-cols-2 gap-3 mb-3">
    <div className="card"><h2 className="font-semibold mb-2">Rozdělení aktivit</h2>{bt.map(([id,m])=><div key={id} className="mb-2"><div className="flex justify-between text-sm"><span>{C(id).name}</span><span>{fm(m)} · {Math.round(m/tot*100)} %</span></div><div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full"><div className="h-full rounded-full" style={{width:m/tot*100+'%',background:C(id).color}}/></div></div>)}{!bt.length&&<p className="mu">Žádné záznamy.</p>}</div>
    <div className="card"><h2 className="font-semibold mb-2">Souhrn</h2><p>Celkem <b>{fm(tot)}</b> v {a.length} aktivitách.</p>
      <p className={diff>=0?'text-green-600':'text-red-600'}>{diff>=0?'▲ +':'▼ −'}{fm(Math.abs(diff))} <span className="mu">oproti {wk?'minulému týdnu':'minulému měsíci'} ({fm(ptot)})</span></p>
      {bt[0]&&<p>Nejnáročnější: <b>{C(bt[0][0]).name}</b> ({fm(bt[0][1])})</p>}
      {!wk&&Object.entries(wsum).map(([k,v])=><div key={k} className="flex justify-between text-sm"><span>týden od {fd(k)}</span><b>{fm(v)}</b></div>)}</div></div>
  <Goal l={wk?'Týdenní cíl':'Měsíční cíl'} cur={tot} g={wk?goal.w:goal.m}/></>
}

function Hist({acts,cats,C,run,setMo}){
  const [f,setF]=useState(''),[t,setT]=useState(''),[c,setC]=useState('')
  const a=acts.filter(x=>(!f||x.date>=f)&&(!t||x.date<=t)&&(!c||x.type===c))
  return <><h1 className="text-2xl font-bold mb-3">Historie</h1>
  <div className="card mb-3 grid grid-cols-2 gap-2"><label className="mu">Od<input type="date" className="inp" value={f} onChange={e=>setF(e.target.value)}/></label><label className="mu">Do<input type="date" className="inp" value={t} onChange={e=>setT(e.target.value)}/></label>
    <label className="mu col-span-2">Kategorie<select className="inp" value={c} onChange={e=>setC(e.target.value)}><option value="">Všechny</option>{cats.map(k=><option key={k.id} value={k.id}>{k.name}{k.archived?' (archiv)':''}</option>)}</select></label></div>
  <div className="card"><div className="mu mb-1">{a.length} záznamů · {fm(sum(a))}</div>
    {a.map(x=><Row key={x.id} x={x} C={C} edit={<div className="flex gap-2"><button className="btn2" onClick={()=>setMo(x)}>Upravit</button>
      <button className="btn2 text-red-600" onClick={()=>confirm('Opravdu smazat záznam?')&&run(supabase.from('activities').delete().eq('id',x.id),'Záznam smazán')}>Smazat</button></div>}/>)}</div></>
}

function Form({x,cats,run,setMo}){
  const edit=!!x.id,[type,setType]=useState(x.type||cats.find(c=>!c.archived)?.id||''),[date,setD]=useState(x.date||today()),
    [h,setH]=useState(x.min?Math.floor(x.min/60):0),[mi,setMi]=useState(x.min?x.min%60:0),[note,setN]=useState(x.note||''),[busy,setB]=useState(false),[e,setE]=useState('')
  async function save(){
    const minutes=(+h||0)*60+(+mi||0)
    if(!type)return setE('Vyberte typ aktivity');if(minutes<=0)return setE('Zadejte délku větší než 0');if(!date)return setE('Zadejte datum')
    setB(true)
    const row={category_id:type,activity_date:date,minutes,note:note.trim()}
    const ok=await run(edit?supabase.from('activities').update(row).eq('id',x.id):supabase.from('activities').insert(row),'Aktivita uložena')
    setB(false);if(ok)setMo(null)
  }
  return <div className="fixed inset-0 bg-black/50 grid place-items-end md:place-items-center z-20"><div className="card w-full max-w-md rounded-b-none md:rounded-b-xl space-y-2">
    <h2 className="font-bold text-lg">{edit?'Upravit aktivitu':'Přidat aktivitu'}</h2>
    <label className="mu block">Typ aktivity<select className="inp" value={type} onChange={e=>setType(e.target.value)}>{cats.filter(c=>!c.archived||c.id===x.type).map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
    <label className="mu block">Datum<input type="date" className="inp" value={date} onChange={e=>setD(e.target.value)}/></label>
    <div className="grid grid-cols-2 gap-2"><label className="mu">Hodiny<input type="number" min="0" max="24" className="inp" value={h} onChange={e=>setH(e.target.value)}/></label><label className="mu">Minuty<input type="number" min="0" max="59" className="inp" value={mi} onChange={e=>setMi(e.target.value)}/></label></div>
    <label className="mu block">Poznámka (volitelná)<textarea rows="2" className="inp" value={note} onChange={e=>setN(e.target.value)}/></label>
    {e&&<p className="text-red-600 text-sm">{e}</p>}
    <div className="flex gap-2 pt-2"><button className="btn2 flex-1" onClick={()=>setMo(null)}>Zrušit</button><button className="btn flex-1" disabled={busy} onClick={save}>{busy?'Ukládám…':'Uložit aktivitu'}</button></div></div></div>
}

function Settings({cats,goal,run,session}){
  const [w,setW]=useState(goal.w),[m,setM]=useState(goal.m),[n,setN]=useState(''),[col,setCol]=useState('#2563eb')
  return <><h1 className="text-2xl font-bold mb-3">Nastavení</h1>
  <div className="card mb-3"><h2 className="font-semibold mb-2">Pracovní cíle (hodiny)</h2><div className="grid grid-cols-2 gap-2">
    <label className="mu">Týdenní<input type="number" min="0" className="inp" value={w} onChange={e=>setW(e.target.value)}/></label><label className="mu">Měsíční<input type="number" min="0" className="inp" value={m} onChange={e=>setM(e.target.value)}/></label></div>
    <button className="btn mt-3" onClick={()=>run(supabase.from('goals').upsert({user_id:session.user.id,weekly_hours:Math.max(0,+w||0),monthly_hours:Math.max(0,+m||0)}),'Cíle uloženy')}>Uložit cíle</button></div>
  <div className="card mb-3"><h2 className="font-semibold mb-2">Druhy aktivit</h2>
    {cats.map(c=><div key={c.id} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-800 last:border-0"><span><i className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{background:c.color}}/>{c.name}{c.archived&&<span className="mu"> (archivováno)</span>}</span>
      <span className="flex gap-2"><button className="btn2" onClick={()=>{const r=prompt('Nový název',c.name);if(r&&r.trim())run(supabase.from('categories').update({name:r.trim()}).eq('id',c.id),'Přejmenováno')}}>Přejmenovat</button>
      <button className="btn2" onClick={()=>run(supabase.from('categories').update({archived:!c.archived}).eq('id',c.id),c.archived?'Obnoveno':'Archivováno')}>{c.archived?'Obnovit':'Archivovat'}</button></span></div>)}
    <div className="flex gap-2 mt-3"><input className="inp" placeholder="Název nového typu" value={n} onChange={e=>setN(e.target.value)}/><input type="color" className="h-10 w-12 rounded" value={col} onChange={e=>setCol(e.target.value)}/>
    <button className="btn whitespace-nowrap" onClick={async()=>{const name=n.trim();if(!name)return;if(cats.some(c=>c.name.toLowerCase()===name.toLowerCase()))return alert('Takový typ už existuje');if(await run(supabase.from('categories').insert({name,color:col}),'Typ přidán'))setN('')}}>+ Nový typ aktivity</button></div></div>
  <div className="card"><p className="mu mb-2">Přihlášen: {session.user.email}</p><button className="btn2" onClick={()=>supabase.auth.signOut()}>Odhlásit se</button></div></>
}
