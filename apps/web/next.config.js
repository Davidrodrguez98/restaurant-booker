const path = require("path");

const isVercel = process.env.VERCEL === "1";

module.exports = {
	reactStrictMode: true,
	transpilePackages: ["@repo/ui"],
	output: isVercel ? undefined : "standalone",
	outputFileTracingRoot: isVercel ? undefined : path.join(__dirname, "../../"),
};
