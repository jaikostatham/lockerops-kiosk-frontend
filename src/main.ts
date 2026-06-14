import '@quasar/extras/material-icons/material-icons.css';
import 'quasar/src/css/index.sass';
import './styles/main.scss';

import { Quasar, Notify } from 'quasar';
import { createApp } from 'vue';

import App from './App.vue';
import i18n, { initialLocale, setDocumentLocale } from './i18n';
import router from './router/routes';

const app = createApp(App);

app.use(Quasar, {
  plugins: {
    Notify,
  },
  config: {
    notify: {
      position: 'top',
      timeout: 1800,
      actions: [{ icon: 'close', color: 'white', round: true }],
    },
  },
});

app.use(i18n);
app.use(router);
app.mount('#app');

setDocumentLocale(initialLocale);
