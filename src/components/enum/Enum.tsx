import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getFrameworks } from "../../redux/framework/framework";
import { getAuditTypes } from "../../redux/auditType/auditType";
import { getAuditors } from "../../redux/users/user";

const Enum = () => {
  const dispatch = useDispatch();

  const { frameworksList } = useSelector((state: any) => state.framework);
  const { auditTypesList } = useSelector((state: any) => state.auditType);
  const { usersList } = useSelector((state: any) => state.user);

  const frameworkOptions = useMemo(() => {
    return frameworksList?.length
      ? frameworksList.map((f: any) => ({
          value: f.id,
          label: f.code.toUpperCase(),
        }))
      : [];
  }, [frameworksList]);

  const auditTypeOptions = useMemo(() => {
    return auditTypesList?.length
      ? auditTypesList.map((a: any) => ({
          value: a.id,
          label: a.value.replace(/\b\w/g, (char: string) => char.toUpperCase()),
        }))
      : [];
  }, [auditTypesList]);

  const auditorOptions = useMemo(() => {
    return usersList?.length
      ? usersList.map((u: any) => ({
          value: u.id,
          label: u.email,
        }))
      : [];
  }, [usersList]);

  useEffect(() => {
    getFrameworks(dispatch);
    getAuditTypes(dispatch);
    getAuditors(dispatch);
  }, [dispatch]);

  return {
    frameworkOptions,
    auditTypeOptions,
    auditorOptions,
  };
};

export default Enum;
