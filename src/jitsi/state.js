import Vue from 'vue'
import { assert } from '../lib/assert'
import { FromIFrameChannel } from '../lib/mq/iframe'
import { ChannelTaskQueue } from '../lib/mq/mq'
import { JitsiBridge } from './jitsi'

require('debug').enable('*')
const log = require('debug')('jitsi:state')

let room = location.hash.substr(1)

export let state = {

  room,

  jitsiID: null,

  teacher: false,

  stream: null,

  // Streams per peerID
  streams: {},
}

// PARENT WINDOW COMMUNICATION

export let queue = new ChannelTaskQueue(new FromIFrameChannel('jitsi'))

queue.on('state', newState => {
  log('state', newState)
  for (let [key, value] of Object.entries(newState)) {
    Vue.set(state, key, value)
  }
})

// JITSI

const jitsi = new JitsiBridge({ room })

jitsi.on('stream', ({ stream }) => {
  log('stream', stream)
  state.stream = stream // local video
})

jitsi.on('joined', ({ id }) => {
  state.jitsiID = id
  queue.emit('jitsi', { id })
  // let peerID = state.peerID
  // log('joined', peerID, id)
  // jitsiID = id
  // if (peerID) {
  //   log('set jitsi id via joined', peerID, jitsiID)
  //   sync.tracks.set(jitsiID, state.peerID)
  // }
})

jitsi.on('add', ({ id, track, video }) => {
  let peerID = state.tracks[id]
  log('add', id, video, peerID)
  assert(id)
  assert(track)
  if (video) {
    if (peerID) {
      log('set stream', peerID, id)
      Vue.set(state.streams, id, track)
    }
  } else {

  }
  log('add done')
})

jitsi.connect()
  .then(_ => log('jitsi connect'))
  .catch(err => log('jitsi err', err))

//
