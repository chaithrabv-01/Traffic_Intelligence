import {useEffect,useState} from 'react'; import {api} from '../api'
export default function Events(){
  const [es,setEs]=useState([]); const load=()=>api.get('/api/events?portal=police').then(setEs); useEffect(()=>{load()},[])
  const set=async(id,s)=>{await api.patch('/api/events/'+id,{status:s}); load()}
  return <div><h1 className="text-xl font-semibold mb-3">Incident Management</h1>
  <table className="w-full text-sm bg-white rounded shadow-sm"><thead><tr className="text-left"><th className="p-2">ID</th><th>Type</th><th>Video</th><th>t</th><th>Location</th><th>Severity</th><th>Conf.</th><th>Status</th><th></th></tr></thead>
  <tbody>{es.map(e=><tr key={e.id} className="border-t"><td className="p-2">{e.id}</td><td>{e.type}</td><td>{e.video_id??'-'}</td><td>{e.ts??'-'}</td>
   <td>{e.lat?`${e.lat.toFixed(4)}, ${e.lon.toFixed(4)}`:'unknown'}</td><td>{e.severity}</td><td>{e.confidence??'-'}</td><td>{e.status}</td>
   <td className="space-x-2">{e.status==='unverified'&&<><button className="text-green-700" onClick={()=>set(e.id,'verified')}>Verify</button><button className="text-red-600" onClick={()=>set(e.id,'rejected')}>Reject</button></>}</td></tr>)}</tbody></table></div>}
