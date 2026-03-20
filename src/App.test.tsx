import { render } from '@testing-library/react';
import App from './App';

test('App mounts without crashing', () => {
  render(<App />);
});
