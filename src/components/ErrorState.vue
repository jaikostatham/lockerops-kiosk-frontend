<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps<{
  title?: string;
  message?: string;
  actionLabel?: string;
}>();

const { t } = useI18n();

const displayTitle = computed(() => props.title || t('states.errorTitle'));
const displayMessage = computed(
  () => props.message || t('states.errorMessage'),
);
const displayActionLabel = computed(
  () => props.actionLabel || t('common.retry'),
);

defineEmits<{
  retry: [];
}>();
</script>

<template>
  <div class="state-view state-view--error">
    <q-icon name="signal_wifi_off" size="72px" />
    <h2>{{ displayTitle }}</h2>
    <p>{{ displayMessage }}</p>
    <q-btn
      unelevated
      color="primary"
      icon="refresh"
      :label="displayActionLabel"
      class="touch-button touch-button--compact"
      @click="$emit('retry')"
    />
  </div>
</template>
