import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

export const calculate = (data) => api.post('/calculate', data)
export const getMaterials = (code) => api.get('/materials', { params: { code } })

export const getPipeSchedules = (params) => api.get('/pipe-schedule', { params })
export const uploadPipeCSV = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/pipe-schedule/upload', fd)
}
export const deletePipeSchedule = (id) => api.delete(`/pipe-schedule/${id}`)

export const getAllowableStresses = (params) => api.get('/allowable-stress', { params })
export const uploadStressCSV = (file) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/allowable-stress/upload', fd)
}
export const deleteAllowableStress = (id) => api.delete(`/allowable-stress/${id}`)
