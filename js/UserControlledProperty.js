// Copyright 2018, University of Colorado Boulder

/**
 * Property wrapper that keeps track of whether the UserControlledProperty.set() method is being called.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {Property} property - initial value
   * @param {Object} [options]
   * @constructor
   */
  function UserControlledProperty( property, options ) {
    this._isUserControlled = false;

    this.property = property;
    this.range = options.range;
  }

  axon.register( 'UserControlledProperty', UserControlledProperty );

  return inherit( Object, UserControlledProperty, {
    /**
     * @param {*} value
     * @returns {Property} this instance, for chaining.
     * @public
     */
    set: function( value ) {
      assert && assert( !this._isUserControlled, 'This property is already user controlled' );
      this._isUserControlled = true;
      this.property.value = value;
      this._isUserControlled = false;
    },

    get: function() {
      return this.property.value;
    },

    isUserControlled: function() {
      return this._isUserControlled;
    },

    link: function( f ) {
      this.property.link( f );
    },

    lazyLink: function( f ) {
      this.property.lazyLink( f );
    },

    set value( value ) {
      this.set( value );
    },

    get value() {
      return this.get();
    }
  } );
} );