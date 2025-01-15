module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.module.rules.push({
        test: /\.(txt|glsl)$/i,
        type: 'asset/source',
      });
      return webpackConfig;
    },
  },
};