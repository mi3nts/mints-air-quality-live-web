import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/home/'

Vue.use(VueRouter)
/**
 * All the url configurations go here.
 */
const routes = [{
    path: '/',
    name: 'home',
    component: Home
  },
  // {
  //   path: '/particulate-matter',
  //   name: 'particulate-matter',
  //   component: () => import(/* webpackChunkName: "particulate-matters" */ '../views/particulate-matter')
  // }
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router