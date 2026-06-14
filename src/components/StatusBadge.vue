<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

import {
  getCompartmentStatusLabelKey,
  getStationStatusLabelKey,
} from '@/utils/lockerLabels';
import type { LockerCompartmentStatus } from '@/types/lockerCompartment';
import type { LockerStationStatus } from '@/types/lockerStation';

const props = defineProps<{
  status: LockerStationStatus | LockerCompartmentStatus;
  domain: 'station' | 'compartment';
}>();

const { t } = useI18n();

const label = computed(() => {
  if (props.domain === 'station') {
    return t(getStationStatusLabelKey(props.status as LockerStationStatus));
  }

  return t(
    getCompartmentStatusLabelKey(props.status as LockerCompartmentStatus),
  );
});

const badgeClass = computed(() => [
  'status-badge',
  `status-badge--${props.status.toLowerCase().replaceAll('_', '-')}`,
]);
</script>

<template>
  <span :class="badgeClass">
    <span class="status-badge__light" aria-hidden="true"></span>
    {{ label }}
  </span>
</template>
