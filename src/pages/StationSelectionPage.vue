<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';

import { getApiErrorMessage } from '@/api/httpClient';
import { getLockerStations } from '@/api/lockerStationsApi';
import AppHeader from '@/components/AppHeader.vue';
import EmptyState from '@/components/EmptyState.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StationCard from '@/components/StationCard.vue';
import type { LockerStation } from '@/types/lockerStation';

type LoadState = 'loading' | 'ready' | 'error';

const router = useRouter();
const { t } = useI18n();
const stations = ref<LockerStation[]>([]);
const loadState = ref<LoadState>('loading');
const errorMessage = ref('');

async function loadStations(): Promise<void> {
  loadState.value = 'loading';
  errorMessage.value = '';

  try {
    stations.value = await getLockerStations();
    loadState.value = 'ready';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
    loadState.value = 'error';
  }
}

function openStation(stationId: number): void {
  void router.push({
    name: 'compartments',
    params: { stationId },
  });
}

onMounted(() => {
  void loadStations();
});
</script>

<template>
  <q-page class="kiosk-page station-page">
    <AppHeader :title="t('stations.title')" show-back back-to="/" />

    <main class="screen-content">
      <LoadingState
        v-if="loadState === 'loading'"
        :message="t('stations.loading')"
      />

      <ErrorState
        v-else-if="loadState === 'error'"
        :message="errorMessage"
        @retry="loadStations"
      />

      <EmptyState
        v-else-if="stations.length === 0"
        :title="t('stations.emptyTitle')"
        :message="t('stations.emptyMessage')"
        :action-label="t('common.back')"
        @action="router.push('/')"
      />

      <section v-else class="station-grid" :aria-label="t('stations.gridAria')">
        <StationCard
          v-for="station in stations"
          :key="station.id"
          :station="station"
          @select="openStation"
        />
      </section>
    </main>
  </q-page>
</template>
