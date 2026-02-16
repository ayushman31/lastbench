'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import { Loader2, Users, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { SessionInfo } from '@/lib/types';

export default function GuestJoinPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [guestName, setGuestName] = useState('');
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSessionInfo();
  }, [token]);

  const fetchSessionInfo = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_SERVER_URL || 'http://localhost:4002';
      const response = await fetch(`${apiUrl}/api/sessions/invite/${token}`);

      if (!response.ok) {
        throw new Error('Invalid or expired invite link');
      }

      const data = await response.json();
      setSession(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = () => {
    if (!guestName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (guestName.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    setJoining(true);

    // navigate to recording room with token and guest name
    router.push(`/recording-room?token=${token}&guestName=${encodeURIComponent(guestName.trim())}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      joinSession();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading session...</p>
        </motion.div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full"
        >
          <div className="bg-destructive/10 border border-destructive/20 rounded-2xl p-6 flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Unable to Join
              </h2>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => (window.location.href = 'http://localhost:3000')}
              variant="secondary"
              className="w-full"
            >
              Go to Home
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const isSessionFull = session.currentGuests >= session.maxGuests;
  const expiresAt = new Date(session.expiresAt);
  const isExpired = expiresAt < new Date();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">
          <div className="relative p-6 border-b border-border">
            <div className="absolute top-0 left-0 w-32 h-32 pointer-events-none">
              <div
                className="absolute top-0 left-0 w-full h-full"
                style={{
                  background:
                    'radial-gradient(circle at top left, rgba(29, 222, 55, 0.15) 0%, rgba(17, 205, 95, 0.08) 40%, transparent 70%)',
                  filter: 'blur(20px)',
                }}
              />
            </div>

            <div className="relative">
              <h1 className="text-2xl font-bold mb-2">Join Recording</h1>
              <p className="text-sm text-muted-foreground">
                You've been invited to join a recording session
              </p>
            </div>
          </div>

          {/* session info */}
          <div className="p-6 space-y-4">
            <div className="bg-muted/50 rounded-xl p-4 space-y-3">
              <div>
                <h2 className="font-semibold text-lg mb-1">
                  {session.title || 'Recording Session'}
                </h2>
                {session.description && (
                  <p className="text-sm text-muted-foreground">
                    {session.description}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">
                    {session.hostName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Hosted by</p>
                  <p className="font-medium">{session.hostName}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2 border-t border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <Users size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    {session.currentGuests} / {session.maxGuests} guests
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock size={16} className="text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Expires {expiresAt.toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* warning messages */}
            {isExpired && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-destructive mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">
                    Session Expired
                  </p>
                  <p className="text-xs text-destructive/80 mt-0.5">
                    This invite link has expired
                  </p>
                </div>
              </div>
            )}

            {isSessionFull && !isExpired && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle size={16} className="text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-500">
                    Session Full
                  </p>
                  <p className="text-xs text-yellow-500/80 mt-0.5">
                    This session has reached maximum capacity
                  </p>
                </div>
              </div>
            )}

            {/* name input */}
            {!isExpired && !isSessionFull && (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    value={guestName}
                    onChange={(e) => {
                      setGuestName(e.target.value);
                      setError('');
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="Enter your name"
                    className="w-full"
                    disabled={joining}
                    autoFocus
                  />
                  {error && (
                    <p className="text-xs text-destructive">{error}</p>
                  )}
                </div>

                <Button
                  onClick={joinSession}
                  disabled={joining || !guestName.trim()}
                  className="w-full h-12 text-base"
                >
                  {joining ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Joining...
                    </>
                  ) : (
                    'Join Recording'
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">
          By joining, you agree to be recorded
        </p>
      </motion.div>
    </div>
  );
}