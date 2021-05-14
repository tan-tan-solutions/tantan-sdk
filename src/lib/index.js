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

  init () {
    // https://www.javascripttutorial.net/dom/css/add-styles-to-an-element/
    const style = document.createElement('style')
    style.innerHTML = `
      .tt-button {
        background-color: #f38027;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 2px;
      }
      .tt-button:hover {
        background-color: #076fac;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        margin-bottom: 2px;
      }`
    document.head.appendChild(style)

    const buttons = document.getElementsByClassName('tt-button')

    for (const button of buttons) {
      const width = button.getAttribute('tt-width') || 50
      const height = button.getAttribute('tt-height') || 10
      button.style.cssText += `padding: ${height}px ${width}px ${height}px ${width}px;`
      const img = document.createElement('img')
      img.src =
        'https://tantan.solutions/wp-content/uploads/2020/05/tantan_ID-2-1536x826.png'
      img.width = '50'
      button.appendChild(img)
      button.addEventListener('click', function () {
        const title = button.getAttribute('tt-title')
        const price = button.getAttribute('tt-price')
        window.open(
          'https://dashboard-tantan.netlify.app/#/forms/preview?title=' +
            title +
            '&price=' +
            price,
          'popup',
          'width=600,height=600'
        )
        return false
      })
    }
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
