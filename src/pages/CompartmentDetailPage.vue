<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartment } from '@/api/lockerCompartmentsApi';
import {
  getApiErrorCode,
  getApiErrorMessage,
} from '@/api/httpClient';
import { simulatePayment } from '@/api/paymentsApi';
import { createReservation } from '@/api/reservationsApi';
import AppHeader from '@/components/AppHeader.vue';
import ErrorState from '@/components/ErrorState.vue';
import LoadingState from '@/components/LoadingState.vue';
import StatusBadge from '@/components/StatusBadge.vue';
import { RESERVATION_FLOW_ENABLED } from '@/config/apiConfig';
import type { LockerCompartment } from '@/types/lockerCompartment';
import type {
  PaymentStatus,
  SimulatedPaymentResponse,
} from '@/types/payment';
import type {
  Reservation,
  ReservationStatus,
  ReservationTicket,
} from '@/types/reservation';
import { isPastDateTime } from '@/utils/dateTime';
import {
  getCompartmentSizeLabelKey,
  getCompartmentStatusLabelKey,
} from '@/utils/lockerLabels';

type LoadState = 'loading' | 'ready' | 'error';
type ReservationState =
  | 'idle'
  | 'submitting'
  | 'pendingPayment'
  | 'confirmed'
  | 'error';
