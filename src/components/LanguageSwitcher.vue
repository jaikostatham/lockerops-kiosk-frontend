<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import englishFlag from '@/assets/flags/en.svg';
import spanishFlag from '@/assets/flags/es.svg';
import {
  setDocumentLocale,
  setStoredLocale,
  supportedLocaleOptions,
  type SupportedLocale,
} from '@/i18n';

const { locale, t } = useI18n();

const flagByLocale: Record<
  SupportedLocale,
  { src: string; altKey: 'language.spanishFlagAlt' | 'language.englishFlagAlt' }
> = {
  es: { src: spanishFlag, altKey: 'language.spanishFlagAlt' },
  en: { src: englishFlag, altKey: 'language.englishFlagAlt' },
};

const localeOptions = supportedLocaleOptions.map((option) => ({
  ...option,
  flag: flagByLocale[option.code],
}));

const currentLocale = computed(() => locale.value as SupportedLocale);

function selectLocale(nextLocale: SupportedLocale): void {
  locale.value = nextLocale;
  setStoredLocale(nextLocale);
  setDocumentLocale(nextLocale);
}
</script>

<template>
  <div class="language-switcher" role="group" :aria-label="t('language.ariaLabel')">
    <q-btn
      v-for="option in localeOptions"
      :key="option.code"
      flat
      no-caps
      :aria-label="t(option.ariaKey)"
      :class="[
        'language-switcher__button',
        { 'language-switcher__button--active': currentLocale === option.code },
      ]"
      @click="selectLocale(option.code)"
    >
      <span class="language-switcher__content">
        <img
          :src="option.flag.src"
          :alt="t(option.flag.altKey)"
          class="language-switcher__flag"
        />
        <span>{{ option.label }}</span>
      </span>
    </q-btn>
  </div>
</template>
