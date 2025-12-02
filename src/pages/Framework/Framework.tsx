import { useEffect } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import { useDispatch, useSelector } from "react-redux";
import { getAuditTypes } from "../../redux/auditType/auditType";
import AuditTypeSection from "../../components/framework/AuditTypeSection";
import AuditTypePanel from "../../components/framework/AuditTypePanel";
import FrameworkSection from "../../components/framework/FrameworkSection";
import { getFrameworks } from "../../redux/framework/framework";
import FrameworkPanel from "../../components/framework/FrameworkPanel";

export default function FrameworkElements() {
  const dispatch = useDispatch();
  const { auditTypesList } = useSelector((state: any) => state.auditType);
  const { frameworksList } = useSelector((state: any) => state.framework);

  useEffect(() => {
    getAuditTypes(dispatch);
    getFrameworks(dispatch);
  }, [dispatch]);

  return (
    <div className="p-8 space-y-16">
      <PageMeta title="Framework Management" description="" />
      <PageBreadcrumb pageTitle="Frameworks" />

      {/* ===========================
         FRAMEWORKS LIST SECTION
       =========================== */}
      <FrameworkSection frameworks={frameworksList} />
      <AuditTypeSection auditTypes={auditTypesList} />

      {/* ===========================
         FORMS SECTION (2-column)
       =========================== */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-10">
        {/* Add Framework */}
        <FrameworkPanel frameworkList={frameworksList} />
        {/* Add Audit Type */}
        <AuditTypePanel auditTypes={auditTypesList} />
      </section>
    </div>
  );
}
