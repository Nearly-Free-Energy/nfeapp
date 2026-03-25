import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('Energy breakdown dashboard', () => {
  it('renders seven weekday headers in weekly view', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Energy Breakdown' })).toBeInTheDocument();
    expect(screen.getByLabelText('Weekly energy usage')).toBeInTheDocument();
    for (const weekday of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getByText(weekday, { selector: 'span' })).toBeInTheDocument();
    }
  });

  it('switches to month view and shows a month label', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Month' }));

    expect(screen.getByLabelText('Monthly energy usage')).toBeInTheDocument();
    expect(screen.getByText('Mar 2026')).toBeInTheDocument();
  });

  it('navigates periods forward from weekly view', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: 'Next period' }));

    expect(screen.getByText('Mar 29 - Apr 4')).toBeInTheDocument();
  });
});
