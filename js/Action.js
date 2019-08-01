// Copyright 2019, University of Colorado Boulder

/**
 * An action that can be executed and sent to the PhET-iO data stream, and optionally recorded for playback. This type
 * will also validate the argument types passed to the action function.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ActionIO = require( 'AXON/ActionIO' );
  const axon = require( 'AXON/axon' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const ValidatorDef = require( 'AXON/ValidatorDef' );
  const validate = require( 'AXON/validate' );

  // constants
  const ActionIOWithNoArgs = ActionIO( [] );

  // Simulations have thousands of Emitters, so we re-use objects where possible.
  const EMPTY_ARRAY = [];
  assert && Object.freeze( EMPTY_ARRAY );

  class Action extends PhetioObject {

    /**
     * @param {function} action - the function that is called when this Action occurs
     * @param {Object} [options]
     */
    constructor( action, options ) {

      // It is important to know if the following options were provided by the client
      const phetioTypeSupplied = options && options.hasOwnProperty( 'phetioType' ); // TODO: this will be removed, https://github.com/phetsims/axon/issues/257
      const validatorsSupplied = options && options.hasOwnProperty( 'parameters' );

      // Important to be before super call. OK to supply either or one or the other, but not both. This is a NAND operator.
      // TODO: this is not going to fly, https://github.com/phetsims/axon/issues/257
      assert && assert( !( phetioTypeSupplied && validatorsSupplied ),
        'use either phetioType or parameters, not both, see EmitterIO to set parameters on an instrumented Action'
      );

      // ActionIO that have 0 args should use the built-in ActionIO([]) default.  But we must support EmitterIO([]),
      // so we guard based on the type name.
      if ( assert && phetioTypeSupplied && options.phetioType.typeName.indexOf( 'ActionIO' ) === 0 ) {
        assert( options.phetioType.parameterTypes.length > 0, 'do not specify phetioType that is the same as the default' );
      }

      options = _.extend( {

        // {ValidatorDef[]}
        parameters: EMPTY_ARRAY,

        // phet-io - see PhetioObject.js for doc
        tandem: Tandem.optional,
        phetioState: false,
        phetioType: ActionIOWithNoArgs, // subtypes can override with ActionIO([...]), see ActionIO.js
        phetioPlayback: PhetioObject.DEFAULT_OPTIONS.phetioPlayback,
        phetioEventMetadata: PhetioObject.DEFAULT_OPTIONS.phetioEventMetadata
      }, options );

      // Use the phetioType's validators if provided, we know we aren't overwriting here because of the above assertion
      if ( phetioTypeSupplied ) {
        options.parameters = options.phetioType.parameters;
      }

      // phetioPlayback events need to know the order the arguments occur in order to call EmitterIO.emit()
      // Indicate whether the event is for playback, but leave this "sparse"--only indicate when this happens to be true
      if ( options.phetioPlayback ) {
        options.phetioEventMetadata = options.phetioEventMetadata || {};

        assert && assert( !options.phetioEventMetadata.hasOwnProperty( 'dataKeys' ),
          'dataKeys should be supplied by Action, not elsewhere' );

        options.phetioEventMetadata.dataKeys = options.phetioType.elements.map( element => element.name );
      }

      super( options );

      assert && this.validateValidators( options.parameters, validatorsSupplied, phetioTypeSupplied );

      // @public (only for testing) - Note: one test indicates stripping this out via assert && in builds may save around 300kb heap
      this.parameters = options.parameters;

      assert && assert( typeof action === 'function', 'action should be a function' );

      // @private {function}
      this._action = action;
    }

    /**
     * @param {ValidatorDef[]} validators
     * @param {boolean} validatorsSuppliedByClient - true if the validators option was passed into the constructor via options,
     *                                               false if using the default from the options extend call
     * @param phetioTypeSuppliedByClient - true if the phetioType option was passed into the constructor via options,
     *                                     false if using the default from the options extend call
     * @private
     */
    validateValidators( validators, validatorsSuppliedByClient, phetioTypeSuppliedByClient ) {

      // validate the validators object
      validate( validators, { valueType: Array } );

      this.isPhetioInstrumented() && assert( !validatorsSuppliedByClient, 'when specifying tandem, use phetioType instead of validators' );

      // Iterate through each validator and make sure that it won't validate options on validating value. This is
      // mainly done for performance
      validators.forEach( validator => {
        assert(
          validator.validateOptionsOnValidateValue !== true,
          'Action sets its own validateOptionsOnValidateValue for each argument type'
        );
        validator.validateOptionsOnValidateValue = false;

        // Changing the validator options after construction indicates a logic error, except that many EmitterIOs
        // are shared between instances. Don't assume we "own" the validator if it came from the TypeIO.
        !phetioTypeSuppliedByClient && Object.freeze( validator );

        // validate the options passed in to validate each Action argument
        ValidatorDef.validateValidator( validator );
      } );

      // Changing after construction indicates a logic error, except that many EmitterIOs are shared between instances.
      // Don't assume we "own" the validator if it came from the TypeIO.
      !phetioTypeSuppliedByClient && Object.freeze( validators );
    }

    /**
     * Gets the data that will be emitted to the PhET-iO data stream, for an instrumented simulation.
     * @returns {*}
     * @private
     */
    getPhetioData() {

      // null if there are no arguments. dataStream.js omits null values for data
      let data = null;
      if ( this.phetioType.elements.length > 0 ) {

        // Enumerate named argsObject for the data stream.
        data = {};
        for ( let i = 0; i < this.phetioType.elements.length; i++ ) {
          const element = this.phetioType.elements[ i ];
          data[ element.name ] = element.type.toStateObject( arguments[ i ] );
        }
      }
      return data;
    }

    /**
     * Invokes the action.
     * @params - expected parameters are based on options.parameters, see constructor
     * @public
     */
    execute() {
      if ( assert ) {
        assert( arguments.length === this.parameters.length,
          `Emitted unexpected number of args. Expected: ${this.parameters.length} and received ${arguments.length}`
        );
        for ( let i = 0; i < this.parameters.length; i++ ) {
          validate( arguments[ i ], this.parameters[ i ] );
        }
      }

      // handle phet-io data stream for the emitted event
      this.isPhetioInstrumented() && this.phetioStartEvent( 'emitted', this.getPhetioData.apply( this, arguments ) );

      this._action.apply( null, arguments );

      this.isPhetioInstrumented() && this.phetioEndEvent();
    }
  }

  return axon.register( 'Action', Action );
} );