type PaymentState = 'idle' | 'processing' | 'declined' | 'error';

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
const reservation = ref<Reservation | null>(null);
const paymentState = ref<PaymentState>('idle');
const paymentErrorMessage = ref('');
const payment = ref<SimulatedPaymentResponse | null>(null);
const processingOutcome = ref<PaymentStatus | null>(null);
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
    !reservation.value &&
    reservationState.value !== 'submitting',
);
const ticket = computed<ReservationTicket | null>(
  () => payment.value?.ticket ?? null,
);
const isPendingPayment = computed(
  () =>
    reservation.value?.status === 'PENDING_PAYMENT' &&
    reservationState.value === 'pendingPayment',
);
const isPaymentWindowExpired = computed(() => {
  const paymentExpiresAt = reservation.value?.paymentExpiresAt;

  if (
    reservationState.value === 'pendingPayment' &&
    reservation.value?.status === 'EXPIRED'
  ) {
    return true;
  }

  return Boolean(
    isPendingPayment.value &&
      paymentExpiresAt &&
      isPastDateTime(paymentExpiresAt, currentTimestamp.value),
  );
});
const displayedReservationStatus = computed<ReservationStatus | null>(() => {
  if (isPaymentWindowExpired.value) {
    return 'EXPIRED';
  }

  if (
    ticket.value &&
    isPastDateTime(ticket.value.reservedUntil, currentTimestamp.value)
  ) {
    return 'EXPIRED';
  }

  return payment.value?.reservationStatus ?? reservation.value?.status ?? null;
});
const isReservationExpired = computed(
  () => displayedReservationStatus.value === 'EXPIRED',
);
const canSimulatePayment = computed(
  () =>
    isPendingPayment.value &&
    !isPaymentWindowExpired.value &&
    paymentState.value !== 'processing',
);
const paymentTimeRemaining = computed(() => {
  const paymentExpiresAt = reservation.value?.paymentExpiresAt;

  if (!paymentExpiresAt) {
    return '';
  }

  const expiresAt = new Date(paymentExpiresAt).getTime();

  if (Number.isNaN(expiresAt)) {
    return '';
  }

  const remainingSeconds = Math.max(
    0,
    Math.ceil((expiresAt - currentTimestamp.value) / 1000),
  );
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

async function loadCompartment(): Promise<void> {
  if (!Number.isFinite(compartmentId.value) || compartmentId.value <= 0) {
    errorMessage.value = t('detail.invalidRoute');
    loadState.value = 'error';
    return;
  }

  loadState.value = 'loading';
  errorMessage.value = '';
  resetReservationFlow();

  try {
    compartment.value = await getLockerCompartment(compartmentId.value);
    loadState.value = 'ready';
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error);
    loadState.value = 'error';
  }
}

function resetReservationFlow(): void {
  reservationState.value = 'idle';
  reservationErrorMessage.value = '';
  reservation.value = null;
  paymentState.value = 'idle';
  paymentErrorMessage.value = '';
  payment.value = null;
  processingOutcome.value = null;
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
      ticketCode: ticket.value?.ticketCode || undefined,
      accessCode: ticket.value?.accessCode || undefined,
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

function formatMoney(amountMinor: number, currency: string): string {
  return new Intl.NumberFormat(locale.value === 'es' ? 'es-ES' : 'en-US', {
    style: 'currency',
    currency,
  }).format(amountMinor / 100);
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
    reservationState.value = 'pendingPayment';
  } catch (error) {
    reservationErrorMessage.value = getApiErrorMessage(error, {
      400: t('reservation.errors.invalidRequest'),
      404: t('reservation.errors.notFound'),
      409: t('reservation.errors.conflict'),
    });
    reservationState.value = 'error';
  }
}

async function processSimulatedPayment(outcome: PaymentStatus): Promise<void> {
  if (!reservation.value || !canSimulatePayment.value) {
    return;
  }

  paymentState.value = 'processing';
  processingOutcome.value = outcome;
  paymentErrorMessage.value = '';

  try {
    const result = await simulatePayment({
      reservationReference: reservation.value.reservationReference,
      outcome,
    });

    payment.value = result;

    if (result.paymentStatus === 'DECLINED') {
      paymentState.value = 'declined';
      return;
    }

    if (!result.ticket) {
      paymentState.value = 'error';
      paymentErrorMessage.value = t('payment.errors.missingTicket');
      return;
    }

    reservation.value = {
      ...reservation.value,
      status: result.reservationStatus,
      reservedFrom: result.ticket.reservedFrom,
      reservedUntil: result.ticket.reservedUntil,
    };
    paymentState.value = 'idle';
    reservationState.value = 'confirmed';
  } catch (error) {
    const errorCode = getApiErrorCode(error);

    if (String(errorCode) === '6002') {
      paymentErrorMessage.value = t('payment.errors.expired');
      reservation.value = {
        ...reservation.value,
        status: 'EXPIRED',
      };
    } else if (String(errorCode) === '6001') {
      paymentErrorMessage.value = t('payment.errors.notPending');
    } else {
      paymentErrorMessage.value = getApiErrorMessage(error, {
        400: t('payment.errors.invalidRequest'),
        404: t('payment.errors.notFound'),
        409: t('payment.errors.conflict'),
      });
    }

    paymentState.value = 'error';
  } finally {
    processingOutcome.value = null;
  }
}

onMounted(() => {
  void loadCompartment();
  currentTimeIntervalId = window.setInterval(() => {
    currentTimestamp.value = Date.now();
  }, 1000);
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
            v-if="reservationState === 'confirmed' && ticket"
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
                <strong>{{ ticket.reservationId }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reference') }}</span>
                <strong>{{ ticket.reservationReference }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.ticketCode') }}</span>
                <strong class="reservation-grid__code">
                  {{ ticket.ticketCode }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.accessCode') }}</span>
                <strong class="reservation-grid__access-code">
                  {{ ticket.accessCode }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.lockerNumber') }}</span>
                <strong>{{ ticket.compartmentNumber }}</strong>
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
                <strong>{{ formatDateTime(ticket.reservedFrom) }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reservedUntil') }}</span>
                <strong>{{ formatDateTime(ticket.reservedUntil) }}</strong>
              </div>
              <div v-if="ticket.customerReference">
                <span>{{ t('reservation.customerReference') }}</span>
                <strong>{{ ticket.customerReference }}</strong>
              </div>
            </div>
          </section>

          <section
            v-else-if="reservation && reservationState === 'pendingPayment'"
            :class="[
              'reservation-panel',
              isPaymentWindowExpired
                ? 'reservation-panel--expired'
                : paymentState === 'declined'
                  ? 'reservation-panel--declined'
                  : 'reservation-panel--payment',
            ]"
            aria-live="polite"
          >
            <p class="screen-kicker">{{ t('payment.kicker') }}</p>
            <h3>
              {{
                isPaymentWindowExpired
                  ? t('payment.expiredTitle')
                  : paymentState === 'declined'
                    ? t('payment.declinedTitle')
                    : t('payment.title')
              }}
            </h3>
            <p class="reservation-panel__message">
              {{
                isPaymentWindowExpired
                  ? t('payment.expiredMessage')
                  : paymentState === 'declined'
                    ? t('payment.declinedMessage')
                    : t('payment.instructions')
              }}
            </p>

            <div class="reservation-grid">
              <div>
                <span>{{ t('reservation.id') }}</span>
                <strong>{{ reservation.id }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reference') }}</span>
                <strong>{{ reservation.reservationReference }}</strong>
              </div>
              <div>
                <span>{{ t('payment.amount') }}</span>
                <strong class="reservation-grid__price">
                  {{ formatMoney(reservation.amountMinor, reservation.currency) }}
                </strong>
              </div>
              <div>
                <span>{{ t('reservation.status') }}</span>
                <strong
                  :class="{
                    'reservation-grid__status--expired': isPaymentWindowExpired,
                  }"
                >
                  {{ t(`reservationStatuses.${displayedReservationStatus}`) }}
                </strong>
              </div>
              <div v-if="reservation.paymentExpiresAt">
                <span>{{ t('payment.deadline') }}</span>
                <strong>{{ formatDateTime(reservation.paymentExpiresAt) }}</strong>
              </div>
              <div v-if="paymentTimeRemaining && !isPaymentWindowExpired">
                <span>{{ t('payment.timeRemaining') }}</span>
                <strong class="reservation-grid__countdown">
                  {{ paymentTimeRemaining }}
                </strong>
              </div>
              <div v-if="payment">
                <span>{{ t('payment.reference') }}</span>
                <strong>{{ payment.paymentReference }}</strong>
              </div>
            </div>

            <p
              v-if="paymentState === 'error'"
              class="reservation-panel__error"
              role="alert"
            >
              {{ paymentErrorMessage }}
            </p>
          </section>

          <section
            v-else-if="!RESERVATION_FLOW_ENABLED"
            class="reservation-panel"
          >
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
              v-if="
                RESERVATION_FLOW_ENABLED &&
                reservationState === 'confirmed' &&
                ticket
              "
              unelevated
              color="primary"
              icon-right="password"
              :label="t('accessCode.openValidation')"
              :disable="isReservationExpired"
              class="touch-button touch-button--primary"
              @click="openAccessCodeScreen"
            />
            <template
              v-else-if="
                RESERVATION_FLOW_ENABLED &&
                reservationState === 'pendingPayment' &&
                reservation &&
                !isPaymentWindowExpired
              "
            >
              <q-btn
                outline
                color="negative"
                icon="credit_card_off"
                :label="t('payment.decline')"
                :disable="!canSimulatePayment"
                :loading="processingOutcome === 'DECLINED'"
                class="touch-button touch-button--secondary"
                @click="processSimulatedPayment('DECLINED')"
              />
              <q-btn
                unelevated
                color="primary"
                icon-right="credit_card"
                :label="t('payment.approve')"
                :disable="!canSimulatePayment"
                :loading="processingOutcome === 'APPROVED'"
                class="touch-button touch-button--primary"
                @click="processSimulatedPayment('APPROVED')"
              />
            </template>
            <q-btn
              v-else-if="RESERVATION_FLOW_ENABLED && !reservation"
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
