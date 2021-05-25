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
    console.log(qrcode)
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
          if (!roomId) {
            window.localStorage.setItem('room_id', data.room_id)
          }
          this.generateQrCode(qrcode, data.qr_encoded)
          break
        case 'authorized':
          this.handleAction(qrcode, data, action, cb)
          break
        case 'payment':
          cb()
          break
      }
    }
  }

  pay (el) {
    const roomId = window.localStorage.getItem('room_id')
    this.generatePaymentWindow(el, roomId, null)
  }

  handleAction (el, data, cb) {
    console.log(data.user_info.scope_result.token)
    window.localStorage.setItem(
      'tt-web-token',
      data.user_info.scope_result.token
    )
    cb(data.user_info)
  }

  generatePaymentWindow (el, roomId, cb) {
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
