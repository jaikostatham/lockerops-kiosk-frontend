<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';

import StatusBadge from './StatusBadge.vue';
import type { LockerCompartment } from '@/types/lockerCompartment';
import { getCompartmentSizeLabelKey } from '@/utils/lockerLabels';

const props = defineProps<{
  compartment: LockerCompartment;
  displayNumber?: number;
}>();

const emit = defineEmits<{
  select: [compartmentId: number];
  blocked: [compartment: LockerCompartment];
}>();

const { t } = useI18n();
const blockedFlash = ref(false);
const isAvailable = computed(() => props.compartment.status === 'AVAILABLE');
const displayCompartmentNumber = computed(
  () => props.displayNumber ?? props.compartment.compartmentNumber,
);
const sizeLabel = computed(() =>
  t(getCompartmentSizeLabelKey(props.compartment.size)),
);
const cardClass = computed(() => [
  'compartment-card',
  `compartment-card--${props.compartment.status.toLowerCase().replaceAll('_', '-')}`,
  {
    'compartment-card--flash': blockedFlash.value,
    'compartment-card--selectable': isAvailable.value,
  },
]);

function handlePress(): void {
  if (isAvailable.value) {
    emit('select', props.compartment.id);
    return;
  }

  blockedFlash.value = true;
  emit('blocked', props.compartment);

  window.setTimeout(() => {
    blockedFlash.value = false;
  }, 360);
}
</script>

<template>
  <q-card
    :class="cardClass"
    role="button"
    tabindex="0"
    :aria-disabled="!isAvailable"
    @click="handlePress"
    @keyup.enter="handlePress"
  >
    <div class="compartment-card__door" aria-hidden="true">
      <span></span>
    </div>

    <div class="compartment-card__content">
      <span class="compartment-card__number">
        {{ displayCompartmentNumber }}
      </span>
      <span class="compartment-card__size">{{ sizeLabel }}</span>
      <StatusBadge :status="compartment.status" domain="compartment" />
    </div>
  </q-card>
</template>
