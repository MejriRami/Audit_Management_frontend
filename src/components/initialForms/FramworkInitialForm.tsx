import { useState } from "react";

const FrameworkInitialForm = () => {
    const [formFramework, setFormFramework] = useState({
        label: "",
        code: ""
    });

    function handleInputValue(e: any) {
    const { name, value } = e.target;
    setFormFramework(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

  return { handleInputValue, formFramework, setFormFramework };

};

export default FrameworkInitialForm;