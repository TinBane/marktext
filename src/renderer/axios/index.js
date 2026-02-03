import axios from 'axios'

// Force Node.js http adapter in Electron renderer process
axios.defaults.adapter = 'http'

const http = axios.create({
  adapter: 'http'
})

export default http
