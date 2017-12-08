export default function(d) {
  return {
    title: d,
    type: 'component',
    componentName: 'canvas',
    componentState: {
      name: d,
      render: d
    }
  };
}
