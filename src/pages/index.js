import Visualizer from '../visualizer';

export default () => {
  return (
    <div
      style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'none'
      }}
    >
      <div
        id="container"
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        <Visualizer />
      </div>
    </div>
  );
}