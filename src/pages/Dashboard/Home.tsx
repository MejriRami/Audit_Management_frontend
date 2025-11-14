import EcommerceMetrics from "../../components/ecommerce/AuditCountMetrics";
import MonthlySalesChart from "../../components/ecommerce/MonthlySalesChart";
import StatisticsChart from "../../components/ecommerce/StatisticsChart";
import MonthlyTarget from "../../components/ecommerce/MonthlyTarget";
import RecentOrders from "../../components/ecommerce/RecentOrders";
import DemographicCard from "../../components/ecommerce/DemographicCard";
import PageMeta from "../../components/common/PageMeta";
import AuditStatusDonut from "../../components/ecommerce/AuditStatus";

const data = [
  { status: "Completed", count: 40 },
  { status: "Pending", count: 25 },
  { status: "In Progress", count: 15 },
  { status: "Failed", count: 5 },
];

export default function Home() {
  return (
    <>
      <PageMeta
        title="Track and Manage Audits | Admin Dashboard"
        description=""
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 space-y-6 xl:col-span-7">
          <EcommerceMetrics />

          <MonthlySalesChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          {/* <MonthlyTarget /> */}
          <AuditStatusDonut data={data} />
        </div>

        <div className="col-span-12">
          <StatisticsChart />
        </div>

        <div className="col-span-12 xl:col-span-5">
          <DemographicCard />
        </div>

        <div className="col-span-12 xl:col-span-7">
          <RecentOrders />
        </div>
      </div>
    </>
  );
}
