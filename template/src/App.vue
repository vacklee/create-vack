<template>
  <AppLayout>
    <router-view />
  </AppLayout>
</template>

<script setup>
import AppLayout from './layout/index.vue';

defineOptions({ name: 'App' });
</script>
