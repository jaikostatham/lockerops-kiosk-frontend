<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';

import { getLockerCompartment } from '@/api/lockerCompartmentsApi';
import { validateAccessCode } from '@/api/accessCodesApi';
import { getApiErrorCode, getApiErrorMessage } from '@/api/httpClient';
import AppHeader from '@/components/AppHeader.vue';
import type { AccessCodeValidationResult } from '@/types/accessCode';
import type { LockerCompartment } from '@/types/lockerCompartment';
import { isPastDateTime } from '@/utils/dateTime';

type ValidationState = 'idle' | 'submitting' | 'success' | 'error';

const route = useRoute();
const router = useRouter();
const { locale, t } = useI18n();

const ticketCode = ref(String(route.query.ticketCode || ''));
const accessCode = ref(String(route.query.accessCode || ''));
const validationState = ref<ValidationState>('idle');
const validationErrorMessage = ref('');
const validationResult = ref<AccessCodeValidationResult | null>(null);
const validatedCompartment = ref<LockerCompartment | null>(null);
const currentTimestamp = ref(Date.now());
let currentTimeIntervalId: number | undefined;

const normalizedTicketCode = computed(() => ticketCode.value.trim());
const normalizedAccessCode = computed(() => accessCode.value.trim());
const canValidate = computed(
  () =>
    normalizedTicketCode.value.length > 0 &&
    normalizedAccessCode.value.length > 0 &&
    validationState.value !== 'submitting',
);
const isValidationExpired = computed(
  () =>
    validationResult.value !== null &&
    isPastDateTime(validationResult.value.reservedUntil, currentTimestamp.value),
);

function goHome(): void {
  void router.push('/');
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

async function submitCode(): Promise<void> {
  if (!canValidate.value) {
    return;
  }

  validationState.value = 'submitting';
  validationErrorMessage.value = '';
  validationResult.value = null;
  validatedCompartment.value = null;

  try {
    const result = await validateAccessCode({
      ticketCode: normalizedTicketCode.value,
      accessCode: normalizedAccessCode.value,
    });

    validationResult.value = result;

    try {
      validatedCompartment.value = await getLockerCompartment(
        result.lockerCompartmentId,
      );
    } catch {
      validatedCompartment.value = null;
    }

    validationState.value = 'success';
  } catch (error) {
    validationErrorMessage.value =
      String(getApiErrorCode(error)) === '5102'
        ? t('accessCode.errors.expired')
        : getApiErrorMessage(error);
    validationState.value = 'error';
  }
}

onMounted(() => {
  currentTimeIntervalId = window.setInterval(() => {
    currentTimestamp.value = Date.now();
  }, 15000);
});

onBeforeUnmount(() => {
  if (currentTimeIntervalId) {
    window.clearInterval(currentTimeIntervalId);
  }
});
</script>

<template>
  <q-page class="kiosk-page access-page">
    <AppHeader :title="t('accessCode.title')" show-back back-to="/" />

    <main class="screen-content screen-content--center">
      <section class="access-board">
        <div class="access-board__visual" aria-hidden="true">
          <q-icon name="password" />
        </div>

        <div class="access-board__content">
          <p class="screen-kicker">{{ t('accessCode.kicker') }}</p>
          <h2>{{ t('accessCode.heading') }}</h2>
          <p class="access-board__message">
            {{ t('accessCode.instructions') }}
          </p>

          <form class="access-form" @submit.prevent="submitCode">
            <q-input
              v-model="ticketCode"
              dark
              outlined
              autofocus
              input-class="access-form__input"
              :label="t('accessCode.ticketInputLabel')"
              :disable="validationState === 'submitting'"
            />

            <q-input
              v-model="accessCode"
              dark
              outlined
              input-class="access-form__input"
              :label="t('accessCode.accessInputLabel')"
              :disable="validationState === 'submitting'"
            />

            <q-btn
              unelevated
              color="primary"
              icon-right="login"
              type="submit"
              :label="
                validationState === 'submitting'
                  ? t('accessCode.validating')
                  : t('accessCode.validate')
              "
              :disable="!canValidate"
              :loading="validationState === 'submitting'"
              class="touch-button touch-button--primary"
            />
          </form>

          <section
            v-if="validationState === 'success' && validationResult"
            :class="[
              'access-result',
              isValidationExpired
                ? 'access-result--expired'
                : 'access-result--success',
            ]"
            aria-live="polite"
          >
            <p class="screen-kicker">
              {{
                isValidationExpired
                  ? t('accessCode.expiredKicker')
                  : t('accessCode.grantedKicker')
              }}
            </p>
            <h3>
              {{
                isValidationExpired
                  ? t('accessCode.expiredTitle')
                  : t('accessCode.grantedTitle')
              }}
            </h3>
            <div class="reservation-grid">
              <div>
                <span>{{ t('reservation.ticketCode') }}</span>
                <strong>{{ validationResult.ticketCode }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.id') }}</span>
                <strong>{{ validationResult.reservationId }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.lockerNumber') }}</span>
                <strong>{{ validationResult.compartmentNumber }}</strong>
              </div>
              <div>
                <span>{{ t('reservation.reservedUntil') }}</span>
                <strong>{{ formatDateTime(validationResult.reservedUntil) }}</strong>
              </div>
              <div v-if="validatedCompartment">
                <span>{{ t('accessCode.compartmentStatus') }}</span>
                <strong>
                  {{
                    t(`compartmentStatuses.${validatedCompartment.status}`)
                  }}
                </strong>
              </div>
              <div>
                <span>{{ t('accessCode.validatedAt') }}</span>
                <strong>{{ formatDateTime(validationResult.validatedAt) }}</strong>
              </div>
            </div>
          </section>

          <p
            v-if="validationState === 'error'"
            class="reservation-panel__error"
            role="alert"
          >
            {{ validationErrorMessage }}
          </p>

          <div class="detail-board__actions">
            <q-btn
              outline
              color="white"
              icon="home"
              :label="t('accessCode.backHome')"
              class="touch-button touch-button--secondary"
              @click="goHome"
            />
          </div>
        </div>
      </section>
    </main>
  </q-page>
</template>
