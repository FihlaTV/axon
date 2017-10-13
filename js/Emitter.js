// Copyright 2015, University of Colorado Boulder

/**
 * Lightweight event & listener abstraction for a single event type.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );
  var phetioEvents = require( 'ifphetio!PHET_IO/phetioEvents' );
  var Tandem = require( 'TANDEM/Tandem' );
  var TEmitter = require( 'AXON/TEmitter' );

  /**
   *
   * @constructor
   */
  function Emitter( options ) {

    // @private {Function[]} - the listeners to emit to
    this.listeners = [];

    // @private - during emit() keep track of which listeners should receive events in order to manage removal of
    //          - listeners during emit()
    this.listenersToEmitTo = [];

    options = _.extend( {
      phetioArgumentTypes: [], // {Object[]} - for serializing/displaying the values during emit. Key = arg name, value = TType
      tandem: Tandem.tandemOptional(),

      // Can be overriden to suppress data from the phet-io data stream.  For example, clock tick
      // emits would spam the console, but the wrapper may still want to listen for the emits
      // TODO: this may not be needed once phetioEvents is fully implemented.
      phetioEvents: true
    }, options );

    var self = this;

    // @private
    this.tandem = options.tandem;

    // @private
    this.phetioArgumentTypes = options.phetioArgumentTypes;

    // Tandem registration
    this.ttype = TEmitter( options.phetioArgumentTypes );
    options.tandem.addInstance( this, this.ttype, options );

    // @private - only emit data in phet-io brand and when tandem is provided and when supposed to emit data
    this.emitToPhETIO = options.phetioEmitData && this.tandem.isLegalAndUsable();

    // @private
    this.disposeEmitter = function() {

      // See https://github.com/phetsims/axon/issues/124
      self.listeners.length = 0;

      // Tandem de-registration
      options.tandem.removeInstance( self );
    };
  }

  axon.register( 'Emitter', Emitter );

  return inherit( Object, Emitter, {

    /**
     * Dispose an Emitter that is no longer used.  Like Property.dispose, this method checks that there are no leaked
     * listeners.
     */
    dispose: function() {
      this.disposeEmitter();
    },

    /**
     * Adds a listener
     * @param {function} listener
     * @public
     */
    addListener: function( listener ) {

      assert && assert( this.listeners.indexOf( listener ) === -1, 'Cannot add the same listener twice' );

      // If callbacks are in progress, make a copy of the current list of listeners--the newly added listener
      // will be available for the next emit() but not the one in progress.  This is to match behavior with removeListener
      this.defendCallbacks();

      this.listeners.push( listener );
    },

    /**
     * Removes a listener
     * @param {function} listener
     * @public
     */
    removeListener: function( listener ) {

      var index = this.listeners.indexOf( listener );
      assert && assert( index >= 0, 'tried to removeListener on something that wasn\'t a listener' );

      // If callbacks are in progress, make a copy of the current list of listeners--the removed listener
      // will remain in the list and receive a callback for this emit call, see #72
      this.defendCallbacks();

      this.listeners.splice( index, 1 );
    },

    /**
     * Removes all the listeners
     * @public
     */
    removeAllListeners: function() {
      while ( this.listeners.length > 0 ) {
        this.removeListener( this.listeners[ 0 ] );
      }
    },

    /**
     * If processing callbacks during an emit() call and addListener/removeListener() is called,
     * make a defensive copy of the array of listener before changing the array, and use it for
     * the rest of the callbacks until the emit call has completed.
     * @private
     */
    defendCallbacks: function() {

      for ( var i = this.listenersToEmitTo.length - 1; i >= 0; i-- ) {

        // Once we meet a level that was already defended, we can stop, since all previous levels are also defended
        if ( this.listenersToEmitTo[ i ].defended ) {
          break;
        }
        else {
          var defendedListeners = this.listeners.slice();

          // Mark copies as 'defended' so that it will use the original listeners when emit started and not the modified list.
          defendedListeners.defended = true;
          this.listenersToEmitTo[ i ] = defendedListeners;
        }
      }
    },

    /**
     * Emits a single event.
     * This method is called many times in a simulation and must be well-optimized.
     * @public
     */
    emit: function() {

      var id = this.emitToPhETIO && phetioEvents.start( 'model', this.tandem.id, this.ttype, 'emitted' );
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]();
      }

      this.listenersToEmitTo.pop();
      this.emitToPhETIO && phetioEvents.end( id );
    },

    /**
     * Emits a single event with one argument.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @public
     */
    emit1: function( arg0 ) {

      // TODO: name the args for the data stream

      var id = this.emitToPhETIO && phetioEvents.start( 'model', this.tandem.id, this.ttype, 'emitted', {
        args: [ this.phetioArgumentTypes[ 0 ].toStateObject( arg0 ) ]
      } );
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]( arg0 );
      }

      this.listenersToEmitTo.pop();
      this.emitToPhETIO && phetioEvents.end( id );
    },

    /**
     * Emits a single event with two arguments.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @param {*} arg1
     * @public
     */
    emit2: function( arg0, arg1 ) {
      var id = this.emitToPhETIO && phetioEvents.start( 'model', this.tandem.id, this.ttype, 'emitted', {
        args: [
          this.phetioArgumentTypes[ 0 ].toStateObject( arg0 ),
          this.phetioArgumentTypes[ 1 ].toStateObject( arg1 )
        ]
      } );
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]( arg0, arg1 );
      }

      this.listenersToEmitTo.pop();
      this.emitToPhETIO && phetioEvents.end( id );
    },

    /**
     * Emits a single event with three arguments.  This is a copy-paste of emit() for performance reasons.
     * @param {*} arg0
     * @param {*} arg1
     * @param {*} arg2
     * @public
     */
    emit3: function( arg0, arg1, arg2 ) {
      var id = this.emitToPhETIO && phetioEvents.start( 'model', this.tandem.id, this.ttype, 'emitted', {
        args: [
          this.phetioArgumentTypes[ 0 ].toStateObject( arg0 ),
          this.phetioArgumentTypes[ 1 ].toStateObject( arg1 ),
          this.phetioArgumentTypes[ 2 ].toStateObject( arg2 )
        ]
      } );
      this.listenersToEmitTo.push( this.listeners );
      var lastEntry = this.listenersToEmitTo.length - 1;

      for ( var i = 0; i < this.listenersToEmitTo[ lastEntry ].length; i++ ) {
        this.listenersToEmitTo[ lastEntry ][ i ]( arg0, arg1, arg2 );
      }

      this.listenersToEmitTo.pop();
      this.emitToPhETIO && phetioEvents.end( id );
    },

    /**
     * Checks whether a listener is registered with this Emitter
     * @param {function} listener
     * @returns {boolean}
     * @public
     */
    hasListener: function( listener ) {
      assert && assert( arguments.length === 1, 'Emitter.hasListener should be called with 1 argument' );
      return this.listeners.indexOf( listener ) >= 0;
    },

    /**
     * Returns true if there are any listeners.
     * @returns {boolean}
     * @public
     */
    hasListeners: function() {
      assert && assert( arguments.length === 0, 'Emitter.hasListeners should be called without arguments' );
      return this.listeners.length > 0;
    }
  } );
} );