import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the login page for unauthenticated users', () => {
  localStorage.removeItem('user');
  render(<App />);
  expect(screen.getByText('VisitorPass')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
});
