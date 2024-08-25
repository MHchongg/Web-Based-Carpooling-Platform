import axios from "axios"

const request = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000 // 30 seconds
})

request.interceptors.request.use((config) => { 
    return config
}, (error) => {
    return Promise.reject(error)
})

request.interceptors.response.use((response) => {
    return response
}, (error) => {
    return Promise.reject(error)
})

export { request }