

module.exports.log = function( message ) {
  const d = new Date()
  const datestring = (
    "0" + d.getDate()).slice(-2) + "-" + ("0"+(d.getMonth()+1)).slice(-2) + "-" +
    d.getFullYear() + " " + ("0" + d.getHours()).slice(-2) + ":" + ( "0" + d.getMinutes() ).slice( -2 ) + ":" + ( "0" + d.getSeconds() ).slice( -2 )

  console.log( "[" + datestring + "] " + message )
}

let channelcount = 0
let totalcount = 0
module.exports.lognewchannel = () => {
  channelcount++
  module.exports.log( `New channel opened - current count now ${channelcount}` )
}

module.exports.logclosechannel = ( message, d, mstimeout ) => {
  channelcount--
  totalcount++
  module.exports.log( message )
  module.exports.log( ` Expected number of packets: ${Math.round(mstimeout / 20)}, Received: ${d.stats.in["count"]},` +
  ` Score: ${(d.stats.in["count"] / mstimeout * 20).toFixed(2)}` )
  module.exports.log( `Channel closed - current count now ${channelcount} total channels this session ${totalcount}` )
}

module.exports.totalchannelcount = () => {
  return totalcount
}

module.exports.currentchannelcount = () => {
  return channelcount
}

module.exports.mktemp = () => {
  return "project_" + (Math.random() + 1).toString(36).substring(7)
}

module.exports.mktempwav = () => {
  return "/tmp/project_" + (Math.random() + 1).toString(36).substring(7) + ".wav"
}

module.exports.between = ( min, max ) => {
  return Math.floor(
    Math.random() * ( max - min ) + min
  )
}

module.exports.waitbetween = async ( min, max ) => {
  return new Promise( ( resolve ) => { setTimeout( () => resolve(), module.exports.between( min, max ) ) } )
}

const possiblecodecs = [ 0, 8, 9, 97 ]
module.exports.randcodec = () => {
  return possiblecodecs[ module.exports.between( 0, possiblecodecs.length ) ]
}
