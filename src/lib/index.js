/**
 *
 * @param {*} el
 * @param {*} data
 */
const generateQrCode = (el, data) => {
  const size = el.getAttribute('tt-size') || 250
  const img = document.createElement('img')
  img.src = data
  img.width = size
  el.appendChild(img)
}

/**
 *
 * @param {*} el
 * @param {*} roomId
 * @param {*} cb
 */
const generatePaymentWindow = (el, roomId, cb) => {
  window.open(
    'https://qrdash.tantan.solutions/#/forms/payment?title=' +
      el.getAttribute('tt-title') +
      '&price=' +
      el.getAttribute('tt-price') +
      '&room_id=' +
      roomId,
    'popup',
    'width=600,height=600'
  )
}

/**
 *
 * @param {*} el
 * @param {*} data
 * @param {*} action
 * @param {*} cb
 */
const handleAction = (el, data, action, cb) => {
  const roomId = window.localStorage.getItem('room_id')
  switch (action) {
    case 'SIGNIN':
      cb(data.user_info)
      break
    case 'PAY':
      generatePaymentWindow(el, roomId, cb)
      break
    default:
      break
  }
}

class TanTanQrLogin {
  constructor (config) {
    this.client_id = config.client_id
    this.action = config.action || 'SIGNIN'
  }

  /**
   *
   * @param {*} el
   * @param {*} cb
   */
  login (el, cb) {
    console.log(el)
    const qrcode = document.getElementById(el)
    const action = qrcode.getAttribute('tt-action')
    const wsPath =
      'wss://qrlogin-test.tantan.solutions:8001/login/stream/?client_id=' +
      this.client_id +
      '&action=' +
      action
    console.log('Connecting to ' + wsPath)
    const socket = new ReconnectingWebSocket(wsPath)

    // Handle incoming messages
    socket.onmessage = message => {
      // Decode the JSON
      const data = JSON.parse(message.data)
      console.log(data)
      // Handle errors
      if (data.error) {
        console.log(data.error)
        return
      }

      // handle login actions
      switch (data.action) {
        case 'qrcode':
          window.localStorage.setItem('room_id', data.room_id)
          generateQrCode(qrcode, data.qr_encoded)
          break
        case 'authorized':
          handleAction(qrcode, data, action, cb)
          break
        case 'payment':
          cb()
          break
      }
    }
  }
}
