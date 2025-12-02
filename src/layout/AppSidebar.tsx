import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import {
  ClipboardList,
  FileSearch,
  BookCheck,
  LayoutDashboard,
  ClipboardCheck,
  BarChart2,
  CalendarCheck,
  ListChecks,
} from "lucide-react";

// Assume these icons are imported from an icon library
import {
  BoxCubeIcon,
  CalenderIcon,
  ChevronDownIcon,
  GridIcon,
  HorizontaLDots,
  ListIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  TableIcon,
  UserCircleIcon,
} from "../icons";
import { useSidebar } from "../context/SidebarContext";
import SidebarWidget from "./SidebarWidget";

type NavItem = {
  name: string;
  icon: React.ReactNode;
  path?: string;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

const navItems: NavItem[] = [
  {
    name: "Framework",
    icon: <BookCheck className="w-5 h-5" />,
    path: "/framework",
  },
  {
    name: "Questionnaires",
    icon: <ListChecks className="w-5 h-5" />,
    path: "/questionnaire",
  },
  // {
  //   name: "Create Questionnaire",
  //   icon: <PageIcon className="w-5 h-5" />,
  //   path: "/add-questionnaire",
  // },

  {
    name: "Audits",
    icon: <TableIcon />,
    path: "/audits",
  },
  {
    name: "Execute Audit",
    icon: <ClipboardList className="w-5 h-5" />,
    path: "/fill",
  },
  {
    name: "Audits Calendar",
    icon: <CalendarCheck className="w-5 h-5" />,
    path: "/audits-calendar",
  },
  {
    name: "KPI Audits",
    icon: <BarChart2 className="w-5 h-5" />,
    path: "/kpi-audits",
  },
];

const othersItems: NavItem[] = [
  {
    icon: <PieChartIcon />,
    name: "Charts",
    subItems: [
      { name: "Line Chart", path: "/line-chart", pro: false },
      { name: "Bar Chart", path: "/bar-chart", pro: false },
    ],
  },
  {
    icon: <BoxCubeIcon />,
    name: "UI Elements",
    subItems: [
      { name: "Alerts", path: "/alerts", pro: false },
      { name: "Avatar", path: "/avatars", pro: false },
      { name: "Badge", path: "/badge", pro: false },
      { name: "Buttons", path: "/buttons", pro: false },
      { name: "Images", path: "/images", pro: false },
      { name: "Videos", path: "/videos", pro: false },
    ],
  },
  {
    icon: <PlugInIcon />,
    name: "Authentication",
    subItems: [
      { name: "Sign In", path: "/signin", pro: false },
      { name: "Sign Up", path: "/signup", pro: false },
    ],
  },
];

const AppSidebar: React.FC = () => {
  const { isExpanded, isMobileOpen, isHovered, setIsHovered } = useSidebar();
  const location = useLocation();

  const [openSubmenu, setOpenSubmenu] = useState<{
    type: "main" | "others";
    index: number;
  } | null>(null);
  const [subMenuHeight, setSubMenuHeight] = useState<Record<string, number>>(
    {}
  );
  const subMenuRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const isActive = useCallback(
    (path: string) => location.pathname === path,
    [location.pathname]
  );

  useEffect(() => {
    let submenuMatched = false;
    ["main", "others"].forEach((menuType) => {
      const items = menuType === "main" ? navItems : othersItems;
      items.forEach((nav, index) => {
        if (nav.subItems) {
          nav.subItems.forEach((subItem) => {
            if (isActive(subItem.path)) {
              setOpenSubmenu({
                type: menuType as "main" | "others",
                index,
              });
              submenuMatched = true;
            }
          });
        }
      });
    });

    if (!submenuMatched) {
      setOpenSubmenu(null);
    }
  }, [location, isActive]);

  useEffect(() => {
    if (openSubmenu !== null) {
      const key = `${openSubmenu.type}-${openSubmenu.index}`;
      if (subMenuRefs.current[key]) {
        setSubMenuHeight((prevHeights) => ({
          ...prevHeights,
          [key]: subMenuRefs.current[key]?.scrollHeight || 0,
        }));
      }
    }
  }, [openSubmenu]);

  const handleSubmenuToggle = (index: number, menuType: "main" | "others") => {
    setOpenSubmenu((prevOpenSubmenu) => {
      if (
        prevOpenSubmenu &&
        prevOpenSubmenu.type === menuType &&
        prevOpenSubmenu.index === index
      ) {
        return null;
      }
      return { type: menuType, index };
    });
  };

  const renderMenuItems = (items: NavItem[], menuType: "main" | "others") => (
    <ul className="flex flex-col gap-1.5">
      {items.map((nav, index) => (
        <li key={nav.name}>
          {nav.subItems ? (
            <button
              onClick={() => handleSubmenuToggle(index, menuType)}
              className={`menu-item group transition-all duration-200
              ${
                openSubmenu?.type === menuType && openSubmenu?.index === index
                  ? "bg-white/90 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm"
                  : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400"
              }
              ${
                !isExpanded && !isHovered
                  ? "lg:justify-center"
                  : "lg:justify-start"
              }
            `}
            >
              <span
                className={`menu-item-icon-size transition-colors ${
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                }`}
              >
                {nav.icon}
              </span>
              {(isExpanded || isHovered || isMobileOpen) && (
                <span className="menu-item-text">{nav.name}</span>
              )}
              {(isExpanded || isHovered || isMobileOpen) && (
                <ChevronDownIcon
                  className={`ml-auto w-5 h-5 transition-transform duration-200 ${
                    openSubmenu?.type === menuType &&
                    openSubmenu?.index === index
                      ? "rotate-180 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                />
              )}
            </button>
          ) : (
            nav.path && (
              <Link
                to={nav.path}
                className={`menu-item group transition-all duration-200
                ${
                  isActive(nav.path)
                    ? "bg-white/90 dark:bg-white/10 text-indigo-700 dark:text-indigo-300 font-medium shadow-sm"
                    : "text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/5 hover:text-indigo-600 dark:hover:text-indigo-400"
                }`}
              >
                <span
                  className={`menu-item-icon-size transition-colors ${
                    isActive(nav.path)
                      ? "text-indigo-600 dark:text-indigo-400"
                      : "text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                  }`}
                >
                  {nav.icon}
                </span>
                {(isExpanded || isHovered || isMobileOpen) && (
                  <span className="menu-item-text">{nav.name}</span>
                )}
              </Link>
            )
          )}

          {/* Submenu section */}
          {nav.subItems && (isExpanded || isHovered || isMobileOpen) && (
            <div
              ref={(el) => {
                subMenuRefs.current[`${menuType}-${index}`] = el;
              }}
              className="overflow-hidden transition-all duration-300"
              style={{
                height:
                  openSubmenu?.type === menuType && openSubmenu?.index === index
                    ? `${subMenuHeight[`${menuType}-${index}`]}px`
                    : "0px",
              }}
            >
              <ul className="mt-2 space-y-1 ml-9">
                {nav.subItems.map((subItem) => (
                  <li key={subItem.name}>
                    <Link
                      to={subItem.path}
                      className={`menu-dropdown-item transition-all duration-200 ${
                        isActive(subItem.path)
                          ? "text-indigo-700 dark:text-indigo-300 bg-white/70 dark:bg-white/10 font-medium"
                          : "text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white/40 dark:hover:bg-white/5"
                      }`}
                    >
                      {subItem.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <aside
      className={`
    fixed mt-16 flex flex-col lg:mt-0 top-0 px-5 left-0 
    bg-gradient-to-b from-blue-50  to-indigo-50
    dark:from-slate-900 dark:via-indigo-950 dark:to-violet-950
    text-slate-700 dark:text-slate-200
    border-r border-indigo-100 dark:border-indigo-900/30
    h-screen transition-all duration-300 ease-in-out z-50 
    backdrop-blur-sm
    ${
      isExpanded || isMobileOpen
        ? "w-[290px]"
        : isHovered
        ? "w-[290px]"
        : "w-[90px]"
    }
    ${isMobileOpen ? "translate-x-0" : "-translate-x-full"}
    lg:translate-x-0
  `}
      onMouseEnter={() => !isExpanded && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Top / Logo */}
      <div
        className={`py-8 flex ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link to="/" className="font-semibold tracking-tight">
          {isExpanded || isHovered || isMobileOpen ? (
            <span className="text-[22px] text-slate-800 dark:text-white transition-colors duration-300">
              <div className="text-xl font-bold">
                Track
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0584CE] to-[#046EAF]">
                  Audit
                </span>
                <div className="border-b-2 border-indigo-200 dark:border-indigo-700 mt-1"></div>
              </div>
            </span>
          ) : (
            <span className="text-[22px] text-indigo-600 dark:text-indigo-400 font-bold">
              T
            </span>
          )}
        </Link>
      </div>

      {/* Main content area */}
      <div className="flex flex-col h-full justify-between">
        {/* Scrollable menu items */}
        <div className="flex-1 flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
          <nav className="mb-6">
            <div className="flex flex-col gap-4">
              <div>
                <h2
                  className={`mb-4 text-xs uppercase flex leading-[20px] text-slate-400 dark:text-slate-500 font-semibold tracking-wider ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "justify-start"
                  }`}
                >
                  {isExpanded || isHovered || isMobileOpen ? (
                    "Menu"
                  ) : (
                    <HorizontaLDots className="size-6" />
                  )}
                </h2>
                {renderMenuItems(navItems, "main")}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
{
  /* Sidebar widget fixed at bottom */
}
{
  /* {(isExpanded || isHovered || isMobileOpen) && (
          <div className="mt-4">
            <SidebarWidget />
          </div>
        )} */
}
