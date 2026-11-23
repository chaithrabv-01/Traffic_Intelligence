import {useState} from 'react'; import {api} from '../api'
export default function Assistant(){
  const [q,setQ]=useState(''),[log,setLog]=useState([]),[busy,setBusy]=useState(false)
  const ask=async()=>{setBusy(true);const r=await api.post('/api/assistant',{message:q});setLog([...log,{q,...r}]);setQ('');setBusy(false)}
  return <div className="max-w-2xl space-y-3"><h1 className="text-xl font-semibold">AI Traffic Assistant</h1>
  {log.map((m,i)=><div key={i} className="bg-white p-3 rounded shadow-sm text-sm"><p className="font-medium">{m.q}</p><p className="whitespace-pre-wrap">{m.answer}</p>
   {m.tool_calls?.length>0&&<p className="text-xs text-slate-500 mt-1">Data from: {m.tool_calls.map(t=>t.tool).join(', ')}</p>}</div>)}
  <div className="flex gap-2"><input className="border p-2 flex-1" value={q} placeholder="e.g. How many vehicles were detected in video 1?" onChange={e=>setQ(e.target.value)}/><button disabled={!q||busy} className="bg-blue-600 text-white px-3 rounded disabled:opacity-40" onClick={ask}>Ask</button></div></div>}
