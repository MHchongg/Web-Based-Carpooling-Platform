import axios from "axios"
import { getToken } from "./token"

const request = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000 // 30 seconds
})

request.interceptors.request.use((config) => {
    const token = getToken()
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
}, (error) => {
    return Promise.reject(error)
})

request.interceptors.response.use((response) => {
    return response
}, (error) => {
    switch (error.response.status) {
        case 400:
            window.location.replace("http://localhost:3000/")
            break;
        case 403:
            window.location.replace("http://localhost:3000/forbidden")
            break;
        default:
            window.location.replace("http://localhost:3000/")
            break;
    }
    return Promise.reject(error)
})

export { request }