// Export the baseline module with `git show <base>:src/renderers/webgl/WebGLAttributes.js > /tmp/WebGLAttributes.mjs`.
// Run: node test/benchmarks/webgl-attributes.js /tmp/WebGLAttributes.mjs
import { pathToFileURL } from 'node:url';
import { performance } from 'node:perf_hooks';
import { WebGLAttributes } from '../../src/renderers/webgl/WebGLAttributes.js';
import { BufferAttribute } from '../../src/core/BufferAttribute.js';

const { WebGLAttributes: Baseline } = await import( pathToFileURL( process.argv[ 2 ] ).href );
const count = 10000;
const repeats = 100;
const gl = {
	createBuffer: () => ( {} ),
	bindBuffer() {},
	bufferData() {},
	bufferSubData() {}
};

for ( const pattern of [ 'ordered', 'reverse', 'shuffled', 'late-inversion' ] ) {

	const ranges = Array.from( { length: count }, ( _, i ) => ( {
		start: ( pattern === 'reverse' ? count - i - 1 : pattern === 'shuffled' ? i * 7919 % count : i ) * 3,
		count: 3
	} ) );
	if ( pattern === 'late-inversion' ) {

		[ ranges[ count - 1 ], ranges[ count - 2 ] ] = [ ranges[ count - 2 ], ranges[ count - 1 ] ];

	}

	const samples = { baseline: [], changed: [] };
	for ( let round = 0; round < 9; round ++ ) {

		const order = round % 2 ? [ 'changed', 'baseline' ] : [ 'baseline', 'changed' ];
		for ( const name of order ) {

			const attributes = ( name === 'baseline' ? Baseline : WebGLAttributes )( gl );
			const attribute = new BufferAttribute( new Float32Array( count * 3 ), 3 );
			attributes.update( attribute, 0 );
			let elapsed = 0;
			for ( let i = 0; i < repeats; i ++ ) {

				attribute.updateRanges = ranges.map( range => ( { ...range } ) );
				attribute.needsUpdate = true;
				const start = performance.now();
				attributes.update( attribute, 0 );
				elapsed += performance.now() - start;

			}

			if ( round > 1 ) samples[ name ].push( elapsed );

		}

	}

	console.log( JSON.stringify( { pattern, count, repeats, samples } ) );

}
