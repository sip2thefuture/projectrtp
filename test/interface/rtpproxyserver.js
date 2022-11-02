
const expect = require( "chai" ).expect
const prtp = require( "../../index.js" ).projectrtp
const mocknode = require( "../mock/mocknode.js" )
const mockserver = require( "../mock/mockproxyserver.js" )

/*
The tests in this file are to ensure what we send out over
our socket is in the correct format.
*/

let listenport = 45000

describe( "rtpproxy server", function() {

  afterEach( function() {
    /* when in listen mode a server doesn't appear ot release the bind
    immediatly, so in order to move on to the next test - use a different port */
    listenport++
  } )

  it( `start and stop and start listener`, async function() {

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    let n = new mocknode()

    await n.connect( listenport )
    n.destroy()
    await p.destroy()

    p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n = new mocknode()

    await n.connect( listenport )
    n.destroy()
    await p.destroy()
  } )

  it( `check open json`, async function() {
    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( onmsg ) => {
      n.sendmessage( {
          "action": "open",
          "id": onmsg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "local": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let closereceived = false
    n.setmessagehandler( "close", ( onmsg ) => {
      closereceived = true
      n.destroy()
      p.destroy()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()

    expect( channel ).to.be.an( "object" )
    expect( channel.close ).to.be.an( "function" )
    expect( channel.mix ).to.be.an( "function" )
    expect( channel.unmix ).to.be.an( "function" )
    expect( channel.echo ).to.be.an( "function" )
    expect( channel.play ).to.be.an( "function" )
    expect( channel.record ).to.be.an( "function" )
    expect( channel.direction ).to.be.an( "function" )
    expect( channel.dtmf ).to.be.an( "function" )
    expect( channel.remote ).to.be.an( "function" )
    expect( channel.local ).to.have.property( "port" ).that.is.a( "number" )
    expect( channel.local ).to.have.property( "address" ).that.is.a( "string" )
    expect( channel.local.port ).to.equal( 10002 )
    expect( channel.local.address ).to.equal( "192.168.0.141" )
    expect( channel.uuid ).that.is.a( "string" )
    expect( channel.id ).that.is.a( "string" )

    channel.close()

    await new Promise( ( r ) => { setTimeout( () => r(), 10 ) } )

    expect( closereceived ).to.be.true
  } )

  it( `check echo`, async function() {

    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( onmsg ) => {
      n.sendmessage( {
          "action": "open",
          "id": onmsg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let receivedecho = false
    n.setmessagehandler( "echo", ( onmsg ) => {
      receivedecho = true
    } )

    let closeresolve
    let closereceived = new Promise( resolve => closeresolve = resolve )
    n.setmessagehandler( "close", ( onmsg ) => {
      n.destroy()
      p.destroy()
      closeresolve()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()
    channel.echo()
    channel.close()

    /* this will only resolve when close received */
    await closereceived

    expect( receivedecho ).to.be.true
  } )

  it( `check dtmf`, async function() {

    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( onmsg ) => {
      n.sendmessage( {
          "action": "open",
          "id": onmsg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let reveiveddtmf = false
    n.setmessagehandler( "dtmf", ( msg ) => {
      reveiveddtmf = true
      expect( msg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "dtmf" )
      expect( msg ).to.have.property( "id" ).that.is.a( "string" )
      expect( msg ).to.have.property( "uuid" ).that.is.a( "string" )
      expect( msg ).to.have.property( "digits" ).that.is.a( "string" ).to.equal( "#123" )
    } )

    let closeresolve
    let closereceived = new Promise( resolve => closeresolve = resolve )
    n.setmessagehandler( "close", ( onmsg ) => {
      n.destroy()
      p.destroy()
      closeresolve()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()
    channel.dtmf( "#123" )
    channel.close()

    await closereceived

    expect( reveiveddtmf ).to.be.true
  } )

  it( `check mix/unmix`, async function() {

    /* set up our mock node object */
    let n = new mocknode()
    let uuidcount = 1
    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec15" + uuidcount++,
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let mxmsg
    n.setmessagehandler( "mix", ( msg ) => mxmsg = msg )

    let unmxmsg
    n.setmessagehandler( "unmix", ( msg ) => unmxmsg = msg )

    let closeresolve
    let closereceived = new Promise( resolve => closeresolve = resolve )
    n.setmessagehandler( "close", ( msg ) => {
      n.destroy()
      p.destroy()
      closeresolve()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channela = await prtp.openchannel()
    let channelb = await prtp.openchannel()
    channela.mix( channelb )
    channela.unmix()

    channela.close()
    channelb.close()

    await closereceived

    expect( mxmsg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "mix" )
    expect( mxmsg ).to.have.property( "other" ).that.is.a( "object" )
    expect( mxmsg.other ).to.have.property( "id" ).that.is.a( "string" )
    expect( mxmsg.other ).to.have.property( "uuid" ).that.is.a( "string" )
    expect( mxmsg ).to.have.property( "id" ).that.is.a( "string" )
    expect( mxmsg ).to.have.property( "uuid" ).that.is.a( "string" )

    expect( unmxmsg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "unmix" )
    expect( unmxmsg ).to.have.property( "id" ).that.is.a( "string" )
    expect( unmxmsg ).to.have.property( "uuid" ).that.is.a( "string" )

  } )

  it( `check node selection`, async function() {

    let n = new mocknode()
    let n2 = new mocknode()
    let openedcount = 0

    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec15" +  openedcount++,
          "local": {
            "port": 10002,
            "address": "192.168.0.141"
            },
          "status": n.ourstats
          } )
    } )
    
    n.setmessagehandler( "close", () => {} )

    n2.setmessagehandler( "open", ( msg ) => {
      n2.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "9dfc35d9-eafe-4d8b-8880-c48f528ec15" + openedcount++,
          "local": {
            "port": 10004,
            "address": "192.168.0.141"
            },
          "status": n2.ourstats
          } )

    } )

    n2.setmessagehandler( "close", () => {} )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    await n2.connect( listenport )
    
    n.ourstats.channel.current = 1
    let channel1 = await prtp.openchannel()
    let channel2 = await prtp.openchannel()

    channel1.close()
    channel2.close()

    await new Promise( ( r ) => { setTimeout( () => r(), 10 ) } )

    n.destroy()
    n2.destroy()
    await p.destroy()

    expect( openedcount ).to.equal( 2 )
  } )

  it( `check remote`, async function() {

    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let remotereceived = false
    n.setmessagehandler( "remote", ( msg ) => {
      expect( msg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "remote" )
      expect( msg ).to.have.property( "id" ).that.is.a( "string" )
      expect( msg ).to.have.property( "uuid" ).that.is.a( "string" )
      expect( msg ).to.have.property( "remote" ).that.is.a( "string" ).to.equal( "wouldbearemoteobject" )

      remotereceived = true
    } )

    let closeresolve
    let closereceived = new Promise( resolve => closeresolve = resolve )
    n.setmessagehandler( "close", ( msg ) => {
      n.destroy()
      p.destroy()
      closeresolve()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()
    channel.remote( "wouldbearemoteobject" )

    channel.close()
    await closereceived

    expect( remotereceived ).to.be.true
  } )


  it( `check play/record`, async function() {

    let done
    const completed = new Promise( ( r ) => { done = r } )

    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let playmsg
    n.setmessagehandler( "play", ( msg ) => {
      playmsg = msg

      n.sendmessage( {
        "action": "play",
        "id": msg.id,
        "uuid": msg.uuid
        } )

      setTimeout( () => channel.record( "wouldbearecordobject" ), 10 )
    } )

    let recmsg
    n.setmessagehandler( "record", ( msg ) => {
      recmsg = msg
      channel.close()
    } )

    n.setmessagehandler( "close", () => {
      done()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()
    channel.play( "wouldbeaplayobject" )

    await completed

    n.destroy()
    p.destroy()

    expect( recmsg ).to.be.an( "object" )
    expect( recmsg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "record" )
    expect( recmsg ).to.have.property( "id" ).that.is.a( "string" )
    expect( recmsg ).to.have.property( "uuid" ).that.is.a( "string" )
    expect( recmsg ).to.have.property( "options" ).that.is.a( "string" ).to.equal( "wouldbearecordobject" )

    expect( playmsg ).to.be.an( "object" )
    expect( playmsg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "play" )
    expect( playmsg ).to.have.property( "id" ).that.is.a( "string" )
    expect( playmsg ).to.have.property( "uuid" ).that.is.a( "string" )
    expect( playmsg ).to.have.property( "soup" ).that.is.a( "string" ).to.equal( "wouldbeaplayobject" )

    expect( channel.history ).to.be.an( "array" ).to.have.length( 6 )

  } )

  it( `check direction( { send, recv } )`, async function() {

    let done
    const completed = new Promise( ( r ) => { done = r } )

    /* set up our mock node object */
    let n = new mocknode()
    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )

    let directionmsg
    n.setmessagehandler( "direction", ( msg ) => {
      directionmsg = msg.options

      n.sendmessage( {
        "action": "direction",
        "id": msg.id,
        "uuid": msg.uuid
        } )

        setTimeout( () => channel.close(), 10 )
    } )
    n.setmessagehandler( "close", () => {
      done()
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    await n.connect( listenport )
    let channel = await prtp.openchannel()
    channel.direction( { send: false, recv: false } )

    await completed

    n.destroy()
    p.destroy()

    expect( directionmsg.send ).to.be.false
    expect( directionmsg.recv ).to.be.false
  } )

  it( `Node as listener mockserver to test`, async () => {

    prtp.proxy.addnode( { host: "127.0.0.1", port: 9002 } )
    let n = new mocknode()
    await n.listen( 9002 )
    n.setmessagehandler( "open", ( msg ) => {
      n.sendmessage( {
          "action": "open",
          "id": msg.id,
          "uuid": "7dfc35d9-eafe-4d8b-8880-c48f528ec152",
          "channel": {
            "port": 10002,
            "address": "192.168.0.141"
            }
          } )
    } )
    let chnl = await prtp.openchannel()

/*
    expect( chnl ).to.have.property( "status" ).that.is.a( "object" )
    expect( receivedmsg.status ).to.have.property( "workercount" ).that.is.a( "number" )
    expect( receivedmsg.status ).to.have.property( "instance" ).that.is.a( "string" )
    expect( receivedmsg.status ).to.have.property( "channel" ).that.is.a( "object" )
    expect( receivedmsg.status.channel ).to.have.property( "available" ).that.is.a( "number" )
    expect( receivedmsg.status.channel ).to.have.property( "current" ).that.is.a( "number" )
    */

    n.destroy()
    chnl.close()

    /* close and test with expect */
  } )

  /*it( `Two mock nodes listening, 2 openchannels on the same node close each in turn to ensure connection is maintained`, async () => {

  } )*/
} )
