// Copyright 2002-2013, University of Colorado Boulder

/**
 * PropertySet facilitates creation and use of multiple named Property instances.  There are still several API design issues in question, but this
 * class is ready for use.
 *
 * A PropertySet is a set of Property instances that provides support for:
 * -Easily creating several properties using an object literal (hash)
 * -Resetting them as a group
 * -Set multiple values at once, using propertySet.set({x:100,y:200,name:'alice'});
 * -Support for derived properties, which appear with the same interface as basic properties
 * -Convenient toString that prints e.g., PropertySet{name:'larry',age:101,kids:['alice','bob']}
 * -Wiring up to listen to multiple properties simultaneously
 * -Add properties after the PropertySet is created?  Don't forget to add to the key list as well.
 * -Remove properties that were added using addProperty or the constructor
 *
 * Sample usage:
 * var p = new PropertySet( {name: 'larry', age: 100, kids: ['alice', 'bob']} );
 * p.nameProperty.link( function( n ) {console.log( 'hello ' + n );} );
 * p.name = 'jensen';
 * p.age = 101;//Happy Birthday!
 * console.log( p );
 * p.reset();
 * console.log( p );
 * p.set({name:'clark',age:102,kids:['alice','bob','charlie']});
 *
 * How would this be done without PropertySet (for comparison)?
 * //Normally would be created in a class but that is omitted here for brevity.
 * var p ={name: new Property('larry'), age: new Property('age'), kids: new Property(['alice','bob'])}
 * p.reset = function(){
 *   this.name.reset(); 
 *   this.age.reset();
 *   this.kids.reset();
 * }
 * p.name.set('clark');
 * p.age.set('102');
 * p.kids.set(['alice','bob','charlie']);
 *
 * Note: If a subclass ever substitutes a property like this: person.ageProperty = new Property(person.age), then it would break the getter/setter
 * @author Sam Reid
 */

