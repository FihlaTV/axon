// Copyright 2017-2019, University of Colorado Boulder

/**
 * IO type for NumberProperty.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const axon = require( 'AXON/axon' );
  const NumberIO = require( 'TANDEM/types/NumberIO' );
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const PropertyIO = require( 'AXON/PropertyIO' );
  const RangeIO = require( 'DOT/RangeIO' );
  const validate = require( 'AXON/validate' );

  // constants
  const PropertyIOImpl = PropertyIO( NumberIO );

  // valid values for options.numberType to convey whether it is continuous or discrete with step size 1
  const VALID_NUMBER_TYPES = [ 'FloatingPoint', 'Integer' ];

  class NumberPropertyIO extends PropertyIOImpl {

    /**
     * Encodes a NumberProperty instance to a state.
     * @param {Object} numberProperty
     * @returns {Object} - a state object
     * @override
     */
    static toStateObject( numberProperty ) {
      validate( numberProperty, this.validator );

      const parentStateObject = PropertyIOImpl.toStateObject( numberProperty );

      // conditionals to avoid keys with value "null" in state objects
      if ( numberProperty.numberType ) {
        parentStateObject.numberType = numberProperty.numberType;
      }

      if ( numberProperty.range ) {
        parentStateObject.range = RangeIO.toStateObject( numberProperty.range );
      }
      return parentStateObject;
    }

    /**
     * Decodes a state into a NumberProperty.
     * @param {Object} stateObject
     * @returns {Object}
     * @override
     */
    fromStateObject( stateObject ) {
      const fromParentStateObject = PropertyIOImpl.fromStateObject( stateObject );
      fromParentStateObject.numberType = stateObject.numberType;

      // Create Range instance if defined, otherwise preserve value of null or undefined.
      fromParentStateObject.range = stateObject.range ? RangeIO.fromStateObject( stateObject.range ) : stateObject.range;
      return fromParentStateObject;
    }

    /**
     * @param {NumberProperty} numberProperty
     * @param {Object} fromStateObject
     * @override
     */
    setValue( numberProperty, fromStateObject ) {
      validate( numberProperty, this.validator );

      PropertyIOImpl.setValue( numberProperty, fromStateObject );
      numberProperty.range = fromStateObject.range;
      numberProperty.numberType = fromStateObject.numberType;
    }
  }

  NumberPropertyIO.validator = {
    isValidValue: v => {
      const NumberProperty = window.phet ? phet.axon.NumberProperty : axon.NumberProperty;
      return v instanceof NumberProperty;
    }
  };

  NumberPropertyIO.typeName = 'NumberPropertyIO';
  NumberPropertyIO.documentation = 'Extends PropertyIO to add values for the numeric range ( min, max ) and numberType ( \'' +
                                   VALID_NUMBER_TYPES.join( '\' | \'' ) + '\' )';

  // we need this attribute to be defined even if the brand is not phetio, so we cannot rely on phetio inherit
  NumberPropertyIO.VALID_NUMBER_TYPES = VALID_NUMBER_TYPES;
  ObjectIO.validateSubtype( NumberPropertyIO );

  return axon.register( 'NumberPropertyIO', NumberPropertyIO );
} );