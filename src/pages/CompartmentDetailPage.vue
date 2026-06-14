<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartment } from '@/api/lockerCompartmentsApi';
import { getApiErrorMessage } from '@/api/httpClient';
import AppHeader from '@/components/AppHeader.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import type { LockerCompartment } from '@/types/lockerCompartment';
import {
  getCompartmentSizeLabelKey,
  getCompartmentStatusLabelKey,
} from '@/utils/lockerLabels';

type LoadState = 'loading' | 'ready' | 'error';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const compartment = ref<LockerCompartment | null>(null);
const loadState = ref<LoadState>('loading');
const errorMessage = ref('');

const compartmentId = computed(() => Number(route.params.compartmentId));
const title = computed(() =>
  compartment.value
    ? t('detail.titleWithNumber', {
        number: compartment.value.compartmentNumber,
      })
    : t('detail.fallbackTitle'),
);
const sizeLabel = computed(() =>
  compartment.value ? t(getCompartmentSizeLabelKey(compartment.value.size)) : '',
);
const statusLabel = computed(() =>
  compartment.value
    ? t(getCompartmentStatusLabelKey(compartment.value.status))
    : '',
);
const backTo = computed(() =>
  compartment.value
    ? `/stations/${compartment.value.lockerStationId}/compartments`
    : '/stations',
);

async function loadCompartment(): Promise<void> {
  if (!Number.isFinite(compartmentId.value) || compartmentId.value <= 0) {
    errorMessage.value = t('detail.invalidRoute');
    loadState.value = 'error';
    return;
  }

  loadState.value = 'loading';
  errorMessage.value = '';

  try {
    compartment.value = await getLockerCompartment(compartmentId.value);
    loadState.value = 'ready';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
    loadState.value = 'error';
  }
}

function goBack(): void {
  void router.push(backTo.value);
}

onMounted(() => {
  void loadCompartment();
});
</script>

<template>
  <q-page class="kiosk-page detail-page">
    <AppHeader :title="title" show-back :back-to="backTo" />

    <main class="screen-content screen-content--center">
      <LoadingState
        v-if="loadState === 'loading'"
        :message="t('detail.loading')"
      />

      <ErrorState
        v-else-if="loadState === 'error'"
        :message="errorMessage"
        @retry="loadCompartment"
      />

      <section v-else-if="compartment" class="detail-board">
        <div class="detail-board__number">
          {{ compartment.compartmentNumber }}
        </div>

        <div class="detail-board__content">
          <p class="screen-kicker">{{ t('detail.kicker') }}</p>
          <h2>{{ title }}</h2>

          <div class="detail-grid">
            <div>
              <span>{{ t('detail.size') }}</span>
              <strong>{{ sizeLabel }}</strong>
            </div>
            <div>
              <span>{{ t('detail.status') }}</span>
              <strong>{{ statusLabel }}</strong>
            </div>
            <div>
              <span>{{ t('detail.stationId') }}</span>
              <strong>{{ compartment.lockerStationId }}</strong>
            </div>
          </div>

          <StatusBadge :status="compartment.status" domain="compartment" />

          <p class="detail-board__message">
            {{ t('detail.futureMessage') }}
          </p>

          <div class="detail-board__actions">
            <q-btn
              outline
              color="white"
              icon="arrow_back"
              :label="t('common.back')"
              class="touch-button touch-button--secondary"
              @click="goBack"
            />
            <q-btn
              unelevated
              color="primary"
              icon-right="lock"
              :label="t('common.continue')"
              disable
              class="touch-button touch-button--primary"
            />
          </div>
        </div>
      </section>
    </main>
  </q-page>
</template>
