import { Uint16BufferAttribute, Uint32BufferAttribute } from '../../core/BufferAttribute.js';

function WebGLGeometries( gl, attributes, info, bindingStates ) {

	const geometries = {};
	const wireframeAttributes = new WeakMap();

	// the buffers each geometry was last drawn with, and how many geometries use each
	// buffer, so that disposing a geometry keeps the buffers other geometries still use

	const geometryBuffers = new WeakMap();
	const bufferUsers = new WeakMap();

	const registry = new FinalizationRegistry( ( id ) => delete geometries[ id ] );

	function onGeometryDispose( event ) {

		destroyGeometry( event.target );

	}

	function destroyGeometry( geometry ) {

		const buffers = geometryBuffers.get( geometry );

		if ( buffers !== undefined ) {

			for ( const buffer of new Set( buffers ) ) {

				if ( releaseBuffer( buffer ) === true ) attributes.remove( buffer );

			}

			geometryBuffers.delete( geometry );

		}

		geometry.removeEventListener( 'dispose', onGeometryDispose );

		delete geometries[ geometry.id ];
		registry.unregister( geometry );

		const attribute = wireframeAttributes.get( geometry );

		if ( attribute ) {

			attributes.remove( attribute );
			wireframeAttributes.delete( geometry );

		}

		bindingStates.releaseStatesOfGeometry( geometry );

		if ( geometry.isInstancedBufferGeometry === true ) {

			delete geometry._maxInstanceCount;

		}

		//

		info.memory.geometries --;

	}

	function get( object, geometry ) {

		if ( geometries[ geometry.id ] !== undefined ) return geometry;

		geometry.addEventListener( 'dispose', onGeometryDispose );

		geometries[ geometry.id ] = new WeakRef( geometry );
		registry.register( geometry, geometry.id, geometry );

		info.memory.geometries ++;

		return geometry;

	}

	function update( geometry ) {

		const geometryAttributes = geometry.attributes;

		// Updating index buffer in VAO now. See WebGLBindingStates.

		for ( const name in geometryAttributes ) {

			attributes.update( geometryAttributes[ name ], gl.ARRAY_BUFFER );

		}

		trackBuffers( geometry );

	}

	function getBuffer( attribute ) {

		return attribute.isInterleavedBufferAttribute === true ? attribute.data : attribute;

	}

	function trackBuffers( geometry ) {

		const geometryAttributes = geometry.attributes;
		const geometryIndex = geometry.index;
		const previous = geometryBuffers.get( geometry );

		// fast path: the geometry uses the same buffers as last time

		if ( previous !== undefined ) {

			let i = 0;
			let changed = false;

			for ( const name in geometryAttributes ) {

				if ( previous[ i ++ ] !== getBuffer( geometryAttributes[ name ] ) ) {

					changed = true;
					break;

				}

			}

			if ( changed === false && geometryIndex !== null && previous[ i ++ ] !== geometryIndex ) changed = true;

			if ( changed === false && i === previous.length ) return;

		}

		const current = [];

		for ( const name in geometryAttributes ) current.push( getBuffer( geometryAttributes[ name ] ) );

		if ( geometryIndex !== null ) current.push( geometryIndex );

		geometryBuffers.set( geometry, current );

		const currentSet = new Set( current );
		const previousSet = new Set( previous );

		for ( const buffer of currentSet ) {

			if ( previousSet.has( buffer ) === false ) bufferUsers.set( buffer, ( bufferUsers.get( buffer ) || 0 ) + 1 );

		}

		// a buffer the geometry no longer uses is left to garbage collection, as before,
		// since it may be set again (e.g. when alternating between two attributes)

		for ( const buffer of previousSet ) {

			if ( currentSet.has( buffer ) === false ) releaseBuffer( buffer );

		}

	}

	// returns true when no geometry uses the buffer anymore

	function releaseBuffer( buffer ) {

		const users = ( bufferUsers.get( buffer ) || 0 ) - 1;

		if ( users > 0 ) {

			bufferUsers.set( buffer, users );
			return false;

		}

		bufferUsers.delete( buffer );
		return true;

	}

	function updateWireframeAttribute( geometry ) {

		const geometryIndex = geometry.index;
		const geometryPosition = geometry.attributes.position;
		let version = 0;

		if ( geometryPosition === undefined ) {

			return;

		}

		// only whole triangles; position.count (not array.length) also holds for interleaved positions
		const count = geometryIndex !== null ? geometryIndex.array.length : geometryPosition.count;
		const triangles = Math.floor( count / 3 );

		// check whether a 32 bit or 16 bit buffer is required to store the indices
		// account for PRIMITIVE_RESTART_FIXED_INDEX, #24565
		const IndexBufferAttribute = geometryPosition.count >= 65535 ? Uint32BufferAttribute : Uint16BufferAttribute;
		const attribute = new IndexBufferAttribute( triangles * 6, 1 );
		const indices = attribute.array;

		if ( geometryIndex !== null ) {

			const array = geometryIndex.array;
			version = geometryIndex.version;

			for ( let i = 0, j = 0, il = triangles * 3; i < il; i += 3 ) {

				const a = array[ i + 0 ];
				const b = array[ i + 1 ];
				const c = array[ i + 2 ];

				indices[ j ++ ] = a; indices[ j ++ ] = b;
				indices[ j ++ ] = b; indices[ j ++ ] = c;
				indices[ j ++ ] = c; indices[ j ++ ] = a;

			}

		} else {

			version = geometryPosition.version;

			for ( let i = 0, j = 0, il = triangles * 3; i < il; i += 3 ) {

				const a = i + 0;
				const b = i + 1;
				const c = i + 2;

				indices[ j ++ ] = a; indices[ j ++ ] = b;
				indices[ j ++ ] = b; indices[ j ++ ] = c;
				indices[ j ++ ] = c; indices[ j ++ ] = a;

			}

		}

		attribute.version = version;

		// Updating index buffer in VAO now. See WebGLBindingStates

		//

		const previousAttribute = wireframeAttributes.get( geometry );

		if ( previousAttribute ) attributes.remove( previousAttribute );

		//

		wireframeAttributes.set( geometry, attribute );

	}

	function getWireframeAttribute( geometry ) {

		const currentAttribute = wireframeAttributes.get( geometry );

		if ( currentAttribute ) {

			const geometryIndex = geometry.index;

			if ( geometryIndex !== null ) {

				// if the attribute is obsolete, create a new one

				if ( currentAttribute.version < geometryIndex.version ) {

					updateWireframeAttribute( geometry );

				}

			}

		} else {

			updateWireframeAttribute( geometry );

		}

		return wireframeAttributes.get( geometry );

	}

	function dispose() {

		for ( const id in geometries ) {

			const geometry = geometries[ id ].deref();

			if ( geometry !== undefined ) destroyGeometry( geometry );

		}

	}

	return {

		get: get,
		update: update,

		getWireframeAttribute: getWireframeAttribute,

		dispose: dispose

	};

}


export { WebGLGeometries };
