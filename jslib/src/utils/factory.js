export default function(d) {
  return {
    title: d.label || d,
    type: 'component',
    componentName: 'canvas',
    componentState: {
      name: d.label || d,
      render: d.id || d
    }
  };
}