define( function( require ) {
  'use strict';

  var Property = require( 'AXON/Property' );
  var DerivedProperty = require( 'AXON/DerivedProperty' );
  var Events = require( 'AXON/Events' );
  var axon = require( 'AXON/axon' );
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @class PropertySet
   * @constructor
   * @param values an object hash with the initial values for the properties
   * @param {object} [options] -
   *                           - propertySetID: optional identifier used in data collection messages
   */
  axon.PropertySet = function PropertySet( values, options ) {
    var propertySet = this;
    this.propertySetID = options ? options.propertySetID : null;

    Events.call( this );

    //Keep track of the keys so we know which to reset
    this.keys = [];

    Object.getOwnPropertyNames( values ).forEach( function( value ) {
      propertySet.addProperty( value, values[ value ], propertySet.propertySetID );
    } );
  };

  return inherit( Events, axon.PropertySet, {

    /**
     * Adds a new property to this PropertySet
     *
     * @param {string} name
     * @param value
     * @param propertySetID
     */
    addProperty: function( name, value, propertySetID ) {
      if ( propertySetID !== null && typeof( propertySetID ) !== 'undefined' && typeof( propertySetID ) !== 'string' ) {
        throw new Error( 'If defined, the propertySetID must be a string.' );
      }
      var propertyID;
      if ( typeof( propertySetID ) === 'string' ) {
        propertyID = propertySetID + '.' + name;
      }
      else {
        propertyID = name;
      }
      this[ name + 'Property' ] = new Property( value, { propertyID: propertyID } );
      this.addGetterAndSetter( name );
      this.keys.push( name );
    },

    /**
     * Remove any property (whether a derived property or not) that was added to this PropertySet
     * @param name
     */
    removeProperty: function( name ) {

      //Remove from the keys (only for non-derived properties)
      var index = this.keys.indexOf( name );
      if ( index !== -1 ) {
        this.keys.splice( index, 1 );
      }

      //Unregister the Property instance from the PropertySet
      delete this[ name + 'Property' ];

      //Unregister the getter/setter, if they exist
      delete this[ name ];
    },

    //Add a getter and setter using ES5 get/set syntax, similar to https://gist.github.com/dandean/1292057, same as in github/Atlas
    addGetterAndSetter: function( name ) {
      var property = this[ name + 'Property' ];

      Object.defineProperty( this, name, {

        // Getter proxies to Model#get()...
        get: function() { return property.get();},

        // Setter proxies to Model#set(attributes)
        set: function( value ) { property.set( value );},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    addGetter: function( name ) {
      var property = this[ name + 'Property' ];

      Object.defineProperty( this, name, {

        get: function() { return property.get();},

        // Make it configurable and enumerable so it's easy to override...
        configurable: true,
        enumerable: true
      } );
    },

    //Resets all of the properties associated with this PropertySet
    reset: function() {
      var propertySet = this;
      this.keys.forEach( function( key ) {
        propertySet[ key + 'Property' ].reset();
      } );
    },

    /**
     * Creates a DerivedProperty from the given dependency names and derivation.
     * @param {string[]} dependencyNames
     * @param {function} derivation
     * @returns {DerivedProperty}
     */
    toDerivedProperty: function( dependencyNames, derivation ) {
      return new DerivedProperty( this.getProperties( dependencyNames ), derivation );
    },

    addDerivedProperty: function( name, dependencyNames, derivation ) {
      this[ name + 'Property' ] = this.toDerivedProperty( dependencyNames, derivation );
      this.addGetter( name );
    },

    /**
     * Returns an array of the requested properties.
     * @param dependencyNames
     * @returns {*}
     * @private
     */
    getProperties: function( dependencyNames ) {
      var propertySet = this;
      return dependencyNames.map( function( dependency ) {
        var propertyKey = dependency + 'Property';
        assert && assert( propertySet.hasOwnProperty( propertyKey ) );
        return propertySet[ propertyKey ];
      } );
    },

    /**
     * Set all of the values specified in the object hash
     * Allows you to use this form:
     * puller.set( {x: knot.x, y: knot.y, knot: knot} );
     *
     * instead of this:
     * puller.x.value = knot.x;
     * puller.y.value = knot.y;
     * puller.knot.value = knot;
     *
     * Throws an error if you try to set a value for which there is no property.
     */
    setValues: function( values ) {
      var propertySet = this;
      Object.getOwnPropertyNames( values ).forEach( function( val ) {
        if ( typeof(propertySet[ val + 'Property' ] === 'Property') ) {
          propertySet[ val + 'Property' ].set( values[ val ] );
        }
        else {
          throw new Error( 'property not found: ' + val );
        }
      } );
    },

    /**
     * Get a JS object literal with all the current values of the properties in this property set, say for serialization.  See `set`
     * TODO: this works well to serialize numbers, strings, booleans.  How to handle complex state values such as Vector2 or nested Property?  Maybe that must be up to the client code.
     * TODO: This was named 'get' to mirror the 'set' method above, but I'm concerned this will make them difficult to find/replace and may confuse with real getters & setters.  Maybe setState/getState would be better?
     */
    getValues: function() {
      var state = {};
      for ( var i = 0; i < this.keys.length; i++ ) {
        var key = this.keys[ i ];
        state[ key ] = this.property( key ).value;
      }
      return state;
    },

    /**
     * Registers an observer with multiple properties, then notifies the observer immediately.
     * @param {string[]} dependencyNames
     * @param {function} observer no params, returns nothing
     */
    multilink: function( dependencyNames, observer ) {
      return new axon.Multilink( this.getProperties( dependencyNames ), observer, false );
    },

    lazyMultilink: function( dependencyNames, observer ) {
      return new axon.Multilink( this.getProperties( dependencyNames ), observer, true );
    },

    /**
     * Removes the multilinked listener from this PropertySet.
     * Same as calling detach() on the handle (which happens to be a DerivedProperty instance)
     * @param derivedProperty
     */
    unmultilink: function( derivedProperty ) {
      derivedProperty.detach();
    },

    toString: function() {
      var text = 'PropertySet{';
      var propertySet = this;
      for ( var i = 0; i < this.keys.length; i++ ) {
        var key = this.keys[ i ];
        text = text + key + ':' + propertySet[ key ].toString();
        if ( i < this.keys.length - 1 ) {
          text = text + ',';
        }
      }
      return text + '}';
    },

    /**
     * Link to a property by name, see https://github.com/phetsims/axon/issues/16
     * @param {string} propertyName the name of the property to link to
     * @param {function }observer the callback to link to the property
     */
    link: function( propertyName, observer ) {
      this[ propertyName + 'Property' ].link( observer );
    },

    /**
     * Get a property by name, see https://github.com/phetsims/axon/issues/16
     * @param {string} propertyName the name of the property to get
     */
    property: function( propertyName ) {
      return this[ propertyName + 'Property' ];
    },

    /**
     * Link an attribute to a property by name.  Return a handle to the listener so it can be removed using unlink().
     * @param {string} propertyName the property to link to
     * @param {object} object the object for which the attribute will be set
     * @param {string} attributeName the name of the attribute to set on the object
     */
    linkAttribute: function( propertyName, object, attributeName ) {
      return this.property( propertyName ).linkAttribute( object, attributeName );
    },

    /**
     * Unlink a listener added with linkAttribute.  Note: the args of linkAttribute do not match the args of
     * unlinkAttribute: here, you must pass the listener handle returned by linkAttribute rather than object and attributeName
     * @param {string} propertyName - the name of the property that the listener will be removed from
     * @param {function} listener
     */
    unlinkAttribute: function( propertyName, listener ) {
      this.property( propertyName ).unlink( listener );
    },
  } );
} );
