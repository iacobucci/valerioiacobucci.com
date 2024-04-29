const path = require("path");

module.exports = {
  mode: "production",
  target: "node",
    entry: './src/main.ts', // Il punto di ingresso del tuo progetto
    module: {
        rules: [
            {
                test: /\.tsx?$/, // Match dei file .ts e .tsx
                use: 'ts-loader', // Utilizzare ts-loader per compilare i file TypeScript
                exclude: /node_modules/,
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js'], // Estensioni da risolvere automaticamente
    },
    output: {
        filename: 'bundle.js', // Il nome del file di output bundle
        path: path.resolve(__dirname, 'dist'), // La cartella di output
    },
};
