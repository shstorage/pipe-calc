import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const calculate = (data) => api.post('/calculate', data)
export const getMaterials = (code) => api.get('/materials', { params: { code } })

export const getPipeSchedules = (params) => api.get('/pipe-schedule', { params })
export const exportPipeSchedule = (standard) =>
  api.get('/pipe-schedule/export', {
    params: standard ? { standard } : {},
    responseType: 'blob',
  })
export const uploadPipeFile = (file, mode = 'add') => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/pipe-schedule/upload?mode=${mode}`, fd)
}
export const deletePipeSchedule = (id) => api.delete(`/pipe-schedule/${id}`)

export const getStressMeta = () => api.get('/allowable-stress/meta')
export const getAllowableStresses = (params) => api.get('/allowable-stress', { params })
export const exportAllowableStress = (code, edition) =>
  api.get('/allowable-stress/export', {
    params: { ...(code ? { code } : {}), ...(edition ? { edition } : {}) },
    responseType: 'blob',
  })
export const downloadStressTemplate = () =>
  api.get('/allowable-stress/template', { responseType: 'blob' })
export const uploadStressFile = (file, mode = 'add') => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post(`/allowable-stress/upload?mode=${mode}`, fd)
}
export const deleteAllowableStress = (id) => api.delete(`/allowable-stress/${id}`)
