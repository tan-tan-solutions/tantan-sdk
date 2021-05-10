const generateQrCode = (el, data) => {
  const qrcode = new QRCode(el, {
    text: data,
    colorDark: '#f38027',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H
  })
}

class TanTanQrLogin {
  constructor (config) {
    this.client_id = config.client_id
  }

  login (cb) {
    const wsPath =
      'wss://qrlogin-test.tantan.solutions:8001/login/stream/?client_id=' +
      this.client_id
    console.log('Connecting to ' + wsPath)
    const socket = new ReconnectingWebSocket(wsPath)

    // Handle incoming messages
    socket.onmessage = function (message) {
      // Decode the JSON
      const data = JSON.parse(message.data)
      // Handle errors
      if (data.error) {
        console.log(data.error)
        return
      }

      // handle login actions
      switch (data.action) {
        case 'qrcode':
          generateQrCode('qrcode', data.qr_data)
          break
        case 'authorized':
          cb(data.user_info)
          break
      }
    }
  }
}
