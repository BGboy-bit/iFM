<template>
  <div class="audio-player">
    <!-- 搜索框和按钮 -->
    <div class="search">
      <input v-model="searchQuery" placeholder="搜索播客..." @keyup.enter="searchAudio" />
      <button @click="searchAudio">搜索</button>
    </div>
    
    <!-- 播放器 -->
    <audio ref="audio" :src="currentAudioSrc" @timeupdate="updateTime" @loadedmetadata="setDuration"></audio>
    <div class="controls">
      <button @click="togglePlay">{{ isPlaying ? "暂停" : "播放" }}</button>
      <span>{{ currentTimeDisplay }} / {{ durationDisplay }}</span>
      <input type="range" min="0" :max="duration" step="0.1" v-model="currentTime" @input="seek" />
      <input type="range" min="0" max="1" step="0.1" v-model="volume" @input="adjustVolume" />
    </div>

    <!-- 搜索结果列表 -->
    <div class="search-results">
      <h3>搜索结果</h3>
      <ul>
        <li v-for="(result, index) in searchResults" :key="index" @click="addToPlaylist(result)">
          {{ result.name }}
        </li>
      </ul>
    </div>

    <!-- 播放列表 -->
    <div class="playlist">
      <h3>播放列表</h3>
      <ul>
        <li v-for="(track, index) in playlist" :key="index" @click="selectTrack(track)">
          {{ track.name }}
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import rssToJson from 'rss-to-json';

export default {
  name: "AudioPlayer",
  data() {
    return {
      searchQuery: "", // 搜索框输入内容
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      currentAudioSrc: "", // 当前播放的音频链接
      searchResults: [], // 搜索结果列表
      playlist: [] // 播放列表
    };
  },
  computed: {
    currentTimeDisplay() {
      return this.formatTime(this.currentTime);
    },
    durationDisplay() {
      return this.formatTime(this.duration);
    }
  },
  methods: {
    togglePlay() {
      const audio = this.$refs.audio;
      if (audio.paused) {
        audio.play();
        this.isPlaying = true;
      } else {
        audio.pause();
        this.isPlaying = false;
      }
    },
    updateTime() {
      const audio = this.$refs.audio;
      this.currentTime = audio.currentTime;
    },
    setDuration() {
      const audio = this.$refs.audio;
      this.duration = audio.duration;
    },
    adjustVolume() {
      const audio = this.$refs.audio;
      audio.volume = this.volume;
    },
    seek() {
      const audio = this.$refs.audio;
      audio.currentTime = this.currentTime;
    },
    async searchAudio() {
      try {
        // 请求 iTunes API 获取搜索结果
        const response = await axios.get(`https://itunes.apple.com/search`, {
          params: {
            term: this.searchQuery,
            media: "podcast"
          }
        });
        // 将搜索结果存入 searchResults
        this.searchResults = response.data.results.map(result => ({
          name: result.collectionName,
          feedUrl: result.feedUrl // 保存 RSS 源链接
        }));
      } catch (error) {
        console.error("搜索失败:", error);
      }
    },
    async addToPlaylist(result) {
      try {
        // 使用 rss-to-json 获取并解析 RSS 源
        const feed = await rssToJson.load(result.feedUrl);

        // 找到第一个音频文件
        const firstEpisode = feed.items[0];
        console.log("First Episode:", firstEpisode); // 调试输出

        const track = {
          name: result.name,
          src: firstEpisode.enclosure ? firstEpisode.enclosure.url : null
        };

        if (track.src) {
          // 添加到播放列表并自动播放
          this.playlist.push(track);
          this.selectTrack(track); // 自动播放
        } else {
          console.error("音频 URL 不存在，无法播放");
        }
      } catch (error) {
        console.error("RSS 解析失败:", error);
      }
    },
    selectTrack(track) {
      this.currentAudioSrc = track.src;
      this.isPlaying = false;
      this.currentTime = 0;

      this.$refs.audio.removeEventListener('canplay', this.autoPlay);
      this.$refs.audio.addEventListener('canplay', this.autoPlay);
      this.$refs.audio.load();
    },
    autoPlay() {
      this.$refs.audio.play();
      this.isPlaying = true;
      this.$refs.audio.removeEventListener('canplay', this.autoPlay);
    },
    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }
  }
};
</script>

<style scoped>
/* 样式 */
.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.controls {
  display: flex;
  align-items: center;
}
.search-results, .playlist {
  margin-top: 20px;
}
.search button {
  margin-left: 10px;
}

/* 列表项样式 */
ul {
  list-style-type: none;
  padding: 0;
}

li {
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s, color 0.3s;
}

/* 鼠标悬停时的效果 */
li:hover {
  background-color: #f0f0f0;
  color: #333;
  border-radius: 5px;
}
</style>

