import { useState } from 'react';
import { isAxiosError } from 'axios';
import { toggleAvailability } from '../api/delivery';
import './AvailabilityToggle.css';

/**
 * DESIGN NOTES (AvailabilityToggle)
 * ---------------------------------
 * Unknown until first toggle: there is no GET endpoint for current
 * availability, so showing a guessed initial state (e.g. defaulting to
 * "Available") would risk lying to the partner about their real status
 * until they interact with it — showing "unknown" is more honest than a
 * confident-looking guess.
 */
export function AvailabilityToggle() {
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleToggle() {
    setError('');
    setIsLoading(true);
    try {
      const result = await toggleAvailability();
      setIsAvailable(result.isAvailable);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message ?? 'Could not update availability');
      } else {
        setError('Could not update availability');
      }
    } finally {
      setIsLoading(false);
    }
  }

  const stateClass =
    isAvailable === null
      ? 'availability-toggle-btn-unknown'
      : isAvailable
        ? 'availability-toggle-btn-available'
        : 'availability-toggle-btn-unavailable';

  const label =
    isAvailable === null
      ? 'Tap to set availability'
      : isAvailable
        ? 'Available'
        : 'Unavailable';

  return (
    <div className="availability-toggle">
      {isAvailable === null ? (
        <p className="availability-toggle-hint">
          Availability: unknown — tap to set
        </p>
      ) : null}
      <button
        type="button"
        className={`availability-toggle-btn ${stateClass}`}
        disabled={isLoading}
        onClick={() => void handleToggle()}
      >
        {isLoading ? 'Updating…' : label}
      </button>
      {error ? (
        <p className="availability-toggle-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
