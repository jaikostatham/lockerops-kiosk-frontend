<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import LanguageSwitcher from './LanguageSwitcher.vue';

const props = withDefaults(
  defineProps<{
    eyebrow?: string;
    title?: string;
    backTo?: string;
    showBack?: boolean;
  }>(),
  {
    eyebrow: 'LockerOps',
    title: '',
    backTo: '/',
    showBack: false,
  },
);

const { t } = useI18n();
const router = useRouter();

function goBack(): void {
  void router.push(props.backTo);
}
</script>

<template>
  <header class="app-header">
    <div class="app-header__brand">
      <q-btn
        v-if="showBack"
        flat
        round
        color="white"
        icon="arrow_back"
        class="app-header__back"
        :aria-label="t('common.back')"
        @click="goBack"
      />
      <div class="brand-mark" aria-hidden="true">
        <q-icon name="inventory_2" />
      </div>
      <div>
        <p class="app-header__eyebrow">{{ eyebrow }}</p>
        <h1 v-if="title" class="app-header__title">{{ title }}</h1>
      </div>
    </div>

    <div class="app-header__actions">
      <LanguageSwitcher />
      <div class="app-header__status">
        <span class="pulse-dot" aria-hidden="true"></span>
        {{ t('header.kioskOnline') }}
      </div>
    </div>
  </header>
</template>
