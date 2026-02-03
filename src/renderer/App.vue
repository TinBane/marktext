<template>
  <router-view></router-view>
</template>

<script>
export default {
  name: 'RootApp',
  mounted () {
    console.log('[DEBUG] RootApp mounted, route:', this.$route?.path)
    console.log('[DEBUG] Router:', this.$router?.currentRoute?.value?.path)
  }
}
</script>
