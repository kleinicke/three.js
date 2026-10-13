import { Object3D } from '../../../../src/core/Object3D.js';
import { Mesh } from '../../../../src/objects/Mesh.js';
import { Raycaster } from '../../../../src/core/Raycaster.js';
import { PlaneGeometry } from '../../../../src/geometries/PlaneGeometry.js';
import { BoxGeometry } from '../../../../src/geometries/BoxGeometry.js';
import { MeshBasicMaterial } from '../../../../src/materials/MeshBasicMaterial.js';
import { Vector2 } from '../../../../src/math/Vector2.js';
import { Vector3 } from '../../../../src/math/Vector3.js';
import { DoubleSide } from '../../../../src/constants.js';
import { Material } from '../../../../src/materials/Material.js';
import { BufferGeometry } from '../../../../src/core/BufferGeometry.js';
import { Float32BufferAttribute } from '../../../../src/core/BufferAttribute.js';

export default QUnit.module( 'Objects', () => {

	QUnit.module( 'Mesh', () => {

		// INHERITANCE
		QUnit.test( 'Extending', ( assert ) => {

			const mesh = new Mesh();
			assert.strictEqual(
				mesh instanceof Object3D, true,
				'Mesh extends from Object3D'
			);

		} );

		// INSTANCING
		QUnit.test( 'Instancing', ( assert ) => {

			const object = new Mesh();
			assert.ok( object, 'Can instantiate a Mesh.' );

		} );

		// PROPERTIES
		QUnit.test( 'type', ( assert ) => {

			const object = new Mesh();
			assert.ok(
				object.type === 'Mesh',
				'Mesh.type should be Mesh'
			);

		} );

		// PUBLIC
		QUnit.test( 'isMesh', ( assert ) => {

			const object = new Mesh();
			assert.ok(
				object.isMesh,
				'Mesh.isMesh should be true'
			);

		} );

		QUnit.test( 'copy/material', ( assert ) => {

			// Material arrays are cloned
			const mesh1 = new Mesh();
			mesh1.material = [ new Material() ];

			const copy1 = mesh1.clone();
			assert.notStrictEqual( mesh1.material, copy1.material );

			// Non arrays are not cloned
			const mesh2 = new Mesh();
			mesh1.material = new Material();
			const copy2 = mesh2.clone();
			assert.strictEqual( mesh2.material, copy2.material );

		} );

		QUnit.todo( 'raycast', ( assert ) => {

			const geometry = new PlaneGeometry();
			const material = new MeshBasicMaterial();

			const mesh = new Mesh( geometry, material );

			const raycaster = new Raycaster();
			raycaster.ray.origin.set( 0.25, 0.25, 1 );
			raycaster.ray.direction.set( 0, 0, - 1 );

			const intersections = [];

			mesh.raycast( raycaster, intersections );

			const intersection = intersections[ 0 ];

			assert.equal( intersection.object, mesh, 'intersection object' );
			assert.equal( intersection.distance, 1, 'intersection distance' );
			assert.equal( intersection.faceIndex, 1, 'intersection face index' );
			assert.deepEqual( intersection.face, { a: 0, b: 2, c: 1 }, 'intersection vertex indices' );
			assert.deepEqual( intersection.point, new Vector3( 0.25, 0.25, 0 ), 'intersection point' );
			assert.deepEqual( intersection.uv, new Vector2( 0.75, 0.75 ), 'intersection uv' );

		} );

		QUnit.test( 'raycast/partial triangle', ( assert ) => {

			// two triangles side by side; the second one is hit by the ray
			const positions = [
				- 2, - 1, 0, 0, - 1, 0, - 1, 1, 0,
				0, - 1, 0, 2, - 1, 0, 1, 1, 0
			];
			const raycaster = new Raycaster( new Vector3( 1, 0, 5 ), new Vector3( 0, 0, - 1 ) );

			const cases = [ 'non-indexed', 'indexed', 'non-indexed groups', 'indexed groups' ];

			for ( const name of cases ) {

				const geometry = new BufferGeometry();
				geometry.setAttribute( 'position', new Float32BufferAttribute( positions, 3 ) );
				if ( name.startsWith( 'indexed' ) ) geometry.setIndex( [ 0, 1, 2, 3, 4, 5 ] );

				let material = new MeshBasicMaterial();

				if ( name.endsWith( 'groups' ) ) {

					geometry.addGroup( 0, Infinity, 0 );
					material = [ material ];

				}

				const mesh = new Mesh( geometry, material );
				const intersections = [];

				mesh.raycast( raycaster, intersections );
				assert.strictEqual( intersections.length, 1, name + ': the whole second triangle is hit' );

				// four vertices draw one triangle: the second one is not rendered
				geometry.setDrawRange( 0, 4 );
				intersections.length = 0;
				mesh.raycast( raycaster, intersections );
				assert.strictEqual( intersections.length, 0, name + ': a partial triangle is not hit' );

			}

		} );

		QUnit.test( 'raycast/range', ( assert ) => {

			const geometry = new BoxGeometry( 1, 1, 1 );
			const material = new MeshBasicMaterial( { side: DoubleSide } );
			const mesh = new Mesh( geometry, material );
			const raycaster = new Raycaster();
			const intersections = [];

			raycaster.ray.origin.set( 0, 0, 0 );
			raycaster.ray.direction.set( 1, 0, 0 );
			raycaster.near = 100;
			raycaster.far = 200;

			mesh.matrixWorld.identity();
			mesh.position.setX( 150 );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length > 0, 'bounding sphere between near and far' );

			mesh.matrixWorld.identity();
			mesh.position.setX( raycaster.near );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length > 0, 'bounding sphere across near' );

			mesh.matrixWorld.identity();
			mesh.position.setX( raycaster.far );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length > 0, 'bounding sphere across far' );

			mesh.matrixWorld.identity();
			mesh.position.setX( 150 );
			mesh.scale.setY( 9999 );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length > 0, 'bounding sphere across near and far' );

			mesh.matrixWorld.identity();
			mesh.position.setX( - 9999 );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length === 0, 'bounding sphere behind near' );

			mesh.matrixWorld.identity();
			mesh.position.setX( 9999 );
			mesh.updateMatrixWorld( true );
			intersections.length = 0;
			mesh.raycast( raycaster, intersections );
			assert.ok( intersections.length === 0, 'bounding sphere beyond far' );

		} );

	} );

} );
