import { Line } from '../../../../src/objects/Line.js';

import { Object3D } from '../../../../src/core/Object3D.js';
import { Material } from '../../../../src/materials/Material.js';
import { BufferGeometry } from '../../../../src/core/BufferGeometry.js';
import { BufferAttribute } from '../../../../src/core/BufferAttribute.js';
import { Raycaster } from '../../../../src/core/Raycaster.js';
import { Vector3 } from '../../../../src/math/Vector3.js';

export default QUnit.module( 'Objects', () => {

	QUnit.module( 'Line', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const line = new Line();
			assert.strictEqual(
				line instanceof Object3D, true,
				'Line extends from Object3D'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			const object = new Line();
			assert.ok( object, 'Can instantiate a Line.' );

		} );

		// PROPERTIES
		QUnit.test( 'type', ( assert ) => {

			const object = new Line();
			assert.ok(
				object.type === 'Line',
				'Line.type should be Line'
			);

		} );

		// PUBLIC
		QUnit.test( 'isLine', ( assert ) => {

			const object = new Line();
			assert.ok(
				object.isLine,
				'Line.isLine should be true'
			);

		} );

		QUnit.test( 'copy/material', ( assert ) => {

			// Material arrays are cloned
			const mesh1 = new Line();
			mesh1.material = [ new Material() ];

			const copy1 = mesh1.clone();
			assert.notStrictEqual( mesh1.material, copy1.material );

			// Non arrays are not cloned
			const mesh2 = new Line();
			mesh1.material = new Material();
			const copy2 = mesh2.clone();
			assert.strictEqual( mesh2.material, copy2.material );

		} );

		QUnit.test( 'raycast', ( assert ) => {

			// a unit segment along x, shown ten times larger; rays run along -z through x = 5

			const geometry = new BufferGeometry();
			geometry.setAttribute( 'position', new BufferAttribute( new Float32Array( [ 0, 0, 0, 1, 0, 0 ] ), 3 ) );

			const hits = ( object, y ) => {

				const raycaster = new Raycaster( new Vector3( 5, y, 10 ), new Vector3( 0, 0, - 1 ) );
				raycaster.params.Line.threshold = 0.5;
				return raycaster.intersectObject( object ).length;

			};

			const scaled = new Line( geometry );
			scaled.scale.setScalar( 10 );
			scaled.updateMatrixWorld();

			const parent = new Object3D();
			parent.scale.setScalar( 10 );
			const child = new Line( geometry );
			parent.add( child );
			parent.updateMatrixWorld();

			const mirrored = new Line( geometry );
			mirrored.scale.set( - 10, 10, 10 );
			mirrored.position.x = 10;
			mirrored.updateMatrixWorld();

			for ( const [ name, object ] of [ [ 'own scale', scaled ], [ 'parent scale', child ], [ 'mirrored scale', mirrored ] ] ) {

				assert.strictEqual( hits( object, 0.3 ), 1, `${ name }: a ray 0.3 away hits` );
				assert.strictEqual( hits( object, 1 ), 0, `${ name }: a ray 1 away misses` );
				assert.strictEqual( hits( object, 3 ), 0, `${ name }: a ray 3 away misses` );

			}

		} );

	} );

} );
