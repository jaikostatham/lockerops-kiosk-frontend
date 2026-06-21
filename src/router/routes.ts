import { createRouter, createWebHistory } from 'vue-router';
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'welcome',
    component: () => import('@/pages/WelcomePage.vue'),
  },
  {
    path: '/stations',
    name: 'stations',
    component: () => import('@/pages/StationSelectionPage.vue'),
  },
  {
    path: '/stations/:stationId/compartments',
    name: 'compartments',
    component: () => import('@/pages/CompartmentGridPage.vue'),
  },
  {
    path: '/compartments/:compartmentId',
    name: 'compartment-detail',
    component: () => import('@/pages/CompartmentDetailPage.vue'),
  },
  {
    path: '/access-code',
    name: 'access-code',
    component: () => import('@/pages/AccessCodePage.vue'),
  },
  {
    path: '/:catchAll(.*)*',
    redirect: '/',
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
