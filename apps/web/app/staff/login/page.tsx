"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import clsx from 'clsx';

interface StaffProfile {
  id: string;
  name: string;
  avatar: string;
  roleType: string;
}

export default function StaffLoginPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<StaffProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<StaffProfile | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  // Fetch staff profiles for this organization
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const response = await fetch('/api/staff/profiles');
        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
        }
      } catch (err) {
        console.error('Failed to fetch profiles:', err);
        // Use demo profiles if API fails
        setProfiles([
          { id: 'sam', name: 'Sam Server', avatar: 'SS', roleType: 'SERVER' },
          { id: 'lisa', name: 'Lisa Server', avatar: 'LS', roleType: 'SERVER' },
          { id: 'mike', name: 'Mike Lobby', avatar: 'ML', roleType: 'FRONT_DESK' },
          { id: 'emma', name: 'Emma Desk', avatar: 'ED', roleType: 'FRONT_DESK' },
          { id: 'tom', name: 'Tom Bartender', avatar: 'TB', roleType: 'BARTENDER' },
          { id: 'ana', name: 'Ana Rooms', avatar: 'AR', roleType: 'HOUSEKEEPING' },
        ]);
      }
    }
    fetchProfiles();
  }, []);

  const handleProfileSelect = (profile: StaffProfile) => {
    setSelectedProfile(profile);
    setPin('');
    setError('');
    setAttempts(0);
    setIsLocked(false);
  };

  const handlePinDigit = (digit: string) => {
    if (isLocked || pin.length >= 4) return;

    const newPin = pin + digit;
    setPin(newPin);
    setError('');

    // Auto-submit when 4 digits entered
    if (newPin.length === 4) {
      handlePinSubmit(newPin);
    }
  };

  const handleBackspace = () => {
    if (isLocked) return;
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    if (isLocked) return;
    setPin('');
    setError('');
  };

  const handlePinSubmit = async (submittedPin: string) => {
    if (!selectedProfile) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedProfile.id,
          pin: submittedPin
        }),
      });

      if (response.ok) {
        // Success - redirect to staff dashboard
        router.push('/staff');
      } else {
        const data = await response.json();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= 3) {
          setIsLocked(true);
          setError('Too many attempts. Wait 30 seconds.');
          setTimeout(() => {
            setIsLocked(false);
            setAttempts(0);
            setPin('');
          }, 30000);
        } else {
          setError(data.message || 'Incorrect PIN. Try again.');
        }
        setPin('');
      }
    } catch (err) {
      setError('Connection error. Try again.');
      setPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setSelectedProfile(null);
    setPin('');
    setError('');
    setAttempts(0);
    setIsLocked(false);
  };

  // Profile Selection Screen
  if (!selectedProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Topline</h1>
            <p className="text-slate-400">Select Your Profile</p>
          </div>

          {/* Profile Grid */}
          <div className="grid grid-cols-3 gap-4" data-testid="profile-grid">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className="flex flex-col items-center p-4 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
                data-testid={`profile-${profile.id}`}
              >
                <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold mb-2">
                  {profile.avatar}
                </div>
                <span className="text-white text-sm font-medium truncate w-full text-center">
                  {profile.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>

          {/* Admin Login Link */}
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Manager/Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PIN Entry Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Selected Profile */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3">
            {selectedProfile.avatar}
          </div>
          <h2 className="text-2xl font-semibold text-white">{selectedProfile.name}</h2>
          <p className="text-slate-400 text-sm">Enter Your PIN</p>
        </div>

        {/* PIN Dots */}
        <div className="flex justify-center gap-4 mb-6" data-testid="pin-dots">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={clsx(
                'w-4 h-4 rounded-full transition-colors',
                pin.length > i ? 'bg-emerald-500' : 'bg-white/20'
              )}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center" data-testid="pin-error">
            {error}
          </div>
        )}

        {/* PIN Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-6" data-testid="pin-keypad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <button
              key={digit}
              onClick={() => handlePinDigit(String(digit))}
              disabled={isLoading || isLocked}
              className={clsx(
                'h-16 rounded-xl text-2xl font-bold transition-colors',
                isLocked
                  ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                  : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
              )}
            >
              {digit}
            </button>
          ))}

          {/* Bottom row: Backspace, 0, Clear */}
          <button
            onClick={handleBackspace}
            disabled={isLoading || isLocked}
            className={clsx(
              'h-16 rounded-xl text-xl transition-colors flex items-center justify-center',
              isLocked
                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            data-testid="pin-backspace"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={() => handlePinDigit('0')}
            disabled={isLoading || isLocked}
            className={clsx(
              'h-16 rounded-xl text-2xl font-bold transition-colors',
              isLocked
                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30'
            )}
          >
            0
          </button>
          <button
            onClick={handleClear}
            disabled={isLoading || isLocked}
            className={clsx(
              'h-16 rounded-xl text-xl transition-colors flex items-center justify-center',
              isLocked
                ? 'bg-white/5 text-slate-600 cursor-not-allowed'
                : 'bg-white/10 text-white hover:bg-white/20'
            )}
            data-testid="pin-clear"
          >
            <X size={24} />
          </button>
        </div>

        {/* Cancel Button */}
        <button
          onClick={handleCancel}
          className="w-full py-3 text-slate-400 hover:text-white transition-colors"
          data-testid="pin-cancel"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
