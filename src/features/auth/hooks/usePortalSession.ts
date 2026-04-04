import { Session } from '@supabase/supabase-js';
import { FormEvent, useEffect, useState } from 'react';
import { getMe } from '../../../api';
import { supabase } from '../../../supabase';

export type PortalSessionState =
  | {
      status: 'checking';
      email: string;
      authError: string | null;
      authMessage: string | null;
      isSendingLink: boolean;
    }
  | {
      status: 'signedOut';
      email: string;
      authError: string | null;
      authMessage: string | null;
      isSendingLink: boolean;
    }
  | {
      status: 'verifying';
      email: string;
      authError: string | null;
      authMessage: string | null;
      isSendingLink: boolean;
    }
  | {
      status: 'signedIn';
      email: string;
      customerName: string | null;
      session: Session;
      authError: string | null;
      authMessage: string | null;
      isSendingLink: boolean;
    };

type UsePortalSessionResult = {
  state: PortalSessionState;
  handleEmailChange: (value: string) => void;
  handleSignIn: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleSignOut: () => Promise<void>;
};

export function usePortalSession(): UsePortalSessionResult {
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [email, setEmail] = useState('');
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSendingLink, setIsSendingLink] = useState(false);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string | null>(null);
  const [isVerifyingSession, setIsVerifyingSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();
      if (!isMounted) {
        return;
      }

      if (error) {
        setAuthError(error.message);
      } else {
        setSession(data.session);
        setVerifiedEmail(null);
        setCustomerName(null);
        if (data.session?.user.email) {
          setEmail(data.session.user.email);
        }
      }

      setIsAuthReady(true);
    }

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsAuthReady(true);
      setVerifiedEmail(null);
      setCustomerName(null);

      if (nextSession?.user.email) {
        setEmail(nextSession.user.email);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function verifySession() {
      if (!session?.access_token || !session.user.email) {
        setVerifiedEmail(null);
        setCustomerName(null);
        setIsVerifyingSession(false);
        return;
      }

      setIsVerifyingSession(true);

      try {
        const profile = await getMe(session.access_token);
        if (!isMounted) {
          return;
        }

        setVerifiedEmail(profile.email);
        setCustomerName(profile.customerName);
        setAuthError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setVerifiedEmail(null);
        setCustomerName(null);
        setAuthMessage(null);

        const message = error instanceof Error ? error.message : 'Unable to verify your session.';
        await supabase.auth.signOut();
        setSession(null);
        setAuthError(message);
      } finally {
        if (isMounted) {
          setIsVerifyingSession(false);
        }
      }
    }

    void verifySession();

    return () => {
      isMounted = false;
    };
  }, [session]);

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsSendingLink(true);

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setAuthError(error.message);
    } else {
      setAuthMessage('Check your email for the secure sign-in link.');
    }

    setIsSendingLink(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    setSession(null);
    setVerifiedEmail(null);
    setCustomerName(null);
    setAuthMessage(null);
    setAuthError(null);
  }

  if (!isAuthReady) {
    return {
      state: {
        status: 'checking',
        email,
        authError,
        authMessage,
        isSendingLink,
      },
      handleEmailChange: setEmail,
      handleSignIn,
      handleSignOut,
    };
  }

  if (!session) {
    return {
      state: {
        status: 'signedOut',
        email,
        authError,
        authMessage,
        isSendingLink,
      },
      handleEmailChange: setEmail,
      handleSignIn,
      handleSignOut,
    };
  }

  if (isVerifyingSession || !verifiedEmail) {
    return {
      state: {
        status: 'verifying',
        email,
        authError,
        authMessage,
        isSendingLink,
      },
      handleEmailChange: setEmail,
      handleSignIn,
      handleSignOut,
    };
  }

  return {
    state: {
      status: 'signedIn',
      email: verifiedEmail,
      customerName,
      session,
      authError,
      authMessage,
      isSendingLink,
    },
    handleEmailChange: setEmail,
    handleSignIn,
    handleSignOut,
  };
}
