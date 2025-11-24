import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
import Badge from "../../ui/badge/Badge";
import AuditDetailsModal from "../../modals/AuditDetailsModal";
import { Audit } from "../../../types";

export default function TableAudits({ audits }: { audits: Audit[] }) {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  if (!audits.length)
    return <p className="text-gray-500 p-4">No audits found.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-[#F9FAFB] to-[#F1F5F9] dark:from-[#1C1C1E] dark:to-[#111113] text-gray-800 dark:text-gray-100 font-semibold text-[15px] tracking-wide">
            <TableRow>
              {[
                "#Audit ID",
                "Auditor",
                "Auditee",
                "Entity",
                "Status",
                "Final Score",
                "Details",
              ].map((header) => (
                <TableCell
                  key={header}
                  isHeader
                  className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                >
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {audit.id}
                </TableCell>

                <TableCell className="px-5 py-4 text-start">
                  {audit.participants
                    ?.filter((p) => p.local_role === "auditor")
                    .map((p) => (
                      <div
                        key={p.user.id}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        <div className="font-medium">{p.user.name}</div>
                        <div className="text-gray-500 text-xs">
                          {p.user.email}
                        </div>
                      </div>
                    ))}
                </TableCell>

                <TableCell className="px-5 py-4 text-start">
                  {audit.participants
                    ?.filter((p) => p.local_role === "auditee")
                    .map((p) => (
                      <div
                        key={p.user.id}
                        className="text-sm text-gray-700 dark:text-gray-300"
                      >
                        <div className="font-medium">{p.user.name}</div>
                        <div className="text-gray-500 text-xs">
                          {p.user.email}
                        </div>
                      </div>
                    ))}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {audit.entity || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {/* <Badge size="sm" color={
                    audit.status === "confirmed" ? "success" :
                    audit.status === "planned" ? "info" : "info"
                  }>
                    {audit.status?.charAt(0).toUpperCase() + audit.status?.slice(1)}
                  </Badge> */}
                  s
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {audit.finalScore}
                </TableCell>

                <TableCell>
                  <button
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                    onClick={() => setSelectedAudit(audit)}
                  >
                    View
                  </button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {selectedAudit && (
          <AuditDetailsModal
            audit={selectedAudit}
            onClose={() => setSelectedAudit(null)}
          />
        )}
      </div>
    </div>
  );
}
