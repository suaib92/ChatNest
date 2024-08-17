import { useContext, useState } from "react";
import axios from "axios";
import { UserContext } from "./UserContext.jsx";

export default function RegisterAndLoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('login');
  const { setUsername: setLoggedInUsername, setId } = useContext(UserContext);
  const [error, setError] = useState('');

  async function handleSubmit(ev) {
    ev.preventDefault();
    try {
      const url = isLoginOrRegister === 'register' ? '/register' : '/login';
      const { data } = await axios.post(url, { username, password });
      setLoggedInUsername(username);
      setId(data.id);
      setError(''); // Clear any previous error
    } catch (err) {
      setError('An error occurred. Please check your credentials.');
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-screen flex items-center justify-center">
      <form 
        className="w-80 p-6 bg-white rounded-lg shadow-lg transform transition duration-500 hover:scale-105"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-700">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </h2>
        <input
          value={username}
          onChange={ev => setUsername(ev.target.value)}
          type="text"
          placeholder="Username"
          className="block w-full rounded-lg p-2 mb-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <input
          value={password}
          onChange={ev => setPassword(ev.target.value)}
          type="password"
          placeholder="Password"
          className="block w-full rounded-lg p-2 mb-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        {error && <p className="text-red-500 text-center mb-3">{error}</p>}
        <button
          className="bg-blue-500 text-white font-semibold w-full rounded-lg p-2 transition duration-300 ease-in-out hover:bg-blue-600"
        >
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        <div className="text-center mt-4">
          {isLoginOrRegister === 'register' ? (
            <div>
              Already a member?
              <button
                type="button"
                className="ml-1 text-blue-500 underline transition duration-300 ease-in-out hover:text-blue-700"
                onClick={() => setIsLoginOrRegister('login')}
              >
                Login here
              </button>
            </div>
          ) : (
            <div>
              Don’t have an account?
              <button
                type="button"
                className="ml-1 text-blue-500 underline transition duration-300 ease-in-out hover:text-blue-700"
                onClick={() => setIsLoginOrRegister('register')}
              >
                Register
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
