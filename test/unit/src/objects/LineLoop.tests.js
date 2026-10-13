import { Object3D } from '../../../../src/core/Object3D.js';
import { Line } from '../../../../src/objects/Line.js';
import { LineLoop } from '../../../../src/objects/LineLoop.js';
import { BufferGeometry } from '../../../../src/core/BufferGeometry.js';
import { BufferAttribute } from '../../../../src/core/BufferAttribute.js';
import { LineBasicMaterial } from '../../../../src/materials/LineBasicMaterial.js';
import { Raycaster } from '../../../../src/core/Raycaster.js';
import { Vector3 } from '../../../../src/math/Vector3.js';

export default QUnit.module( 'Objects', () => {

	QUnit.module( 'LineLoop', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const lineLoop = new LineLoop();

			assert.strictEqual( lineLoop instanceof Object3D, true, 'LineLoop extends from Object3D' );
			assert.strictEqual( lineLoop instanceof Line, true, 'LineLoop extends from Line' );

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			const object = new LineLoop();
			assert.ok( object, 'Can instantiate a LineLoop.' );

		} );

		// PROPERTIES
		QUnit.test( 'type', ( assert ) => {

			const object = new LineLoop();
			assert.ok(
				object.type === 'LineLoop',
				'LineLoop.type should be LineLoop'
			);

		} );

		// PUBLIC
		QUnit.test( 'isLineLoop', ( assert ) => {

			const object = new LineLoop();
			assert.ok(
				object.isLineLoop,
				'LineLoop.isLineLoop should be true'
			);

		} );

		QUnit.test( 'raycast (closing segment)', ( assert ) => {

			const raycaster = new Raycaster( new Vector3( 0, 0, 5 ), new Vector3( 0, 0, - 1 ) );
			raycaster.params.Line.threshold = 0.1;

			for ( const indexed of [ false, true ] ) {

				const geometry = new BufferGeometry();
				geometry.setAttribute( 'position', new BufferAttribute( new Float32Array( [ - 1, 0, 0, 1, 0, 0, 1, 2, 0 ] ), 3 ) );
				if ( indexed ) geometry.setIndex( [ 0, 1, 2 ] );
				const lineLoop = new LineLoop( geometry, new LineBasicMaterial() );
				const name = indexed ? 'indexed: ' : 'non-indexed: ';

				geometry.setDrawRange( 0, 2 );
				assert.strictEqual( raycaster.intersectObject( lineLoop ).length, 1, name + 'two vertices draw one segment' );

				geometry.setDrawRange( 1, 0 );
				assert.strictEqual( raycaster.intersectObject( lineLoop ).length, 0, name + 'an empty draw range is not hit' );

				geometry.setDrawRange( 0, Infinity );
				assert.strictEqual( raycaster.intersectObject( lineLoop ).length, 1, name + 'the whole loop is hit once' );

			}

		} );

	} );

} );
