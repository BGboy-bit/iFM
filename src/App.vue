<template>
  <div id="app">
    <h1>欢迎使用 iFM</h1>
    <AudioPlayer />
  </div>
</template>

<script>
import AudioPlayer from "./components/AudioPlayer.vue";

export default {
  name: "App",
  components: {
    AudioPlayer
  }
};
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
}
</style>
