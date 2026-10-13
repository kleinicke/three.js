import assert from 'node:assert/strict';
import { performance } from 'node:perf_hooks';
import { Matrix3 } from '../../src/math/Matrix3.js';
import { Matrix4 } from '../../src/math/Matrix4.js';

// Run from the repository root: node test/benchmarks/normal-matrix.js
// Compare the previous composed implementation with getNormalMatrix(), using
// separate call sites and alternating order. Discard the first two rounds.
class BaselineMatrix3 extends Matrix3 {

	getNormalMatrix( matrix ) {

		return this.setFromMatrix4( matrix ).invert().transpose();

	}

}

let seed = 42;
const matrices = Array.from( { length: 1024 }, () => {

	const matrix = new Matrix4();
	for ( let i = 0; i < 16; i ++ ) {

		seed = ( Math.imul( seed, 1664525 ) + 1013904223 ) >>> 0;
		matrix.elements[ i ] = seed / 4294967296 * 4 - 2;

	}

	return matrix;

} );

const baseline = new BaselineMatrix3();
const changed = new Matrix3();
const iterations = 2000000;

function runBaseline() {

	let sum = 0;
	for ( let i = 0; i < iterations; i ++ ) {

		baseline.getNormalMatrix( matrices[ i & 1023 ] );
		sum += baseline.elements[ i % 9 ];

	}

	return sum;

}

function runChanged() {

	let sum = 0;
	for ( let i = 0; i < iterations; i ++ ) {

		changed.getNormalMatrix( matrices[ i & 1023 ] );
		sum += changed.elements[ i % 9 ];

	}

	return sum;

}

const samples = { baseline: [], changed: [] };
const functions = { baseline: runBaseline, changed: runChanged };
const checksums = {};

for ( let round = 0; round < 9; round ++ ) {

	for ( const name of round % 2 ? [ 'changed', 'baseline' ] : [ 'baseline', 'changed' ] ) {

		const start = performance.now();
		checksums[ name ] = functions[ name ]();
		const elapsed = performance.now() - start;
		if ( round > 1 ) samples[ name ].push( elapsed );

	}

	assert.equal( checksums.baseline, checksums.changed );

}

console.log( JSON.stringify( { iterations, samples }, null, 2 ) );
