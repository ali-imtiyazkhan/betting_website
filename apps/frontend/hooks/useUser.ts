import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

const useUser = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setUser(session.user);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log(session);
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signInWithSolana = async () => {
    const { data, error } = await supabase.auth.signInWithWeb3({
      chain: "solana",
      statement:
        "Please sign this message to verify your identity at prediction market",
    });

    if (error) {
      console.error("Sign in error:", error.message);
      return;
    }

    console.log(data);
  };

  return {
    user,
    signInWithSolana,
  };
};

export default useUser;
