import path from 'path';
import copyWebpackPlugin from 'copy-webpack-plugin';
import eslintPlugin from 'eslint-webpack-plugin';
import htmlWebpackPlugin from 'html-webpack-plugin';
import type webpack from 'webpack';
import type { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';

export default (
  env: any,
): webpack.Configuration & { devServer?: WebpackDevServerConfiguration } => ({
  entry: './src/index.tsx',
  output: {
    // eslint-disable-next-line no-undef
    path: path.join(__dirname, '/test_dist'),
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
      template: './src/index.html',
    }),
    new eslintPlugin({
      extensions: ['ts', 'tsx'],
      fix: true,
      cache: true,
    }),
    new copyWebpackPlugin({
      patterns: [{ from: 'res', to: 'res' }],
    }),
  ],
  devServer: {
    host: '0.0.0.0',
    port: 20310,
    allowedHosts: 'all',
    client: {
      logging: 'none',
    },
    hot: true,
    watchFiles: ['src/**/*'],
  },
  mode: env.production ? 'production' : 'development',
});
