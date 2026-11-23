const getToken = () => localStorage.getItem('token')

const authHeaders = (isJson = true) => {
  const h = {}
  if (isJson) h['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) h['Authorization'] = `Bearer ${token}`
  return h
}

const handleResponse = async (r) => {
  if (!r.ok) {
    let errText = ''
    try {
      const errJson = await r.json()
      errText = errJson.detail || JSON.stringify(errJson)
    } catch {
      errText = await r.text()
    }
    throw new Error(errText || `HTTP Error ${r.status}`)
  }
  return r.json()
}

export const api = {
  get: (url) => fetch(url, { headers: authHeaders(false) }).then(handleResponse),

  post: (url, body) =>
    fetch(url, {
      method: 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(body)
    }).then(handleResponse),

  patch: (url, body) =>
    fetch(url, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify(body)
    }).then(handleResponse),

  uploadVideo: (file, location = '', mpp = '') => {
    const f = new FormData()
    f.append('file', file)
    if (location) f.append('location', location)
    if (mpp) f.append('m_per_px', mpp)
    const token = getToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetch('/api/videos', { method: 'POST', headers, body: f }).then(handleResponse)
  },

  uploadIncident: (formData) => {
    const token = getToken()
    const headers = token ? { Authorization: `Bearer ${token}` } : {}
    return fetch('/api/incidents', { method: 'POST', headers, body: formData }).then(handleResponse)
  }
}
