import { Object3D } from '../../../../src/core/Object3D.js';
import { Material } from '../../../../src/materials/Material.js';
import { Points } from '../../../../src/objects/Points.js';
import { BufferGeometry } from '../../../../src/core/BufferGeometry.js';
import { BufferAttribute } from '../../../../src/core/BufferAttribute.js';
import { Raycaster } from '../../../../src/core/Raycaster.js';
import { Vector3 } from '../../../../src/math/Vector3.js';

export default QUnit.module( 'Objects', () => {

	QUnit.module( 'Points', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const points = new Points();
			assert.strictEqual(
				points instanceof Object3D, true,
				'Points extends from Object3D'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			const object = new Points();
			assert.ok( object, 'Can instantiate a Points.' );

		} );

		// PROPERTIES
		QUnit.test( 'type', ( assert ) => {

			const object = new Points();
			assert.ok(
				object.type === 'Points',
				'Points.type should be Points'
			);

		} );

		// PUBLIC
		QUnit.test( 'isPoints', ( assert ) => {

			const object = new Points();
			assert.ok(
				object.isPoints,
				'Points.isPoints should be true'
			);

		} );

		QUnit.test( 'copy/material', ( assert ) => {

			// Material arrays are cloned
			const mesh1 = new Points();
			mesh1.material = [ new Material() ];

			const copy1 = mesh1.clone();
			assert.notStrictEqual( mesh1.material, copy1.material );

			// Non arrays are not cloned
			const mesh2 = new Points();
			mesh1.material = new Material();
			const copy2 = mesh2.clone();
			assert.strictEqual( mesh2.material, copy2.material );

		} );

		QUnit.test( 'raycast', ( assert ) => {

			// points along x at 0.0, 0.1, ... 0.9; the ray runs along -z through x = 0.5

			const positions = new Float32Array( 30 );
			for ( let i = 0; i < 10; i ++ ) positions[ i * 3 ] = i / 10;

			const geometry = new BufferGeometry();
			geometry.setAttribute( 'position', new BufferAttribute( positions, 3 ) );

			const raycaster = new Raycaster( new Vector3( 5, 0, 10 ), new Vector3( 0, 0, - 1 ) );
			raycaster.params.Points.threshold = 0.5;

			// scaled by its own scale

			const scaled = new Points( geometry );
			scaled.scale.setScalar( 10 );
			scaled.updateMatrixWorld();

			// scaled by a parent: the same world positions, so the same hits

			const parent = new Object3D();
			parent.scale.setScalar( 10 );
			const child = new Points( geometry );
			parent.add( child );
			parent.updateMatrixWorld();

			assert.strictEqual( raycaster.intersectObject( scaled ).length, 1, 'own scale' );
			assert.strictEqual( raycaster.intersectObject( child ).length, 1, 'parent scale' );

		} );

	} );

} );
