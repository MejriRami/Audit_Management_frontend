import { Outlet, useLocation, useNavigate } from "react-router";

import { useEffect } from 'react';


import { useDispatch } from 'react-redux';


const RequireAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/SignIn', { state: { prevUrl: location.pathname } });
      return;
    }

  }, [dispatch, navigate, location.pathname, token]);

  return  (
  <>
    <Outlet />
  </>
  );
};

export default RequireAuth;
