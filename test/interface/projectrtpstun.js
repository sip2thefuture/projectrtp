

const expect = require( "chai" ).expect
const projectrtp = require( "../../index.js" ).projectrtp
const dgram = require( "dgram" )


/**
 * Use wireshark to copy->as hex stream for the input to this function to create a JS Buffer.
 * @param { string } str 
 */
function tobuffer( str ) {

  let hex = str.substring( 0,2 )
  let res = []

  while( hex ) {

    str = str.slice( 2 )
    res.push( parseInt( hex, 16 ) )
    hex = str.substring( 0,2 )
  }

  return Buffer.from( res )
}


describe( "STUN", function() {
  it( `Bind Request 1`, async function() {

    const server = dgram.createSocket( "udp4" )

    /* generated with chrome client with project, generated by chrome sent to us */
    let stunpacket = tobuffer( "0001005c2112a442546a56583341484a6b5a457400060015393037643261663462313133306237653a2b394f41000000c0570004000003e7802a00081617d3f2124471b400250000002400046e001eff000800141dd53ef0e9774d2fbbad5c904327d2cecb0c161f802800042e8f2b6b" )

    /* from chrome */
    /* ice-pwd:EHF1KuU51q+m7U0o246kgM29 */
    let chromeicepwd = "EHF1KuU51q+m7U0o246kgM29"
    
    /* from project */
    let projecticepwd = "vjwMJC1QaQKkmddLFOWbtmIF"

    let done
    let finished = new Promise( ( r ) => { done = r } )

    let channel = await projectrtp.openchannel( { 
      "id": "4", 
      "remote": { 
        "address": "localhost", 
        "port": 20000, 
        "codec": 0, 
        "icepwd": chromeicepwd 
      },
      "local": {
        "icepwd": projecticepwd /* override our generated one */
      }
    }, ( d ) => {
      if( "close" === d.action ) done()
    } )

    server.on( "message", function( msg, rinfo ) {
      /* exit to show our test has passed */
      server.close()
      channel.close()
    } )

    server.bind()
    server.on( "listening", async function() {
      server.send( stunpacket, channel.local.port, "localhost" )
    } )

    await finished
    
  } )

  it( `Bind Request 2`, async function() {


    let fromchrome = "0001005c2112a4426977794337524e516367556500060015343635613064383863333238376336613a5a483651000000c0570004000003e7802a0008912756f47f66a6e200250000002400046e001eff000800140bcc9d77b7beabf7e63d32095423e527b2908aa380280004ca294ea6"
    let stunpacket = tobuffer( fromchrome )

    /* from chrome */
    let chromeicepwd = "oQBeaQ7QASCyv0qQQ+lxwQaE"
    
    /* from project */
    let projecticepwd = "nxIUvOuFnrokdbuiloUXtK51"

    let done
    let finished = new Promise( ( r ) => { done = r } )

    let channel = await projectrtp.openchannel( { 
      "id": "4", 
      "remote": { 
        "address": "localhost", 
        "port": 20000, 
        "codec": 0, 
        "icepwd": chromeicepwd 
      },
      "local": {
        "icepwd": projecticepwd /* override our generated one */
      }
    }, ( d ) => {
      if( "close" === d.action ) done()
    } )

    const server = dgram.createSocket( "udp4" )

    server.on( "message", function( msg, rinfo ) {
      /* exit to show our test has passed */
      server.close()
      channel.close()
    } )

    server.bind()
    server.on( "listening", async function() {
      server.send( stunpacket, channel.local.port, "localhost" )
    } )

    await finished

  } )

  it( `Bind Response 1`, async function() {

    /* Useful test to have - but nothing to test */

    /* Binding request */
    let chromeicepwd = "jNDi+HequKwI10yrrRVWwp9y"
    let projecticepwd = "46XDyTXBxaqr5zLGDl0c9khf"

    let ourresponse = "0101002c2112a44268725570544b537536656951002000080001f3cde1baa4cf00080014b775fbfe51ab48a871b6e4ca2adeaf63ceb823c480280004b0e3a47a"
    let stunpacket = tobuffer( ourresponse )

    let done
    let finished = new Promise( ( r ) => { done = r } )

    let channel = await projectrtp.openchannel( { 
      "id": "4", 
      "remote": { 
        "address": "localhost", 
        "port": 20000, 
        "codec": 0, 
        "icepwd": chromeicepwd 
      },
      "local": {
        "icepwd": projecticepwd /* override our generated one */
      }
    }, (d ) => {
      if( "close" === d.action ) done()
    } )

    const server = dgram.createSocket( "udp4" )
    server.bind()
    server.on( "listening", async function() {
      server.send( stunpacket, channel.local.port, "localhost" )
    } )


    setTimeout( () => {
      server.close()
      channel.close()
    }, 200 )

    await finished

  } )


  it( `Bind Response 2`, async function() {

    /* chrome - FS */

    /* Binding request */
    let chromeicepwd = "akNxwdQhePf2wiKw2+A2LF9A"
    let projecticepwd = "DShvmi9dnQ1WOQmvkTiX3oJv"

    let response = "0101002c2112a4426d553159356c616f374d4758002000080001bf6d73016a24000800143dd0c7760e54aef711d5a767b74211e4855f8c7780280004ad03a421"
    let stunpacket = tobuffer( response )

    let done
    let finished = new Promise( ( r ) => { done = r } )

    let channel = await projectrtp.openchannel( { 
      "id": "4", 
      "remote": { 
        "address": "localhost", 
        "port": 20000, 
        "codec": 0, 
        "icepwd": chromeicepwd 
      },
      "local": {
        "icepwd": projecticepwd /* override our generated one */
      }
    }, ( d ) => {
      if( "close" === d.action ) done()
    } )

    const server = dgram.createSocket( "udp4" )
    server.bind()
    server.on( "listening", async function() {
      server.send( stunpacket, channel.local.port, "localhost" )
    } )


    setTimeout( () => {
      server.close()
      channel.close()
    }, 200 )

    await finished

  } )

} )
