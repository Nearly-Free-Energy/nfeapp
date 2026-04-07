import { Navigate, Route, Routes } from 'react-router-dom';
import { AccountOverview } from './features/account/components/AccountOverview';
import { AuthStatusScreen } from './features/auth/components/AuthStatusScreen';
import { SignInScreen } from './features/auth/components/SignInScreen';
import { usePortalSession } from './features/auth/hooks/usePortalSession';
import { DashboardScreen } from './features/dashboard/components/DashboardScreen';
import { UsageOverview } from './features/usage/components/UsageOverview';

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
    <Routes>
      <Route
        path="/usage"
        element={
            <DashboardScreen
              email={signedInState.email}
              accountName={signedInState.account.displayName}
              onSignOut={handleSignOut}
            >
            <UsageOverview accessToken={signedInState.session.access_token} />
          </DashboardScreen>
        }
      />
      <Route
        path="/account"
        element={
          <DashboardScreen
            email={signedInState.email}
            accountName={signedInState.account.displayName}
            onSignOut={handleSignOut}
          >
            <AccountOverview
              profile={signedInState.profile}
              account={signedInState.account}
              services={signedInState.services}
              microgrids={signedInState.microgrids}
            />
          </DashboardScreen>
        }
      />
      <Route path="/" element={<Navigate to="/usage" replace />} />
      <Route path="*" element={<Navigate to="/usage" replace />} />
    </Routes>
  );
}

export default App;
