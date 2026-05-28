import useUser from "../hooks/useUser"
import { supabase } from "../lib/supabase";

const App = () => {

  const { user, signInWithSolana } = useUser();

  return (
    <div>
      <button onClick={signInWithSolana}>
        Sign in with Solana
      </button>

      <pre>{JSON.stringify(user, null, 2)}</pre>

      {
        user && (
          <button onClick={() => {
            supabase.auth.signOut();
          }}>
            Sign out
          </button>
        )
      }
    </div>
  );
};

export default App;