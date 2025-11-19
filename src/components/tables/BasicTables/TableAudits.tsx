import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";
import { useState } from "react";
import { Audit } from "../../../types";
import AuditDetailsModal from "../../modals/AuditDetailsModal";

export default function TableAudits({ audits }: { audits: Audit[] }) {
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  if (!audits.length)
    return <p className="text-gray-500 p-4">No audits found.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader
            className="
              border-b border-gray-200 dark:border-white/10
              bg-gradient-to-r from-[#F9FAFB] to-[#F1F5F9]
              dark:from-[#1C1C1E] dark:to-[#111113]
              text-gray-800 dark:text-gray-100
              font-semibold text-[15px]  tracking-wide
            "
          >
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                #Audit ID
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Auditor
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Auditee
              </TableCell>{" "}
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Plant
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Status
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Expected Date
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Questionnaire
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Final Score
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 font-medium text-gray-800 text-start text-theme-xs dark:text-gray-700"
              >
                Details
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {audits.map((audit) => (
              <TableRow key={audit.id}>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {audit.id}
                </TableCell>

                {/* Auditors */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex flex-col gap-1">
                    {audit.participants
                      ?.filter((p) => p.local_role === "auditor")
                      ?.map((p) => (
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
                  </div>
                </TableCell>

                {/* Auditees */}
                <TableCell className="px-5 py-4 sm:px-6 text-start">
                  <div className="flex flex-col gap-1">
                    {audit.participants
                      ?.filter((p) => p.local_role === "auditee")
                      ?.map((p) => (
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
                  </div>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {audit.entity || "-"}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  <Badge
                    size="sm"
                    color={
                      audit.status === "confirmed"
                        ? "success"
                        : audit.status === "planned"
                        ? "info"
                        : audit.status === "postponed"
                        ? "warning"
                        : audit.status === "cancelled"
                        ? "error"
                        : audit.status === "closed"
                        ? "dark"
                        : "info"
                    }
                  >
                    {audit.status.charAt(0).toUpperCase() +
                      audit.status.slice(1)}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {/* {audit.entity || "-"} */}10:30-11:30 13/11/2025
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {audit.framework || "-"}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {audit.finalScore}
                </TableCell>

                <TableCell>
                  <button
                    className="text-blue-600 hover:text-blue-800 font-medium underline"
                    onClick={() => setSelectedAudit(audit)} // Set the selected audit
                  >
                    {/* <button  className="px-4 py-2 bg-gradient-to-r
                     from-[#0584CE] to-[#046EAF] text-white rounded-lg  dark:from-[#035C91] dark:to-[#023C64]" >*/}
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
