import { useState } from "react";
import { Questionnaire } from "../../redux/questionnaire/questionnaire-slice-types";
import Enum from "../enum/Enum";


const QuestionnaireInitialForm = () => {
   const { auditorOptions} = Enum();
   const [formQuestionnaire, setFormQuestionnaire] = useState({
        id: 0,
        name: "",
        version: 1,
        status: "under revision",
        target_duration: "",
        score_calculation: "",
        guideline_file: "",
        type_id: "",
        framework_id: "",
        framework: {
            id:"",
            label:""
        },
        auditors: [],
        questions: []
   } as Questionnaire);

   function handleInputValue(e: any) {
     const { name, value } = e.target;
     setFormQuestionnaire(prevState => ({
        ...prevState,
        [name]: value   // KEEP HH:MM
        }));
    }

    function handleSelectChange(name:string, value: any) {
      setFormQuestionnaire(prev => ({
        ...prev,
        [name]: parseInt(value)
      }));
    }

    function handleMultiSelectInput(name: string, selectedIds: string[]) {
      const selectedAuditors = selectedIds
        .map(id => auditorOptions.find((o:any) => String(o.value) === id))
        .filter(Boolean)
        .map(opt => ({ id: Number(opt.value), email: opt.label })); // keep same structure

      setFormQuestionnaire(prev => ({
        ...prev,
        [name]: selectedAuditors
      }));
    }

    const handleTextAreaValue = (name:string, value: string) => {
      setFormQuestionnaire(prev => ({
        ...prev,
        [name]: value
      }));
    }

    return {
        formQuestionnaire,
        setFormQuestionnaire,
        handleInputValue,
        handleSelectChange,
        handleMultiSelectInput,
        handleTextAreaValue
   };   
}

export default QuestionnaireInitialForm;