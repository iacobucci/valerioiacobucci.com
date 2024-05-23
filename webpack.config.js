const path = require("path");
const webpack = require("webpack");

const backend = {
	mode: "production",
	target: "node",
	entry: "./server/main.ts", // Il punto di ingresso del tuo progetto
	module: {
		rules: [
			{
				test: /\.tsx?$/, // Match dei file .ts e .tsx
				use: "ts-loader", // Utilizzare ts-loader per compilare i file TypeScript
				exclude: /node_modules/,
			},
		],
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"], // Estensioni da risolvere automaticamente
	},
	output: {
		filename: "bundle.js", // Il nome del file di output bundle
		path: path.resolve(__dirname, "dist"), // La cartella di output
	},
};

const frontend = {
	mode: "development",
	entry: "./src/index.ts",
	output: {
		filename: "bundle.js",
		path: path.join(__dirname, "public/bundle"),
	},
	resolve: {
		extensions: [".ts", ".tsx", ".js"],
	},
	module: {
		rules: [
			{
				test: /\.tsx?$/,
				use: "ts-loader",
				exclude: /node_modules/,
			},
		],
	},
	devServer: {
		static: {
			directory: path.join(__dirname, "public"),
		},
		compress: true,
		port: 9000,
		hot: true,
		proxy: [
			{ context: ["/api"], target: "http://localhost:3000", secure: false },
		],
	},
	devtool: "inline-source-map",
	target: ["web", "es2020"],
};

module.exports = [backend, frontend];
