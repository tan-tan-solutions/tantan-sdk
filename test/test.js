const { assert, expect } = require('chai')

describe('Tests for SDK', () => {
  it('Test get QR Code', () => {
    expect("qrcode").to.be.an('string')
  })
})
