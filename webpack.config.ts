import os from 'os';
import path from 'path';
import copyWebpackPlugin from 'copy-webpack-plugin';
import eslintPlugin from 'eslint-webpack-plugin';
import htmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

const PORT = 20310;

function getIpAddress() {
  var ifaces = os.networkInterfaces();

  for (const dev in ifaces) {
    let iface = ifaces[dev]!;

    for (let i = 0; i < iface.length; ++i) {
      let { family, address, internal } = iface[i];

      if (family === 'IPv4' && address !== '127.0.0.1' && !internal) {
        return address;
      }
    }
  }
  return '127.0.0.1';
}

export default (
  env: any,
): webpack.Configuration & { devServer?: WebpackDevServerConfiguration } => ({
  entry: './src/ui/index.tsx',
  output: {
    // eslint-disable-next-line no-undef
    path: path.join(__dirname, '/dist'),
    filename: '[name].bundle.js',
    clean: true,
  },
  optimization: {
    minimize: env.production,
  },
  cache: true,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
      },
      {
        test: /\.html$/,
        loader: 'html-loader',
      },
    ],
  },
  resolve: {
    alias: {
      // eslint-disable-next-line no-undef
      '@': path.resolve(__dirname, 'src'),
    },
    modules: ['src', 'node_modules'],
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    fallback: {
      // eslint-disable-next-line no-undef
      url: require.resolve('url/'),
    },
  },
  plugins: [
    new htmlWebpackPlugin({
      template: './src/ui/index.html',
    }),
    new eslintPlugin({
      extensions: ['ts', 'tsx'],
      fix: true,
      cache: true,
    }),
    new copyWebpackPlugin({
      patterns: [{ from: 'res', to: 'res' }],
    }),
    new webpack.DefinePlugin({
      SERVER_URL: env.production
        ? `'${'https://3Ddemo.jiba201.com/'}'`
        : `'http://${getIpAddress()}:${PORT}/'`,
    }),
  ],
  devServer: {
    host: '0.0.0.0',
    port: PORT,
    allowedHosts: 'all',
    client: {
      logging: 'none',
    },
    hot: true,
    watchFiles: ['src/**/*'],
  },
  mode: env.production ? 'production' : 'development',
});
