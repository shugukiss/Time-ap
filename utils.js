export const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Prague'}).format(new Date())
const P=d=>new Date(d+'T00:00:00Z')
export const addD=(d,n)=>{const u=P(d);u.setUTCDate(u.getUTCDate()+n);return u.toISOString().slice(0,10)}
export const mon=d=>addD(d,-((P(d).getUTCDay()+6)%7))
export const addM=(m,n)=>{const u=P(m+'-01');u.setUTCMonth(u.getUTCMonth()+n);return u.toISOString().slice(0,7)}
export const dim=m=>{const u=P(m+'-01');u.setUTCMonth(u.getUTCMonth()+1);u.setUTCDate(0);return u.getUTCDate()}
export const fm=m=>{m=Math.round(m);const h=Math.floor(m/60),r=m%60;return h?(r?`${h} h ${r} min`:`${h} h`):`${r} min`}
export const fd=d=>{const[y,m,x]=d.split('-');return `${+x}. ${+m}. ${y}`}
export const sum=a=>a.reduce((s,x)=>s+x.min,0)
export const inR=(a,f,t)=>a.filter(x=>x.date>=f&&x.date<=t)
export const byType=a=>{const o={};a.forEach(x=>o[x.type]=(o[x.type]||0)+x.min);return Object.entries(o).sort((a,b)=>b[1]-a[1])}
export const byDay=(a,f,n)=>Array.from({length:n},(_,i)=>{const d=addD(f,i);return{d,v:sum(a.filter(x=>x.date===d))}})
