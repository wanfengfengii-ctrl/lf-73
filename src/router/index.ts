import { createRouter, createWebHistory } from 'vue-router'
import DesignPage from '@/pages/DesignPage.vue'

const routes = [
  {
    path: '/',
    name: 'design',
    component: DesignPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
