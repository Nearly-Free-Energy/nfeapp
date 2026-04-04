import { AuthStatusScreen } from './features/auth/components/AuthStatusScreen';
import { SignInScreen } from './features/auth/components/SignInScreen';
import { usePortalSession } from './features/auth/hooks/usePortalSession';
import { DashboardScreen } from './features/dashboard/components/DashboardScreen';

function App() {
  const { state, handleEmailChange, handleSignIn, handleSignOut } = usePortalSession();

  if (state.status === 'checking') {
    return <AuthStatusScreen title="Electricity Consumption" message="Checking your session..." />;
  }

  if (state.status === 'signedOut') {
    return (
      <SignInScreen
        email={state.email}
        authError={state.authError}
        authMessage={state.authMessage}
        isSendingLink={state.isSendingLink}
        onEmailChange={handleEmailChange}
        onSubmit={handleSignIn}
      />
    );
  }

  if (state.status === 'verifying') {
    return <AuthStatusScreen title="Electricity Consumption" message="Verifying your secure session..." />;
  }

  const signedInState = state;

  return (
    <DashboardScreen
      email={signedInState.email}
      customerName={signedInState.customerName}
      onSignOut={handleSignOut}
    />
  );
}

export default App;
