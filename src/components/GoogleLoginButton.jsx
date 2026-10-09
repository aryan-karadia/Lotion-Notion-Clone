import { useGoogleLogin } from "@react-oauth/google";

const GoogleLoginButton = ({ onSuccess }) => {
  const login = useGoogleLogin({
    onSuccess,
    onError: (error) => console.log("Login Failed:", error),
    redirectUri: process.env.REACT_APP_REDIRECT_URI,
  });

  return (
    <button onClick={() => login()} className="login-button">
      Sign in to Lotion with Google
    </button>
  );
};

export default GoogleLoginButton;
