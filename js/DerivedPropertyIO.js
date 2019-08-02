// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for DerivedProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Andrew Adare (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var axon = require( 'AXON/axon' );
  var phetioInherit = require( 'TANDEM/phetioInherit' );
  var PropertyIO = require( 'AXON/PropertyIO' );
  var VoidIO = require( 'TANDEM/types/VoidIO' );

  // constants
  const PROPERTY_IO_VALIDATOR = {
    isValidValue: v => {
      var DerivedProperty = window.phet ? phet.axon.DerivedProperty : axon.DerivedProperty;
      return v instanceof DerivedProperty;
    }
  };

  /**
   * Parametric IO type constructor.  Given an value type, this function returns an appropriate DerivedProperty IO type.
   *
   * @param {function} parameterType - phet-io type wrapper like StringIO, NumberIO, etc. If loaded by phet (not phet-io)
   *                                    it will be the function returned by the 'ifphetio!' plugin.
   */
  function DerivedPropertyIO( parameterType ) {

    // The parent type is also parameterized, so we have to instantiate it before we can extend it.
    var PropertyIOImpl = PropertyIO( parameterType );

    /**
     * This type constructor is parameterized based on the parameterType.
     *
     * @param {DerivedProperty} derivedProperty
     * @param {string} phetioID
     * @constructor
     */
    var DerivedPropertyIOImpl = function DerivedPropertyIOImpl( derivedProperty, phetioID ) {
      assert && assert( !!parameterType, 'DerivedPropertyIO needs parameterType' );

      PropertyIOImpl.call( this, derivedProperty, phetioID );
    };
    phetioInherit( PropertyIOImpl, 'DerivedPropertyIO', DerivedPropertyIOImpl, {

      setValue: {
        returnType: VoidIO,
        parameterTypes: [ parameterType ],
        implementation: function( value ) {
          return this.phetioObject.set( value );
        },
        documentation: 'Errors out when you try to set a derived property.',
        invocableForReadOnlyElements: false
      }
    }, {
      documentation: 'Like PropertyIO, but not settable.  Instead it is derived from other DerivedPropertyIO or PropertyIO ' +
                     'instances',

      // Used to generate the unique parametric typename for each PropertyIO
      parameterTypes: [ parameterType ],

      validator: PROPERTY_IO_VALIDATOR
    } );

    // @public - allow type checking for DerivedPropertyIOImpl
    // TODO: move this to static properties
    DerivedPropertyIOImpl.outerType = DerivedPropertyIO;

    return DerivedPropertyIOImpl;
  }

  axon.register( 'DerivedPropertyIO', DerivedPropertyIO );

  return DerivedPropertyIO;
} );