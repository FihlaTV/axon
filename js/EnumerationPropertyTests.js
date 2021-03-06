// Copyright 2019-2020, University of Colorado Boulder

/**
 * QUnit Tests for EnumerationProperty
 *
 * @author Chris Malley (PixelZoom, Inc.)
 */

import Enumeration from '../../phet-core/js/Enumeration.js';
import EnumerationIO from '../../phet-core/js/EnumerationIO.js';
import EnumerationProperty from './EnumerationProperty.js';

QUnit.module( 'EnumerationProperty' );
QUnit.test( 'EnumerationProperty', function( assert ) {

  const Birds = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
  let birdProperty = null;

  // constructor value
  assert.ok( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN );
  }, 'good constructor value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( true );
  }, 'invalid constructor value' );

  // set value
  assert.ok( () => {
    birdProperty.set( Birds.JAY );
  }, 'good set value' );
  window.assert && assert.throws( () => {
    birdProperty.set( 5 );
  }, 'bad set value' );

  // superclass options that are not supported by EnumerationProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { validValues: Birds.VALUES } );
  }, 'EnumerationProperty does not support validValues' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { isValidValue: () => true } );
  }, 'EnumerationProperty does not support isValidValue' );

  // superclass options that are controlled by EnumerationProperty
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { valueType: Birds } );
  }, 'EnumerationProperty sets valueType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, Birds.ROBIN, { phetioType: EnumerationIO } );
  }, 'EnumerationProperty sets phetioType' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( Birds, { phetioType: EnumerationIO } );
  }, 'Did not include initial value' );
  window.assert && assert.throws( () => {
    birdProperty = new EnumerationProperty( {} );
  }, 'That is not an enumeration' );

  assert.ok( true, 'so we have at least 1 test in this set' );
} );

QUnit.test( 'EnumerationIO validation', assert => {

    const Birds1 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ] );
    const Birds2 = Enumeration.byKeys( [ 'ROBIN', 'JAY', 'WREN' ], { phetioDocumentation: 'the second one' } );
    assert.ok( Birds1 !== Birds2, 'different Enumerations' );
    assert.ok( Birds1.ROBIN !== Birds2.ROBIN, 'different Enumerations' );
    const birdProperty = new EnumerationProperty( Birds1, Birds1.ROBIN );
    const birdProperty2 = new EnumerationProperty( Birds2, Birds2.ROBIN );

    assert.ok( true, 'so we have at least 1 test in this set' );
    // constructor value
    window.assert && assert.throws( () => {
      birdProperty.set( Birds2.ROBIN );
    }, 'cannot use same string value from other Enumeration instance' );

    birdProperty.set( Birds1.WREN );

    // This should not fail! If it does then EnumerationIO and PropertyIO caching isn't working, see https://github.com/phetsims/phet-core/issues/79
    birdProperty2.set( Birds2.WREN );
  }
);