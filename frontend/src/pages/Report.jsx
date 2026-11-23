import {useState} from 'react'; import {api} from '../api'
export default function Report(){
  const [f,setF]=useState({category:'pothole',description:'',lat:'',lon:''}),[msg,setMsg]=useState('')
  const locate=()=>navigator.geolocation.getCurrentPosition(p=>setF({...f,lat:p.coords.latitude,lon:p.coords.longitude}))
  const send=async()=>{const r=await api.post('/api/incidents',{...f,lat:+f.lat,lon:+f.lon});setMsg('Submitted. Reference #'+r.id)}
  return <div className="max-w-md space-y-3"><h1 className="text-xl font-semibold">Report an Issue</h1>
  <select className="border p-2 w-full" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{['pothole','waterlogging','roadblock','damaged signal','accident','dangerous condition'].map(c=><option key={c}>{c}</option>)}</select>
  <textarea className="border p-2 w-full" rows="3" placeholder="Describe the issue" onChange={e=>setF({...f,description:e.target.value})}/>
  <div className="flex gap-2"><input className="border p-2 w-1/2" placeholder="lat" value={f.lat} onChange={e=>setF({...f,lat:e.target.value})}/><input className="border p-2 w-1/2" placeholder="lon" value={f.lon} onChange={e=>setF({...f,lon:e.target.value})}/></div>
  <button className="text-sm text-blue-600" onClick={locate}>Use my location</button><br/>
  <button disabled={!f.lat||!f.description} className="bg-blue-600 text-white px-3 py-2 rounded disabled:opacity-40" onClick={send}>Submit</button>{msg&&<p className="text-sm text-green-700">{msg}</p>}</div>}
