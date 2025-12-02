import { useState } from "react";
import { AddAuditTypeForm } from "../../redux/auditType/auditType-slice-types";


const AuditTypeInitialForm = () => {
    const [auditTypeForm, setAuditTypeForm] = useState({
        value: ""
    } as AddAuditTypeForm);

    function handleInputValue(e: any) {
    const { name, value } = e.target;
    setAuditTypeForm(prevState => ({
      ...prevState,
      [name]: value
    }));
  }

    return { handleInputValue, auditTypeForm, setAuditTypeForm };
};



export default AuditTypeInitialForm;