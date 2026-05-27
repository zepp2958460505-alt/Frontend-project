import 'dotenv/config'
import app from './app.js'

const port = process.env.PORT || 3101

app.listen(port, () => {
  console.log(`服务器地址: http://localhost:${port}`)
})
