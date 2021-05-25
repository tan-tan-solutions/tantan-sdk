class TanTanQrLogin {
  constructor (config) {
    this.client_id = config.client_id
    this.action = config.action || 'SIGNIN'
    this.socket = null
  }

  /**
   *
   * @param {*} el
   * @param {*} cb
   */
  login (el, cb) {
    const qrcode = document.getElementById(el)
    const action = qrcode.getAttribute('tt-action')
    const roomId = window.localStorage.getItem('room_id')
    const wsPath =
      'wss://qrlogin-test.tantan.solutions:8001/login/stream/?client_id=' +
      this.client_id +
      '&action=' +
      action +
      '&room_id=' +
      roomId
    console.log('Connecting to ' + wsPath)
    const socket = new ReconnectingWebSocket(wsPath)
    this.socket = socket
    this.handleAction(qrcode, roomId, cb)
    console.log(qrcode)
  }

  handleAction (qrcode, roomId, cb) {
    // Handle incoming messages
    this.socket.onmessage = message => {
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
          if (!roomId) {
            window.localStorage.setItem('room_id', data.room_id)
          }
          this.generateQrCode(qrcode, data.qr_encoded)
          window.localStorage.setItem('tt_qrcode', data.qr_encoded)
          break
        case 'authorized':
          console.log(data.user_info.scope_result.token)
          window.localStorage.setItem(
            'tt-web-token',
            data.user_info.scope_result.token
          )
          cb(data.user_info)
          break
        case 'payment':
          cb(data.payment_info)
          break
      }
    }
  }

  pay (el, cb) {
    const roomId = window.localStorage.getItem('room_id')
    this.generatePaymentWindow(el, roomId)
    this.handleAction(null, roomId, cb)
  }

  generatePaymentWindow (el, roomId) {
    const button = document.getElementById(el)
    window.open(
      'https://dashboard.tantan.solutions/#/forms/payment?title=' +
        button.getAttribute('tt-title') +
        '&price=' +
        button.getAttribute('tt-price') +
        '&room_id=' +
        roomId,
      'popup',
      'width=600,height=600'
    )
  }

  generateQrCode (el, data) {
    const size = el.getAttribute('tt-size') || 250
    const img = document.createElement('img')
    img.src = data
    img.width = size
    el.appendChild(img)
  }
}
