<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import StatusBadge from './StatusBadge.vue';
import type { LockerStation } from '@/types/lockerStation';

const props = defineProps<{
  station: LockerStation;
}>();

defineEmits<{
  select: [stationId: number];
}>();

const failedImageUrl = ref('');

const usableImageUrl = computed(() => {
  const imageUrl = props.station.imageUrl?.trim();

  if (!imageUrl || failedImageUrl.value === imageUrl) {
    return '';
  }

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(imageUrl, window.location.origin);
  } catch {
    return '';
  }

  if (parsedUrl.hostname === 'example.com') {
    return '';
  }

  return imageUrl;
});

const hasImage = computed(() => Boolean(usableImageUrl.value));

const cardClass = computed(() => [
  'station-card',
  `station-card--${props.station.status.toLowerCase().replaceAll('_', '-')}`,
]);

function handleImageError(): void {
  failedImageUrl.value = props.station.imageUrl?.trim() || '';
}

watch(
  () => props.station.imageUrl,
  () => {
    failedImageUrl.value = '';
  },
);
</script>

<template>
  <q-card
    :class="cardClass"
    role="button"
    tabindex="0"
    @click="$emit('select', station.id)"
    @keyup.enter="$emit('select', station.id)"
  >
    <div class="station-card__media">
      <q-img
        v-if="hasImage"
        :src="usableImageUrl"
        :ratio="16 / 10"
        fit="cover"
        spinner-color="primary"
        @error="handleImageError"
      />
      <div v-else class="locker-visual locker-visual--station" aria-hidden="true">
        <span v-for="cell in 12" :key="cell"></span>
      </div>
    </div>

    <div class="station-card__body">
      <div class="station-card__topline">
        <StatusBadge :status="station.status" domain="station" />
        <span class="station-card__model">{{ station.model }}</span>
      </div>

      <h2>{{ station.name }}</h2>
      <p>{{ station.location }}</p>

      <div class="station-card__footer">
        <span>{{ station.manufacturer }}</span>
        <q-icon name="arrow_forward" aria-hidden="true" />
      </div>
    </div>
  </q-card>
</template>
