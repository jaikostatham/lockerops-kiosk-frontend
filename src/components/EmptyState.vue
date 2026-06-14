<script setup lang="ts">
withDefaults(
  defineProps<{
    icon?: string;
    title: string;
    message: string;
    actionLabel?: string;
  }>(),
  {
    icon: 'inventory_2',
    actionLabel: '',
  },
);

defineEmits<{
  action: [];
}>();
</script>

<template>
  <div class="state-view state-view--empty">
    <q-icon :name="icon" size="72px" />
    <h2>{{ title }}</h2>
    <p>{{ message }}</p>
    <q-btn
      v-if="actionLabel"
      flat
      color="primary"
      icon="arrow_back"
      :label="actionLabel"
      class="touch-button touch-button--compact"
      @click="$emit('action')"
    />
  </div>
</template>
