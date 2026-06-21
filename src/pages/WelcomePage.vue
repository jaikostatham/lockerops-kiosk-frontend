<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import LanguageSwitcher from '@/components/LanguageSwitcher.vue';

const router = useRouter();
const { t } = useI18n();

function startKiosk(): void {
  void router.push({ name: 'stations' });
}

function openAccessCode(): void {
  void router.push({ name: 'access-code' });
}
</script>

<template>
  <q-page class="kiosk-page welcome-page">
    <div class="welcome-page__language">
      <LanguageSwitcher />
    </div>

    <div class="welcome-page__content">
      <div class="welcome-copy">
        <div class="brand-mark brand-mark--large" aria-hidden="true">
          <q-icon name="inventory_2" />
        </div>
        <p class="screen-kicker">{{ t('welcome.kicker') }}</p>
        <h1>{{ t('welcome.title') }}</h1>
        <p class="welcome-copy__subtitle">{{ t('welcome.subtitle') }}</p>
        <p class="welcome-copy__brand">{{ t('welcome.byline') }}</p>
        <p class="welcome-copy__body">
          {{ t('welcome.body') }}
        </p>

        <div class="welcome-copy__actions">
          <q-btn
            unelevated
            color="primary"
            icon-right="arrow_forward"
            :label="t('common.start')"
            class="touch-button touch-button--primary"
            @click="startKiosk"
          />
          <q-btn
            outline
            color="white"
            icon="password"
            :label="t('accessCode.haveCode')"
            class="touch-button touch-button--secondary"
            @click="openAccessCode"
          />
        </div>

        <p class="welcome-copy__platform">{{ t('welcome.platform') }}</p>
      </div>

      <div class="welcome-visual" aria-hidden="true">
        <div class="welcome-visual__screen">
          <div class="welcome-visual__bar"></div>
          <div class="locker-visual locker-visual--hero">
            <span v-for="cell in 24" :key="cell"></span>
          </div>
          <div class="welcome-visual__dock">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </div>
  </q-page>
</template>
