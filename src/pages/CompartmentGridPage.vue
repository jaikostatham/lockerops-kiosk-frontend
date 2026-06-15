<script setup lang="ts">
import { Notify } from 'quasar';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartmentsByStationId } from '@/api/lockerCompartmentsApi';
import { getApiErrorMessage } from '@/api/httpClient';
import { getLockerStation } from '@/api/lockerStationsApi';
import AppHeader from '@/components/AppHeader.vue';
import CompartmentCard from '@/components/CompartmentCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import type { LockerCompartment } from '@/types/lockerCompartment';
import type { LockerStation } from '@/types/lockerStation';
import { getCompartmentStatusLabelKey } from '@/utils/lockerLabels';

type LoadState = 'loading' | 'ready' | 'error';

const compartmentSizeOrder: Record<LockerCompartment['size'], number> = {
  SMALL: 0,
  MEDIUM: 1,
  LARGE: 2,
  EXTRA_LARGE: 3,
};

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const station = ref<LockerStation | null>(null);
const compartments = ref<LockerCompartment[]>([]);
const loadState = ref<LoadState>('loading');
const errorMessage = ref('');

const stationId = computed(() => Number(route.params.stationId));
const stationTitle = computed(
  () =>
    station.value?.name ||
    t('compartments.fallbackStationName', { id: stationId.value }),
);
const availableCount = computed(
  () => compartments.value.filter((item) => item.status === 'AVAILABLE').length,
);
const totalCount = computed(() => compartments.value.length);
const hasDuplicateCompartmentNumbers = computed(() => {
  const numbers = compartments.value.map((item) => item.compartmentNumber);

  return new Set(numbers).size !== numbers.length;
});

function sortCompartmentsBySize(
  compartmentItems: LockerCompartment[],
): LockerCompartment[] {
  return [...compartmentItems].sort((first, second) => {
    const sizeDifference =
      compartmentSizeOrder[first.size] - compartmentSizeOrder[second.size];

    if (sizeDifference !== 0) {
      return sizeDifference;
    }

    return first.compartmentNumber - second.compartmentNumber;
  });
}

async function loadCompartments(): Promise<void> {
  if (!Number.isFinite(stationId.value) || stationId.value <= 0) {
    errorMessage.value = t('compartments.invalidRoute');
    loadState.value = 'error';
    return;
  }

  loadState.value = 'loading';
  errorMessage.value = '';

  try {
    const [stationResult, compartmentResult] = await Promise.all([
      getLockerStation(stationId.value).catch(() => null),
      getLockerCompartmentsByStationId(stationId.value),
    ]);

    station.value = stationResult;
    compartments.value = sortCompartmentsBySize(compartmentResult);
    loadState.value = 'ready';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
    loadState.value = 'error';
  }
}

function openCompartment(compartmentId: number): void {
  void router.push({
    name: 'compartment-detail',
    params: { compartmentId },
  });
}

function showBlockedFeedback(compartment: LockerCompartment): void {
  const statusLabel = t(getCompartmentStatusLabelKey(compartment.status));

  Notify.create({
    type: 'warning',
    icon: 'lock',
    message: t('compartments.blockedMessage', { status: statusLabel }),
    caption: t('compartments.blockedCaption'),
  });
}

onMounted(() => {
  void loadCompartments();
});
</script>

<template>
  <q-page class="kiosk-page compartment-page">
    <AppHeader :title="stationTitle" show-back back-to="/stations" />

    <main class="screen-content">
      <LoadingState
        v-if="loadState === 'loading'"
        :message="t('compartments.loading')"
      />

      <ErrorState
        v-else-if="loadState === 'error'"
        :message="errorMessage"
        @retry="loadCompartments"
      />

      <template v-else>
        <section
          class="screen-summary"
          :aria-label="t('compartments.availabilityAria')"
        >
          <div>
            <p class="screen-kicker">{{ t('compartments.kicker') }}</p>
            <h2>{{ stationTitle }}</h2>
          </div>
          <div class="summary-pills">
            <span>
              <strong>{{ availableCount }}</strong>
              {{ t('compartments.available') }}
            </span>
            <span>
              <strong>{{ totalCount }}</strong>
              {{ t('compartments.total') }}
            </span>
          </div>
        </section>

        <EmptyState
          v-if="compartments.length === 0"
          :title="t('compartments.emptyTitle')"
          :message="t('compartments.emptyMessage')"
          :action-label="t('common.back')"
          @action="router.push('/stations')"
        />

        <section
          v-else
          class="compartment-grid"
          :aria-label="t('compartments.gridAria')"
        >
          <CompartmentCard
            v-for="(compartment, index) in compartments"
            :key="compartment.id"
            :compartment="compartment"
            :display-number="
              hasDuplicateCompartmentNumbers
                ? index + 1
                : compartment.compartmentNumber
            "
            @select="openCompartment"
            @blocked="showBlockedFeedback"
          />
        </section>
      </template>
    </main>
  </q-page>
</template>
