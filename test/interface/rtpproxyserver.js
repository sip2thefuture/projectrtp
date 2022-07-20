
const expect = require( "chai" ).expect
const prtp = require( "../../index.js" ).projectrtp
const mocknode = require( "../mock/mocknode.js" )

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

    n.connect( listenport )
    await p.waitfornewconnection()
    n.destroy()
    await p.destroy()

    p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n = new mocknode()

    n.connect( listenport )
    await p.waitfornewconnection()
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
    n.connect( listenport )
    await p.waitfornewconnection()
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

    await new Promise( ( resolve, reject ) => { setTimeout( () => resolve(), 10 ) } )

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

    let closereceived = false
    n.setmessagehandler( "close", ( onmsg ) => {
      n.destroy()
      p.destroy()
      closereceived = true
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n.connect( listenport )
    await p.waitfornewconnection()
    let channel = await prtp.openchannel()
    channel.echo()
    channel.close()

    await new Promise( ( resolve, reject ) => { setTimeout( () => resolve(), 10 ) } )

    expect( receivedecho ).to.be.true
    expect( closereceived ).to.be.true

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

    let closereceived = false
    n.setmessagehandler( "close", ( onmsg ) => {
      n.destroy()
      p.destroy()
      closereceived = true
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n.connect( listenport )
    await p.waitfornewconnection()
    let channel = await prtp.openchannel()
    channel.dtmf( "#123" )
    channel.close()

    await new Promise( ( resolve, reject ) => { setTimeout( () => resolve(), 10 ) } )

    expect( closereceived ).to.be.true
    expect( reveiveddtmf ).to.be.true
  } )

  it( `check mix/unmix`, async function() {

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

    let mixreceived = false
    let unmixreceived = false
    n.setmessagehandler( "mix", ( msg ) => {
      expect( msg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "mix" )
      expect( msg ).to.have.property( "other" ).that.is.a( "object" )
      expect( msg.other ).to.have.property( "id" ).that.is.a( "string" )
      expect( msg.other ).to.have.property( "uuid" ).that.is.a( "string" )
      expect( msg ).to.have.property( "id" ).that.is.a( "string" )
      expect( msg ).to.have.property( "uuid" ).that.is.a( "string" )
      mixreceived = true
    } )

    n.setmessagehandler( "unmix", ( msg ) => {
      expect( msg ).to.have.property( "channel" ).that.is.a( "string" ).to.equal( "unmix" )
      expect( msg ).to.have.property( "id" ).that.is.a( "string" )
      expect( msg ).to.have.property( "uuid" ).that.is.a( "string" )
      unmixreceived = true
    } )

    let closereceived = false
    n.setmessagehandler( "close", ( msg ) => {
      n.destroy()
      p.destroy()
      closereceived = true
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n.connect( listenport )
    await p.waitfornewconnection()
    let channel = await prtp.openchannel()
    channel.mix( { "id": "otheruuid", "uuid": "787-87686" } )
    channel.unmix()

    channel.close()

    await new Promise( ( resolve, reject ) => { setTimeout( () => resolve(), 10 ) } )

    expect( mixreceived ).to.be.true
    expect( unmixreceived ).to.be.true

    expect( closereceived ).to.be.true

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

    let closereceived = false
    n.setmessagehandler( "close", ( msg ) => {
      n.destroy()
      p.destroy()
      closereceived = true
    } )

    let p = await prtp.proxy.listen( undefined, "127.0.0.1", listenport )
    n.connect( listenport )
    await p.waitfornewconnection()
    let channel = await prtp.openchannel()
    channel.remote( "wouldbearemoteobject" )

    channel.close()
    await new Promise( ( resolve ) => { setTimeout( () => resolve(), 10 ) } )

    expect( remotereceived ).to.be.true
    expect( closereceived ).to.be.true

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
    n.connect( listenport )
    await p.waitfornewconnection()
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
    n.connect( listenport )
    await p.waitfornewconnection()
    let channel = await prtp.openchannel()
    channel.direction( { send: false, recv: false } )

    await completed

    n.destroy()
    p.destroy()

    expect( directionmsg.send ).to.be.false
    expect( directionmsg.recv ).to.be.false
  } )
} )
