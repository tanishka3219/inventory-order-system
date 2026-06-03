import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900 transition-colors">
      <div className="max-w-md w-full glass-panel p-8 shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign In</h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">Enter your credentials to access the system</p>
          <p className="text-xs text-gray-400 mt-1">Default Admin: admin / admin123</p>
        </div>
        
        {error && <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:border-dark-700 dark:text-white transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none dark:bg-dark-800 dark:border-dark-700 dark:text-white transition-colors"
              required
            />
          </div>
          <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
