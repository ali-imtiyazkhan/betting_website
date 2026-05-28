import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const useUser = () => {

  const [user, setUser] = useState(null);

  useEffect(() => {

    supabase.auth.getClaims().then((res) => {
      if (res.data) {
        setUser(res.data.claims);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(session);
    });

    return () => {
      subscription.unsubscribe();
    };

  }, []);

  const signInWithSolana = async () => {

    const data = await supabase.auth.signInWithWeb3({
      chain: "solana",
      statement:
        "Please sign this message to verify your identity at prediction market",
    });

    console.log(data);
  };

  return {
    user,
    signInWithSolana,
  };
};

export default useUser;