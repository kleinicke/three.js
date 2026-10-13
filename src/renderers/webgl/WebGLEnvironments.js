import { CubeReflectionMapping, CubeRefractionMapping, EquirectangularReflectionMapping, EquirectangularRefractionMapping } from '../../constants.js';
import { PMREMGenerator } from '../../extras/PMREMGenerator.js';
import { WebGLCubeRenderTarget } from '../WebGLCubeRenderTarget.js';

function WebGLEnvironments( renderer ) {

	let cubeMaps = new WeakMap();
	let pmremMaps = new WeakMap();

	let pmremGenerator = null;

	// textures with a 'dispose' listener, so dispose() can remove them

	let textures = {};
	const registry = new FinalizationRegistry( ( id ) => delete textures[ id ] );

	function track( texture ) {

		if ( textures[ texture.id ] !== undefined ) return;

		textures[ texture.id ] = new WeakRef( texture );
		registry.register( texture, texture.id, texture );

	}

	function untrack( texture ) {

		if ( cubeMaps.has( texture ) || pmremMaps.has( texture ) ) return;

		delete textures[ texture.id ];
		registry.unregister( texture );

	}

	function get( texture, usePMREM = false ) {

		if ( texture === null || texture === undefined ) return null;

		if ( usePMREM ) {

			return getPMREM( texture );

		}

		return getCube( texture );

	}

	function getCube( texture ) {

		if ( texture && texture.isTexture ) {

			const mapping = texture.mapping;

			if ( mapping === EquirectangularReflectionMapping || mapping === EquirectangularRefractionMapping ) {

				if ( cubeMaps.has( texture ) ) {

					const cubemap = cubeMaps.get( texture ).texture;
					return mapTextureMapping( cubemap, texture.mapping );

				} else {

					const image = texture.image;

					if ( image && image.height > 0 ) {

						const renderTarget = new WebGLCubeRenderTarget( image.height );
						renderTarget.fromEquirectangularTexture( renderer, texture );
						cubeMaps.set( texture, renderTarget );

						texture.addEventListener( 'dispose', onCubemapDispose );
						track( texture );

						return mapTextureMapping( renderTarget.texture, texture.mapping );

					} else {

						// image not yet ready. try the conversion next frame

						return null;

					}

				}

			}

		}

		return texture;

	}

	function getPMREM( texture ) {

		if ( texture && texture.isTexture && texture.isPMREMTexture !== true ) {

			const mapping = texture.mapping;

			const isEquirectMap = ( mapping === EquirectangularReflectionMapping || mapping === EquirectangularRefractionMapping );
			const isCubeMap = ( mapping === CubeReflectionMapping || mapping === CubeRefractionMapping );

			// equirect/cube map to PMREM conversion

			if ( isEquirectMap || isCubeMap ) {

				let renderTarget = pmremMaps.get( texture );

				const currentPMREMVersion = renderTarget !== undefined ? renderTarget.texture.pmremVersion : 0;

				if ( texture.isRenderTargetTexture && texture.pmremVersion !== currentPMREMVersion ) {

					if ( pmremGenerator === null ) pmremGenerator = new PMREMGenerator( renderer );

					renderTarget = isEquirectMap ? pmremGenerator.fromEquirectangular( texture, renderTarget ) : pmremGenerator.fromCubemap( texture, renderTarget );
					renderTarget.texture.pmremVersion = texture.pmremVersion;

					pmremMaps.set( texture, renderTarget );

					return renderTarget.texture;

				} else {

					if ( renderTarget !== undefined ) {

						return renderTarget.texture;

					} else {

						const image = texture.image;

						if ( ( isEquirectMap && image && image.height > 0 ) || ( isCubeMap && image && isCubeTextureComplete( image ) ) ) {

							if ( pmremGenerator === null ) pmremGenerator = new PMREMGenerator( renderer );

							renderTarget = isEquirectMap ? pmremGenerator.fromEquirectangular( texture ) : pmremGenerator.fromCubemap( texture );
							renderTarget.texture.pmremVersion = texture.pmremVersion;

							pmremMaps.set( texture, renderTarget );

							texture.addEventListener( 'dispose', onPMREMDispose );
							track( texture );

							return renderTarget.texture;

						} else {

							// image not yet ready. try the conversion next frame

							return null;

						}

					}

				}

			}

		}

		return texture;

	}

	function mapTextureMapping( texture, mapping ) {

		if ( mapping === EquirectangularReflectionMapping ) {

			texture.mapping = CubeReflectionMapping;

		} else if ( mapping === EquirectangularRefractionMapping ) {

			texture.mapping = CubeRefractionMapping;

		}

		return texture;

	}

	function isCubeTextureComplete( image ) {

		let count = 0;
		const length = 6;

		for ( let i = 0; i < length; i ++ ) {

			if ( image[ i ] !== undefined ) count ++;

		}

		return count === length;

	}

	function onCubemapDispose( event ) {

		const texture = event.target;

		texture.removeEventListener( 'dispose', onCubemapDispose );

		const cubemap = cubeMaps.get( texture );

		if ( cubemap !== undefined ) {

			cubeMaps.delete( texture );
			cubemap.dispose();

		}

		untrack( texture );

	}

	function onPMREMDispose( event ) {

		const texture = event.target;

		texture.removeEventListener( 'dispose', onPMREMDispose );

		const pmrem = pmremMaps.get( texture );

		if ( pmrem !== undefined ) {

			pmremMaps.delete( texture );
			pmrem.dispose();

		}

		untrack( texture );

	}

	function dispose() {

		for ( const id in textures ) {

			const texture = textures[ id ].deref();

			if ( texture !== undefined ) {

				texture.removeEventListener( 'dispose', onCubemapDispose );
				texture.removeEventListener( 'dispose', onPMREMDispose );
				registry.unregister( texture );

			}

		}

		textures = {};

		cubeMaps = new WeakMap();
		pmremMaps = new WeakMap();

		if ( pmremGenerator !== null ) {

			pmremGenerator.dispose();
			pmremGenerator = null;

		}

	}

	return {
		get: get,
		dispose: dispose
	};

}

export { WebGLEnvironments };
