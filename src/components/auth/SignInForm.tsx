import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import {EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import { login } from "../../redux/auth/auth";
import { useDispatch, useSelector } from "react-redux";
import Alert from "../ui/alert/Alert";
import { resetAuthState } from "../../redux/auth/auth-slice";

export default function SignInForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formLoginData, setFormLoginData] = useState({ email: '', password: '' });
  const { toast, isAuthenticated } = useSelector((state: any) => state.auth);

  function handleInputValue(e: any) {
    const { name, value } = e.target;
    setFormLoginData(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  function handleSignInSubmit(e: any) {
    e.preventDefault();
    login(formLoginData, dispatch);
  }

  useEffect(() => {
    if (isAuthenticated) {
      setTimeout(() => {
        dispatch(resetAuthState());
        navigate('/home');
      }, 1000);
    }
  }, [isAuthenticated, toast, dispatch, navigate]);

  useEffect(() => {
    return () => {
      dispatch(resetAuthState());
    }
  }, [dispatch]);

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Sign In
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to sign in!
            </p>
          </div>
          <div className="mb-5 sm:mb-8">
            { toast && (
            <Alert
              variant={toast === 'Email et mot de passe sont valides' ? "success" : "error"}
              title={toast}
              message=""
            />
            )}
          </div>
          <div>
            <form onSubmit={handleSignInSubmit}>
              <div className="space-y-6">
                <div>
                  <Label>
                    Email <span className="text-error-500">*</span>{" "}
                  </Label>
                  <Input 
                    name="email"
                    value={formLoginData.email}
                    onChange={handleInputValue}
                    placeholder="entrez votre email" />
                </div>
                <div>
                  <Label>
                    Password <span className="text-error-500">*</span>{" "}
                  </Label>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formLoginData.password}
                      onChange={handleInputValue}
                      placeholder="Enter your password"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Link
                    to="/reset-password"
                    className="text-sm text-[#F68C1F] hover:text-[#EF7807] dark:text-[#B55A00] dark:hover:text-[#8A4600] font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#F68C1F] to-[#EF7807] 
             dark:from-[#B55A00] dark:to-[#8A4600] 
             text-white hover:opacity-90 transition-all"
                    size="sm"
                  >
                    Sign in
                  </Button>
                </div>                
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
