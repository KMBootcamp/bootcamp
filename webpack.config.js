module.exports = {
  entry: {
    app: ['./app/app.js']
  },
  output: {
    path: './app',
    filename: 'bundle.js'
  },
  resolve:{
    extensions: ['', '.js', '.css']
  },
  module:{
    loaders:[
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.html$/,
        loader: 'html-loader'
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  devServer:{
    contentBase: 'app',
    port: 3000
  }
};
