// Copyright 2018, University of Colorado Boulder

/**
 * Property wrapper that keeps track of whether the UserControlledProperty.set() method is being called, in order to
 * set the direction of data flow.  See https://github.com/phetsims/phet-io/issues/1349
 *
 * This implementation explicitly forwards to all Property methods.  This is verbose and unmaintainable, but
 * will have good performance.  If methods are changed in the Property hierarchy, that must be reflected here.
 * An alternative strategy would be to use Proxy or to create method/property bindings for each key in the passed object.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );

  class UserControlledProperty {

    /**
     * @param {Property} property - initial value
     */
    constructor( property ) {

      // @private - for forwarding
      this.property = property;

      // @public properties from PhetioObject
      this.tandem = property.tandem;
      this.phetioType = property.phetioType;
      this.phetioState = property.phetioState;
      this.phetioReadOnly = property.phetioReadOnly;
      this.phetioInstanceDocumentation = property.phetioInstanceDocumentation;
      this.phetioWrapper = property.phetioWrapper;

      // @public properies from Property
      this.units = property.units;
      this.validValues = property.validValues;
      this.isDisposed = property.isDisposed;

      // @public properties from NumberProperty
      this.numberType = property.numberType;
      this.range = property.range;

      // New properties for this type
      this._isUserControlled = false;
    }

    /**
     * Indicates whether the value is being set by a user interface element.
     * @returns {boolean}
     * @public
     */
    isUserControlled() {
      return this._isUserControlled;
    }

    /**
     * @param {*} value
     * @returns {Property} this instance, for chaining.
     * @public
     */
    set( value ) {
      assert && assert( !this._isUserControlled, 'This property is already user controlled' );
      this._isUserControlled = true;
      this.property.set( value );
      this._isUserControlled = false;
    }

    // @public PhetioObject methods
    phetioStartEvent( event, args, options ) {return this.property.phetioStartEvent( event, args, options );}

    phetioEndEvent( event, args, options ) {return this.property.phetioEndEvent( event, args, options );}

    dispose() {return this.property.dispose();}

    // @public Property methods
    get() {return this.property.get();}

    get initialValue() {return this.property.initialValue;}

    notifyListenersStatic() {return this.property.notifyListenersStatic();}

    reset() {return this.property.reset();}

    get value() { return this.property.value; }

    set value( newValue ) { this.property.value = newValue; }

    link( listener ) {return this.property.link( listener );}

    lazyLink( listener ) {return this.property.lazyLink( listener );}

    unlink( listener ) {return this.property.unlink( listener );}

    unlinkAll() {return this.property.unlinkAll();}

    linkAttribute( object, attributeName ) {return this.property.linkAttribute( object, attributeName );}

    unlinkAttribute( listener ) {return this.property.unlinkAttribute( listener );}

    toString() {return 'Property{' + this.get() + '}'; }

    valueOf() {return this.toString();}

    debug( name ) {return this.property.debug( name );}

    toggle() {return this.property.toggle();}

    hasListener( listener ) {return this.property.hasListener( listener );}

    hasListeners() {return this.property.hasListeners();}
  }

  return axon.register( 'UserControlledProperty', UserControlledProperty );
} );