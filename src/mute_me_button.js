var { HID } = require('node-hid')

class MuteMeButton {
  static vendorId = 8352
  static productId = 17114

  static colors = [
    0, // noColor
    1, // red
    2, // green
    3, // yellow
    4, // blue
    5, // purple
    6, // cyan
    7, // white
    8, // orange -- undocumented!
  ]

  static modes = [
    0, // full bright
    16, // dim
    32, // fastPulse
    48, // slowPulse
  ]

  constructor(vendorId, productId) {
    this.vendorId = vendorId
    this.productId = productId
    this.device = null
    this.connected = false

    this.color = 0
    this.mode = 0
    this.touching = false

    this.touchStartResponders = []
    this.touchStopResponders = []
    this.keepAlive = 0
  }

  connect() {
    if (this.connected) return
    this.#connect()
    // it takes the muteme at least 5 seconds to reboot when it crashes
    setTimeout(() => { this.connect() }, 1000)
  }

  disconnect() {
    if (this.connected)
      this.device.close()

    this.connected = false
    clearInterval(this.keepAlive)
  }

  #connect() {
    try {
      this.device = new HID(this.vendorId, this.productId)
      this.connected = true
    } catch (e) {
      this.connected = false
      console.log("Unable to connect: ", e.message)
      return
    }

    this.device.setNonBlocking(1)
    this.device.on("data", this.read.bind(this))
    this.device.on("error", this.error.bind(this))
    this.touching = false
  }

  onTouchStart(responder) {
    this.touchStartResponders.push(responder)
  }

  #touchStart() {
    if (this.touching) return
    this.touching = true
    this.touchStartResponders.forEach(responder => responder())
  }

  onTouchStop(responder) {
    this.touchStopResponders.push(responder)
  }

  #touchStop() {
    if (! this.touching) return
    this.touching = false
    this.touchStopResponders.forEach(responder => responder())
  }

  read(buffer) {
    switch(buffer[3]) {
      case 0:
        break
      case 1:
        this.#touchStart()
        break
      case 2:
        this.#touchStop()
        break

      case 5:
        // Not sure what this indicates. At one point I tricked the device
        // into emitting it repeatedly. It may be because I set the mode
        // to 112, or it may not. Perhaps a hidden hook to upload firmware?
        break;
      default:
        console.log(`unknown buffer read`, buffer)
    }
  }

  error(buffer) {
    console.log("error:", buffer)
    this.connected = false
    console.log("reconnecting...")
    setTimeout(() => { this.connect() }, 100)
  }

  setColor(color) {
    this.color = color
    this.write()
  }

  setMode(mode) {
    this.mode = mode
    this.write()
  }

  write() {
    if (! this.connected) return
    let command = this.color + this.mode

    this.#write(command)

    // The MuteMe-Client.app does this, but in my experience the device stays lit without it.
    //
    // clearInterval(this.keepAlive)
    // this.keepAlive = setInterval(() => { this.#write(command) }, 5000)

    // The MuteMe-Client.app does this, but it seems to have no effect.
    // My best guess is that it starts a timer which shuts the device off after 5 seconds,
    // which makes the above keepAlive timer necessary.
    //
    // setTimeout(() => {
    //   command += 64
    //   this.#write(command)
    // }, 100)
  }

  #write(command) {
    try {
      this.device.write([0, command])
    } catch (e) {
      console.log(`Write failure for ${command}`)
    }
  }
}

exports.MuteMeButton = MuteMeButton;
