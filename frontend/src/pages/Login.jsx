import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';  
import { useNavigate } from 'react-router-dom';
import api from '../api/api.js';
import { useAuth } from '../context/AuthContext.jsx';


// Login form validation schema using Zod
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});



export default function Login() {
  const { dispatch } =useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver:zodResolver(loginSchema),
  });

  

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/login', data);
      const token = response.data.token;
      const user = response.data.user;
      localStorage.setItem('token', token);

      dispatch({ type: 'LOGIN_SUCCESS', payload: { token, user } });
      alert('Login successful!');
      navigate('/');
    } catch (error) {
      alert(error.message || 'Login failed.');
    }
  };

  return (
    <>
    
    <section className="page narrow">
      <div className="text-center w-full max-w-md">
        <h1 className="text-4xl font-bold text-center mb-8 text-accent">Login</h1>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="form">
          <div>
            <span className="input-group-text">Email: </span>
            <input type="email" 
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"  aria-label="Username" aria-describedby="visible-addon" {...register('email')}/>
              {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
          </div>
          <div>
            <span className="input-group-text" id="visible-addon">Password: </span>
            <input type="password" {...register('password')}  
            className="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm" />
            {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
          </div>
        <div className="mt-4">
          <button type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
          Login
          </button>
        </div>

        <div>
          <button type="button" onClick={ () => window.location.href = '/register'}
          className="w-full flex justify-center py-2 px-4 mt-4 text-sm font-medium rounded-md transition-all duration-200 border-2! border-accent! bg-transparent! text-accent! hover:bg-accent! hover:text-accent-contrast!">
          Register
          </button>
        </div>
        
      </form> 
    </section>
    </>
  );
}

