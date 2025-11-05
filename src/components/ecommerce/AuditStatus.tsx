import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

interface AuditStatusChartProps {
  data: { status: string; count: number }[];
}

export default function AuditStatusDonut({ data }: AuditStatusChartProps) {
  const series = data.map((item) => item.count);
  const labels = data.map((item) => item.status);

  const options: ApexOptions = {
    chart: {
      type: "donut",
      fontFamily: "Outfit, sans-serif",
      height: 320,
    },
    labels,
    colors: ["#067abdff", "#dc7208ff", "#df0857ff", "#039855"],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
      labels: {
        colors: "#64748B",
        useSeriesColors: false,
      },
    },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: {
            show: true,
            total: {
              show: true,
              label: "Total",
              formatter: function () {
                return series.reduce((a, b) => a + b, 0).toString();
              },
            },
          },
        },
      },
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return `${val} audits`;
        },
      },
    },
    responsive: [
      {
        breakpoint: 480,
        options: {
          chart: {
            height: 250,
          },
          legend: {
            position: "bottom",
          },
        },
      },
    ],
  };

  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-6 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Audits by Status
            </h3>
            <p className="mt-1 text-gray-500 text-sm dark:text-gray-400">
              Current status distribution of all audits
            </p>
          </div>
          <div className="relative inline-block">
            <button onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                View Details
              </DropdownItem>
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Export
              </DropdownItem>
            </Dropdown>
          </div>
        </div>

        <div className="mt-5">
          <Chart options={options} series={series} type="donut" height={320} />
        </div>
      </div>
    </div>
  );
}
