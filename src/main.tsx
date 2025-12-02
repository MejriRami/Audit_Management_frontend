import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.ts";
import { authService } from "./services/authService.ts";
import "./services/axiosInterceptors.ts";

authService.setup(localStorage.getItem("token"));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AppWrapper>
        <Provider store={store}>
          <App />
        </Provider>
      </AppWrapper>
    </ThemeProvider>
  </StrictMode>,
);
