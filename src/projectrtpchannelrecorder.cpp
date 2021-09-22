

#include "projectrtpchannelrecorder.h"

/*
# channelrecorder
c'stor and create

Track files we are recording to.
*/
channelrecorder::channelrecorder( std::string file, std::function<void( const std::string, const std::string )> f ) :
  file( file ),
  poweraveragepackets( 50 ),
  startabovepower( 0 ),
  finishbelowpower( 0 ),
  minduration( 0 ),
  maxduration( 0 ),
  numchannels( 2 ),
  lastpowercalc( 0 ),
  created( boost::posix_time::microsec_clock::local_time() ),
  f( f ),
  _active( false )
{
}

channelrecorder::~channelrecorder() {
  if( this->f ) {
    this->f( this->file, this->finishreason );
  }
}

uint16_t channelrecorder::poweravg( uint16_t power ) {
  if( this->poweraveragepackets != this->powerfilter.getlength() )
  {
    this->powerfilter.reset( this->poweraveragepackets );
  }
  this->lastpowercalc = this->powerfilter.execute( power );
  return this->lastpowercalc;
}

channelrecorder::pointer channelrecorder::create( std::string file, std::function<void( const std::string, const std::string )> f ) {
  return pointer( new channelrecorder( file, f ) );
}

void channelrecorder::active( void ) {

  if( this->_active ) return;
  this->activeat = boost::posix_time::microsec_clock::local_time();

  this->_active = true;

  if( this->f ) {
    this->f( this->file, "recording" );
  }
}
