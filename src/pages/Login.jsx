import { GoogleLogin } from '@react-oauth/google';

const Login = () => {

    const responseMessage = (response) => {
        console.log(response);
    };
    const errorMessage = (error) => {
        console.log(error);
    };

    return (
        <div>
            <h2>React Google Login</h2>
            <br />
            <br />
            <GoogleLogin onSuccess={responseMessage} onError={errorMessage}>Sign in to Lotion with Google</GoogleLogin>
        </div>

    )
}

export default Login