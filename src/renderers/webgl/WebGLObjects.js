function WebGLObjects( gl, geometries, attributes, bindingStates, info ) {

	let updateMap = new WeakMap();

	const instancedMeshes = {};
	const registry = new FinalizationRegistry( ( id ) => delete instancedMeshes[ id ] );

	function update( object ) {

		const frame = info.render.frame;

		const geometry = object.geometry;
		const buffergeometry = geometries.get( object, geometry );

		// Update once per frame

		if ( updateMap.get( buffergeometry ) !== frame ) {

			geometries.update( buffergeometry );

			updateMap.set( buffergeometry, frame );

		}

		if ( object.isInstancedMesh ) {

			if ( instancedMeshes[ object.id ] === undefined ) {

				object.addEventListener( 'dispose', onInstancedMeshDispose );

				instancedMeshes[ object.id ] = new WeakRef( object );
				registry.register( object, object.id, object );

			}

			if ( updateMap.get( object ) !== frame ) {

				attributes.update( object.instanceMatrix, gl.ARRAY_BUFFER );

				if ( object.instanceColor !== null ) {

					attributes.update( object.instanceColor, gl.ARRAY_BUFFER );

				}

				updateMap.set( object, frame );

			}

		}

		if ( object.isSkinnedMesh ) {

			const skeleton = object.skeleton;

			if ( updateMap.get( skeleton ) !== frame ) {

				skeleton.update();

				updateMap.set( skeleton, frame );

			}

		}

		return buffergeometry;

	}

	function dispose() {

		for ( const id in instancedMeshes ) {

			const instancedMesh = instancedMeshes[ id ].deref();

			if ( instancedMesh !== undefined ) destroyInstancedMesh( instancedMesh );

		}

		updateMap = new WeakMap();

	}

	function onInstancedMeshDispose( event ) {

		destroyInstancedMesh( event.target );

	}

	function destroyInstancedMesh( instancedMesh ) {

		instancedMesh.removeEventListener( 'dispose', onInstancedMeshDispose );

		delete instancedMeshes[ instancedMesh.id ];
		registry.unregister( instancedMesh );

		bindingStates.releaseStatesOfObject( instancedMesh );

		attributes.remove( instancedMesh.instanceMatrix );

		if ( instancedMesh.instanceColor !== null ) attributes.remove( instancedMesh.instanceColor );

	}

	return {

		update: update,
		dispose: dispose

	};

}


export { WebGLObjects };
