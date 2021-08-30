let { MuteMeButton } = require("./src/mute_me_button.js")

let muteme = new MuteMeButton(MuteMeButton.vendorId, MuteMeButton.productId)
muteme.connect()

let colors = MuteMeButton.colors
let modes = MuteMeButton.modes
let color = 0
let mode = 0

muteme.onTouchStop(function() {
  colorChange()
  // modeChange()
})

function colorChange(){
  muteme.setColor(colors[color])
  if (++ color >= colors.length) color = 0
}

function modeChange(){
  muteme.setMode(modes[mode])
  if (++ mode >= modes.length) mode = 0
}
