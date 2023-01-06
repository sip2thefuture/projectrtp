
const expect = require( "chai" ).expect
const net = require( "net" )
const message = require( "../../lib/message.js" )
const prtp = require( "../../index.js" ).projectrtp
const { v4: uuidv4 } = require( "uuid" )

class mocknode {

  constructor() {
    this.mp = message.newstate()
    this.ourstats = prtp.stats()
    this.messagehandlers = {}
    this.recevievedmessagecount = 0
    this.id = uuidv4()
    this.socks = []
  }

  /**
   * 
   * @returns { mocknode }
   */
  static create() {
    return new mocknode()
  }

  /**
   * 
   * @param { number } port 
   * @param { string } address 
   * @return { Promise }
   */
  async connect( port = 9002, address = "127.0.0.1" ) {

    const connectpromise = new Promise( r => this._newconnectresolve = r )
    this.connection = net.createConnection( port, address )
    this.connection.on( "connect", this._onsocketconnect.bind( this ) )
    this.connection.on( "data", this._onsocketdata.bind( this ) )

    await connectpromise
  }

  /**
   * Listen for connections to this mock node.
   * @param { number } [ port ] - default 9002
   * @return { Promise } 
   */
  listen( port = 9002, host = "127.0.0.1" ) {
    let listenresolve
    const listenpromise = new Promise( ( r ) => listenresolve = r )
    this.port = port
    this.host = host
    this.server = net.createServer( ( connection ) => {
      this.connection = connection
      this.connection.setKeepAlive( true )
      this.connection.on( "data", this._onsocketdata.bind( this ) )
    } )

    this.server.listen( port, host )
    this.server.on( "listening", () => listenresolve() )
    this.server.on( "close", () => {} )
    return listenpromise
  }

  /**
   * 
   * @param { string } event 
   * @param { function } cb 
   * @return { void }
   */
  setmessagehandler( event, cb ) {
    this.messagehandlers[ event ] = cb
  }

  /**
   * @return { void }
   */
  destroy() {
    if( this.connection ) this.connection.destroy()
    if( this.server ) this.server.close()
  }

  /**
   * @private
   * @return { void }
   */
  _onsocketconnect() {

    /* Pretend to be a node: our server will pass out new connections only after a
    stats message has been sent and it must have an instance id */
    const msg = {}
    msg.status = this.ourstats
    msg.status.instance = this.id
    this.connection.write( message.createmessage( msg ) )

    this._newconnectresolve()
  }

  /**
   * @private
   * @param { Buffer } data
   * @return { void }
   */
  _onsocketdata( data ) {
    message.parsemessage( this.mp, data, ( receivedmsg ) => {
      this.recevievedmessagecount++
      expect( receivedmsg ).to.have.property( "channel" ).that.is.a( "string" )
      expect( receivedmsg ).to.have.property( "id" ).that.is.a( "string" )
      this.messagehandlers[ receivedmsg.channel ]( receivedmsg )
    } )
  }

  /**
   * 
   * @param { object } obj 
   * @return { void }
   */
  sendmessage( obj ) {
    obj.status = this.ourstats
    this.connection.write( message.createmessage( obj ) )
  }
}


module.exports = mocknode