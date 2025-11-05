import { useState } from "react";
import { Entity } from "../../../types";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";
// import Badge from "../../ui/badge/Badge";

export default function TableEntities({ entities }: { entities: Entity[] }) {
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  if (!entities?.length)
    return <p className="text-gray-500 p-4">No entities found.</p>;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-200 dark:border-white/10 bg-gradient-to-r from-[#F9FAFB] to-[#F1F5F9] dark:from-[#1C1C1E] dark:to-[#111113] text-gray-800 dark:text-gray-100 font-semibold text-[15px] uppercase tracking-wide">
            <TableRow>
              {["#ID", "Entity Name", "Type", "Code", "Parent"].map(
                (header) => (
                  <TableCell
                    key={header}
                    isHeader
                    className="px-5 py-3 text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    {header}
                  </TableCell>
                )
              )}
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {entities.map((entity) => (
              <TableRow
                key={entity.id || entity.code}
                className={`transition-colors ${
                  selectedEntity?.id === entity.id
                    ? "bg-orange-50 dark:bg-orange-900/20"
                    : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                }`}
              >
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {entity.id}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 text-start text-theme-sm">
                  {entity.label}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {entity.type}
                </TableCell>
                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {entity.code}
                </TableCell>

                <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
                  {entity.parent?.label || "-"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
