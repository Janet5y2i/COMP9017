import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';  
import api from '../api/api.js';

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});


export default function Register() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      role: 'player'
    },
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/auth/register', data);

      alert('Registration successful!');
    } catch (error) {
      alert(error.message || 'Registration failed.');
    }
  };

  return (
    <section className="page narrow">
      <h1>Register</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="form">
        {/* Email field */}
        <div>
          <span class="input-group-text">Email: </span>
          <input type="email"
          class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          aria-label="Email"
          aria-describedby="visible-addon" {...register('email')} />
          {errors.email && <p className="mt-1 text-xs text-red-600 font-medium">{errors.email.message}</p>}
        </div>
        {/* Username field */}
        <div>
          <span class="input-group-text">Username: </span>
          <input type="text"
          class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          aria-label="Username"
          aria-describedby="visible-addon" {...register('username')} />
          {errors.username && <p className="mt-1 text-xs text-red-600 font-medium">{errors.username.message}</p>}
        </div>

        {/* Password field */}
        <div>
          <span class="input-group-text">Password: </span>
          <input type="password"
          class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
          aria-label="Password"
          aria-describedby="visible-addon" {...register('password')} />
          {errors.password && <p className="mt-1 text-xs text-red-600 font-medium">{errors.password.message}</p>}
        </div>

        {/* Register role: default to player, only allow admin if explicitly selected (for testing purposes) */}
        <div>
          <span class="input-group-text">Role: </span>
          <select
            class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
            {...register('role')}
            >
              <option value="player">Player</option>
              <option value="admin">Admin</option>
            </select>
        </div>
        <button type="submit"
          className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-4">
          Register
        </button>


      </form>


    </section>
  );
}

