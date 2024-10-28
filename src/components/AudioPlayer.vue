<template>
  <div class="audio-player">
    <!-- 顶部导航栏 -->
    <div class="top-bar">
      <h2>Podcast Player</h2>
      <button @click="toggleSearchPage">{{ showSearch ? "返回" : "搜索" }}</button>
    </div>

    <!-- 主页面内容 -->
    <div v-if="!showSearch" class="main-content">
      <div class="top-section">
        <!-- 左侧：播放列表 -->
        <div class="playlist">
          <h3>播放列表</h3>
          <table>
            <thead>
              <tr>
                <th>曲目</th>
                <th>歌手</th>
                <th>时长</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(track, index) in playlist" 
                  :key="index" 
                  @click="selectTrack(track)"
                  :class="{ selected: selectedTrack === track }">
                <td>{{ track.name }}</td>
                <td>{{ track.artist || '未知歌手' }}</td>
                <td>{{ track.duration || '--:--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 右侧：当前播放信息 -->
        <div class="now-playing">
          <img :src="currentCover" alt="封面" class="cover" />
          <div class="track-info">
            <h3>{{ currentTitle }}</h3>
            <p>{{ currentArtist || '未知歌手' }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 搜索页面内容 -->
    <div v-if="showSearch" class="search-content">
      <div class="search-bar">
    <input 
        v-model="searchQuery" 
        placeholder="搜索播客..." 
        @keyup.enter="searchAudio" 
        class="search-input" />
    <button @click="searchAudio">搜索</button>
</div>

      
      <div class="search-results">
        <ul>
          <li v-for="(result, index) in searchResults" 
              :key="index" 
              @click="selectSearchResult(result)"
              @dblclick="confirmAddToPlaylist(result)"
              :class="{ selected: selectedSearchResult === result }">
            <img :src="result.cover" alt="封面" class="result-cover" />
            <span>{{ result.name }}</span>
          </li>
        </ul>
      </div>
    </div>

    <!-- 当前播放的曲目名称 -->
    <div class="now-playing-title" v-if="currentTitle">
      正在播放: {{ currentTitle }}
    </div>

    <!-- 播放器控制栏：在主页面和搜索页面都显示 -->
    <div class="controls">
      <button @click="previousTrack">上一首</button>
      <button @click="togglePlay">{{ isPlaying ? "暂停" : "播放" }}</button>
      <button @click="nextTrack">下一首</button>
      <span>{{ currentTimeDisplay }} / {{ durationDisplay }}</span>
      <input type="range" min="0" :max="duration" step="0.1" v-model="currentTime" @input="seek" />
      <input type="range" min="0" max="1" step="0.1" v-model="volume" @input="adjustVolume" />
      <button @click="toggleShuffle">{{ isShuffling ? "随机播放" : "顺序播放" }}</button>
      <button @click="toggleRepeat">{{ repeatModeText }}</button>
    </div>

    <!-- 添加音频元素 -->
    <audio ref="audio" @canplay="autoPlay" @ended="onAudioEnded"></audio>
  </div>
</template>

<script>
// const rssToJson = require('rss-to-json');
export default {
  name: "AudioPlayer",
  data() {
  return {
    searchQuery: "",
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    currentAudioSrc: "",
    searchResults: [],
    playlist: [],
    selectedTrack: null,
    selectedSearchResult: null, // 当前选中的搜索结果
    currentCover: "",
    currentTitle: "未选择",
    currentArtist: "",
    showSearch: false,
    isShuffling: false,
    repeatMode: 0,
    
  mounted() {
    if (this.$refs.audio) {
      console.log("Audio element has been mounted and initialized.");
      this.$refs.audio.addEventListener('canplay', this.autoPlay);
    } else {
      console.error("Audio element reference is not available at mounted.");
    }
  },
    
};
  },
  computed: {
    currentTimeDisplay() {
      return this.formatTime(this.currentTime);
    },
    durationDisplay() {
      console.log("this.duration = ",this.duration);
      return this.formatTime(this.duration);
    },
    repeatModeText() {
      return this.repeatMode === 1 ? "单曲循环" : this.repeatMode === 2 ? "全部循环" : "顺序播放";
    }
  },
  methods: {
    togglePlay() {
      console.log("togglePlay method called.");
      if (!this.$refs.audio) {
        console.error("音频引用未定义，无法切换播放状态");
        return;
      }
      console.log("Audio element found, toggling play state.");
      if (!this.$refs.audio) {
        console.error("音频引用未定义，无法切换播放状态");
        return;
      }
      const audio = this.$refs.audio;
      if (audio.paused) {
        audio.play();
        this.isPlaying = true;
      } else {
        audio.pause();
        this.isPlaying = false;
      }
    },
    previousTrack() {
      const currentIndex = this.playlist.indexOf(this.selectedTrack); // 获取当前曲目的索引
      if (currentIndex > 0) {
        this.selectTrack(this.playlist[currentIndex - 1]); // 选择上一首曲目
      } else if (this.playlist.length > 0) {
        this.selectTrack(this.playlist[this.playlist.length - 1]); // 循环到最后一首曲目
      }
    },

    nextTrack() {
      const currentIndex = this.playlist.indexOf(this.selectedTrack); // 获取当前曲目的索引
      if (currentIndex < this.playlist.length - 1) {
        this.selectTrack(this.playlist[currentIndex + 1]); // 选择下一首曲目
      } else if (this.playlist.length > 0) {
        this.selectTrack(this.playlist[0]); // 循环回到第一首曲目
      }      
    },

    toggleShuffle() {
      this.isShuffling = !this.isShuffling;
    },
    toggleRepeat() {
      this.repeatMode = (this.repeatMode + 1) % 3;
    },
    toggleSearchPage() {
      this.showSearch = !this.showSearch;
    },
    async searchAudio() {
      try {
        // 检查搜索关键词是否为空
        if (!this.searchQuery) {
          console.warn("搜索关键词不能为空");
          return;
        }

        // 设置加载状态
        this.isLoading = true;

        // 使用 fetch 进行请求
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(this.searchQuery)}&media=podcast`);

        // 检查响应是否成功
        if (!response.ok) {
          throw new Error("网络响应不成功");
        }

        const data = await response.json(); // 解析 JSON 数据

        // 检查是否有搜索结果
        if (data.results.length === 0) {
          console.warn("没有找到相关播客");
          this.searchResults = [];
          return;
        }

        // 映射搜索结果
        this.searchResults = data.results.map(result => ({
          name: result.collectionName,
          cover: result.artworkUrl100,
          feedUrl: result.feedUrl
        }));
      } catch (error) {
        console.error("搜索失败:", error);
      } finally {
        // 清除加载状态
        this.isLoading = false;
      }
    },

    selectSearchResult(result) {
      // 选中单击的搜索结果
      this.selectedSearchResult = result;
      this.selectedTrack = null;
    },

    async confirmAddToPlaylist(result) {
      // 调试输出，确认双击事件触发
      console.log("双击事件触发，准备确认加入播放列表");

      // 弹出确认框询问是否加入播放列表
      const confirmed = window.confirm(`是否将 "${result.name}" 加入播放列表？`);
      if (confirmed) {
        console.log("用户确认加入播放列表");
        // 用户确认后调用 addToPlaylist 将条目添加到播放列表
        await this.addToPlaylist(result);
      } else {
        console.log("用户取消加入播放列表");
      }
    },
  
    // 解码
    async addToPlaylist(result) {
      console.log("addToPlaylist Begin");
      try {
        // 获取 RSS 源
        const feedUrl = new URL(result.feedUrl); // 创建 URL 对象
        console.log("feedUrl = ", feedUrl);
        // const rssPath = feedUrl.pathname; 
        // const response = await fetch(`/api${rssPath}`);
        const response = await fetch(`http://localhost:3000/proxy?url=${encodeURIComponent(feedUrl)}`);
        console.log("response = ", response);
        const rssText = await response.text();
        console.log("获取 RSS 源");

        // 解析 XML
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(rssText, "text/xml");
        console.log("解析 XML");

        // 获取 RSS 中的第一个条目
        const firstEpisode = xmlDoc.getElementsByTagName("item")[0];
        console.log("获取 RSS 中的第一个条目");

        // 提取所需的数据
        const track = {
          name: result.name,
          src: firstEpisode.getElementsByTagName("enclosure")[0].getAttribute("url"), // 获取 enclosure 的 URL
          duration: firstEpisode.getElementsByTagName("itunes:duration")[0].textContent, // 获取持续时间
          cover: result.cover,
          artist: result.artist || "未知歌手",
        };
        console.log("提取所需的数据");
        // 输出音频的 URL
        console.log("获取到的音频 URL:", track.src);

        // 添加到播放列表
        this.playlist.push(track);
        console.log("添加到播放列表");

        // 自动选择并播放该曲目
        this.selectTrack(track);
        console.log("自动选择并播放该曲目");

      } catch (error) {
        console.error("RSS 解析失败:", error);
      }
    },

    selectTrack(track) {
      console.log("selectTrack Begin");

      this.selectedSearchResult = null;
      this.selectedTrack = track;
      this.currentAudioSrc = track.src;
      this.currentCover = track.cover;
      this.currentTitle = track.name;
      this.currentArtist = track.artist;
      this.isPlaying = false;
      this.currentTime = 0;

      // 确保音频引用存在
      console.log(this.$refs.audio);
      if (this.$refs.audio) {
        console.log("音频引用存在");
        // 移除之前的监听器（如果存在）
        this.$refs.audio.removeEventListener('canplay', this.autoPlay);
        
        // 添加新的监听器
        this.$refs.audio.addEventListener('canplay', this.autoPlay);

        // 加载新音频
        this.$refs.audio.src = track.src; // 确保设置音频源
        this.$refs.audio.load(); // 加载音频
      } else {
        console.error("音频引用未定义");
      }
    },

    autoPlay() {
      if (this.$refs.audio) {
        this.$refs.audio.play().then(() => {
          this.isPlaying = true;

          this.duration = this.$refs.audio.duration;

          this.startPlaybackTimer();

        }).catch((error) => {
          console.error("播放音频失败:", error);
        });
        
        // 移除事件监听器
        this.$refs.audio.removeEventListener('canplay', this.autoPlay);
      }
    },
    startPlaybackTimer() {
      // 每100毫秒更新一次当前播放时间
      this.playbackInterval = setInterval(() => {
        if (this.$refs.audio) {
          this.currentTime = this.$refs.audio.currentTime;
        }
      }, 60);
    },

    onAudioEnded() {
      // 当音频结束时，清除定时器
      clearInterval(this.playbackInterval);
      this.isPlaying = false;
      this.currentTime = 0; // 重置当前时间
    },

    formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
    }
  },

  mounted() {
    if (this.$refs.audio) {
      console.log("Audio element has been mounted and initialized.");
      this.$refs.audio.addEventListener('canplay', this.autoPlay);
    } else {
      console.error("Audio element reference is not available at mounted.");
    }
  }
    
};
</script>

<style scoped>
/* 样式调整 */
.audio-player {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.top-section {
  display: flex;
  width: 100%;
  justify-content: space-between;
  padding: 20px;
}
.playlist {
  width: 60%;
}
.now-playing {
  width: 35%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cover {
  width: 150px;
  height: 150px;
  margin-bottom: 10px;
  border-radius: 10px;
}
.search-results ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}
.search-results li {
  display: flex;
  align-items: center;
  padding: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-size: 1.2em;
}
.result-cover {
  width: 60px;
  height: 60px;
  margin-right: 15px;
  border-radius: 5px;
}
.search-results li:hover {
  background-color: #f0f0f0;
  border-radius: 5px;
}
table {
  width: 100%;
  border-collapse: collapse;
}
table th, table td {
  padding: 8px;
  text-align: left;
  color: #f0f0f0;
}
table tr:hover {
  background-color: #333;
}
.now-playing-title {
  position: fixed;
  bottom: 40px; /* 增加间距，确保曲目名称框与播放器之间不紧贴 */
  left: 0;
  width: 100%;
  text-align: left; /* 将内容左对齐 */
  padding-left: 20px; /* 左侧增加内边距，使文本不紧贴左边框 */
  font-size: 1.2em;
  color: #fff;
  background-color: #333;
  padding: 10px 0;
  z-index: 1000;
}

.controls {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 10px;
  background-color: #222;
  color: #fff;
  z-index: 1000;
}
.selected {
  background-color: #d0d0d0;
  border-radius: 5px;
}

.search-bar {
    display: flex; /* 确保按钮和输入框在同一行 */
    align-items: center; /* 垂直居中对齐 */
    margin: 20px 0; /* 添加一些外边距 */
}

.search-bar input {
    border: 1px solid #ccc; /* 添加边框 */
    padding: 10px; /* 增加内边距 */
    font-size: 1em; /* 调整字体大小 */
    border-radius: 5px; /* 添加圆角 */
    width: 70%; /* 使输入框占据70%的宽度 */
    margin-right: 10px; /* 为按钮留出空间 */
}


</style>