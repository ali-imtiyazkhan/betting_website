import useUser from "../hooks/useUser"

const App = () => {

  const { user, signInWithSolana } = useUser();

  return (
    <div>
      <button onClick={signInWithSolana}>
        Sign in with Solana
      </button>

      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
};

export default App;