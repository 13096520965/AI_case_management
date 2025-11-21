import { createApp } from 'vue'
<<<<<<< HEAD
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import 'element-plus/dist/index.css'
import './styles/element-override.css'


const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
=======
import './style.css'
import App from './App.vue'

createApp(App).mount('#app')
>>>>>>> a13d898 (feat: 完整的法律案件管理系统 - 包含AI助手、文书管理、证据管理等完整功能)
