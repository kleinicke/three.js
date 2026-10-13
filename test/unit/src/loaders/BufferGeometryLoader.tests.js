import { BufferGeometryLoader } from '../../../../src/loaders/BufferGeometryLoader.js';

import { BufferAttribute, Float16BufferAttribute } from '../../../../src/core/BufferAttribute.js';
import { InstancedBufferGeometry } from '../../../../src/core/InstancedBufferGeometry.js';
import { InstancedBufferAttribute } from '../../../../src/core/InstancedBufferAttribute.js';
import { toHalfFloat } from '../../../../src/extras/DataUtils.js';
import { BufferGeometry } from '../../../../src/core/BufferGeometry.js';
import { InterleavedBuffer } from '../../../../src/core/InterleavedBuffer.js';
import { InterleavedBufferAttribute } from '../../../../src/core/InterleavedBufferAttribute.js';
import { DynamicDrawUsage } from '../../../../src/constants.js';
import { Loader } from '../../../../src/loaders/Loader.js';

export default QUnit.module( 'Loaders', () => {

	QUnit.module( 'BufferGeometryLoader', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const object = new BufferGeometryLoader();
			assert.strictEqual(
				object instanceof Loader, true,
				'BufferGeometryLoader extends from Loader'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			const object = new BufferGeometryLoader();
			assert.ok( object, 'Can instantiate a BufferGeometryLoader.' );

		} );

		// OTHERS
		QUnit.test( 'parser - attributes - circlable', ( assert ) => {

			const loader = new BufferGeometryLoader();
			const geometry = new BufferGeometry();
			const attr = new BufferAttribute( new Float32Array( [ 7, 8, 9, 10, 11, 12 ] ), 2, true );
			attr.name = 'attribute';
			attr.setUsage( DynamicDrawUsage );

			geometry.setAttribute( 'attr', attr );

			const geometry2 = loader.parse( geometry.toJSON() );

			assert.ok( geometry2.getAttribute( 'attr' ),
				'Serialized attribute can be deserialized under the same attribute key.' );

			assert.deepEqual(
				geometry.getAttribute( 'attr' ),
				geometry2.getAttribute( 'attr' ),
				'Serialized attribute can be deserialized correctly.'
			);

		} );

		QUnit.test( 'parser - round trip of attribute and geometry state', ( assert ) => {

			const geometry = new InstancedBufferGeometry();
			geometry.setAttribute( 'position', new Float16BufferAttribute( [ 0.5, 1, 2 ].map( toHalfFloat ), 3 ) );
			geometry.setAttribute( 'offset', new InstancedBufferAttribute( new Float32Array( 6 ), 3, false, 2 ) );
			geometry.instanceCount = 3;
			geometry.setDrawRange( 0, 1 );

			const loaded = new BufferGeometryLoader().parse( JSON.parse( JSON.stringify( geometry.toJSON() ) ) );

			assert.ok( loaded.attributes.position.isFloat16BufferAttribute, 'Float16BufferAttribute' );
			assert.strictEqual( loaded.attributes.position.getX( 0 ), 0.5, 'half float values' );
			assert.strictEqual( loaded.attributes.offset.meshPerAttribute, 2, 'meshPerAttribute' );
			assert.strictEqual( loaded.instanceCount, 3, 'instanceCount' );
			assert.deepEqual( loaded.drawRange, { start: 0, count: 1 }, 'drawRange' );

			geometry.setDrawRange( 1, Infinity );
			assert.strictEqual( new BufferGeometryLoader().parse( JSON.parse( JSON.stringify( geometry.toJSON() ) ) ).drawRange.count, Infinity, 'open drawRange' );

		} );

		QUnit.test( 'parser - interleaved attributes - views into a shared array buffer', ( assert ) => {

			// e.g. GLTFLoader creates interleaved buffers as views at different offsets into one array buffer

			const buffer = new Float32Array( [ 1, 2, 3, 0, 4, 5, 6, 0, 7, 8, 9, 0, 10, 11, 12, 0 ] ).buffer;
			const position = new InterleavedBufferAttribute( new InterleavedBuffer( new Float32Array( buffer, 0, 8 ), 4 ), 3, 0 );
			const normal = new InterleavedBufferAttribute( new InterleavedBuffer( new Float32Array( buffer, 32, 8 ), 4 ), 3, 0 );

			const geometry = new BufferGeometry();
			geometry.setAttribute( 'position', position );
			geometry.setAttribute( 'normal', normal );

			const geometry2 = new BufferGeometryLoader().parse( geometry.toJSON() );

			assert.deepEqual( Array.from( geometry2.getAttribute( 'position' ).data.array ), [ 1, 2, 3, 0, 4, 5, 6, 0 ], 'first view was deserialized' );
			assert.deepEqual( Array.from( geometry2.getAttribute( 'normal' ).data.array ), [ 7, 8, 9, 0, 10, 11, 12, 0 ], 'second view was deserialized' );
			assert.strictEqual( geometry2.getAttribute( 'normal' ).count, 2, 'count is preserved' );

		} );

	} );

} );
