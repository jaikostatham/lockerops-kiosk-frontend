<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartment } from '@/api/lockerCompartmentsApi';
import { getApiErrorMessage } from '@/api/httpClient';
import { createReservation } from '@/api/reservationsApi';
import AppHeader from '@/components/AppHeader.vue';
import { RESERVATION_FLOW_ENABLED } from '@/config/apiConfig';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import type { LockerCompartment } from '@/types/lockerCompartment';
import type { KioskReservation } from '@/types/reservation';
import {
  getCompartmentSizeLabelKey,
  getCompartmentStatusLabelKey,
} from '@/utils/lockerLabels';
import { isPastDateTime } from '@/utils/dateTime';

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
const currentTimestamp = ref(Date.now());
let currentTimeIntervalId: number | undefined;

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
  () =>
    RESERVATION_FLOW_ENABLED &&
    isAvailable.value &&
    reservationState.value !== 'submitting',
);
const displayedReservationStatus = computed(() => {
  if (!reservation.value) {
    return null;
  }

  if (
    reservation.value.reservationStatus === 'EXPIRED' ||
    isPastDateTime(reservation.value.reservedUntil, currentTimestamp.value)
  ) {
    return 'EXPIRED';
  }

  return reservation.value.reservationStatus;
});
const isReservationExpired = computed(
  () => displayedReservationStatus.value === 'EXPIRED',
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

async function refreshCompartment(): Promise<void> {
  if (!Number.isFinite(compartmentId.value) || compartmentId.value <= 0) {
    return;
  }

  try {
    compartment.value = await getLockerCompartment(compartmentId.value);
  } catch {
    // Keep the current screen stable; explicit loading errors are handled by loadCompartment.
  }
}

function refreshActiveCompartment(): void {
  if (loadState.value === 'ready') {
    void refreshCompartment();
  }
}

function handleVisibilityChange(): void {
  if (!document.hidden) {
    refreshActiveCompartment();
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
  currentTimeIntervalId = window.setInterval(() => {
    currentTimestamp.value = Date.now();
  }, 15000);
  window.addEventListener('focus', refreshActiveCompartment);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  if (currentTimeIntervalId) {
    window.clearInterval(currentTimeIntervalId);
  }

  window.removeEventListener('focus', refreshActiveCompartment);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

watch(isReservationExpired, (expired) => {
  if (expired) {
    void refreshCompartment();
  }
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
            :class="[
              'reservation-panel',
              isReservationExpired
                ? 'reservation-panel--expired'
                : 'reservation-panel--success',
            ]"
            aria-live="polite"
          >
            <p class="screen-kicker">
              {{
                isReservationExpired
                  ? t('reservation.expiredKicker')
                  : t('reservation.successKicker')
              }}
            </p>
            <h3>
              {{
                isReservationExpired
                  ? t('reservation.expiredTitle')
                  : t('reservation.successTitle')
              }}
            </h3>
            <p v-if="isReservationExpired" class="reservation-panel__message">
              {{ t('reservation.expiredMessage') }}
            </p>
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
                <strong
                  :class="{
                    'reservation-grid__status--expired': isReservationExpired,
                  }"
                >
                  {{ t(`reservationStatuses.${displayedReservationStatus}`) }}
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

          <section v-else-if="!RESERVATION_FLOW_ENABLED" class="reservation-panel">
            <div>
              <p class="screen-kicker">{{ t('reservation.kicker') }}</p>
              <h3>{{ t('reservation.readOnlyTitle') }}</h3>
              <p class="reservation-panel__message">
                {{ t('reservation.readOnlyMessage') }}
              </p>
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
              v-if="RESERVATION_FLOW_ENABLED && reservationState === 'success'"
              unelevated
              color="primary"
              icon-right="password"
              :label="t('accessCode.openValidation')"
              :disable="isReservationExpired"
              class="touch-button touch-button--primary"
              @click="openAccessCodeScreen"
            />
            <q-btn
              v-else-if="RESERVATION_FLOW_ENABLED"
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
