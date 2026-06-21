<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartment } from '@/api/lockerCompartmentsApi';
import { getApiErrorMessage } from '@/api/httpClient';
import { createReservation } from '@/api/reservationsApi';
import AppHeader from '@/components/AppHeader.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import type { LockerCompartment } from '@/types/lockerCompartment';
import type { KioskReservation } from '@/types/reservation';
import {
  getCompartmentSizeLabelKey,
  getCompartmentStatusLabelKey,
} from '@/utils/lockerLabels';

type LoadState = 'loading' | 'ready' | 'error';
type ReservationState = 'idle' | 'submitting' | 'success' | 'error';

const durationOptions = [30, 60, 120, 240] as const;

const route = useRoute();
const router = useRouter();
const { locale, t } = useI18n();
const compartment = ref<LockerCompartment | null>(null);
const loadState = ref<LoadState>('loading');
const errorMessage = ref('');
const selectedDuration = ref<number>(60);
const reservationState = ref<ReservationState>('idle');
const reservationErrorMessage = ref('');
const reservation = ref<KioskReservation | null>(null);

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
const isAvailable = computed(
  () => compartment.value?.status === 'AVAILABLE',
);
const canCreateReservation = computed(
  () => isAvailable.value && reservationState.value !== 'submitting',
);

async function loadCompartment(): Promise<void> {
  if (!Number.isFinite(compartmentId.value) || compartmentId.value <= 0) {
    errorMessage.value = t('detail.invalidRoute');
    loadState.value = 'error';
    return;
  }

  loadState.value = 'loading';
  errorMessage.value = '';
  reservationState.value = 'idle';
  reservationErrorMessage.value = '';
  reservation.value = null;

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

function openAccessCodeScreen(): void {
  void router.push({
    name: 'access-code',
    query: {
      ticketCode: reservation.value?.ticketCode || undefined,
      accessCode: reservation.value?.accessCode || undefined,
    },
  });
}

function buildCustomerReference(): string {
  const randomValue =
    window.crypto.randomUUID?.() || Math.random().toString(36).slice(2);

  return `KIOSK-SESSION-${randomValue.slice(0, 8).toUpperCase()}`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

async function confirmReservation(): Promise<void> {
  if (!compartment.value || !canCreateReservation.value) {
    return;
  }

  reservationState.value = 'submitting';
  reservationErrorMessage.value = '';

  try {
    reservation.value = await createReservation({
      lockerCompartmentId: compartment.value.id,
      durationMinutes: selectedDuration.value,
      customerReference: buildCustomerReference(),
    });
    compartment.value = {
      ...compartment.value,
      status: 'RESERVED',
    };
    reservationState.value = 'success';
  } catch (error) {
    reservationErrorMessage.value = getApiErrorMessage(error, {
      400: t('reservation.errors.invalidRequest'),
      404: t('reservation.errors.notFound'),
      409: t('reservation.errors.conflict'),
    });
    reservationState.value = 'error';
  }
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

          <section
            v-if="reservationState === 'success' && reservation"
            class="reservation-panel reservation-panel--success"
            aria-live="polite"
          >
            <p class="screen-kicker">{{ t('reservation.successKicker') }}</p>
            <h3>{{ t('reservation.successTitle') }}</h3>
            <div class="reservation-grid">
              <div>
                <span>{{ t('reservation.id') }}</span>
                <strong>{{ reservation.reservationId }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reference') }}</span>
                <strong>{{ reservation.reservationReference }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.ticketCode') }}</span>
                <strong class="reservation-grid__code">
                  {{ reservation.ticketCode }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.accessCode') }}</span>
                <strong class="reservation-grid__access-code">
                  {{ reservation.accessCode }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.lockerNumber') }}</span>
                <strong>{{ reservation.compartmentNumber }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.status') }}</span>
                <strong>
                  {{ t(`reservationStatuses.${reservation.reservationStatus}`) }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.reservedFrom') }}</span>
                <strong>{{ formatDateTime(reservation.reservedFrom) }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reservedUntil') }}</span>
                <strong>{{ formatDateTime(reservation.reservedUntil) }}</strong>
              </div>
              <div v-if="reservation.customerReference">
                <span>{{ t('reservation.customerReference') }}</span>
                <strong>{{ reservation.customerReference }}</strong>
              </div>
            </div>
          </section>

          <section v-else class="reservation-panel">
            <div>
              <p class="screen-kicker">{{ t('reservation.kicker') }}</p>
              <h3>{{ t('reservation.title') }}</h3>
              <p class="reservation-panel__message">
                {{
                  isAvailable
                    ? t('reservation.instructions')
                    : t('reservation.unavailableMessage')
                }}
              </p>
            </div>

            <div
              class="duration-picker"
              role="group"
              :aria-label="t('reservation.durationAria')"
            >
              <q-btn
                v-for="duration in durationOptions"
                :key="duration"
                unelevated
                no-caps
                :disable="!isAvailable || reservationState === 'submitting'"
                :class="[
                  'duration-picker__button',
                  {
                    'duration-picker__button--active':
                      selectedDuration === duration,
                  },
                ]"
                @click="selectedDuration = duration"
              >
                <strong>{{ duration }}</strong>
                <span>{{ t('reservation.minutes') }}</span>
              </q-btn>
            </div>

            <p
              v-if="reservationState === 'error'"
              class="reservation-panel__error"
              role="alert"
            >
              {{ reservationErrorMessage }}
            </p>
          </section>

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
              v-if="reservationState === 'success'"
              unelevated
              color="primary"
              icon-right="password"
              :label="t('accessCode.openValidation')"
              class="touch-button touch-button--primary"
              @click="openAccessCodeScreen"
            />
            <q-btn
              v-else
              unelevated
              color="primary"
              icon-right="event_available"
              :label="
                reservationState === 'submitting'
                  ? t('reservation.confirming')
                  : t('reservation.confirm')
              "
              :disable="!canCreateReservation"
              :loading="reservationState === 'submitting'"
              class="touch-button touch-button--primary"
              @click="confirmReservation"
            />
          </div>
        </div>
      </section>
    </main>
  </q-page>
</template>
