import axios from 'axios';

const baseURL = import.meta.env.DEV
  ? 'http://localhost:4000'
  : import.meta.env.VITE_BASEURL || window.location.origin

const api = axios.create({
    baseURL
})

export default api