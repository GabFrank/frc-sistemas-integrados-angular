//Polyfill Node.js core modules in Webpack. This module is only needed for webpack 5+.
const NodePolyfillPlugin = require("node-polyfill-webpack-plugin");
const webpack = require("webpack");
const path = require("path");

/**
 * Custom angular webpack configuration
 */
module.exports = (config, options) => {
    config.target = 'electron-renderer';

    if (options.fileReplacements) {
        for(let fileReplacement of options.fileReplacements) {
            if (fileReplacement.replace !== 'src/environments/environment.ts') {
                continue;
            }

            let fileReplacementParts = fileReplacement['with'].split('.');
            if (fileReplacementParts.length > 1 && ['web'].indexOf(fileReplacementParts[1]) >= 0) {
                config.target = 'web';
            }
            break;
        }
    }

    config.plugins = [
        ...config.plugins,
        new NodePolyfillPlugin({
            excludeAliases: ["console"]
        }),
        // NormalModuleReplacementPlugin intercepta DESPUÉS de la resolución del módulo,
        // por eso funciona donde IgnorePlugin y resolve.alias fallan.
        // Redirige cualquier require/import de @tensorflow/tfjs-node a un shim vacío,
        // independientemente de cómo webpack resolvió el entry point del package.
        new webpack.NormalModuleReplacementPlugin(
            /^@tensorflow\/tfjs-node(\/.*)?$/,
            path.resolve(__dirname, 'tfjs-node-shim.js')
        ),
    ];

    // https://github.com/ryanclark/karma-webpack/issues/497
    config.output.globalObject = 'globalThis';

    // Sin la condición "node", webpack resuelve @vladmandic/human por la condición
    // "import" en su exports field → human.esm.js (WebGL backend, sin tfjs-node).
    // Esto ataca la raíz del problema: electron-renderer activa "node" por defecto
    // lo que carga human.node.js, que tiene require("@tensorflow/tfjs-node") directo.
    config.resolve = {
        ...config.resolve,
        conditionNames: ['browser', 'import', 'module', 'default'],
        alias: {
            ...(config.resolve?.alias || {}),
            '@tensorflow/tfjs-node': path.resolve(__dirname, 'tfjs-node-shim.js')
        }
    };

    return config;
}
