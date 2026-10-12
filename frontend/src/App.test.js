import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page for unauthenticated users', () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  render(<App />);
  expect(screen.getByText('Manage every visit with confidence.')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Sign in to continue' })).toHaveAttribute('href', '/login');
});
