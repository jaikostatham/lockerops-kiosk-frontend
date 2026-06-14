<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  message?: string;
}>();

const { t } = useI18n();

const displayMessage = computed(
  () => props.message || t('states.loadingDefault'),
);
</script>

<template>
  <div class="state-view state-view--loading">
    <q-spinner-dots size="72px" color="primary" />
    <p>{{ displayMessage }}</p>
  </div>
</template>
