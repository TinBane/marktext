import { defineStore } from 'pinia'
import { ipcRenderer } from 'electron'
import bus from '../bus'

export const useTweetStore = defineStore('tweet', {
  state: () => ({}),

  actions: {
    listenForTweet () {
      ipcRenderer.on('mt::tweet', (e, type) => {
        if (type === 'twitter') {
          bus.$emit('tweetDialog')
        }
      })
    }
  }
})
