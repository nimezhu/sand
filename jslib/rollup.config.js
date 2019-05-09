import resolve from 'rollup-plugin-node-resolve';
export default {
  input: 'index.js',
  output: {
    file: '../app/web/lib/sand.js',
    format: 'umd',
    name : "sand"
  },
  plugins: [
    resolve(),
  ]
};  
