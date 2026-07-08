const { transformSync } = require("esbuild");

module.exports = {
	process(src, filename) {
		const loader = filename.endsWith(".tsx")
			? "tsx"
			: filename.endsWith(".ts")
				? "ts"
				: filename.endsWith(".jsx")
					? "jsx"
					: "js";

		const result = transformSync(src, {
			loader,
			format: "cjs",
			target: "es2022",
			sourcemap: "inline",
			sourcefile: filename,
			jsx: "transform",
			tsconfigRaw: {
				compilerOptions: {
					experimentalDecorators: true,
					emitDecoratorMetadata: true,
				},
			},
		});

		return {
			code: result.code,
			map: result.map,
		};
	},
};
