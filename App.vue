<template>
  <div id="app">
    <router-view></router-view> <!-- This renders the matched component -->
  </div>
</template>

<script>
export default {
  name: 'App'
};

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin: 0;
  padding: 0;
}

body, html {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>
