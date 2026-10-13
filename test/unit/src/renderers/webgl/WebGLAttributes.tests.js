import { WebGLAttributes } from '../../../../../src/renderers/webgl/WebGLAttributes.js';
import { BufferAttribute } from '../../../../../src/core/BufferAttribute.js';

QUnit.module( 'Renderers', () => {

	QUnit.module( 'WebGLAttributes', () => {

		QUnit.test( 'partial updates merge ordered and unordered ranges', ( assert ) => {

			const cases = [
				[[[ 0, 3 ], [ 3, 3 ], [ 20, 2 ], [ 19, 2 ]], [[ 0, 0, 6 ], [ 76, 19, 3 ]]],
				[[[ 5, 3 ], [ 8, 3 ], [ 0, 2 ]], [[ 0, 0, 2 ], [ 20, 5, 6 ]]],
				[[], [[ 0, undefined, undefined ]]],
				[[[ 4, 2 ]], [[ 16, 4, 2 ]]],
				[[[ 0, 3 ], [ 3, 2 ], [ 10, 2 ]], [[ 0, 0, 5 ], [ 40, 10, 2 ]]],
				[[[ 10, 2 ], [ 3, 2 ], [ 0, 3 ]], [[ 0, 0, 5 ], [ 40, 10, 2 ]]],
				[[[ 0, 8 ], [ 0, 2 ], [ 3, 2 ], [ 8, 2 ]], [[ 0, 0, 10 ]]],
				[[[ 0, 2 ], [ 3, 2 ], [ 9, 1 ], [ 7, 2 ]], [[ 0, 0, 5 ], [ 28, 7, 3 ]]]
			];

			for ( const [ ranges, expected ] of cases ) {

				const calls = [];
				const gl = {
					createBuffer: () => ( {} ),
					bindBuffer() {},
					bufferData() {},
					bufferSubData( target, offset, array, start, count ) {

						calls.push( [ offset, start, count ] );

					}
				};
				const attributes = WebGLAttributes( gl );
				const attribute = new BufferAttribute( new Float32Array( 32 ), 1 );
				attributes.update( attribute, 0 );
				for ( const [ start, count ] of ranges ) attribute.addUpdateRange( start, count );
				attribute.needsUpdate = true;
				let callbacks = 0;
				attribute.onUpload( () => callbacks ++ );
				attributes.update( attribute, 0 );
				assert.deepEqual( calls, expected, JSON.stringify( ranges ) );
				assert.strictEqual( attribute.updateRanges.length, 0, 'Ranges cleared' );
				assert.strictEqual( callbacks, 1, 'Upload callback runs once' );
				attributes.update( attribute, 0 );
				assert.strictEqual( calls.length, expected.length, 'Unchanged version does not upload again' );

			}

		} );

	} );

} );
