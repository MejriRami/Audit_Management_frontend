import { useEffect, useState } from "react";
import { ChevronLeftIcon, EyeCloseIcon, EyeIcon } from "../../icons";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router";
import { resetPassword } from "../../redux/auth/auth";
import { resetAuthState } from "../../redux/auth/auth-slice";

export default function ResetPasswordForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast, success } = useSelector((state: any) => state.auth);
  const [formResetPasswordData, setFormResetPasswordData] = useState({ 
    email: '',
    new_password: '',
    confirm_password: '',
  });
  const [errorResetPassword, setErrorResetPassword] = useState<string | null>(null);

  const resetPasswordSubmit = (e: any) => {
    e.preventDefault();
    if (formResetPasswordData.new_password === e.target.confirm_password.value) {
        resetPassword(formResetPasswordData, dispatch);
    } else {
        setErrorResetPassword("Les mots de passe ne sont pas identiques");
    }
  }

  function handleInputValue(e: any) {
    const { name, value } = e.target;
    setFormResetPasswordData(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  useEffect(() => {
    if(formResetPasswordData.new_password !== formResetPasswordData.confirm_password){
      setErrorResetPassword("Les mots de passe ne sont pas identiques");
    } else {
        setErrorResetPassword(null);
    }
  },[formResetPasswordData.new_password, formResetPasswordData.confirm_password]);

  useEffect(() => {
      if (success) {
        setTimeout(() => {
          dispatch(resetAuthState());
          navigate('/signIn');
        }, 1000);
      }
    }, [success, toast, dispatch, navigate]);

  return (
    <div className="flex flex-col flex-1 w-full overflow-y-auto lg:w-1/2 no-scrollbar">
        <div className="w-full max-w-md mx-auto mb-5 sm:pt-10">
            <Link
                to="/signIn"
                className="inline-flex items-center text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
                <ChevronLeftIcon className="size-5" />
                Back to sign in
            </Link>
      </div>
      <div className="flex flex-col justify-center flex-1 w-full max-w-md mx-auto">
        <div>
          <div className="mb-5 sm:mb-8">
            <h1 className="mb-2 font-semibold text-gray-800 text-title-sm dark:text-white/90 sm:text-title-md">
              Reset Password
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Enter your email and password to reset your password!
            </p>
          </div>
          <div className="mb-5 sm:mb-8">
            { toast && (
            <Alert
              variant={toast === 'votre mot de passe a été réinitialisé avec succès' ? "success" : "error"}
              title={toast}
              message=""
            />
            )}
          </div>
          <div>
            <form onSubmit={resetPasswordSubmit}>
              <div className="space-y-5">
                {/* <!-- Email --> */}
                <div>
                  <Label>
                    Email<span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    onChange={handleInputValue}
                  />
                </div>
                {/* <!-- Password --> */}
                <div>
                  <Label>
                    Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showPassword ? "text" : "password"}
                      name="new_password"
                      onChange={handleInputValue}
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
                {/* <!-- Confirm Password --> */}
                <div>
                  <Label>
                    Confirm Password<span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      placeholder="Enter your password"
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirm_password"
                      onChange={handleInputValue}
                    />
                    <span
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute z-30 -translate-y-1/2 cursor-pointer right-4 top-1/2"
                    >
                      {showConfirmPassword ? (
                        <EyeIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      ) : (
                        <EyeCloseIcon className="fill-gray-500 dark:fill-gray-400 size-5" />
                      )}
                    </span>
                  </div>
                  {errorResetPassword && (
                        <p className="mt-2 text-sm text-error-500">
                            {errorResetPassword}
                        </p>
                  )}
                </div>
                {/* <!-- Button --> */}
                <div>
                  <Button
                    className="w-full bg-gradient-to-r from-[#F68C1F] to-[#EF7807] 
             dark:from-[#B55A00] dark:to-[#8A4600] 
             text-white hover:opacity-90 transition-all"
                    size="sm"
                    disabled={!!errorResetPassword}
                  >
                    Reset Password
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
