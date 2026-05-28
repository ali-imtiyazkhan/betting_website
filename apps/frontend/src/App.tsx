import useUser from "../hooks/useUser"
import { supabase } from "../lib/supabase";
import axios from "axios";
const App = () => {

  const { user, signInWithSolana } = useUser();

  return (
    <div>
      <button onClick={signInWithSolana}>
        Sign in with Solana
      </button>

      <pre>{JSON.stringify(user, null, 2)}</pre>

      <button onClick={async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        console.log("token that is strore in frontend : ", token)
        const data = await axios.post("http://localhost:3000/buy", {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log(data);
      }}>click here to buy</button>

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