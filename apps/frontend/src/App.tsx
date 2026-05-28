import { createClient } from "@supabase/supabase-js";
const supabase = createClient("","")

const App = () => {
  return (
    <div>
      <button
        onClick={async() => {

        }}
      >
        Sign in with solana
      </button>
    </div>
  );
};

export default App; 