// Copyright 2017-2020, University of Colorado Boulder

/**
 * QUnit tests for DerivedProperty
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import DerivedProperty from './DerivedProperty.js';
import Property from './Property.js';

QUnit.module( 'DerivedProperty' );

QUnit.test( 'Test stale values in DerivedProperty', function( assert ) {
  const a = new Property( 1 );
  const b = new Property( 2 );
  const c = new DerivedProperty( [ a, b ], function( a, b ) {return a + b;} );
  a.value = 7;
  assert.equal( c.value, 9 );
} );

QUnit.test( 'Test DerivedProperty.unlink', function( assert ) {

  const widthProperty = new Property( 2 );
  const heightProperty = new Property( 3 );
  const areaProperty = new DerivedProperty( [ widthProperty, heightProperty ],
    function( width, height ) { return width * height; } );
  const listener = function( area ) { /*console.log( 'area = ' + area );*/ };
  areaProperty.link( listener );

  assert.equal( widthProperty.changedEmitter.getListenerCount(), 1 );
  assert.equal( heightProperty.changedEmitter.getListenerCount(), 1 );
  assert.equal( areaProperty.dependencies.length, 2 );
  assert.equal( areaProperty.dependencyListeners.length, 2 );

  // Unlink the listener
  areaProperty.unlink( listener );
  areaProperty.dispose();

  assert.equal( widthProperty.changedEmitter.getListenerCount(), 0 );
  assert.equal( heightProperty.changedEmitter.getListenerCount(), 0 );
  assert.equal( heightProperty.changedEmitter.getListenerCount(), 0 );

  assert.equal( areaProperty.dependencies, null );
  assert.equal( areaProperty.dependencyListeners, null );
  assert.equal( areaProperty.dependencyValues, null );

} );


QUnit.test( 'DerivedProperty.valueEquals', function( assert ) {
  const propA = new Property( 'a' );
  const propB = new Property( 'b' );
  const prop = DerivedProperty.valueEquals( propA, propB );
  assert.equal( prop.value, false );
  propA.value = 'b';
  assert.equal( prop.value, true );
} );

QUnit.test( 'DerivedProperty and/or', function( assert ) {

  const propA = new Property( false );
  const propB = new Property( false );
  const propC = new Property( false );
  const propD = new Property( 0 ); // dependency with an invalid (non-boolean) type

  // fail: 'and' with non-boolean Property
  window.assert && assert.throws( function() { return DerivedProperty.and( [ propA, propD ] ); },
    'DerivedProperty.and requires booleans Property values' );

  // fail: 'or' with non-boolean Property
  window.assert && assert.throws( function() { return DerivedProperty.or( [ propA, propD ] ); },
    'DerivedProperty.or requires booleans Property values' );

  // correct usages of 'and' and 'or'
  const and = DerivedProperty.and( [ propA, propB, propC ] );
  const or = DerivedProperty.or( [ propA, propB, propC ] );

  assert.equal( and.value, false );
  assert.equal( or.value, false );

  propA.value = true;
  assert.equal( and.value, false );
  assert.equal( or.value, true );

  propB.value = true;
  assert.equal( and.value, false );
  assert.equal( or.value, true );

  propC.value = true;
  assert.equal( and.value, true );
  assert.equal( or.value, true );

  // fail: setting a dependency to a non-boolean value
  window.assert && assert.throws( function() { propA.value = 0; },
    'DerivedProperty dependency must have boolean value' );
} );