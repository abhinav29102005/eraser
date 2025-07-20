
import axiosInstance from '../api/axiosInstance';


export const getTestToken = async () => {
  try {
    const response = await axiosInstance.get('/auth/test-token');
    console.log("Response from test-token:", response.data); 
    localStorage.setItem('jwtToken', response.data.token); 
    return response.data.user;
  } catch (error) {

  }
};
export const getMyUserDetails = async () => {
  try {
    const response = await axiosInstance.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Failed to fetch user details:', error.response?.data?.message || error.message);
    throw error.response?.data || error;
  }
};
export const logout = () => {
  localStorage.removeItem('jwtToken');
  console.log('Logged out successfully.');
};
export const isLoggedIn = () => {
  return !!localStorage.getItem('jwtToken');
};