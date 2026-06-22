import { createRouter, createWebHistory } from 'vue-router'
import DesignPage from '@/pages/DesignPage.vue'
import TeachingPage from '@/pages/TeachingPage.vue'

const routes = [
  {
    path: '/',
    name: 'design',
    component: DesignPage,
  },
  {
    path: '/teaching',
    name: 'teaching',
    component: TeachingPage,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
